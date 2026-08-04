import { Injectable } from '@nestjs/common';
import { ManufacturerUploadLog, Prisma } from '../../generated/prisma';
import { formatCsvDate, toCsv } from '../../common/csv';
import { getPagination } from '../../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ManufacturerUploadLogQueryDto } from './dto/manufacturer-upload-log-query.dto';

@Injectable()
export class ManufacturerUploadLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ManufacturerUploadLogQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildWhere(query);
    const [total, logs] = await this.prisma.$transaction([
      this.prisma.manufacturerUploadLog.count({ where }),
      this.prisma.manufacturerUploadLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);
    const companyMap = await this.buildCompanyMap(logs);

    return {
      total,
      page,
      page_size: pageSize,
      items: logs.map((log) => this.serializeLog(log, companyMap)),
    };
  }

  async export(query: ManufacturerUploadLogQueryDto) {
    const logs = await this.prisma.manufacturerUploadLog.findMany({
      where: this.buildWhere(query),
      orderBy: { createdAt: 'desc' },
    });
    const companyMap = await this.buildCompanyMap(logs);

    return toCsv(
      [
        '上传时间',
        '厂家编码',
        '设备编号',
        '厂家记录ID',
        '处理状态',
        '错误原因',
        '归属企业',
        '请求摘要',
      ],
      logs.map((log) => {
        const item = this.serializeLog(log, companyMap);
        return [
          formatCsvDate(log.createdAt),
          item.manufacturer_code,
          item.device_sn,
          item.manufacturer_record_id,
          item.result,
          item.error_reason,
          item.company_name,
          item.request_summary,
        ];
      }),
    );
  }

  private buildWhere(query: ManufacturerUploadLogQueryDto) {
    const where: Prisma.ManufacturerUploadLogWhereInput = {};
    if (query.manufacturer_code) {
      where.manufacturerCode = { contains: query.manufacturer_code };
    }
    if (query.device_sn) {
      where.deviceSn = { contains: query.device_sn };
    }
    if (query.result) where.result = query.result;
    if (query.date_from || query.date_to) {
      where.createdAt = {};
      if (query.date_from) where.createdAt.gte = new Date(query.date_from);
      if (query.date_to) where.createdAt.lte = new Date(query.date_to);
    }
    return where;
  }

  private async buildCompanyMap(
    logs: Array<{ manufacturerCode: string; deviceSn: string | null }>,
  ) {
    const pairs = logs
      .filter((log) => log.deviceSn)
      .map((log) => ({
        manufacturerCode: log.manufacturerCode,
        deviceSn: log.deviceSn!,
      }));
    if (!pairs.length) return new Map<string, string>();

    const devices = await this.prisma.device.findMany({
      where: { OR: pairs },
      include: { company: { select: { name: true } } },
    });

    return new Map(
      devices.map((device) => [
        `${device.manufacturerCode}::${device.deviceSn}`,
        device.company?.name || '',
      ]),
    );
  }

  private serializeLog(
    log: ManufacturerUploadLog,
    companyMap: Map<string, string>,
  ) {
    const key = `${log.manufacturerCode}::${log.deviceSn || ''}`;
    return {
      id: log.id.toString(),
      manufacturer_code: log.manufacturerCode,
      device_sn: log.deviceSn,
      manufacturer_record_id: log.manufacturerRecordId,
      result: log.result,
      error_reason: log.errorReason,
      company_name: companyMap.get(key) || null,
      request_summary: this.summarizePayload(log.requestPayload),
      created_at: log.createdAt,
      updated_at: log.updatedAt,
    };
  }

  private summarizePayload(payload: Prisma.JsonValue | null) {
    if (!payload) return '';
    const text = JSON.stringify(payload).replace(
      /"(access_secret|password|token|jwt|secret|sign)"\s*:\s*"[^"]*"/gi,
      '"$1":"[masked]"',
    );
    return text.length > 500 ? `${text.slice(0, 500)}...` : text;
  }
}
