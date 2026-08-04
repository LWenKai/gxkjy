import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SalesProduct, SalesProductCategory } from '../../generated/prisma';
import { getPagination } from '../../common/pagination.dto';
import { parseBigIntId } from '../../common/id';
import { buildUploadUrl, MemoryUploadFile, saveValidatedFile } from '../../common/upload-files';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSalesProductDto,
  SalesProductQueryDto,
  UpdateSalesProductDto,
} from './dto/sales-product.dto';
import { serializeSalesProduct } from './sales-products.serializer';

const SALES_PRODUCT_CATEGORY_ORDER: Record<SalesProductCategory, number> = {
  [SalesProductCategory.DETECTION_EQUIPMENT]: 10,
  [SalesProductCategory.CERTIFICATE_PRINTER]: 20,
  [SalesProductCategory.DATA_TERMINAL]: 30,
  [SalesProductCategory.SOFTWARE]: 40,
  [SalesProductCategory.ENZYME_REAGENT]: 50,
  [SalesProductCategory.COLLOIDAL_GOLD_CARD]: 60,
  [SalesProductCategory.PRINTING_CONSUMABLE]: 70,
  [SalesProductCategory.LAB_CONSUMABLE]: 80,
  [SalesProductCategory.SERVICE]: 90,
  [SalesProductCategory.OTHER]: 100,
};

function normalizedSortOrder(value: number) {
  return value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

function compareSalesProducts(a: SalesProduct, b: SalesProduct) {
  const categoryDiff =
    SALES_PRODUCT_CATEGORY_ORDER[a.category] - SALES_PRODUCT_CATEGORY_ORDER[b.category];
  if (categoryDiff !== 0) return categoryDiff;

  const activeDiff = Number(b.isActive) - Number(a.isActive);
  if (activeDiff !== 0) return activeDiff;

  const sortDiff = normalizedSortOrder(a.sortOrder) - normalizedSortOrder(b.sortOrder);
  if (sortDiff !== 0) return sortDiff;

  const productNoDiff = a.productNo.localeCompare(b.productNo, 'zh-CN');
  if (productNoDiff !== 0) return productNoDiff;

  return a.name.localeCompare(b.name, 'zh-CN');
}

const DEFAULT_PRODUCT_MODEL_BY_SORT_ORDER: Record<number, string> = {
  10: 'GX-ZP20MS',
  20: 'GX-NE12MS',
  30: 'GX-ZGXMS',
  100: 'GX-RE-NC500',
  110: 'GX-CG-SR3',
  120: 'GX-CG-AFB1',
  130: 'GX-CG-MG',
  140: 'GX-CG-CAP',
  200: 'GX-LC-CUP',
  210: 'GX-LC-TIP',
  220: 'GX-LC-TUBE',
  230: 'GX-LC-BAG',
  300: 'GX-PR-6080B',
  310: 'GX-LB-6080',
  400: 'GX-DT-S01',
  500: 'GX-SW-QJY-1Y',
  600: 'GX-SV-INST',
  610: 'GX-SV-CAL',
};

function defaultProductModel(item: CreateSalesProductDto & { sort_order: number }) {
  return item.model || DEFAULT_PRODUCT_MODEL_BY_SORT_ORDER[item.sort_order] || undefined;
}

const DEFAULT_SALES_PRODUCTS: Array<CreateSalesProductDto & { sort_order: number }> = [
  {
    name: '食品安全综合检测仪',
    category: SalesProductCategory.DETECTION_EQUIPMENT,
    unit: '台',
    specification: '多参数食品安全快检设备，具体配置按项目确认',
    repeat_reminder_enabled: false,
    default_reminder_days_before: 7,
    sort_order: 10,
  },
  {
    name: '农药残留快速检测仪',
    category: SalesProductCategory.DETECTION_EQUIPMENT,
    unit: '台',
    specification: '适用于蔬菜水果农残快速筛查',
    repeat_reminder_enabled: false,
    default_reminder_days_before: 7,
    sort_order: 20,
  },
  {
    name: '胶体金读卡仪',
    category: SalesProductCategory.DETECTION_EQUIPMENT,
    unit: '台',
    specification: '适用于胶体金检测卡结果读取',
    repeat_reminder_enabled: false,
    default_reminder_days_before: 7,
    sort_order: 30,
  },
  {
    name: '农残检测酶试剂',
    category: SalesProductCategory.ENZYME_REAGENT,
    unit: '盒',
    specification: '蔬菜水果农药残留快速检测配套试剂',
    repeat_reminder_enabled: true,
    reference_cycle_days: 30,
    default_reminder_days_before: 7,
    sort_order: 100,
  },
  {
    name: '瘦肉精三联检测卡',
    category: SalesProductCategory.COLLOIDAL_GOLD_CARD,
    unit: '条',
    specification: '肉类样品快速筛查，具体项目按采购确认',
    repeat_reminder_enabled: true,
    reference_cycle_days: 60,
    default_reminder_days_before: 7,
    sort_order: 110,
  },
  {
    name: '黄曲霉毒素B1检测卡',
    category: SalesProductCategory.COLLOIDAL_GOLD_CARD,
    unit: '条',
    specification: '粮油及相关食品样品快速筛查',
    repeat_reminder_enabled: true,
    reference_cycle_days: 60,
    default_reminder_days_before: 7,
    sort_order: 120,
  },
  {
    name: '孔雀石绿检测卡',
    category: SalesProductCategory.COLLOIDAL_GOLD_CARD,
    unit: '条',
    specification: '水产品样品快速筛查',
    repeat_reminder_enabled: true,
    reference_cycle_days: 60,
    default_reminder_days_before: 7,
    sort_order: 130,
  },
  {
    name: '氯霉素检测卡',
    category: SalesProductCategory.COLLOIDAL_GOLD_CARD,
    unit: '条',
    specification: '水产品、肉类等样品快速筛查',
    repeat_reminder_enabled: true,
    reference_cycle_days: 60,
    default_reminder_days_before: 7,
    sort_order: 140,
  },
  {
    name: '样品杯',
    category: SalesProductCategory.LAB_CONSUMABLE,
    unit: '包',
    specification: '快检室样品处理耗材',
    repeat_reminder_enabled: true,
    reference_cycle_days: 90,
    default_reminder_days_before: 7,
    sort_order: 200,
  },
  {
    name: '移液枪枪头',
    category: SalesProductCategory.LAB_CONSUMABLE,
    unit: '包',
    specification: '实验室取样和移液配套耗材',
    repeat_reminder_enabled: true,
    reference_cycle_days: 90,
    default_reminder_days_before: 7,
    sort_order: 210,
  },
  {
    name: '离心管',
    category: SalesProductCategory.LAB_CONSUMABLE,
    unit: '包',
    specification: '样品前处理耗材',
    repeat_reminder_enabled: true,
    reference_cycle_days: 90,
    default_reminder_days_before: 7,
    sort_order: 220,
  },
  {
    name: '取样袋',
    category: SalesProductCategory.LAB_CONSUMABLE,
    unit: '包',
    specification: '快检采样留样耗材',
    repeat_reminder_enabled: true,
    reference_cycle_days: 90,
    default_reminder_days_before: 7,
    sort_order: 230,
  },
  {
    name: '优博讯K329便携标签打印机',
    category: SalesProductCategory.CERTIFICATE_PRINTER,
    brand: '优博讯',
    model: 'K329',
    unit: '台',
    specification: '合格证标签打印设备，具体适配以项目确认',
    repeat_reminder_enabled: false,
    default_reminder_days_before: 7,
    sort_order: 300,
  },
  {
    name: '60×80mm合格证标签纸',
    category: SalesProductCategory.PRINTING_CONSUMABLE,
    unit: '卷',
    specification: '承诺达标合格证标签纸',
    repeat_reminder_enabled: true,
    reference_cycle_days: 90,
    default_reminder_days_before: 7,
    sort_order: 310,
  },
  {
    name: '数据上传终端',
    category: SalesProductCategory.DATA_TERMINAL,
    unit: '台',
    specification: '检测数据上传和现场数据采集配套终端',
    repeat_reminder_enabled: false,
    default_reminder_days_before: 7,
    sort_order: 400,
  },
  {
    name: '谷芯快检云年服务',
    category: SalesProductCategory.SOFTWARE,
    unit: '年',
    specification: '检测记录、合格证开具、扫码查询和打印管理服务',
    repeat_reminder_enabled: true,
    reference_cycle_days: 365,
    default_reminder_days_before: 30,
    sort_order: 500,
  },
  {
    name: '快检室安装培训服务',
    category: SalesProductCategory.SERVICE,
    unit: '次',
    specification: '设备安装指导、基础操作培训和试运行支持',
    repeat_reminder_enabled: false,
    default_reminder_days_before: 7,
    sort_order: 600,
  },
  {
    name: '检测仪维护校准服务',
    category: SalesProductCategory.SERVICE,
    unit: '次',
    specification: '检测设备维护、排查和校准配合服务',
    repeat_reminder_enabled: false,
    default_reminder_days_before: 7,
    sort_order: 610,
  },
];

@Injectable()
export class SalesProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: SalesProductQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.SalesProductWhereInput = { deletedAt: null };
    const keyword = query.keyword?.trim();
    if (keyword) {
      where.OR = [
        { productNo: { contains: keyword } },
        { name: { contains: keyword } },
        { brand: { contains: keyword } },
        { model: { contains: keyword } },
        { salesModel: { contains: keyword } },
        { specification: { contains: keyword } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.is_active !== undefined) where.isActive = query.is_active;

    const [total, allItems] = await this.prisma.$transaction([
      this.prisma.salesProduct.count({ where }),
      this.prisma.salesProduct.findMany({
        where,
      }),
    ]);
    const items = allItems.sort(compareSalesProducts).slice(skip, skip + take);

    return {
      total,
      page,
      page_size: pageSize,
      items: items.map(serializeSalesProduct),
    };
  }

  async get(id: bigint) {
    const product = await this.findProduct(id);
    return serializeSalesProduct(product);
  }

  async create(dto: CreateSalesProductDto, request: RequestWithAdmin) {
    const product = await this.prisma.salesProduct.create({
      data: {
        productNo: await this.generateProductNo(),
        ...this.buildData(dto),
      },
    });
    await this.writeLog(request, product.id, 'sales_product.create', {
      product_no: product.productNo,
      name: product.name,
    });
    return serializeSalesProduct(product);
  }

  async update(id: bigint, dto: UpdateSalesProductDto, request: RequestWithAdmin) {
    await this.findProduct(id);
    const product = await this.prisma.salesProduct.update({
      where: { id },
      data: this.buildData(dto),
    });
    await this.writeLog(request, product.id, 'sales_product.update', {
      product_no: product.productNo,
      name: product.name,
    });
    return serializeSalesProduct(product);
  }

  async delete(id: bigint, request: RequestWithAdmin) {
    const product = await this.findProduct(id);
    await this.prisma.salesProduct.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.writeLog(request, id, 'sales_product.delete', {
      product_no: product.productNo,
      name: product.name,
    });
    return { deleted: true };
  }

  async setActive(id: bigint, isActive: boolean, request: RequestWithAdmin) {
    const product = await this.findProduct(id);
    const updated = await this.prisma.salesProduct.update({
      where: { id },
      data: { isActive },
    });
    await this.writeLog(request, id, isActive ? 'sales_product.enable' : 'sales_product.disable', {
      product_no: product.productNo,
    });
    return serializeSalesProduct(updated);
  }

  async uploadImage(id: bigint, file: MemoryUploadFile, request: RequestWithAdmin) {
    const product = await this.findProduct(id);
    const saved = await saveValidatedFile(file, `sales-products/${id.toString()}`, {
      maxSize: 5 * 1024 * 1024,
      allowedExtensions: ['.jpg', '.jpeg', '.png'],
      allowedMimeTypes: ['image/jpeg', 'image/png'],
    });
    const updated = await this.prisma.salesProduct.update({
      where: { id },
      data: { imageUrl: buildUploadUrl(saved.relativePath) },
    });
    await this.writeLog(request, id, 'sales_product.image.upload', {
      product_no: product.productNo,
      file_name: saved.originalName,
    });
    return serializeSalesProduct(updated);
  }

  async ensureDefaults(request: RequestWithAdmin) {
    let created = 0;
    let skipped = 0;

    for (const item of DEFAULT_SALES_PRODUCTS) {
      const exists = await this.prisma.salesProduct.findFirst({
        where: {
          deletedAt: null,
          name: item.name,
          category: item.category,
        },
      });

      if (exists) {
        const model = defaultProductModel(item);
        const data: Prisma.SalesProductUpdateInput = {};
        if (model && exists.model !== model) data.model = model;
        if (exists.salesModel) data.salesModel = null;
        if (Object.keys(data).length) {
          await this.prisma.salesProduct.update({
            where: { id: exists.id },
            data,
          });
        }
        skipped += 1;
        continue;
      }

      await this.prisma.salesProduct.create({
        data: {
          productNo: await this.generateProductNo(),
          ...this.buildData({
            ...item,
            model: defaultProductModel(item),
            default_sale_price: undefined,
            reference_cost_price: undefined,
            description: item.specification,
          }),
        },
      });
      created += 1;
    }

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'sales_product',
      action: 'sales_product.ensure_defaults',
      content: { created, skipped, total: DEFAULT_SALES_PRODUCTS.length },
      ip: request.ip,
    });

    return { created, skipped, total: DEFAULT_SALES_PRODUCTS.length };
  }

  private buildData(dto: CreateSalesProductDto | UpdateSalesProductDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException({ message: '请输入产品名称', code: 'PRODUCT_NAME_REQUIRED' });
    }
    return {
      name: dto.name.trim(),
      category: dto.category || SalesProductCategory.OTHER,
      brand: dto.brand || null,
      model: dto.model || null,
      salesModel: dto.sales_model || null,
      specification: dto.specification || null,
      unit: dto.unit || '件',
      defaultSalePrice: dto.default_sale_price || null,
      referenceCostPrice: dto.reference_cost_price || null,
      defaultCycleDays: dto.default_cycle_days || null,
      repeatReminderEnabled: dto.repeat_reminder_enabled === true,
      referenceCycleDays: dto.reference_cycle_days ?? dto.default_cycle_days ?? null,
      defaultReminderDaysBefore: dto.default_reminder_days_before ?? 7,
      description: dto.description || null,
      remark: dto.remark || null,
      sortOrder: dto.sort_order || 0,
      ...(dto.is_active !== undefined ? { isActive: dto.is_active } : {}),
    };
  }

  private async findProduct(id: bigint) {
    const product = await this.prisma.salesProduct.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException({ message: '销售产品不存在', code: 'SALES_PRODUCT_NOT_FOUND' });
    }
    return product;
  }

  private async generateProductNo() {
    const prefix = 'SP';
    const count = await this.prisma.salesProduct.count();
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
      targetType: 'sales_product',
      targetId,
      action,
      content,
      ip: request.ip,
    });
  }
}
