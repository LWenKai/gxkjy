import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SalesProductPackageType } from '../../generated/prisma';
import { parseBigIntId } from '../../common/id';
import { getPagination } from '../../common/pagination.dto';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSalesProductPackageDto,
  SalesProductPackageItemDto,
  SalesProductPackageQueryDto,
  UpdateSalesProductPackageDto,
} from './dto/sales-product-package.dto';
import { serializeSalesProductPackage } from './sales-product-packages.serializer';

@Injectable()
export class SalesProductPackagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: SalesProductPackageQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.SalesProductPackageWhereInput = { deletedAt: null };
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { packageNo: { contains: keyword } },
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.is_active !== undefined) where.isActive = query.is_active;

    const [total, packages] = await this.prisma.$transaction([
      this.prisma.salesProductPackage.count({ where }),
      this.prisma.salesProductPackage.findMany({
        where,
        include: this.packageInclude(),
        orderBy: [
          { isActive: 'desc' },
          { sortOrder: 'asc' },
          { packageNo: 'asc' },
        ],
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: packages.map(serializeSalesProductPackage),
    };
  }

  async get(id: bigint) {
    return serializeSalesProductPackage(await this.findPackage(id));
  }

  async create(dto: CreateSalesProductPackageDto, request: RequestWithAdmin) {
    const itemData = await this.buildItems(dto.items);
    const pkg = await this.prisma.salesProductPackage.create({
      data: {
        packageNo: await this.generatePackageNo(),
        ...this.buildPackageData(dto),
        items: { create: itemData },
      },
      include: this.packageInclude(),
    });
    await this.writeLog(request, pkg.id, 'sales_product_package.create', {
      package_no: pkg.packageNo,
      name: pkg.name,
    });
    return serializeSalesProductPackage(pkg);
  }

  async update(id: bigint, dto: UpdateSalesProductPackageDto, request: RequestWithAdmin) {
    const existing = await this.findPackage(id);
    const itemData = await this.buildItems(dto.items);
    await this.prisma.$transaction([
      this.prisma.salesProductPackageItem.deleteMany({ where: { packageId: id } }),
      this.prisma.salesProductPackage.update({
        where: { id },
        data: {
          ...this.buildPackageData(dto),
          items: { create: itemData },
        },
      }),
    ]);
    await this.writeLog(request, id, 'sales_product_package.update', {
      package_no: existing.packageNo,
      name: dto.name,
    });
    return serializeSalesProductPackage(await this.findPackage(id));
  }

  async setActive(id: bigint, isActive: boolean, request: RequestWithAdmin) {
    const existing = await this.findPackage(id);
    const updated = await this.prisma.salesProductPackage.update({
      where: { id },
      data: { isActive },
      include: this.packageInclude(),
    });
    await this.writeLog(
      request,
      id,
      isActive ? 'sales_product_package.enable' : 'sales_product_package.disable',
      { package_no: existing.packageNo },
    );
    return serializeSalesProductPackage(updated);
  }

  async delete(id: bigint, request: RequestWithAdmin) {
    const existing = await this.findPackage(id);
    await this.prisma.salesProductPackage.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.writeLog(request, id, 'sales_product_package.delete', {
      package_no: existing.packageNo,
      name: existing.name,
    });
    return { deleted: true };
  }

  private buildPackageData(dto: CreateSalesProductPackageDto | UpdateSalesProductPackageDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException({ message: '请输入套餐名称。', code: 'PACKAGE_NAME_REQUIRED' });
    }
    return {
      name: dto.name.trim(),
      type: dto.type || SalesProductPackageType.CUSTOM,
      description: dto.description || null,
      isActive: dto.is_active !== false,
      sortOrder: dto.sort_order || 0,
      remark: dto.remark || null,
    };
  }

  private async buildItems(items: SalesProductPackageItemDto[]) {
    if (!items?.length) {
      throw new BadRequestException({ message: '套餐至少需要一项产品。', code: 'PACKAGE_ITEMS_REQUIRED' });
    }
    const result: Prisma.SalesProductPackageItemCreateWithoutPackageInput[] = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const quantity = new Prisma.Decimal(item.quantity || '0');
      const unitPrice = new Prisma.Decimal(item.unit_price || '0');
      if (quantity.lte(0)) {
        throw new BadRequestException({ message: '套餐产品数量必须大于0。', code: 'INVALID_QUANTITY' });
      }
      if (unitPrice.lt(0)) {
        throw new BadRequestException({ message: '套餐产品单价不能小于0。', code: 'INVALID_UNIT_PRICE' });
      }
      const salesProduct = item.sales_product_id
        ? await this.prisma.salesProduct.findFirst({
            where: { id: parseBigIntId(item.sales_product_id, 'sales_product_id'), deletedAt: null },
          })
        : null;
      const productName = item.product_name || salesProduct?.name;
      if (!productName?.trim()) {
        throw new BadRequestException({ message: '请选择或填写套餐产品名称。', code: 'PRODUCT_NAME_REQUIRED' });
      }
      result.push({
        salesProduct: salesProduct ? { connect: { id: salesProduct.id } } : undefined,
        productNameSnapshot: productName.trim(),
        brandSnapshot: item.brand || salesProduct?.brand || null,
        modelSnapshot: item.model || salesProduct?.model || salesProduct?.salesModel || null,
        specificationSnapshot: item.specification || salesProduct?.specification || null,
        unitSnapshot: item.unit || salesProduct?.unit || '件',
        quantity,
        unitPrice,
        subtotal: quantity.mul(unitPrice),
        itemRemark: item.item_remark || null,
        sortOrder: item.sort_order ?? index + 1,
      });
    }
    return result;
  }

  private async findPackage(id: bigint) {
    const pkg = await this.prisma.salesProductPackage.findFirst({
      where: { id, deletedAt: null },
      include: this.packageInclude(),
    });
    if (!pkg) {
      throw new NotFoundException({ message: '销售套餐不存在。', code: 'SALES_PACKAGE_NOT_FOUND' });
    }
    return pkg;
  }

  private packageInclude() {
    return {
      items: {
        include: { salesProduct: true },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
      },
    };
  }

  private async generatePackageNo() {
    const prefix = 'PKG';
    const count = await this.prisma.salesProductPackage.count();
    return `${prefix}${String(count + 1).padStart(6, '0')}`;
  }

  private async writeLog(
    request: RequestWithAdmin,
    targetId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'sales_product_package',
      targetId,
      action,
      content,
      ip: request.ip,
    });
  }
}
