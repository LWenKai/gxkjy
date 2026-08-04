import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrinterRuntimeStatus } from '../../generated/prisma';
import { formatCsvDate, toCsv } from '../../common/csv';
import { parseBigIntId } from '../../common/id';
import { getPagination } from '../../common/pagination.dto';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { PrinterQueryDto } from './dto/printer-query.dto';
import { printerInclude, serializePrinter } from './printers.serializer';

@Injectable()
export class PrintersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: PrinterQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildWhere(query);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.printer.count({ where }),
      this.prisma.printer.findMany({
        where,
        include: printerInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: items.map(serializePrinter),
    };
  }

  async export(query: PrinterQueryDto) {
    const items = await this.prisma.printer.findMany({
      where: this.buildWhere(query),
      include: printerInclude,
      orderBy: { createdAt: 'desc' },
    });

    return toCsv(
      [
        '\u6253\u5370\u673a\u540d\u79f0',
        '\u578b\u53f7',
        '\u8fde\u63a5\u65b9\u5f0f',
        '\u7ed1\u5b9a\u4f01\u4e1a',
        '\u72b6\u6001',
        '\u6700\u540e\u8fde\u63a5\u65f6\u95f4',
        '\u6253\u5370\u6b21\u6570',
        '\u521b\u5efa\u65f6\u95f4',
      ],
      items.map((printer) => [
        printer.printerName,
        printer.printerModel,
        printer.connectionType,
        printer.company?.name || '\u672a\u7ed1\u5b9a',
        this.statusText(printer.status),
        formatCsvDate(printer.lastConnectedAt),
        printer._count.printLogs,
        formatCsvDate(printer.createdAt),
      ]),
    );
  }

  async create(dto: CreatePrinterDto, request: RequestWithAdmin) {
    const companyId = dto.company_id ? parseBigIntId(dto.company_id, 'company_id') : null;
    if (companyId) await this.ensureCompanyExists(companyId);

    const printer = await this.prisma.printer.create({
      data: {
        companyId,
        printerName: dto.printer_name.trim(),
        printerModel: dto.printer_model.trim(),
        manufacturer: dto.manufacturer?.trim() || null,
        connectionType: dto.connection_type,
        serialNo: dto.serial_no?.trim() || null,
        macAddress: dto.mac_address?.trim() || null,
        status: dto.status || PrinterRuntimeStatus.inactive,
        remark: dto.remark?.trim() || null,
      },
      include: printerInclude,
    });

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'printer',
      targetId: printer.id,
      action: 'printer.create',
      content: {
        printer_name: printer.printerName,
        printer_model: printer.printerModel,
        connection_type: printer.connectionType,
        company_id: companyId?.toString() || null,
      },
      ip: request.ip,
    });

    return serializePrinter(printer);
  }

  async get(id: bigint) {
    const printer = await this.prisma.printer.findUnique({
      where: { id },
      include: printerInclude,
    });
    if (!printer) {
      throw new NotFoundException({
        message: '\u6253\u5370\u673a\u4e0d\u5b58\u5728',
        code: 'PRINTER_NOT_FOUND',
      });
    }
    return serializePrinter(printer);
  }

  async testPayload() {
    return {
      title: '\u6253\u5370\u6d4b\u8bd5',
      printer_model: 'UROVO-K329',
      connection_type: 'bluetooth',
      label_size: '60\u00d780mm',
      tests: [
        { name: '\u6587\u5b57\u6253\u5370', status: 'ready', remark: '\u7528\u4e8e\u9a8c\u8bc1\u4e2d\u6587\u548c\u57fa\u7840\u6392\u7248' },
        { name: '\u4e8c\u7ef4\u7801\u6253\u5370', status: 'ready', remark: '\u7528\u4e8e\u9a8c\u8bc1\u626b\u7801\u94fe\u63a5' },
        { name: '\u6807\u7b7e\u6253\u5370', status: 'waiting', remark: '\u7b49\u5f85\u771f\u5b9e\u6253\u5370\u673a\u8054\u8c03' },
        { name: '\u72b6\u6001\u68c0\u6d4b', status: 'waiting', remark: '\u7b49\u5f85\u5382\u5bb6\u72b6\u6001\u6307\u4ee4\u786e\u8ba4' },
      ],
      note: '\u5f53\u524d\u4ec5\u7528\u4e8e\u6253\u5370\u63a5\u5165\u524d\u7684\u6d4b\u8bd5\u51c6\u5907',
    };
  }

  private buildWhere(query: PrinterQueryDto) {
    const where: Prisma.PrinterWhereInput = {};
    if (query.company_id) {
      where.companyId = parseBigIntId(query.company_id, 'company_id');
    }
    if (query.connection_type) {
      where.connectionType = query.connection_type;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.keyword) {
      where.OR = [
        { printerName: { contains: query.keyword } },
        { printerModel: { contains: query.keyword } },
        { serialNo: { contains: query.keyword } },
      ];
    }
    return where;
  }

  private async ensureCompanyExists(companyId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });
    if (!company) {
      throw new NotFoundException({
        message: '\u4f01\u4e1a\u4e0d\u5b58\u5728',
        code: 'COMPANY_NOT_FOUND',
      });
    }
  }

  private statusText(status: PrinterRuntimeStatus) {
    const map: Record<PrinterRuntimeStatus, string> = {
      inactive: '\u672a\u8fde\u63a5',
      available: '\u53ef\u7528',
      connected: '\u5df2\u8fde\u63a5',
      disabled: '\u505c\u7528',
    };
    return map[status];
  }
}
