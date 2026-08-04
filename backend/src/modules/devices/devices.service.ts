import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DeviceStatus, Prisma } from '../../generated/prisma';
import { formatCsvDate, toCsv } from '../../common/csv';
import { getPagination } from '../../common/pagination.dto';
import { isPrismaUniqueError } from '../../common/prisma-errors';
import { parseBigIntId } from '../../common/id';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { BindDeviceDto } from './dto/bind-device.dto';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DeviceQueryDto } from './dto/device-query.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import {
  deviceWithRelations,
  DeviceWithRelations,
  serializeDevice,
} from './devices.serializer';

@Injectable()
export class DevicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: DeviceQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildDeviceWhere(query);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.device.count({ where }),
      this.prisma.device.findMany({
        where,
        include: deviceWithRelations.include,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: items.map(serializeDevice),
    };
  }

  async export(query: DeviceQueryDto) {
    const items = await this.prisma.device.findMany({
      where: this.buildDeviceWhere(query),
      include: deviceWithRelations.include,
      orderBy: { createdAt: 'desc' },
    });

    return toCsv(
      ['设备名称', '设备编号', '厂家名称', '绑定企业', '状态', '创建时间'],
      items.map((device) => [
        device.deviceName,
        device.deviceSn,
        device.manufacturer?.manufacturerName,
        device.company?.name || '未绑定',
        device.status === DeviceStatus.normal ? '正常' : '停用',
        formatCsvDate(device.createdAt),
      ]),
    );
  }

  async create(dto: CreateDeviceDto, request: RequestWithAdmin) {
    await this.ensureManufacturerExists(dto.manufacturer_code);
    const companyId = dto.company_id
      ? parseBigIntId(dto.company_id, 'company_id')
      : null;
    if (companyId) await this.ensureCompanyExists(companyId);

    try {
      const device = await this.prisma.device.create({
        data: {
          manufacturerCode: dto.manufacturer_code,
          deviceSn: dto.device_sn,
          deviceName: dto.device_name || null,
          model: dto.model || null,
          companyId,
          status: dto.status || DeviceStatus.normal,
          remark: dto.remark || null,
        },
        include: deviceWithRelations.include,
      });

      await this.writeLog(request, device.id, 'device.create', {
        manufacturer_code: dto.manufacturer_code,
        device_sn: dto.device_sn,
        company_id: companyId?.toString() || null,
      });

      return serializeDevice(device);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new ConflictException({
          message: '设备已存在',
          code: 'DEVICE_EXISTS',
        });
      }
      throw error;
    }
  }

  async get(id: bigint) {
    return serializeDevice(await this.findOrThrow(id));
  }

  async update(id: bigint, dto: UpdateDeviceDto, request: RequestWithAdmin) {
    await this.findOrThrow(id);

    if (dto.manufacturer_code !== undefined) {
      await this.ensureManufacturerExists(dto.manufacturer_code);
    }
    const companyId =
      dto.company_id !== undefined
        ? parseBigIntId(dto.company_id, 'company_id')
        : undefined;
    if (companyId !== undefined) await this.ensureCompanyExists(companyId);

    const data: Prisma.DeviceUpdateInput = {};
    if (dto.manufacturer_code !== undefined) {
      data.manufacturer = {
        connect: { manufacturerCode: dto.manufacturer_code },
      };
    }
    if (dto.device_sn !== undefined) data.deviceSn = dto.device_sn;
    if (dto.device_name !== undefined) data.deviceName = dto.device_name || null;
    if (dto.model !== undefined) data.model = dto.model || null;
    if (companyId !== undefined) {
      data.company = { connect: { id: companyId } };
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.remark !== undefined) data.remark = dto.remark || null;

    try {
      const device = await this.prisma.device.update({
        where: { id },
        data,
        include: deviceWithRelations.include,
      });

      await this.writeLog(request, id, 'device.update', {
        ...dto,
        company_id: companyId?.toString(),
      });

      return serializeDevice(device);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new ConflictException({
          message: '设备已存在',
          code: 'DEVICE_EXISTS',
        });
      }
      throw error;
    }
  }

  async bind(id: bigint, dto: BindDeviceDto, request: RequestWithAdmin) {
    await this.findOrThrow(id);
    const companyId = parseBigIntId(dto.company_id, 'company_id');
    await this.ensureCompanyExists(companyId);

    const device = await this.prisma.device.update({
      where: { id },
      data: {
        company: {
          connect: { id: companyId },
        },
      },
      include: deviceWithRelations.include,
    });

    await this.writeLog(request, id, 'device.bind', {
      company_id: companyId.toString(),
    });

    return serializeDevice(device);
  }

  async unbind(id: bigint, request: RequestWithAdmin) {
    await this.findOrThrow(id);

    const device = await this.prisma.device.update({
      where: { id },
      data: {
        company: {
          disconnect: true,
        },
      },
      include: deviceWithRelations.include,
    });

    await this.writeLog(request, id, 'device.unbind');

    return serializeDevice(device);
  }

  async enable(id: bigint, request: RequestWithAdmin) {
    return this.setStatus(id, DeviceStatus.normal, request);
  }

  async disable(id: bigint, request: RequestWithAdmin) {
    return this.setStatus(id, DeviceStatus.disabled, request);
  }

  private async setStatus(
    id: bigint,
    status: DeviceStatus,
    request: RequestWithAdmin,
  ) {
    await this.findOrThrow(id);

    const device = await this.prisma.device.update({
      where: { id },
      data: { status },
      include: deviceWithRelations.include,
    });

    await this.writeLog(request, id, `device.${status}`, { status });

    return serializeDevice(device);
  }

  private async findOrThrow(id: bigint): Promise<DeviceWithRelations> {
    const device = await this.prisma.device.findUnique({
      where: { id },
      include: deviceWithRelations.include,
    });

    if (!device) {
      throw new NotFoundException({
        message: '设备不存在',
        code: 'DEVICE_NOT_FOUND',
      });
    }

    return device;
  }

  private buildDeviceWhere(query: DeviceQueryDto) {
    const where: Prisma.DeviceWhereInput = {};

    if (query.manufacturer_code) {
      where.manufacturerCode = { contains: query.manufacturer_code };
    }
    if (query.company_id) {
      where.companyId = parseBigIntId(query.company_id, 'company_id');
    }
    if (query.status) {
      where.status = query.status;
    }
    if (!query.company_id && query.bind_status === 'bound') {
      where.companyId = { not: null };
    } else if (!query.company_id && query.bind_status === 'unbound') {
      where.companyId = null;
    }

    return where;
  }

  private async ensureManufacturerExists(manufacturerCode: string) {
    const item = await this.prisma.manufacturerInterface.findUnique({
      where: { manufacturerCode },
      select: { id: true },
    });

    if (!item) {
      throw new NotFoundException({
        message: '厂家接口不存在',
        code: 'MANUFACTURER_INTERFACE_NOT_FOUND',
      });
    }
  }

  private async ensureCompanyExists(companyId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException({
        message: '企业不存在',
        code: 'COMPANY_NOT_FOUND',
      });
    }
  }

  private async writeLog(
    request: RequestWithAdmin,
    id: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'device',
      targetId: id,
      action,
      content,
      ip: request.ip,
    });
  }
}
