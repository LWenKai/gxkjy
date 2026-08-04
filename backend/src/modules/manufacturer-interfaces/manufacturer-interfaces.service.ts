import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ManufacturerInterface,
  ManufacturerInterfaceStatus,
  ManufacturerIntegrationType,
  Prisma,
} from '../../generated/prisma';
import { getPagination } from '../../common/pagination.dto';
import { generateAccessSecret } from '../../common/random';
import { isPrismaUniqueError } from '../../common/prisma-errors';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateManufacturerInterfaceDto } from './dto/create-manufacturer-interface.dto';
import { ManufacturerInterfaceQueryDto } from './dto/manufacturer-interface-query.dto';
import { UpdateManufacturerInterfaceDto } from './dto/update-manufacturer-interface.dto';
import { serializeManufacturerInterface } from './manufacturer-interfaces.serializer';

@Injectable()
export class ManufacturerInterfacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: ManufacturerInterfaceQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.ManufacturerInterfaceWhereInput = {};

    if (query.manufacturer_name) {
      where.manufacturerName = { contains: query.manufacturer_name };
    }
    if (query.manufacturer_code) {
      where.manufacturerCode = { contains: query.manufacturer_code };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.integration_type) {
      where.integrationType = query.integration_type;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.manufacturerInterface.count({ where }),
      this.prisma.manufacturerInterface.findMany({
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
      items: items.map(serializeManufacturerInterface),
    };
  }

  async create(dto: CreateManufacturerInterfaceDto, request: RequestWithAdmin) {
    const generatedSecret = dto.access_secret ? null : generateAccessSecret();
    const accessSecret = dto.access_secret || generatedSecret!;
    const manufacturerCode =
      dto.manufacturer_code || (await this.generateManufacturerCode());

    try {
      const item = await this.prisma.manufacturerInterface.create({
        data: {
          manufacturerName: dto.manufacturer_name,
          manufacturerCode,
          accessSecret,
          integrationType:
            dto.integration_type || ManufacturerIntegrationType.http_api,
          status: dto.status || ManufacturerInterfaceStatus.normal,
          signRule: dto.sign_rule || null,
          allowedIps: dto.allowed_ips || null,
        },
      });

      await this.writeLog(request, item.id, 'manufacturer_interface.create', {
        manufacturer_code: item.manufacturerCode,
      });

      return {
        ...serializeManufacturerInterface(item),
        ...(generatedSecret ? { access_secret_once: generatedSecret } : {}),
      };
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new ConflictException({
          message: '厂家标识已存在',
          code: 'MANUFACTURER_CODE_EXISTS',
        });
      }
      throw error;
    }
  }

  async get(id: bigint) {
    return serializeManufacturerInterface(await this.findOrThrow(id));
  }

  async update(
    id: bigint,
    dto: UpdateManufacturerInterfaceDto,
    request: RequestWithAdmin,
  ) {
    await this.findOrThrow(id);

    const data: Prisma.ManufacturerInterfaceUpdateInput = {};
    if (dto.manufacturer_name !== undefined) {
      data.manufacturerName = dto.manufacturer_name;
    }
    if (dto.access_secret !== undefined) data.accessSecret = dto.access_secret;
    if (dto.integration_type !== undefined) {
      data.integrationType = dto.integration_type;
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.sign_rule !== undefined) data.signRule = dto.sign_rule || null;
    if (dto.allowed_ips !== undefined) data.allowedIps = dto.allowed_ips || null;

    const item = await this.prisma.manufacturerInterface.update({
      where: { id },
      data,
    });

    await this.writeLog(request, id, 'manufacturer_interface.update', {
      ...dto,
      access_secret: dto.access_secret ? '[updated]' : undefined,
    });

    return serializeManufacturerInterface(item);
  }

  async enable(id: bigint, request: RequestWithAdmin) {
    return this.setStatus(id, ManufacturerInterfaceStatus.normal, request);
  }

  async disable(id: bigint, request: RequestWithAdmin) {
    return this.setStatus(id, ManufacturerInterfaceStatus.disabled, request);
  }

  async regenerateSecret(id: bigint, request: RequestWithAdmin) {
    await this.findOrThrow(id);
    const accessSecret = generateAccessSecret();
    const item = await this.prisma.manufacturerInterface.update({
      where: { id },
      data: { accessSecret },
    });

    await this.writeLog(request, id, 'manufacturer_interface.regenerate_secret', {
      manufacturer_code: item.manufacturerCode,
      access_secret: '[regenerated]',
    });

    return {
      ...serializeManufacturerInterface(item),
      access_secret_once: accessSecret,
    };
  }

  private async setStatus(
    id: bigint,
    status: ManufacturerInterfaceStatus,
    request: RequestWithAdmin,
  ) {
    await this.findOrThrow(id);

    const item = await this.prisma.manufacturerInterface.update({
      where: { id },
      data: { status },
    });

    await this.writeLog(request, id, `manufacturer_interface.${status}`, {
      status,
    });

    return serializeManufacturerInterface(item);
  }

  private async findOrThrow(id: bigint): Promise<ManufacturerInterface> {
    const item = await this.prisma.manufacturerInterface.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException({
        message: '厂家接口不存在',
        code: 'MANUFACTURER_INTERFACE_NOT_FOUND',
      });
    }

    return item;
  }

  private async generateManufacturerCode() {
    const total = await this.prisma.manufacturerInterface.count();
    for (let offset = 1; offset <= 999999; offset += 1) {
      const code = `MFR${String(total + offset).padStart(6, '0')}`;
      const exists = await this.prisma.manufacturerInterface.findUnique({
        where: { manufacturerCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }

    throw new ConflictException({
      message: '厂家编码生成失败，请重试',
      code: 'MANUFACTURER_CODE_GENERATE_FAILED',
    });
  }

  private async writeLog(
    request: RequestWithAdmin,
    id: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'manufacturer_interface',
      targetId: id,
      action,
      content,
      ip: request.ip,
    });
  }
}
