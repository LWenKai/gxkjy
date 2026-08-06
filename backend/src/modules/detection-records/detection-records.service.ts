function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DetectionRecordStatus,
  DetectionResult,
  DeviceStatus,
  Prisma,
} from '../../generated/prisma';
import { formatCsvDate, toCsv } from '../../common/csv';
import { buildExcelWorkbook } from '../../common/excel';
import { formatDateTimeCompact } from '../../common/date';
import { parseBigIntId } from '../../common/id';
import { getPagination } from '../../common/pagination.dto';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminDetectionRecordQueryDto } from './dto/admin-detection-record-query.dto';
import { ClientDetectionRecordQueryDto } from './dto/client-detection-record-query.dto';
import { CreateTestDetectionRecordDto } from './dto/create-test-detection-record.dto';
import {
  CreateDetectionRecordDisposalDto,
  UpdateDetectionRecordDisposalDto,
} from './dto/create-detection-record-disposal.dto';
import {
  detectionRecordDetailInclude,
  detectionRecordListInclude,
  DetectionRecordListItem,
  fromApiResult,
  serializeDetectionRecord,
  serializeDetectionRecordDetail,
  toApiResult,
} from './detection-records.serializer';

type ClientExportField =
  | 'record_no'
  | 'product_name'
  | 'sample_name'
  | 'overall_result'
  | 'test_time'
  | 'device_name'
  | 'item_count'
  | 'certificate_count';

const EXPORT_FIELD_LABELS: Record<ClientExportField, string> = {
  record_no: '检测记录编号',
  product_name: '产品名称',
  sample_name: '样品名称',
  overall_result: '检测结果',
  test_time: '检测时间',
  device_name: '检测设备',
  item_count: '检测项目数',
  certificate_count: '关联合格证数',
};

const EXPORT_FIELD_EXTRACTORS: Record<
  ClientExportField,
  (record: DetectionRecordListItem) => string | number | null
> = {
  record_no: (record) => record.recordNo,
  product_name: (record) => record.productName,
  sample_name: (record) => record.sampleName,
  overall_result: (record) => (record.overallResult === DetectionResult.pass ? '合格' : '不合格'),
  test_time: (record) => formatCsvDate(record.testTime),
  device_name: (record) => record.device?.deviceName || '',
  item_count: (record) => record._count?.items || 0,
  certificate_count: (record) => record._count?.certificates || 0,
};

@Injectable()
export class DetectionRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async createTestRecord(
    dto: CreateTestDetectionRecordDto,
    request: RequestWithAdmin,
  ) {
    const companyId = parseBigIntId(dto.company_id, 'company_id');
    const deviceId = parseBigIntId(dto.device_id, 'device_id');

    const [company, device] = await Promise.all([
      this.prisma.company.findUnique({ where: { id: companyId } }),
      this.prisma.device.findUnique({ where: { id: deviceId } }),
    ]);

    if (!company) {
      throw new NotFoundException({
        message: '企业不存在',
        code: 'COMPANY_NOT_FOUND',
      });
    }
    if (!device) {
      throw new NotFoundException({
        message: '设备不存在',
        code: 'DEVICE_NOT_FOUND',
      });
    }
    if (!device.companyId) {
      throw new BadRequestException({
        message: '未绑定企业的设备不能生成正式测试检测记录',
        code: 'DEVICE_NOT_BOUND',
      });
    }
    if (device.companyId !== companyId) {
      throw new BadRequestException({
        message: '设备绑定企业与请求企业不一致',
        code: 'DEVICE_COMPANY_MISMATCH',
      });
    }
    if (device.status !== DeviceStatus.normal) {
      throw new BadRequestException({
        message: '设备已停用，不能生成测试检测记录',
        code: 'DEVICE_DISABLED',
      });
    }

    const now = new Date();
    const testTime = dto.test_time ? new Date(dto.test_time) : now;
    const manufacturerRecordId = `TEST${Date.now()}`;
    const recordNo = await this.generateRecordNo(now);

    const record = await this.prisma.detectionRecord.create({
      data: {
        recordNo,
        companyId,
        deviceId,
        manufacturerCode: device.manufacturerCode,
        deviceSn: device.deviceSn,
        manufacturerRecordId,
        sampleName: dto.sample_name || null,
        productName: dto.product_name,
        overallResult: fromApiResult(dto.overall_result),
        testTime,
        uploadTime: now,
        status: DetectionRecordStatus.normal,
        rawPayloadJson: {
          source: 'admin_test_generation',
          admin_id: request.adminUser?.id.toString() || null,
          sample_category: dto.sample_category || null,
          generated_at: now.toISOString(),
        },
        items: {
          create: dto.items.map((item) => ({
            testItem: item.test_item,
            testMethod: item.test_method || null,
            testValue: item.test_value,
            unit: item.unit || null,
            standardLimit: item.standard_limit || null,
            result: fromApiResult(item.result),
          })),
        },
      },
      include: detectionRecordDetailInclude,
    });

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'detection_record',
      targetId: record.id,
      action: 'detection_record.test_create',
      content: {
        company_id: companyId.toString(),
        device_id: deviceId.toString(),
        overall_result: dto.overall_result,
      },
      ip: request.ip,
    });

    return serializeDetectionRecordDetail(record);
  }

  async listClientRecords(
    query: ClientDetectionRecordQueryDto,
    request: RequestWithClientUser,
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.DetectionRecordWhereInput = {
      companyId: request.clientUser!.companyId,
    };

    if (query.overall_result) {
      where.overallResult = fromApiResult(query.overall_result);
    }
    if (query.sample_name) {
      where.OR = [
        { sampleName: { contains: query.sample_name } },
        { productName: { contains: query.sample_name } },
      ];
    }
    if (query.product_name) {
      where.productName = { contains: query.product_name };
    }
    if (query.date_from || query.date_to) {
      where.testTime = {};
      if (query.date_from) {
        where.testTime.gte = new Date(`${query.date_from}T00:00:00`);
      }
      if (query.date_to) {
        where.testTime.lte = new Date(`${query.date_to}T23:59:59`);
      }
    }

    const [total, records] = await this.prisma.$transaction([
      this.prisma.detectionRecord.count({ where }),
      this.prisma.detectionRecord.findMany({
        where,
        include: detectionRecordListInclude,
        orderBy: { testTime: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: records.map(serializeDetectionRecord),
    };
  }

  async getClientRecord(id: bigint, request: RequestWithClientUser) {
    const record = await this.prisma.detectionRecord.findFirst({
      where: {
        id,
        companyId: request.clientUser!.companyId,
      },
      include: detectionRecordDetailInclude,
    });

    if (!record) {
      throw new NotFoundException({
        message: '检测记录不存在',
        code: 'DETECTION_RECORD_NOT_FOUND',
      });
    }

    return serializeDetectionRecordDetail(record);
  }

  async getClientBigScreen(request: RequestWithClientUser) {
    const companyId = request.clientUser!.companyId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    const [
      totalCount,
      passCount,
      todayCount,
      todayPassCount,
      certificateCount,
      deviceCount,
      recentRecords,
      recentCertificates,
      abnormalRecords,
    ] = await this.prisma.$transaction([
      this.prisma.detectionRecord.count({ where: { companyId } }),
      this.prisma.detectionRecord.count({
        where: { companyId, overallResult: DetectionResult.pass },
      }),
      this.prisma.detectionRecord.count({
        where: { companyId, testTime: { gte: startOfToday, lt: startOfTomorrow } },
      }),
      this.prisma.detectionRecord.count({
        where: {
          companyId,
          overallResult: DetectionResult.pass,
          testTime: { gte: startOfToday, lt: startOfTomorrow },
        },
      }),
      this.prisma.certificate.count({
        where: { companyId, status: 'normal' },
      }),
      this.prisma.device.count({ where: { companyId } }),
      this.prisma.detectionRecord.findMany({
        where: { companyId },
        include: detectionRecordListInclude,
        orderBy: { testTime: 'desc' },
        take: 12,
      }),
      this.prisma.certificate.findMany({
        where: { companyId, status: 'normal' },
        orderBy: { issueTime: 'desc' },
        take: 8,
      }),
      this.prisma.detectionRecord.findMany({
        where: { companyId, overallResult: DetectionResult.fail },
        include: detectionRecordListInclude,
        orderBy: { testTime: 'desc' },
        take: 8,
      }),
    ]);

    const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 1000) / 10 : null;
    const todayPassRate =
      todayCount > 0 ? Math.round((todayPassCount / todayCount) * 1000) / 10 : null;

    // 近 7 天检测趋势（每日检测量 / 合格量）
    const trend: { date: string; total: number; pass: number }[] = [];
    const dayTotals = new Map<string, { total: number; pass: number }>();
    for (let i = 29; i >= 0; i--) {
      const day = new Date(startOfToday);
      day.setDate(day.getDate() - i);
      const key = `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`;
      dayTotals.set(key, { total: 0, pass: 0 });
      trend.push({ date: key, total: 0, pass: 0 });
    }
    const trendStart = new Date(startOfToday);
    trendStart.setDate(trendStart.getDate() - 29);
    const trendRecords = await this.prisma.detectionRecord.findMany({
      where: { companyId, testTime: { gte: trendStart } },
      select: { testTime: true, overallResult: true },
    });
    for (const rec of trendRecords) {
      const d = rec.testTime;
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const bucket = dayTotals.get(key);
      if (!bucket) continue;
      bucket.total += 1;
      if (rec.overallResult === DetectionResult.pass) bucket.pass += 1;
    }
    for (const point of trend) {
      const bucket = dayTotals.get(point.date)!;
      point.total = bucket.total;
      point.pass = bucket.pass;
    }

    // 品类检测分布（按样品/产品聚合 Top 6）
    const categoryAgg = await this.prisma.detectionRecord.groupBy({
      by: ['productName'],
      where: { companyId },
      _count: { _all: true },
      orderBy: { _count: { productName: 'desc' } },
      take: 6,
    });
    const categories = categoryAgg
      .filter((c) => c.productName)
      .map((c) => ({ name: c.productName as string, count: c._count._all }));

    // 设备运行状态：近 24h 有上传视为在线
    const onlineThreshold = new Date(startOfToday);
    onlineThreshold.setDate(onlineThreshold.getDate() - 1);
    const devices = await this.prisma.device.findMany({
      where: { companyId },
      select: {
        deviceName: true,
        status: true,
        lastUploadAt: true,
      },
      orderBy: { lastUploadAt: 'desc' },
      take: 6,
    });
    const onlineDeviceCount = devices.filter(
      (d) => d.lastUploadAt && d.lastUploadAt >= onlineThreshold,
    ).length;

    return {
      total_count: totalCount,
      pass_count: passCount,
      pass_rate: passRate,
      today_count: todayCount,
      today_pass_count: todayPassCount,
      today_pass_rate: todayPassRate,
      certificate_count: certificateCount,
      device_count: deviceCount,
      online_device_count: onlineDeviceCount,
      trend,
      categories,
      devices: devices.map((d) => ({
        name: d.deviceName || '未命名设备',
        status: d.status,
        online: Boolean(d.lastUploadAt && d.lastUploadAt >= onlineThreshold),
        last_upload_at: d.lastUploadAt,
      })),
      recent_records: recentRecords.map((record) => ({
        id: record.id.toString(),
        record_no: record.recordNo,
        sample_name: record.sampleName,
        product_name: record.productName,
        overall_result: toApiResult(record.overallResult),
        test_time: record.testTime,
        device_name: record.device?.deviceName || null,
        certificate_count: record._count?.certificates || 0,
      })),
      recent_certificates: recentCertificates.map((cert) => ({
        id: cert.id.toString(),
        certificate_no: cert.certificateNo,
        product_name: cert.productName,
        origin: cert.origin,
        issue_time: cert.issueTime,
        public_token: cert.publicToken,
      })),
      abnormal_records: abnormalRecords.map((record) => ({
        id: record.id.toString(),
        record_no: record.recordNo,
        sample_name: record.sampleName,
        product_name: record.productName,
        test_time: record.testTime,
        device_name: record.device?.deviceName || null,
      })),
    };
  }

  async exportClientRecords(
    query: ClientDetectionRecordQueryDto,
    request: RequestWithClientUser,
    fields?: string,
  ) {
    const where: Prisma.DetectionRecordWhereInput = {
      companyId: request.clientUser!.companyId,
    };

    if (query.overall_result) {
      where.overallResult = fromApiResult(query.overall_result);
    }
    if (query.sample_name) {
      where.OR = [
        { sampleName: { contains: query.sample_name } },
        { productName: { contains: query.sample_name } },
      ];
    }
    if (query.product_name) {
      where.productName = { contains: query.product_name };
    }
    if (query.date_from || query.date_to) {
      where.testTime = {};
      if (query.date_from) {
        where.testTime.gte = new Date(`${query.date_from}T00:00:00`);
      }
      if (query.date_to) {
        where.testTime.lte = new Date(`${query.date_to}T23:59:59`);
      }
    }

    const records = await this.prisma.detectionRecord.findMany({
      where,
      include: detectionRecordListInclude,
      orderBy: { testTime: 'desc' },
    });

    if (!records.length) {
      return null;
    }

    const selected = this.resolveExportFields(fields);
    const headers = selected.map((field) => EXPORT_FIELD_LABELS[field]);
    const rows = records.map((record) =>
      selected.map((field) => EXPORT_FIELD_EXTRACTORS[field](record)),
    );

    return toCsv(headers, rows);
  }

  private resolveExportFields(fields?: string): ClientExportField[] {
    const requested = (fields || '')
      .split(',')
      .map((item) => item.trim())
      .filter((item): item is ClientExportField =>
        Object.prototype.hasOwnProperty.call(EXPORT_FIELD_LABELS, item),
      );
    return requested.length
      ? requested
      : (Object.keys(EXPORT_FIELD_LABELS) as ClientExportField[]);
  }

  async exportClientRecordsExcel(
    query: ClientDetectionRecordQueryDto,
    request: RequestWithClientUser,
  ): Promise<Buffer> {
    const where: Prisma.DetectionRecordWhereInput = {
      companyId: request.clientUser!.companyId,
    };
    if (query.overall_result) {
      where.overallResult = fromApiResult(query.overall_result);
    }
    if (query.sample_name) {
      where.OR = [
        { sampleName: { contains: query.sample_name } },
        { productName: { contains: query.sample_name } },
      ];
    }
    if (query.product_name) {
      where.productName = { contains: query.product_name };
    }
    if (query.date_from || query.date_to) {
      where.testTime = {};
      if (query.date_from) where.testTime.gte = new Date(`${query.date_from}T00:00:00`);
      if (query.date_to) where.testTime.lte = new Date(`${query.date_to}T23:59:59`);
    }

    const [records, totalCount, passCount] = await this.prisma.$transaction([
      this.prisma.detectionRecord.findMany({
        where,
        include: detectionRecordListInclude,
        orderBy: { testTime: 'desc' },
      }),
      this.prisma.detectionRecord.count({ where }),
      this.prisma.detectionRecord.count({
        where: { ...where, overallResult: DetectionResult.pass },
      }),
    ]);

    const rate = totalCount > 0 ? Math.round((passCount / totalCount) * 1000) / 10 : null;

    const dataRows = records.map((record) => ({
      record_no: record.recordNo,
      product_name: record.productName,
      sample_name: record.sampleName,
      overall_result: record.overallResult === DetectionResult.pass ? '合格' : '不合格',
      test_time: formatCsvDate(record.testTime),
      device_name: record.device?.deviceName || '',
      item_count: record._count?.items || 0,
      certificate_count: record._count?.certificates || 0,
    }));

    return buildExcelWorkbook([
      {
        name: '检测记录',
        columns: [
          { header: '检测记录编号', value: (r) => r.record_no, width: 24 },
          { header: '产品名称', value: (r) => r.product_name, width: 16 },
          { header: '样品名称', value: (r) => r.sample_name, width: 16 },
          { header: '检测结果', value: (r) => r.overall_result, width: 10 },
          { header: '检测时间', value: (r) => r.test_time, width: 18 },
          { header: '检测设备', value: (r) => r.device_name, width: 16 },
          { header: '检测项目数', value: (r) => r.item_count, width: 10 },
          { header: '关联合格证数', value: (r) => r.certificate_count, width: 12 },
        ],
        rows: dataRows,
        summary: [
          { label: '合计检测记录数', value: totalCount },
          { label: '合格记录数', value: passCount },
          { label: '合格率', value: rate === null ? '—' : `${rate}%` },
        ],
      },
    ]);
  }

  async listCertifiableRecords(
    query: ClientDetectionRecordQueryDto,
    request: RequestWithClientUser,
  ) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.DetectionRecordWhereInput = {
      companyId: request.clientUser!.companyId,
      overallResult: DetectionResult.pass,
      status: DetectionRecordStatus.normal,
    };

    if (query.sample_name) {
      where.OR = [
        { sampleName: { contains: query.sample_name } },
        { productName: { contains: query.sample_name } },
      ];
    }

    const [total, records] = await this.prisma.$transaction([
      this.prisma.detectionRecord.count({ where }),
      this.prisma.detectionRecord.findMany({
        where,
        include: detectionRecordListInclude,
        orderBy: { testTime: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: records.map(serializeDetectionRecord),
    };
  }

  async listAdminRecords(query: AdminDetectionRecordQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildAdminRecordWhere(query);

    const [total, records] = await this.prisma.$transaction([
      this.prisma.detectionRecord.count({ where }),
      this.prisma.detectionRecord.findMany({
        where,
        include: detectionRecordListInclude,
        orderBy: { testTime: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: records.map(serializeDetectionRecord),
    };
  }

  async exportAdminRecords(query: AdminDetectionRecordQueryDto) {
    const records = await this.prisma.detectionRecord.findMany({
      where: this.buildAdminRecordWhere(query),
      include: detectionRecordListInclude,
      orderBy: { testTime: 'desc' },
    });

    return toCsv(
      [
        '检测记录编号',
        '企业名称',
        '样品名称',
        '样品类别',
        '检测时间',
        '检测结论',
        '状态',
        '检测项目数量',
        '创建时间',
      ],
      records.map((record) => [
        record.recordNo,
        record.company?.name,
        record.sampleName || record.productName,
        record.productName,
        formatCsvDate(record.testTime),
        this.resultLabel(record.overallResult),
        this.recordStatusLabel(record.status),
        record._count?.items || 0,
        formatCsvDate(record.createdAt),
      ]),
    );
  }

  async getAdminRecord(id: bigint) {
    return serializeDetectionRecordDetail(await this.findAdminRecordOrThrow(id));
  }

  async markAbnormal(
    id: bigint,
    request: RequestWithAdmin,
    reason?: string,
  ) {
    return this.setAdminRecordStatus(
      id,
      DetectionRecordStatus.marked_abnormal,
      'detection_record.mark_abnormal',
      request,
      reason,
    );
  }

  async hide(id: bigint, request: RequestWithAdmin, reason?: string) {
    return this.setAdminRecordStatus(
      id,
      DetectionRecordStatus.hidden,
      'detection_record.hide',
      request,
      reason,
    );
  }

  async void(id: bigint, request: RequestWithAdmin, reason?: string) {
    return this.setAdminRecordStatus(
      id,
      DetectionRecordStatus.voided,
      'detection_record.void',
      request,
      reason,
    );
  }

  async restore(id: bigint, request: RequestWithAdmin, reason?: string) {
    return this.setAdminRecordStatus(
      id,
      DetectionRecordStatus.normal,
      'detection_record.restore',
      request,
      reason,
    );
  }

  async cancelAbnormal(
    id: bigint,
    request: RequestWithAdmin,
    reason?: string,
  ) {
    return this.setAdminRecordStatus(
      id,
      DetectionRecordStatus.normal,
      'detection_record.cancel_abnormal',
      request,
      reason,
    );
  }

  private async setAdminRecordStatus(
    id: bigint,
    status: DetectionRecordStatus,
    action: string,
    request: RequestWithAdmin,
    reason?: string,
  ) {
    await this.findAdminRecordOrThrow(id);

    const record = await this.prisma.detectionRecord.update({
      where: { id },
      data: { status },
      include: detectionRecordDetailInclude,
    });

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'detection_record',
      targetId: id,
      action,
      content: { status, reason: reason || null },
      ip: request.ip,
    });

    return serializeDetectionRecordDetail(record);
  }

  private async findAdminRecordOrThrow(id: bigint) {
    const record = await this.prisma.detectionRecord.findUnique({
      where: { id },
      include: detectionRecordDetailInclude,
    });

    if (!record) {
      throw new NotFoundException({
        message: '检测记录不存在',
        code: 'DETECTION_RECORD_NOT_FOUND',
      });
    }

    return record;
  }

  private buildAdminRecordWhere(query: AdminDetectionRecordQueryDto) {
    const where: Prisma.DetectionRecordWhereInput = {};

    if (query.company_id) {
      where.companyId = parseBigIntId(query.company_id, 'company_id');
    }
    if (query.device_id) {
      where.deviceId = parseBigIntId(query.device_id, 'device_id');
    }
    if (query.overall_result) {
      where.overallResult = fromApiResult(query.overall_result);
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.attention === 'abnormal') {
      where.OR = [
        { overallResult: DetectionResult.fail },
        { status: DetectionRecordStatus.marked_abnormal },
      ];
    }
    if (query.date_from || query.date_to) {
      where.testTime = {};
      if (query.date_from) where.testTime.gte = new Date(query.date_from);
      if (query.date_to) where.testTime.lte = new Date(query.date_to);
    }

    return where;
  }

  private resultLabel(result: DetectionResult) {
    return result === DetectionResult.pass ? '合格' : '不合格';
  }

  private recordStatusLabel(status: DetectionRecordStatus) {
    const labels: Record<DetectionRecordStatus, string> = {
      [DetectionRecordStatus.normal]: '正常',
      [DetectionRecordStatus.hidden]: '已隐藏',
      [DetectionRecordStatus.marked_abnormal]: '标记异常',
      [DetectionRecordStatus.voided]: '已作废',
    };
    return labels[status] || status;
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

  // ---- Disposal (不合格处理闭环) ----

  async listClientRecordDisposals(recordId: bigint, request: RequestWithClientUser) {
    const record = await this.prisma.detectionRecord.findUnique({
      where: {
        id: recordId,
        companyId: request.clientUser!.companyId,
      },
      select: { id: true },
    });
    if (!record) {
      throw new NotFoundException({ message: '检测记录不存在', code: 'RECORD_NOT_FOUND' });
    }

    return this.prisma.detectionRecordDisposal.findMany({
      where: { detectionRecordId: recordId, companyId: request.clientUser!.companyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createClientRecordDisposal(
    recordId: bigint,
    dto: CreateDetectionRecordDisposalDto,
    request: RequestWithClientUser,
  ) {
    const record = await this.prisma.detectionRecord.findUnique({
      where: {
        id: recordId,
        companyId: request.clientUser!.companyId,
      },
    });
    if (!record) {
      throw new NotFoundException({ message: '检测记录不存在', code: 'RECORD_NOT_FOUND' });
    }

    return this.prisma.detectionRecordDisposal.create({
      data: {
        companyId: request.clientUser!.companyId,
        detectionRecordId: recordId,
        disposition: dto.disposition,
        description: dto.description || null,
        handledBy: request.clientUser!.username,
        handledAt: new Date(),
        status: 'done',
      },
    });
  }

  async updateClientRecordDisposal(
    disposalId: bigint,
    dto: UpdateDetectionRecordDisposalDto,
    request: RequestWithClientUser,
  ) {
    const disposal = await this.prisma.detectionRecordDisposal.findUnique({
      where: { id: disposalId },
    });
    if (!disposal || disposal.companyId !== request.clientUser!.companyId) {
      throw new NotFoundException({ message: '处理记录不存在', code: 'DISPOSAL_NOT_FOUND' });
    }

    const data: Prisma.DetectionRecordDisposalUpdateInput = {};
    if (dto.disposition !== undefined) data.disposition = dto.disposition;
    if (dto.description !== undefined) data.description = dto.description || null;

    return this.prisma.detectionRecordDisposal.update({
      where: { id: disposalId },
      data,
    });
  }

  async deleteClientRecordDisposal(disposalId: bigint, request: RequestWithClientUser) {
    const disposal = await this.prisma.detectionRecordDisposal.findUnique({
      where: { id: disposalId },
    });
    if (!disposal || disposal.companyId !== request.clientUser!.companyId) {
      throw new NotFoundException({ message: '处理记录不存在', code: 'DISPOSAL_NOT_FOUND' });
    }

    await this.prisma.detectionRecordDisposal.delete({ where: { id: disposalId } });
    return { deleted: true };
  }
}
