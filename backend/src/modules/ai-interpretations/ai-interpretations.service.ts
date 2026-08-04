import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  AiInterpretationResult,
  AiInterpretationStatus,
  DetectionRecordStatus,
  DetectionResult,
  DeviceStatus,
  ManufacturerInterfaceStatus,
  Prisma,
} from '../../generated/prisma';
import { formatDateTimeCompact } from '../../common/date';
import {
  MemoryUploadFile,
  saveValidatedFile,
} from '../../common/upload-files';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  AI_VISION_PROVIDER,
  AiCardResult,
  AiVisionInterpretation,
  AiVisionProvider,
} from './ai-vision.provider';
import { serializeAiInterpretationJob } from './ai-interpretations.serializer';
import { ConfirmAiInterpretationDto } from './dto/confirm-ai-interpretation.dto';
import {
  CreateAiInterpretationBase64Dto,
  CreateAiInterpretationDto,
} from './dto/create-ai-interpretation.dto';
import { ImageQualityService } from './image-quality.service';

const AI_MANUFACTURER_CODE = 'GUXIN_AI';
const AI_MANUFACTURER_NAME = '谷芯拍照判读';
const MAX_AI_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_AI_RETRIES = 2;
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/octet-stream',
  '',
];

type AdminListQuery = {
  page?: string | number;
  page_size?: string | number;
  status?: string;
  result?: string;
  test_item?: string;
  company_name?: string;
  date_from?: string;
  date_to?: string;
};

@Injectable()
export class AiInterpretationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
    private readonly imageQuality: ImageQualityService,
    @Inject(AI_VISION_PROVIDER)
    private readonly visionProvider: AiVisionProvider,
  ) {}

  async create(
    file: MemoryUploadFile,
    dto: CreateAiInterpretationDto,
    request: RequestWithClientUser,
  ) {
    const normalizedDto = this.normalizeCreateDto(dto);
    const companyId = request.clientUser!.companyId;
    const userId = request.clientUser!.id;
    const uploadFile = this.normalizeUploadFile(file);
    const saved = await saveValidatedFile(
      uploadFile,
      `ai-interpretations/${companyId.toString()}`,
      {
        maxSize: MAX_AI_IMAGE_SIZE,
        allowedExtensions: ALLOWED_IMAGE_EXTENSIONS,
        allowedMimeTypes: ALLOWED_IMAGE_MIME_TYPES,
      },
    );

    const promptVersion = this.visionProvider.getPromptVersion(
      normalizedDto.test_item,
    );
    const job = await this.prisma.aiInterpretationJob.create({
      data: {
        companyId,
        companyUserId: userId,
        imagePath: saved.relativePath,
        testItem: normalizedDto.test_item,
        productName: normalizedDto.product_name,
        sampleName: normalizedDto.sample_name || null,
        status: AiInterpretationStatus.CREATED,
        providerName: this.visionProvider.providerName,
        modelName: this.visionProvider.modelName,
        promptVersion,
      },
    });

    try {
      const quality = this.imageQuality.check(file.buffer, file.mimetype);
      await this.prisma.aiInterpretationJob.update({
        where: { id: job.id },
        data: {
          imageQuality: quality.quality,
          imageQualityMessage: quality.message,
          imageWidth: quality.width,
          imageHeight: quality.height,
        },
      });
      this.imageQuality.assertPassed(quality);

      await this.prisma.aiInterpretationJob.update({
        where: { id: job.id },
        data: {
          status: AiInterpretationStatus.PROCESSING,
          processingAt: new Date(),
        },
      });

      const interpretation = await this.callVisionWithRetry(
        job.id,
        file,
        normalizedDto,
        promptVersion,
      );

      await this.prisma.aiInterpretationJob.update({
        where: { id: job.id },
        data: {
          aiResult: interpretation.result,
          confidence: interpretation.confidence,
          reason: interpretation.remark,
          status: AiInterpretationStatus.SUCCESS,
          providerName: interpretation.provider_name,
          modelName: interpretation.model_name,
          promptVersion: interpretation.prompt_version,
          requestTime: interpretation.request_time,
          responseTime: interpretation.response_time,
          successAt: interpretation.response_time,
          confirmingAt: new Date(),
          imageQuality: interpretation.quality,
          standardResultJson: this.toStandardResultJson(interpretation),
          rawResponseJson: interpretation.raw_response as Prisma.InputJsonValue,
        },
      });

      const updated = await this.prisma.aiInterpretationJob.update({
        where: { id: job.id },
        data: {
          status: AiInterpretationStatus.CONFIRMING,
          confirmingAt: new Date(),
        },
        include: this.clientInclude(),
      });

      await this.operationLogs.writeCompanyUserLog({
        userId,
        targetType: 'ai_interpretation',
        targetId: job.id,
        action: 'ai_interpretation.create',
        content: {
          result: interpretation.result,
          confidence: interpretation.confidence,
          test_item: normalizedDto.test_item,
          prompt_version: promptVersion,
        },
        ip: request.ip,
      });

      return serializeAiInterpretationJob(updated);
    } catch (error) {
      const message = this.publicErrorMessage(error);
      const updated = await this.prisma.aiInterpretationJob.update({
        where: { id: job.id },
        data: {
          status: AiInterpretationStatus.FAILED,
          failedAt: new Date(),
          errorReason: message,
          errorMessage: message,
          lastError: this.debugErrorMessage(error),
        },
        include: this.clientInclude(),
      });

      await this.operationLogs.writeCompanyUserLog({
        userId,
        targetType: 'ai_interpretation',
        targetId: job.id,
        action: 'ai_interpretation.failed',
        content: { reason: message, test_item: normalizedDto.test_item },
        ip: request.ip,
      });

      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException({
        message,
        code: 'AI_INTERPRETATION_FAILED',
        data: serializeAiInterpretationJob(updated),
      });
    }
  }

  async createFromBase64(
    dto: CreateAiInterpretationBase64Dto,
    request: RequestWithClientUser,
  ) {
    const imageFile = this.base64ToUploadFile(dto);
    return this.create(imageFile, dto, request);
  }

  async get(id: bigint, request: RequestWithClientUser) {
    const job = await this.findClientJob(id, request);
    return serializeAiInterpretationJob(job);
  }

  async confirm(
    id: bigint,
    dto: ConfirmAiInterpretationDto,
    request: RequestWithClientUser,
  ) {
    const job = await this.findClientJob(id, request);
    if (job.detectionRecordId) {
      throw new BadRequestException({
        message: '该判读结果已经生成检测记录',
        code: 'AI_INTERPRETATION_ALREADY_CONFIRMED',
      });
    }
    if (job.status === AiInterpretationStatus.FAILED) {
      throw new BadRequestException({
        message: '识别失败的图片不能生成检测记录，请重新拍照',
        code: 'AI_INTERPRETATION_FAILED',
      });
    }
    if (job.status !== AiInterpretationStatus.CONFIRMING) {
      throw new BadRequestException({
        message: '当前判读任务还不能确认，请稍后重试',
        code: 'AI_INTERPRETATION_NOT_CONFIRMABLE',
      });
    }
    if (dto.result === 'unknown' || dto.result === 'invalid') {
      throw new BadRequestException({
        message: '无法判断的结果不能生成检测记录，请重新拍照或人工录入',
        code: 'AI_RESULT_NOT_RECORDABLE',
      });
    }

    const now = new Date();
    const companyId = request.clientUser!.companyId;
    const userId = request.clientUser!.id;
    const device = await this.ensureAiDevice(companyId);
    const recordResult = this.toDetectionResult(dto.result);
    const productName = (dto.product_name || job.productName).trim();
    const sampleName = (dto.sample_name || job.sampleName || productName).trim();
    const testItem = (dto.test_item || job.testItem).trim();
    const recordNo = await this.generateRecordNo(now);

    const record = await this.prisma.detectionRecord.create({
      data: {
        recordNo,
        companyId,
        deviceId: device.id,
        manufacturerCode: device.manufacturerCode,
        deviceSn: device.deviceSn,
        manufacturerRecordId: `AIJOB${job.id.toString()}`,
        sampleName,
        productName,
        overallResult: recordResult,
        testTime: now,
        uploadTime: now,
        status: DetectionRecordStatus.normal,
        rawPayloadJson: {
          source: 'ai_photo_interpretation',
          ai_job_id: job.id.toString(),
          image_path: job.imagePath,
          ai_result: job.aiResult,
          ai_confidence: job.confidence === null ? null : Number(job.confidence),
          ai_reason: job.reason,
          prompt_version: job.promptVersion,
          confirmed_result: dto.result,
          confirmed_reason: dto.reason || null,
          confirmed_by: userId.toString(),
          confirmed_at: now.toISOString(),
        },
        items: {
          create: [
            {
              testItem,
              testMethod: '胶体金检测卡拍照判读',
              testValue: this.resultValueLabel(dto.result),
              unit: null,
              standardLimit: '阴性为合格，阳性为不合格',
              result: recordResult,
            },
          ],
        },
      },
    });

    const updated = await this.prisma.aiInterpretationJob.update({
      where: { id: job.id },
      data: {
        status: AiInterpretationStatus.CONFIRMED,
        confirmedResult: dto.result,
        confirmedAt: now,
        detectionRecordId: record.id,
        productName,
        sampleName,
        testItem,
        reason: dto.reason || job.reason,
      },
      include: this.clientInclude(),
    });

    await this.operationLogs.writeCompanyUserLog({
      userId,
      targetType: 'detection_record',
      targetId: record.id,
      action: 'ai_interpretation.confirm',
      content: {
        ai_job_id: job.id.toString(),
        result: dto.result,
        record_no: record.recordNo,
      },
      ip: request.ip,
    });

    return {
      ...serializeAiInterpretationJob(updated),
      can_issue_certificate: recordResult === DetectionResult.pass,
    };
  }

  async listAdmin(query: AdminListQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(query.page_size || 20)));
    const where: Prisma.AiInterpretationJobWhereInput = {};

    if (query.status && this.isAiStatus(query.status)) {
      where.status = query.status;
    }
    if (query.result && this.isAiResult(query.result)) {
      where.aiResult = query.result;
    }
    if (query.test_item) {
      where.testItem = { contains: String(query.test_item).trim() };
    }
    if (query.company_name) {
      where.company = { name: { contains: String(query.company_name).trim() } };
    }
    if (query.date_from || query.date_to) {
      where.createdAt = {
        gte: query.date_from ? new Date(String(query.date_from)) : undefined,
        lte: query.date_to ? new Date(String(query.date_to)) : undefined,
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.aiInterpretationJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          company: { select: { id: true, name: true } },
          companyUser: { select: { id: true, username: true, realName: true } },
          detectionRecord: {
            select: { id: true, recordNo: true, overallResult: true },
          },
        },
      }),
      this.prisma.aiInterpretationJob.count({ where }),
    ]);

    return {
      items: items.map((item) => this.serializeAdminJob(item)),
      total,
      page,
      page_size: pageSize,
    };
  }

  async getAdmin(id: bigint) {
    const job = await this.prisma.aiInterpretationJob.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true } },
        companyUser: { select: { id: true, username: true, realName: true } },
        detectionRecord: {
          select: { id: true, recordNo: true, overallResult: true },
        },
      },
    });
    if (!job) {
      throw new NotFoundException({
        message: 'AI 判读任务不存在',
        code: 'AI_INTERPRETATION_NOT_FOUND',
      });
    }
    return this.serializeAdminJob(job, true);
  }

  private async callVisionWithRetry(
    jobId: bigint,
    file: MemoryUploadFile,
    dto: CreateAiInterpretationDto,
    promptVersion: string,
  ) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_AI_RETRIES; attempt += 1) {
      try {
        if (attempt > 0) {
          await this.prisma.aiInterpretationJob.update({
            where: { id: jobId },
            data: { retryCount: attempt },
          });
        }
        return await this.visionProvider.interpretColloidalGoldCard({
          imageBuffer: file.buffer,
          mimeType: file.mimetype,
          testItem: dto.test_item,
          productName: dto.product_name,
          promptVersion,
        });
      } catch (error) {
        lastError = error;
        await this.prisma.aiInterpretationJob.update({
          where: { id: jobId },
          data: {
            retryCount: attempt,
            lastError: this.debugErrorMessage(error),
          },
        });
      }
    }
    throw lastError;
  }

  private async findClientJob(id: bigint, request: RequestWithClientUser) {
    const job = await this.prisma.aiInterpretationJob.findFirst({
      where: { id, companyId: request.clientUser!.companyId },
      include: this.clientInclude(),
    });
    if (!job) {
      throw new NotFoundException({
        message: '判读记录不存在',
        code: 'AI_INTERPRETATION_NOT_FOUND',
      });
    }
    return job;
  }

  private async ensureAiDevice(companyId: bigint) {
    await this.prisma.manufacturerInterface.upsert({
      where: { manufacturerCode: AI_MANUFACTURER_CODE },
      create: {
        manufacturerName: AI_MANUFACTURER_NAME,
        manufacturerCode: AI_MANUFACTURER_CODE,
        accessSecret: `ai-${randomUUID()}`,
        status: ManufacturerInterfaceStatus.normal,
        signRule: 'internal_ai_photo_interpretation',
      },
      update: {
        manufacturerName: AI_MANUFACTURER_NAME,
        status: ManufacturerInterfaceStatus.normal,
      },
    });

    const deviceSn = `AI-${companyId.toString()}`;
    return this.prisma.device.upsert({
      where: {
        manufacturerCode_deviceSn: {
          manufacturerCode: AI_MANUFACTURER_CODE,
          deviceSn,
        },
      },
      create: {
        manufacturerCode: AI_MANUFACTURER_CODE,
        deviceSn,
        deviceName: '手机拍照判读',
        model: 'AI-PHOTO',
        companyId,
        status: DeviceStatus.normal,
        remark: '系统自动生成，用于胶体金检测卡拍照判读记录归属',
      },
      update: {
        companyId,
        status: DeviceStatus.normal,
      },
    });
  }

  private normalizeUploadFile(file: MemoryUploadFile) {
    if (!file?.buffer) return file;
    if (extname(file.originalname || '')) return file;
    const extension = this.extensionFromMime(file.mimetype);
    return {
      ...file,
      originalname: `${file.originalname || 'ai-card-photo'}${extension}`,
    };
  }

  private base64ToUploadFile(dto: CreateAiInterpretationBase64Dto): MemoryUploadFile {
    const parsed = this.parseBase64Image(dto.image_base64);
    const mimeType = dto.image_mime || parsed.mimeType || 'image/jpeg';
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException({
        message: '仅支持 JPG、PNG、WEBP 图片',
        code: 'AI_IMAGE_TYPE_NOT_ALLOWED',
      });
    }
    if (parsed.buffer.length > MAX_AI_IMAGE_SIZE) {
      throw new BadRequestException({
        message: '图片不能超过 10MB',
        code: 'AI_IMAGE_TOO_LARGE',
      });
    }
    const extension = this.extensionFromMime(mimeType);
    const originalName = (dto.original_name || 'ai-card-photo').trim();
    return {
      originalname: extname(originalName) ? originalName : `${originalName}${extension}`,
      mimetype: mimeType,
      size: parsed.buffer.length,
      buffer: parsed.buffer,
    };
  }

  private parseBase64Image(value: string) {
    const text = String(value || '').trim();
    const matched = text.match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = matched?.[1] || '';
    const payload = matched?.[2] || text;
    if (!payload) {
      throw new BadRequestException({
        message: '请上传检测卡图片',
        code: 'AI_IMAGE_REQUIRED',
      });
    }
    const buffer = Buffer.from(payload, 'base64');
    if (!buffer.length) {
      throw new BadRequestException({
        message: '图片内容为空，请重新选择',
        code: 'AI_IMAGE_EMPTY',
      });
    }
    return { mimeType, buffer };
  }

  private extensionFromMime(mimeType: string) {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    return '.jpg';
  }

  private toDetectionResult(result: AiCardResult) {
    return result === 'positive' ? DetectionResult.fail : DetectionResult.pass;
  }

  private normalizeCreateDto(
    dto: CreateAiInterpretationDto,
  ): CreateAiInterpretationDto {
    return {
      test_item: this.normalizeUploadText(dto.test_item),
      product_name: this.normalizeUploadText(dto.product_name),
      sample_name: dto.sample_name
        ? this.normalizeUploadText(dto.sample_name)
        : undefined,
    };
  }

  private normalizeUploadText(value: string) {
    const text = String(value || '').trim();
    if (!text) return text;

    try {
      const decoded = decodeURIComponent(text);
      if (decoded !== text) return decoded.trim();
    } catch {
      // Keep original text when it is not URI encoded.
    }

    if (/[\u00c0-\u00ff]/.test(text)) {
      const decoded = Buffer.from(text, 'latin1').toString('utf8');
      if (/[\u4e00-\u9fa5]/.test(decoded)) return decoded.trim();
    }

    return text;
  }

  private resultValueLabel(result: AiCardResult) {
    return result === 'positive' ? '阳性' : '阴性';
  }

  private publicErrorMessage(error: unknown) {
    if (error instanceof BadRequestException) {
      return this.readExceptionMessage(error);
    }
    return '图片识别失败，请重新拍摄清晰照片';
  }

  private readExceptionMessage(error: BadRequestException) {
    const response = error.getResponse();
    if (response && typeof response === 'object') {
      const message = (response as { message?: unknown }).message;
      if (typeof message === 'string') return message;
    }
    return '图片识别失败，请重新拍摄清晰照片';
  }

  private debugErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message.slice(0, 1000);
    if (typeof error === 'string') return error.slice(0, 1000);
    return 'unknown error';
  }

  private toStandardResultJson(interpretation: AiVisionInterpretation) {
    return {
      test_item: interpretation.test_item,
      result: interpretation.result,
      confidence: interpretation.confidence,
      quality: interpretation.quality,
      remark: interpretation.remark,
      card_visible: interpretation.card_visible,
      ct_line_visible: interpretation.ct_line_visible,
    } as Prisma.InputJsonValue;
  }

  private clientInclude() {
    return {
      detectionRecord: {
        select: { id: true, recordNo: true, overallResult: true },
      },
    } satisfies Prisma.AiInterpretationJobInclude;
  }

  private isAiStatus(value: string): value is AiInterpretationStatus {
    return Object.values(AiInterpretationStatus).includes(value as AiInterpretationStatus);
  }

  private isAiResult(value: string): value is AiInterpretationResult {
    return Object.values(AiInterpretationResult).includes(value as AiInterpretationResult);
  }

  private serializeAdminJob(
    job: Prisma.AiInterpretationJobGetPayload<{
      include: {
        company: { select: { id: true; name: true } };
        companyUser: { select: { id: true; username: true; realName: true } };
        detectionRecord: { select: { id: true; recordNo: true; overallResult: true } };
      };
    }>,
    detail = false,
  ) {
    return {
      id: job.id.toString(),
      company: {
        id: job.company.id.toString(),
        name: job.company.name,
      },
      operator: {
        id: job.companyUser.id.toString(),
        username: job.companyUser.username,
        real_name: job.companyUser.realName,
      },
      test_item: job.testItem,
      product_name: job.productName,
      sample_name: job.sampleName,
      result: job.aiResult,
      confidence: job.confidence === null ? null : Number(job.confidence),
      quality: job.imageQuality,
      quality_message: job.imageQualityMessage,
      status: job.status,
      error_message: job.errorMessage || job.errorReason,
      provider_name: job.providerName,
      model_name: job.modelName,
      prompt_version: job.promptVersion,
      retry_count: job.retryCount,
      request_time: job.requestTime,
      response_time: job.responseTime,
      created_at: job.createdAt,
      updated_at: job.updatedAt,
      detection_record: job.detectionRecord
        ? {
            id: job.detectionRecord.id.toString(),
            record_no: job.detectionRecord.recordNo,
            overall_result: job.detectionRecord.overallResult,
          }
        : null,
      ...(detail
        ? {
            image_path: job.imagePath,
            image_width: job.imageWidth,
            image_height: job.imageHeight,
            standard_result: job.standardResultJson,
            raw_response: job.rawResponseJson,
            last_error: job.lastError,
            reason: job.reason,
            processing_at: job.processingAt,
            success_at: job.successAt,
            failed_at: job.failedAt,
            confirming_at: job.confirmingAt,
            confirmed_at: job.confirmedAt,
            cancelled_at: job.cancelledAt,
          }
        : {}),
    };
  }

  private async generateRecordNo(date: Date) {
    const prefix = `RD${formatDateTimeCompact(date)}`;
    for (let i = 0; i < 20; i += 1) {
      const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const recordNo = `${prefix}${suffix}`;
      const exists = await this.prisma.detectionRecord.findUnique({
        where: { recordNo },
        select: { id: true },
      });
      if (!exists) return recordNo;
    }
    throw new BadRequestException({
      message: '检测记录编号生成失败，请重试',
      code: 'RECORD_NO_GENERATE_FAILED',
    });
  }
}
