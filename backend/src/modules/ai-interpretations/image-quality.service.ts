import { BadRequestException, Injectable } from '@nestjs/common';

export interface ImageQualityReport {
  passed: boolean;
  quality: 'good' | 'fair' | 'poor' | 'unknown';
  message: string;
  width: number | null;
  height: number | null;
}

@Injectable()
export class ImageQualityService {
  check(buffer: Buffer, mimeType: string): ImageQualityReport {
    if (!buffer || buffer.length === 0) {
      return this.fail('图片为空，请重新拍摄', null, null);
    }

    const size = this.readImageSize(buffer, mimeType);
    if (!size) {
      return this.fail('图片格式无法识别，请使用 JPG、PNG 或 WEBP 图片', null, null);
    }

    const { width, height } = size;
    if (width < 320 || height < 240) {
      return this.fail('图片分辨率偏低，请重新拍摄清晰照片', width, height);
    }

    const minSide = Math.min(width, height);
    const quality = minSide >= 600 ? 'good' : 'fair';
    return {
      passed: true,
      quality,
      message:
        quality === 'good'
          ? '图片基础质量正常'
          : '图片可识别，建议保持检测卡区域清晰完整',
      width,
      height,
    };
  }

  assertPassed(report: ImageQualityReport) {
    if (!report.passed) {
      throw new BadRequestException({
        message: report.message,
        code: 'AI_IMAGE_QUALITY_FAILED',
      });
    }
  }

  private fail(message: string, width: number | null, height: number | null) {
    return { passed: false, quality: 'poor' as const, message, width, height };
  }

  private readImageSize(buffer: Buffer, mimeType: string) {
    if (mimeType === 'image/png' || this.isPng(buffer)) return this.readPngSize(buffer);
    if (mimeType === 'image/webp' || this.isWebp(buffer)) return this.readWebpSize(buffer);
    if (mimeType === 'image/jpeg' || this.isJpeg(buffer)) return this.readJpegSize(buffer);
    return this.readPngSize(buffer) || this.readWebpSize(buffer) || this.readJpegSize(buffer);
  }

  private isPng(buffer: Buffer) {
    return buffer.length > 24 && buffer.toString('hex', 0, 8) === '89504e470d0a1a0a';
  }

  private isJpeg(buffer: Buffer) {
    return buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8;
  }

  private isWebp(buffer: Buffer) {
    return buffer.length > 16 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  }

  private readPngSize(buffer: Buffer) {
    if (!this.isPng(buffer)) return null;
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  private readJpegSize(buffer: Buffer) {
    if (!this.isJpeg(buffer)) return null;
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) return null;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (length < 2) return null;
      if (
        (marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)
      ) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + length;
    }
    return null;
  }

  private readWebpSize(buffer: Buffer) {
    if (!this.isWebp(buffer)) return null;
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X' && buffer.length >= 30) {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (chunk === 'VP8 ' && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === 'VP8L' && buffer.length >= 25) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }
    return null;
  }
}
