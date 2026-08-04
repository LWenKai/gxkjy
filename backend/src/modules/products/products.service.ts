import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '../../generated/prisma';
import { formatCsvDate, toCsv } from '../../common/csv';
import { getPagination } from '../../common/pagination.dto';
import { isPrismaUniqueError } from '../../common/prisma-errors';
import { parseBigIntId } from '../../common/id';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClientSaveProductDto } from './dto/client-save-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { productInclude, serializeProduct } from './products.serializer';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: ProductQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildProductWhere(query);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: items.map(serializeProduct),
    };
  }

  async listClient(request: RequestWithClientUser, keyword?: string) {
    const where: Prisma.ProductWhereInput = {
      companyId: request.clientUser!.companyId,
      status: ProductStatus.normal,
    };
    const search = keyword?.trim();
    if (search) {
      where.OR = [
        { productName: { contains: search } },
        { defaultOrigin: { contains: search } },
        { remark: { contains: search } },
      ];
    }

    const items = await this.prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: [{ productName: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return items.map(serializeProduct);
  }

  async saveClient(dto: ClientSaveProductDto, request: RequestWithClientUser) {
    const companyId = request.clientUser!.companyId;
    const productName = dto.product_name.trim();

    if (!productName) {
      throw new ConflictException({
        message: '请输入产品名称',
        code: 'PRODUCT_NAME_REQUIRED',
      });
    }

    const existing = await this.prisma.product.findUnique({
      where: {
        companyId_productName: {
          companyId,
          productName,
        },
      },
      include: productInclude,
    });

    const product = existing
      ? await this.prisma.product.update({
          where: { id: existing.id },
          data: {
            defaultUnit: dto.default_unit || existing.defaultUnit || 'kg',
            defaultOrigin:
              dto.origin !== undefined ? dto.origin || null : existing.defaultOrigin,
            remark: dto.remark !== undefined ? dto.remark || null : existing.remark,
            status: ProductStatus.normal,
          },
          include: productInclude,
        })
      : await this.prisma.product.create({
          data: {
            companyId,
            productName,
            defaultUnit: dto.default_unit || 'kg',
            defaultOrigin: dto.origin || null,
            remark: dto.remark || null,
            status: ProductStatus.normal,
          },
          include: productInclude,
        });

    await this.operationLogs.writeCompanyUserLog({
      userId: request.clientUser!.id,
      targetType: 'product',
      targetId: product.id,
      action: existing ? 'product.client_update' : 'product.client_create',
      content: { product_name: productName },
      ip: request.ip,
    });

    return serializeProduct(product);
  }

  async updateClient(
    id: bigint,
    dto: ClientSaveProductDto,
    request: RequestWithClientUser,
  ) {
    const companyId = request.clientUser!.companyId;
    const productName = dto.product_name.trim();

    if (!productName) {
      throw new ConflictException({
        message: '请输入产品名称',
        code: 'PRODUCT_NAME_REQUIRED',
      });
    }

    await this.findClientProductOrThrow(id, companyId);

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data: {
          productName,
          defaultUnit: dto.default_unit || 'kg',
          defaultOrigin: dto.origin || null,
          remark: dto.remark || null,
          status: ProductStatus.normal,
        },
        include: productInclude,
      });

      await this.operationLogs.writeCompanyUserLog({
        userId: request.clientUser!.id,
        targetType: 'product',
        targetId: product.id,
        action: 'product.client_update',
        content: { product_name: productName },
        ip: request.ip,
      });

      return serializeProduct(product);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new ConflictException({
          message: '该企业下产品名称已存在',
          code: 'PRODUCT_EXISTS',
        });
      }
      throw error;
    }
  }

  async deleteClient(id: bigint, request: RequestWithClientUser) {
    const companyId = request.clientUser!.companyId;
    const product = await this.findClientProductOrThrow(id, companyId);

    const disabled = await this.prisma.product.update({
      where: { id: product.id },
      data: { status: ProductStatus.disabled },
      include: productInclude,
    });

    await this.operationLogs.writeCompanyUserLog({
      userId: request.clientUser!.id,
      targetType: 'product',
      targetId: disabled.id,
      action: 'product.client_delete',
      content: { product_name: disabled.productName },
      ip: request.ip,
    });

    return { deleted: true };
  }

  async export(query: ProductQueryDto) {
    const products = await this.prisma.product.findMany({
      where: this.buildProductWhere(query),
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    return toCsv(
      [
        '企业名称',
        '产品名称',
        '产品类别',
        '规格型号',
        '产地',
        '默认单位',
        '状态',
        '备注',
        '创建时间',
      ],
      products.map((product) => [
        product.company?.name,
        product.productName,
        product.productCategory,
        product.specModel,
        product.defaultOrigin,
        product.defaultUnit,
        product.status === ProductStatus.normal ? '正常' : '停用',
        product.remark,
        formatCsvDate(product.createdAt),
      ]),
    );
  }

  async create(dto: CreateProductDto, request: RequestWithAdmin) {
    const companyId = parseBigIntId(dto.company_id, 'company_id');
    await this.ensureCompanyExists(companyId);

    try {
      const product = await this.prisma.product.create({
        data: {
          companyId,
          productName: dto.product_name,
          productCategory: dto.product_category || null,
          specModel: dto.spec_model || null,
          defaultOrigin: dto.origin || null,
          defaultUnit: dto.default_unit || 'kg',
          remark: dto.remark || null,
          status: dto.status || ProductStatus.normal,
        },
        include: productInclude,
      });

      await this.writeLog(request, product.id, 'product.create', dto);
      return serializeProduct(product);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new ConflictException({
          message: '该企业下产品名称已存在',
          code: 'PRODUCT_EXISTS',
        });
      }
      throw error;
    }
  }

  async get(id: bigint) {
    return serializeProduct(await this.findOrThrow(id));
  }

  async update(id: bigint, dto: UpdateProductDto, request: RequestWithAdmin) {
    await this.findOrThrow(id);
    const companyId = dto.company_id
      ? parseBigIntId(dto.company_id, 'company_id')
      : undefined;
    if (companyId) await this.ensureCompanyExists(companyId);

    const data: Prisma.ProductUpdateInput = {};
    if (companyId !== undefined) data.company = { connect: { id: companyId } };
    if (dto.product_name !== undefined) data.productName = dto.product_name;
    if (dto.product_category !== undefined) {
      data.productCategory = dto.product_category || null;
    }
    if (dto.spec_model !== undefined) data.specModel = dto.spec_model || null;
    if (dto.origin !== undefined) data.defaultOrigin = dto.origin || null;
    if (dto.default_unit !== undefined) data.defaultUnit = dto.default_unit || 'kg';
    if (dto.remark !== undefined) data.remark = dto.remark || null;
    if (dto.status !== undefined) data.status = dto.status;

    try {
      const product = await this.prisma.product.update({
        where: { id },
        data,
        include: productInclude,
      });

      await this.writeLog(request, id, 'product.update', dto);
      return serializeProduct(product);
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new ConflictException({
          message: '该企业下产品名称已存在',
          code: 'PRODUCT_EXISTS',
        });
      }
      throw error;
    }
  }

  async enable(id: bigint, request: RequestWithAdmin) {
    return this.setStatus(id, ProductStatus.normal, request);
  }

  async disable(id: bigint, request: RequestWithAdmin) {
    return this.setStatus(id, ProductStatus.disabled, request);
  }

  private async setStatus(
    id: bigint,
    status: ProductStatus,
    request: RequestWithAdmin,
  ) {
    await this.findOrThrow(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
      include: productInclude,
    });

    await this.writeLog(request, id, `product.${status}`, { status });
    return serializeProduct(product);
  }

  private async findOrThrow(id: bigint) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException({
        message: '产品不存在',
        code: 'PRODUCT_NOT_FOUND',
      });
    }

    return product;
  }

  private buildProductWhere(query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {};

    if (query.company_id) {
      where.companyId = parseBigIntId(query.company_id, 'company_id');
    }
    if (query.product_name) {
      where.productName = { contains: query.product_name };
    }
    if (query.product_category) {
      where.productCategory = { contains: query.product_category };
    }
    if (query.status) {
      where.status = query.status;
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
        message: '企业不存在',
        code: 'COMPANY_NOT_FOUND',
      });
    }
  }

  private async findClientProductOrThrow(id: bigint, companyId: bigint) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        companyId,
        status: ProductStatus.normal,
      },
      include: productInclude,
    });

    if (!product) {
      throw new NotFoundException({
        message: '产品不存在或已删除',
        code: 'PRODUCT_NOT_FOUND',
      });
    }

    return product;
  }

  private async writeLog(
    request: RequestWithAdmin,
    productId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'product',
      targetId: productId,
      action,
      content,
      ip: request.ip,
    });
  }
}
