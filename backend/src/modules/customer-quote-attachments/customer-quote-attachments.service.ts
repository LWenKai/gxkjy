import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join, normalize, relative } from 'path';
import {
  getUploadRoot,
  MemoryUploadFile,
  saveValidatedFile,
} from '../../common/upload-files';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { serializeQuoteAttachment } from './customer-quote-attachments.serializer';

const ALLOWED_EXTENSIONS = ['.pdf', '.xls', '.xlsx', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];

@Injectable()
export class CustomerQuoteAttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(quoteId: bigint) {
    await this.ensureQuote(quoteId);
    const attachments = await this.prisma.customerQuoteAttachment.findMany({
      where: { quoteId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return attachments.map(serializeQuoteAttachment);
  }

  async upload(quoteId: bigint, files: MemoryUploadFile[], request: RequestWithAdmin) {
    const quote = await this.ensureQuote(quoteId);
    if (!files?.length) {
      throw new BadRequestException({ message: '请选择报价附件', code: 'FILES_REQUIRED' });
    }

    const created = [];
    for (const file of files) {
      const saved = await saveValidatedFile(
        file,
        `customer-quotes/${quote.customerId.toString()}/${quote.id.toString()}`,
        {
          maxSize: 20 * 1024 * 1024,
          allowedExtensions: ALLOWED_EXTENSIONS,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
        },
      );
      const attachment = await this.prisma.customerQuoteAttachment.create({
        data: {
          quoteId,
          originalName: saved.originalName,
          storedName: saved.storedName,
          filePath: saved.relativePath,
          mimeType: saved.mimeType,
          fileExtension: saved.extension,
          fileSize: BigInt(saved.size),
          uploadedBy: request.adminUser!.id,
        },
      });
      created.push(serializeQuoteAttachment(attachment));
    }

    await this.writeLog(request, quote.customerId, 'customer.quote_attachment.upload', {
      quote_id: quoteId.toString(),
      file_count: created.length,
    });
    return created;
  }

  async delete(id: bigint, request: RequestWithAdmin) {
    const attachment = await this.findAttachment(id);
    await this.prisma.customerQuoteAttachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.writeLog(request, attachment.quote.customerId, 'customer.quote_attachment.delete', {
      attachment_id: id.toString(),
      quote_id: attachment.quoteId.toString(),
      file_name: attachment.originalName,
    });
    return { deleted: true };
  }

  async download(id: bigint, response: any) {
    const attachment = await this.findAttachment(id);
    const root = getUploadRoot();
    const fullPath = normalize(join(root, attachment.filePath));
    const rootRelative = relative(root, fullPath);
    if (rootRelative.startsWith('..') || rootRelative === '..') {
      throw new BadRequestException({ message: '文件路径不合法', code: 'INVALID_FILE_PATH' });
    }
    await stat(fullPath);

    const inline = attachment.mimeType === 'application/pdf' || attachment.mimeType.startsWith('image/');
    const encodedName = encodeURIComponent(attachment.originalName);
    response.setHeader('Content-Type', attachment.mimeType);
    response.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodedName}`,
    );
    createReadStream(fullPath).pipe(response);
  }

  private async ensureQuote(id: bigint) {
    const quote = await this.prisma.customerQuote.findFirst({
      where: { id, deletedAt: null, customer: { deletedAt: null } },
    });
    if (!quote) {
      throw new NotFoundException({ message: '报价记录不存在', code: 'QUOTE_NOT_FOUND' });
    }
    return quote;
  }

  private async findAttachment(id: bigint) {
    const attachment = await this.prisma.customerQuoteAttachment.findFirst({
      where: { id, deletedAt: null, quote: { deletedAt: null } },
      include: { quote: true },
    });
    if (!attachment) {
      throw new NotFoundException({ message: '报价附件不存在', code: 'QUOTE_ATTACHMENT_NOT_FOUND' });
    }
    return attachment;
  }

  private async writeLog(
    request: RequestWithAdmin,
    customerId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'customer',
      targetId: customerId,
      action,
      content,
      ip: request.ip,
    });
  }
}
