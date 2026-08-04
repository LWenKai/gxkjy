import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CustomerSource,
  CustomerStatus,
  CustomerType,
  CustomerValueLevel,
  Prisma,
} from '../../generated/prisma';
import { getPagination } from '../../common/pagination.dto';
import { parseBigIntId } from '../../common/id';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {
  CreateCustomerDeviceDto,
  CreateCustomerFollowRecordDto,
  CreateCustomerNeedDto,
  CreateCustomerPurchaseDto,
  CreateCustomerQuoteDto,
} from './dto/customer-record.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  serializeCustomer,
  serializeCustomerListItem,
  serializeDevice,
  serializeFollowRecord,
  serializeNeed,
  serializePurchase,
  serializeQuote,
} from './customers.serializer';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: CustomerQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildCustomerWhere(query);

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        include: {
          followRecords: {
            where: { deletedAt: null },
            orderBy: { followTime: 'desc' },
            take: 1,
          },
          purchases: {
            where: { deletedAt: null },
            orderBy: { purchaseDate: 'desc' },
            take: 1,
          },
          purchaseOrders: {
            where: { deletedAt: null },
            include: {
              items: {
                include: { salesProduct: true },
                orderBy: { nextRepurchaseDate: 'asc' },
                take: 1,
              },
            },
            orderBy: { purchaseDate: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: customers.map(serializeCustomerListItem),
    };
  }

  async get(id: bigint) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: this.detailInclude(),
    });

    if (!customer) {
      throw new NotFoundException({
        message: '客户不存在',
        code: 'CUSTOMER_NOT_FOUND',
      });
    }

    return {
      ...serializeCustomer(customer),
      repurchase_reminders: this.serializeNewReminders(customer),
    };
  }

  async create(dto: CreateCustomerDto, request: RequestWithAdmin) {
    const customer = await this.prisma.customer.create({
      data: {
        customerNo: await this.generateCustomerNo(),
        companyName: dto.company_name.trim(),
        contactName: dto.contact_name || null,
        phone: dto.phone || null,
        wechat: dto.wechat || null,
        province: dto.province || null,
        city: dto.city || null,
        address: dto.address || null,
        customerType: dto.customer_type || CustomerType.OTHER,
        source: dto.source || CustomerSource.OTHER,
        status: dto.status || CustomerStatus.NEW,
        valueLevel: dto.value_level || CustomerValueLevel.UNKNOWN,
        remark: dto.remark || null,
      },
      include: this.detailInclude(),
    });

    await this.writeLog(request, customer.id, 'customer.create', {
      company_name: customer.companyName,
      customer_no: customer.customerNo,
    });

    return serializeCustomer(customer);
  }

  async update(id: bigint, dto: UpdateCustomerDto, request: RequestWithAdmin) {
    await this.ensureCustomerExists(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.company_name !== undefined
          ? { companyName: dto.company_name.trim() }
          : {}),
        ...(dto.contact_name !== undefined
          ? { contactName: dto.contact_name || null }
          : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
        ...(dto.wechat !== undefined ? { wechat: dto.wechat || null } : {}),
        ...(dto.province !== undefined ? { province: dto.province || null } : {}),
        ...(dto.city !== undefined ? { city: dto.city || null } : {}),
        ...(dto.address !== undefined ? { address: dto.address || null } : {}),
        ...(dto.customer_type ? { customerType: dto.customer_type } : {}),
        ...(dto.source ? { source: dto.source } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.value_level ? { valueLevel: dto.value_level } : {}),
        ...(dto.remark !== undefined ? { remark: dto.remark || null } : {}),
      },
      include: this.detailInclude(),
    });

    await this.writeLog(request, customer.id, 'customer.update', {
      company_name: customer.companyName,
    });

    return serializeCustomer(customer);
  }

  async delete(id: bigint, request: RequestWithAdmin) {
    const customer = await this.ensureCustomerExists(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.writeLog(request, id, 'customer.delete', {
      company_name: customer.companyName,
    });
    return { deleted: true };
  }

  async listRepurchaseReminders() {
    const deadline = this.getReminderDeadline();
    const purchases = await this.prisma.customerPurchase.findMany({
      where: {
        deletedAt: null,
        nextRepurchaseDate: { lte: deadline },
        customer: { deletedAt: null },
      },
      include: {
        customer: true,
      },
      orderBy: [{ nextRepurchaseDate: 'asc' }, { purchaseDate: 'desc' }],
      take: 50,
    });

    return purchases.map((purchase) => ({
      id: purchase.id.toString(),
      customer_id: purchase.customerId.toString(),
      company_name: purchase.customer.companyName,
      contact_name: purchase.customer.contactName,
      phone: purchase.customer.phone,
      product_name: purchase.productName,
      quantity: purchase.quantity,
      amount: purchase.amount?.toString() || null,
      purchase_date: purchase.purchaseDate,
      next_repurchase_date: purchase.nextRepurchaseDate,
      expected_cycle_days: purchase.expectedCycleDays,
      remark: purchase.remark,
    }));
  }

  async addNeed(
    customerId: bigint,
    dto: CreateCustomerNeedDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCustomerExists(customerId);
    const need = await this.prisma.customerNeed.create({
      data: {
        customerId,
        needType: dto.need_type,
        productCategory: dto.product_category || null,
        testProject: dto.test_project || null,
        remark: dto.remark || null,
      },
    });
    await this.writeLog(request, customerId, 'customer.need.create', dto);
    return serializeNeed(need);
  }

  async addDevice(
    customerId: bigint,
    dto: CreateCustomerDeviceDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCustomerExists(customerId);
    const device = await this.prisma.customerDevice.create({
      data: {
        customerId,
        manufacturer: dto.manufacturer || null,
        model: dto.model || null,
        deviceCount: dto.device_count || 1,
        purchaseDate: this.parseDate(dto.purchase_date),
        imageUrl: dto.image_url || null,
        remark: dto.remark || null,
      },
    });
    await this.writeLog(request, customerId, 'customer.device.create', dto);
    return serializeDevice(device);
  }

  async addFollowRecord(
    customerId: bigint,
    dto: CreateCustomerFollowRecordDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCustomerExists(customerId);
    const record = await this.prisma.customerFollowRecord.create({
      data: {
        customerId,
        followTime: this.parseDate(dto.follow_time) || new Date(),
        followType: dto.follow_type,
        content: dto.content,
        nextFollowDate: this.parseDate(dto.next_follow_date),
        createdBy: request.adminUser!.id,
      },
    });
    await this.writeLog(request, customerId, 'customer.follow.create', {
      follow_type: dto.follow_type,
      next_follow_date: dto.next_follow_date,
    });
    return serializeFollowRecord(record);
  }

  async addQuote(
    customerId: bigint,
    dto: CreateCustomerQuoteDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCustomerExists(customerId);
    const quote = await this.prisma.customerQuote.create({
      data: {
        customerId,
        productName: dto.product_name,
        amount: dto.amount || null,
        quoteDate: this.parseDate(dto.quote_date) || new Date(),
        status: dto.status,
        remark: dto.remark || null,
      },
    });
    await this.writeLog(request, customerId, 'customer.quote.create', dto);
    return serializeQuote(quote);
  }

  async addPurchase(
    customerId: bigint,
    dto: CreateCustomerPurchaseDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCustomerExists(customerId);
    const purchaseDate = this.parseDate(dto.purchase_date) || new Date();
    const nextRepurchaseDate =
      this.parseDate(dto.next_repurchase_date) ||
      (dto.expected_cycle_days
        ? new Date(
            purchaseDate.getTime() + dto.expected_cycle_days * 24 * 60 * 60 * 1000,
          )
        : null);

    const purchase = await this.prisma.customerPurchase.create({
      data: {
        customerId,
        productName: dto.product_name,
        quantity: dto.quantity || null,
        amount: dto.amount || null,
        purchaseDate,
        expectedCycleDays: dto.expected_cycle_days || null,
        nextRepurchaseDate,
        remark: dto.remark || null,
      },
    });
    await this.writeLog(request, customerId, 'customer.purchase.create', dto);
    return serializePurchase(purchase);
  }

  async deleteNeed(id: bigint, request: RequestWithAdmin) {
    return this.softDeleteChild('customerNeed', id, request, 'customer.need.delete');
  }

  async deleteDevice(id: bigint, request: RequestWithAdmin) {
    return this.softDeleteChild(
      'customerDevice',
      id,
      request,
      'customer.device.delete',
    );
  }

  async deleteFollowRecord(id: bigint, request: RequestWithAdmin) {
    return this.softDeleteChild(
      'customerFollowRecord',
      id,
      request,
      'customer.follow.delete',
    );
  }

  async deleteQuote(id: bigint, request: RequestWithAdmin) {
    return this.softDeleteChild('customerQuote', id, request, 'customer.quote.delete');
  }

  async deletePurchase(id: bigint, request: RequestWithAdmin) {
    return this.softDeleteChild(
      'customerPurchase',
      id,
      request,
      'customer.purchase.delete',
    );
  }

  private async softDeleteChild(
    model:
      | 'customerNeed'
      | 'customerDevice'
      | 'customerFollowRecord'
      | 'customerQuote'
      | 'customerPurchase',
    id: bigint,
    request: RequestWithAdmin,
    action: string,
  ) {
    const delegate = this.prisma[model] as unknown as {
      findFirst(args: unknown): Promise<{ id: bigint; customerId: bigint } | null>;
      update(args: unknown): Promise<unknown>;
    };

    const record = await delegate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!record) {
      throw new NotFoundException({
        message: '记录不存在',
        code: 'CUSTOMER_RECORD_NOT_FOUND',
      });
    }

    await delegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.writeLog(request, record.customerId, action, { record_id: id.toString() });
    return { deleted: true };
  }

  private buildCustomerWhere(query: CustomerQueryDto) {
    const where: Prisma.CustomerWhereInput = { deletedAt: null };
    const keyword = query.keyword?.trim();
    if (keyword) {
      where.OR = [
        { companyName: { contains: keyword } },
        { contactName: { contains: keyword } },
        { phone: { contains: keyword } },
        { wechat: { contains: keyword } },
        { address: { contains: keyword } },
      ];
    }
    if (query.customer_type) where.customerType = query.customer_type;
    if (query.source) where.source = query.source;
    if (query.status) where.status = query.status;
    if (query.value_level) where.valueLevel = query.value_level;
    return where;
  }

  private detailInclude() {
    return {
      needs: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' as const },
      },
      devices: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' as const },
      },
      followRecords: {
        where: { deletedAt: null },
        orderBy: { followTime: 'desc' as const },
      },
      quotes: {
        where: { deletedAt: null },
        include: {
          attachments: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' as const },
          },
        },
        orderBy: { quoteDate: 'desc' as const },
      },
      salesQuotes: {
        where: { deletedAt: null },
        include: {
          items: {
            include: { salesProduct: true },
            orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
          },
        },
        orderBy: [{ quoteDate: 'desc' as const }, { createdAt: 'desc' as const }],
      },
      purchases: {
        where: { deletedAt: null },
        orderBy: { purchaseDate: 'desc' as const },
      },
      purchaseOrders: {
        where: { deletedAt: null },
        include: {
          items: {
            include: { salesProduct: true },
            orderBy: { id: 'asc' as const },
          },
        },
        orderBy: { purchaseDate: 'desc' as const },
      },
    };
  }

  private serializeNewReminders(customer: any) {
    if (!customer || !('purchaseOrders' in customer)) return [];
    const deadline = this.getReminderDeadline();
    const orders = customer.purchaseOrders || [];
    return orders.flatMap((order: any) =>
      (order.items || [])
        .filter(
          (item: any) =>
            item.repurchaseStatus === 'PENDING' &&
            item.repeatReminderEnabled === true &&
            item.nextRepurchaseDate &&
            item.nextRepurchaseDate.getTime() <= deadline.getTime(),
        )
        .map((item: any) => ({
          id: item.id.toString(),
          customer_id: customer.id.toString(),
          order_id: order.id.toString(),
          order_no: order.orderNo,
          product_name: item.productNameSnapshot,
          unit: item.unitSnapshot,
          quantity: item.quantity?.toString() || null,
          unit_price: item.unitPrice?.toString() || null,
          subtotal: item.subtotal?.toString() || null,
          amount: item.subtotal?.toString() || null,
          purchase_date: order.purchaseDate,
          expected_cycle_days: item.expectedCycleDays,
          repeat_reminder_enabled: item.repeatReminderEnabled,
          actual_cycle_days: item.actualCycleDays,
          reminder_days_before: item.reminderDaysBefore,
          next_repurchase_date: item.nextRepurchaseDate,
          repurchase_status: item.repurchaseStatus,
          remark: item.remark,
        })),
    );
  }

  private async ensureCustomerExists(id: bigint) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException({
        message: '客户不存在',
        code: 'CUSTOMER_NOT_FOUND',
      });
    }
    return customer;
  }

  private async generateCustomerNo() {
    const now = new Date();
    const datePart = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
    const prefix = `CUS${datePart}`;
    const count = await this.prisma.customer.count({
      where: { customerNo: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private parseDate(value?: string) {
    return value ? new Date(value) : null;
  }

  private getReminderDeadline() {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    deadline.setHours(23, 59, 59, 999);
    return deadline;
  }

  private async writeLog(
    request: RequestWithAdmin,
    customerId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'customer',
      targetId: customerId,
      action,
      content,
      ip: request.ip,
    });
  }
}
