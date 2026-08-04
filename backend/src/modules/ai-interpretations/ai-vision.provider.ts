import { BadRequestException, Injectable } from '@nestjs/common';

export const AI_VISION_PROVIDER = Symbol('AI_VISION_PROVIDER');

export type AiCardResult = 'negative' | 'positive' | 'unknown' | 'invalid';
export type AiImageQuality = 'good' | 'fair' | 'poor' | 'unknown';

export interface AiVisionInterpretation {
  test_item: string;
  card_visible: boolean;
  ct_line_visible: boolean;
  result: AiCardResult;
  confidence: number;
  quality: AiImageQuality;
  remark: string;
  provider_name: string;
  model_name: string;
  prompt_version: string;
  request_time: Date;
  response_time: Date;
  raw_response: unknown;
}

export interface AiVisionProvider {
  readonly providerName: string;
  readonly modelName: string;

  getPromptVersion(testItem: string): string;

  interpretColloidalGoldCard(params: {
    imageBuffer: Buffer;
    mimeType: string;
    testItem: string;
    productName: string;
    promptVersion: string;
  }): Promise<AiVisionInterpretation>;
}

@Injectable()
export class DashScopeQwenVisionProvider implements AiVisionProvider {
  readonly providerName = 'dashscope';

  get modelName() {
    return process.env.DASHSCOPE_VISION_MODEL || 'qwen-vl-max';
  }

  getPromptVersion(_testItem: string) {
    return 'qwen-vl-colloidal-gold-card-v1';
  }

  async interpretColloidalGoldCard(params: {
    imageBuffer: Buffer;
    mimeType: string;
    testItem: string;
    productName: string;
    promptVersion: string;
  }) {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new BadRequestException({
        message: 'AI判读服务暂未配置，请联系管理员',
        code: 'AI_VISION_NOT_CONFIGURED',
      });
    }

    const baseUrl =
      process.env.DASHSCOPE_BASE_URL ||
      'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const model = this.modelName;
    const mimeType = this.normalizeImageMime(params.mimeType);
    const imageUrl = `data:${mimeType};base64,${params.imageBuffer.toString('base64')}`;
    const requestTime = new Date();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let raw: unknown;
    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                '你是食品安全胶体金检测卡图片判读助手。只根据图片中的检测卡、C线和T线判断，不要编造。必须只输出合法 JSON，不要输出 Markdown 或解释文字。',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text:
                    `请判读这张胶体金检测卡图片。检测项目：${params.testItem}。样品/产品：${params.productName}。\n` +
                    '请严格输出如下 JSON 字段：{"test_item":"检测项目","result":"negative|positive|unknown|invalid","confidence":0.86,"quality":"good|fair|poor|unknown","remark":"简短中文说明","card_visible":true,"ct_line_visible":true}。\n' +
                    '判读规则：C线无效或看不清为 invalid；无法确认结果为 unknown；negative 表示阴性/合格；positive 表示阳性/不合格。',
                },
                {
                  type: 'image_url',
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      raw = await response.json().catch(() => null);
      if (!response.ok) {
        throw new BadRequestException({
          message: 'AI识别服务调用失败，请稍后重试',
          code: 'AI_VISION_REQUEST_FAILED',
        });
      }

      const content = (raw as { choices?: Array<{ message?: { content?: string } }> })
        ?.choices?.[0]?.message?.content || '';
      return this.parseResult(content, raw, {
        testItem: params.testItem,
        model,
        promptVersion: params.promptVersion,
        requestTime,
        responseTime: new Date(),
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({
        message: 'AI识别服务连接失败，请稍后重试',
        code: 'AI_VISION_REQUEST_FAILED',
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private normalizeImageMime(mimeType: string) {
    if (mimeType === 'image/png' || mimeType === 'image/webp') return mimeType;
    return 'image/jpeg';
  }

  private parseResult(
    content: string,
    raw: unknown,
    meta: {
      testItem: string;
      model: string;
      promptVersion: string;
      requestTime: Date;
      responseTime: Date;
    },
  ): AiVisionInterpretation {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(this.extractJson(content));
    } catch {
      throw new BadRequestException({
        message: 'AI返回结果格式异常，请重新拍摄后再试',
        code: 'AI_VISION_PARSE_FAILED',
      });
    }

    const result = String(parsed.result || 'unknown');
    const allowed: AiCardResult[] = ['negative', 'positive', 'unknown', 'invalid'];
    const normalizedResult = allowed.includes(result as AiCardResult)
      ? (result as AiCardResult)
      : 'unknown';
    const quality = String(parsed.quality || 'unknown');
    const allowedQuality: AiImageQuality[] = ['good', 'fair', 'poor', 'unknown'];
    const normalizedQuality = allowedQuality.includes(quality as AiImageQuality)
      ? (quality as AiImageQuality)
      : 'unknown';
    const confidence = Number(parsed.confidence);

    return {
      test_item: String(parsed.test_item || meta.testItem).slice(0, 120),
      card_visible: Boolean(parsed.card_visible),
      ct_line_visible: Boolean(parsed.ct_line_visible),
      result: normalizedResult,
      confidence:
        Number.isFinite(confidence) && confidence >= 0 && confidence <= 1
          ? confidence
          : 0,
      quality: normalizedQuality,
      remark: String(parsed.remark || parsed.reason || 'AI已完成判读，请人工确认结果').slice(0, 1000),
      provider_name: this.providerName,
      model_name: meta.model,
      prompt_version: meta.promptVersion,
      request_time: meta.requestTime,
      response_time: meta.responseTime,
      raw_response: raw,
    };
  }

  private extractJson(content: string) {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
    const match = trimmed.match(/\{[\s\S]*\}/);
    return match?.[0] || trimmed;
  }
}
