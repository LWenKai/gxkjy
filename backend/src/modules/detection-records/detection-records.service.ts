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
  detectionRecordDetailInclude,
  detectionRecordListInclude,
  fromApiResult,
  serializeDetectionRecord,
  serializeDetectionRecordDetail,
} from './detection-records.serializer';

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
}
