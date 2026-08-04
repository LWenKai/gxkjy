import { Injectable } from '@nestjs/common';
import { OperatorType, Prisma } from '../../generated/prisma';
import { formatCsvDate, toCsv } from '../../common/csv';
import { getPagination } from '../../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OperationLogQueryDto } from './dto/operation-log-query.dto';

interface WriteAdminLogParams {
  adminId: bigint;
  targetType: string;
  targetId?: bigint | null;
  action: string;
  content?: unknown;
  ip?: string;
}

interface WriteCompanyUserLogParams {
  userId: bigint;
  targetType: string;
  targetId?: bigint | null;
  action: string;
  content?: unknown;
  ip?: string;
}

@Injectable()
export class OperationLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: OperationLogQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildLogWhere(query);

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.operationLog.count({ where }),
      this.prisma.operationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: logs.map((log) => ({
        id: log.id.toString(),
        operator_type: log.operatorType,
        operator_id: log.operatorId?.toString() || null,
        target_type: log.targetType,
        target_id: log.targetId?.toString() || null,
        action: log.action,
        content: this.maskSensitiveContent(log.content),
        ip: log.ip,
        created_at: log.createdAt,
        updated_at: log.updatedAt,
      })),
    };
  }

  async export(query: OperationLogQueryDto) {
    const logs = await this.prisma.operationLog.findMany({
      where: this.buildLogWhere(query),
      orderBy: { createdAt: 'desc' },
    });

    return toCsv(
      ['操作人', '模块', '操作类型', '操作摘要', 'IP', '操作时间'],
      logs.map((log) => [
        this.operatorLabel(log.operatorType, log.operatorId),
        log.targetType,
        log.action,
        this.maskSensitiveContent(log.content),
        log.ip,
        formatCsvDate(log.createdAt),
      ]),
    );
  }

  async writeAdminLog(params: WriteAdminLogParams) {
    await this.prisma.operationLog.create({
      data: {
        operatorType: OperatorType.admin,
        operatorId: params.adminId,
        targetType: params.targetType,
        targetId: params.targetId || null,
        action: params.action,
        content:
          params.content === undefined
            ? null
            : JSON.stringify(params.content).slice(0, 1000),
        ip: params.ip || null,
      },
    });
  }

  async writeCompanyUserLog(params: WriteCompanyUserLogParams) {
    await this.prisma.operationLog.create({
      data: {
        operatorType: OperatorType.company_user,
        operatorId: params.userId,
        targetType: params.targetType,
        targetId: params.targetId || null,
        action: params.action,
        content:
          params.content === undefined
            ? null
            : JSON.stringify(params.content).slice(0, 1000),
        ip: params.ip || null,
      },
    });
  }

  private maskSensitiveContent(content: string | null) {
    if (!content) return null;
    return content.replace(
      /"(password|password_hash|access_secret|token|jwt|secret|oss_access_key_secret)"\s*:\s*"[^"]*"/gi,
      '"$1":"[masked]"',
    );
  }

  private buildLogWhere(query: OperationLogQueryDto) {
    const where: Prisma.OperationLogWhereInput = {};

    if (query.operator) {
      if (/^\d+$/.test(query.operator)) {
        where.operatorId = BigInt(query.operator);
      } else if (
        query.operator === OperatorType.admin ||
        query.operator === OperatorType.company_user
      ) {
        where.operatorType = query.operator as OperatorType;
      }
    }
    if (query.target_type) {
      where.targetType = { contains: query.target_type };
    }
    if (query.action) {
      where.action = { contains: query.action };
    }
    if (query.date_from || query.date_to) {
      where.createdAt = {};
      if (query.date_from) where.createdAt.gte = new Date(query.date_from);
      if (query.date_to) where.createdAt.lte = new Date(query.date_to);
    }

    return where;
  }

  private operatorLabel(type: OperatorType, id: bigint | null) {
    const label = type === OperatorType.admin ? '后台管理员' : '企业账号';
    return id ? `${label}#${id.toString()}` : label;
  }
}
