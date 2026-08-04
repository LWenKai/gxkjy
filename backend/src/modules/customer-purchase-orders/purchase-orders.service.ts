import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  PurchaseDeliveryStatus,
  PurchasePaymentStatus,
  RepurchaseStatus,
} from '../../generated/prisma';
import { parseBigIntId } from '../../common/id';
import { getPagination } from '../../common/pagination.dto';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePurchaseOrderDto,
  PurchaseOrderItemDto,
  PurchaseOrderQueryDto,
  RepurchaseReminderQueryDto,
  UpdatePurchaseOrderDto,
} from './dto/purchase-order.dto';
import {
  serializePurchaseOrder,
  serializeRepurchaseReminder,
} from './purchase-orders.serializer';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: PurchaseOrderQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.CustomerPurchaseOrderWhereInput = { deletedAt: null };
    if (query.customer_id) where.customerId = parseBigIntId(query.customer_id, 'customer_id');
    if (query.payment_status) where.paymentStatus = query.payment_status;
    if (query.delivery_status) where.deliveryStatus = query.delivery_status;

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.customerPurchaseOrder.count({ where }),
      this.prisma.customerPurchaseOrder.findMany({
        where,
        include: {
          customer: true,
          items: { include: { salesProduct: true }, orderBy: { id: 'asc' } },
        },
        orderBy: { purchaseDate: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: orders.map(serializePurchaseOrder),
    };
  }

  async get(id: bigint) {
    const order = await this.findOrder(id);
    return serializePurchaseOrder(order);
  }

  async create(dto: CreatePurchaseOrderDto, request: RequestWithAdmin) {
    const customerId = parseBigIntId(dto.customer_id, 'customer_id');
    await this.ensureCustomer(customerId);
    const itemData = await this.buildItems(dto.items, dto.purchase_date);
    const totalAmount = itemData.reduce(
      (sum, item) => sum.plus(new Prisma.Decimal(String(item.subtotal || 0))),
      new Prisma.Decimal(0),
    );

    const order = await this.prisma.customerPurchaseOrder.create({
      data: {
        orderNo: await this.generateOrderNo(),
        customerId,
        purchaseDate: this.parseDate(dto.purchase_date) || new Date(),
        dealDate: this.parseDate(dto.deal_date),
        totalAmount,
        paymentStatus: dto.payment_status || PurchasePaymentStatus.UNPAID,
        deliveryStatus: dto.delivery_status || PurchaseDeliveryStatus.PENDING,
        expectedDeliveryDate: this.parseDate(dto.expected_delivery_date),
        actualDeliveryDate: this.parseDate(dto.actual_delivery_date),
        expressCompany: dto.express_company || null,
        trackingNo: dto.tracking_no || null,
        invoiceIssued: dto.invoice_issued === true,
        invoiceType: dto.invoice_type || null,
        remark: dto.remark || null,
        createdBy: request.adminUser!.id,
        items: { create: itemData },
      },
      include: this.orderInclude(),
    });

    await this.writeLog(request, order.id, 'purchase_order.create', {
      order_no: order.orderNo,
      customer_id: customerId.toString(),
      total_amount: totalAmount.toString(),
    });
    return serializePurchaseOrder(order);
  }

  async update(id: bigint, dto: UpdatePurchaseOrderDto, request: RequestWithAdmin) {
    const existing = await this.findOrder(id);
    const customerId = parseBigIntId(dto.customer_id, 'customer_id');
    await this.ensureCustomer(customerId);
    const itemData = await this.buildItems(dto.items, dto.purchase_date);
    const totalAmount = itemData.reduce(
      (sum, item) => sum.plus(new Prisma.Decimal(String(item.subtotal || 0))),
      new Prisma.Decimal(0),
    );

    await this.prisma.$transaction([
      this.prisma.customerPurchaseItem.deleteMany({ where: { purchaseOrderId: id } }),
      this.prisma.customerPurchaseOrder.update({
        where: { id },
        data: {
          customerId,
          purchaseDate: this.parseDate(dto.purchase_date) || existing.purchaseDate,
          dealDate: this.parseDate(dto.deal_date) || existing.dealDate,
          totalAmount,
          paymentStatus: dto.payment_status || existing.paymentStatus,
          deliveryStatus: dto.delivery_status || existing.deliveryStatus,
          expectedDeliveryDate: this.parseDate(dto.expected_delivery_date),
          actualDeliveryDate: this.parseDate(dto.actual_delivery_date),
          expressCompany: dto.express_company || null,
          trackingNo: dto.tracking_no || null,
          invoiceIssued: dto.invoice_issued === true,
          invoiceType: dto.invoice_type || null,
          remark: dto.remark || null,
          items: { create: itemData },
        },
      }),
    ]);

    const order = await this.findOrder(id);
    await this.writeLog(request, id, 'purchase_order.update', {
      order_no: existing.orderNo,
      total_amount: totalAmount.toString(),
    });
    return serializePurchaseOrder(order);
  }

  async delete(id: bigint, request: RequestWithAdmin) {
    const order = await this.findOrder(id);
    await this.prisma.customerPurchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.writeLog(request, id, 'purchase_order.delete', { order_no: order.orderNo });
    return { deleted: true };
  }

  async listRepurchaseReminders(query: RepurchaseReminderQueryDto) {
    const now = new Date();
    const deadline = this.getDeadline(query.range || '7d');
    const where: Prisma.CustomerPurchaseItemWhereInput = {
      repeatReminderEnabled: true,
      repurchaseStatus: query.status || RepurchaseStatus.PENDING,
      purchaseOrder: {
        deletedAt: null,
        customer: { deletedAt: null },
      },
    };
    if (query.range !== 'all') {
      where.nextRepurchaseDate = { lte: deadline };
    }
    if (query.range === 'overdue') {
      where.nextRepurchaseDate = { lt: now };
    }

    const items = await this.prisma.customerPurchaseItem.findMany({
      where,
      include: {
        salesProduct: true,
        purchaseOrder: { include: { customer: true } },
      },
      orderBy: [{ nextRepurchaseDate: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });
    return items.map(serializeRepurchaseReminder);
  }

  async updateRepurchaseStatus(
    id: bigint,
    status: RepurchaseStatus,
    request: RequestWithAdmin,
  ) {
    const item = await this.prisma.customerPurchaseItem.findFirst({
      where: { id, purchaseOrder: { deletedAt: null } },
    });
    if (!item) {
      throw new NotFoundException({ message: '复购提醒不存在', code: 'REPURCHASE_ITEM_NOT_FOUND' });
    }
    const updated = await this.prisma.customerPurchaseItem.update({
      where: { id },
      data: { repurchaseStatus: status },
    });
    await this.writeLog(request, id, 'purchase_item.repurchase_status.update', {
      status,
      product_name: item.productNameSnapshot,
    });
    return { id: updated.id.toString(), repurchase_status: updated.repurchaseStatus };
  }

  private async buildItems(items: PurchaseOrderItemDto[], purchaseDate?: string) {
    if (!items?.length) {
      throw new BadRequestException({ message: '请至少添加一个产品', code: 'PURCHASE_ITEMS_REQUIRED' });
    }
    const result: Prisma.CustomerPurchaseItemCreateWithoutPurchaseOrderInput[] = [];
    const orderDate = this.parseDate(purchaseDate) || new Date();

    for (const item of items) {
      const quantity = new Prisma.Decimal(item.quantity || '0');
      const unitPrice = new Prisma.Decimal(item.unit_price || '0');
      if (quantity.lte(0)) {
        throw new BadRequestException({ message: '产品数量必须大于 0', code: 'INVALID_QUANTITY' });
      }
      if (unitPrice.lt(0)) {
        throw new BadRequestException({ message: '成交单价不能小于 0', code: 'INVALID_UNIT_PRICE' });
      }

      const salesProduct = item.sales_product_id
        ? await this.prisma.salesProduct.findFirst({
            where: {
              id: parseBigIntId(item.sales_product_id, 'sales_product_id'),
              deletedAt: null,
            },
          })
        : null;

      const productName = item.product_name || salesProduct?.name;
      if (!productName?.trim()) {
        throw new BadRequestException({ message: '请选择或填写产品名称', code: 'PRODUCT_NAME_REQUIRED' });
      }

      const repeatReminderEnabled =
        item.repeat_reminder_enabled ??
        salesProduct?.repeatReminderEnabled ??
        Boolean(item.next_repurchase_date || item.actual_cycle_days);
      const expectedCycleDays = item.expected_cycle_days ?? salesProduct?.referenceCycleDays ?? salesProduct?.defaultCycleDays ?? null;
      const actualCycleDays = item.actual_cycle_days ?? expectedCycleDays;
      const nextRepurchaseDate =
        this.parseDate(item.next_repurchase_date) ||
        (repeatReminderEnabled && actualCycleDays
          ? new Date(orderDate.getTime() + actualCycleDays * 24 * 60 * 60 * 1000)
          : null);

      result.push({
        salesProduct: salesProduct ? { connect: { id: salesProduct.id } } : undefined,
        productNameSnapshot: productName.trim(),
        brandSnapshot: item.brand || salesProduct?.brand || null,
        modelSnapshot: item.model || salesProduct?.model || salesProduct?.salesModel || null,
        specificationSnapshot: item.specification || salesProduct?.specification || null,
        unitSnapshot: item.unit || salesProduct?.unit || null,
        quantity,
        unitPrice,
        subtotal: quantity.mul(unitPrice),
        expectedCycleDays,
        repeatReminderEnabled,
        actualCycleDays,
        reminderDaysBefore: item.reminder_days_before ?? salesProduct?.defaultReminderDaysBefore ?? 7,
        nextRepurchaseDate,
        repurchaseStatus: item.repurchase_status || RepurchaseStatus.PENDING,
        remark: item.remark || null,
      });
    }
    return result;
  }

  private async findOrder(id: bigint) {
    const order = await this.prisma.customerPurchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: this.orderInclude(),
    });
    if (!order) {
      throw new NotFoundException({ message: '采购单不存在', code: 'PURCHASE_ORDER_NOT_FOUND' });
    }
    return order;
  }

  private orderInclude() {
    return {
      customer: true,
      items: {
        include: { salesProduct: true },
        orderBy: { id: 'asc' as const },
      },
    };
  }

  private async ensureCustomer(id: bigint) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) {
      throw new NotFoundException({ message: '客户不存在', code: 'CUSTOMER_NOT_FOUND' });
    }
    return customer;
  }

  private async generateOrderNo() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const prefix = `PO${datePart}`;
    const count = await this.prisma.customerPurchaseOrder.count({
      where: { orderNo: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private parseDate(value?: string) {
    return value ? new Date(value) : null;
  }

  private getDeadline(range: string) {
    const deadline = new Date();
    if (range === '30d') deadline.setDate(deadline.getDate() + 30);
    else deadline.setDate(deadline.getDate() + 7);
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  }

  private async writeLog(
    request: RequestWithAdmin,
    targetId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'purchase_order',
      targetId,
      action,
      content,
      ip: request.ip,
    });
  }
}
