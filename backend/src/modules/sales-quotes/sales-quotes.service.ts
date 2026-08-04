import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import ExcelJS = require('exceljs');
import PDFDocument = require('pdfkit');
import { createReadStream, createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { basename, join, normalize, relative } from 'path';
import {
  Prisma,
  PurchaseDeliveryStatus,
  PurchasePaymentStatus,
  RepurchaseStatus,
  SalesQuoteStatus,
} from '../../generated/prisma';
import { parseBigIntId } from '../../common/id';
import { getPagination } from '../../common/pagination.dto';
import { getUploadRoot } from '../../common/upload-files';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConvertQuoteToOrderDto,
  ConvertQuoteToOrderItemDto,
  CreateSalesQuoteDto,
  RepurchaseQuoteDto,
  SalesQuoteItemDto,
  SalesQuoteQueryDto,
  UpdateSalesQuoteDto,
} from './dto/sales-quote.dto';
import { serializeConvertedOrder, serializeSalesQuote } from './sales-quotes.serializer';

const COMPANY_NAME = '山西谷芯科技有限公司';
const COMPANY_PHONE = '13363412262';
const COMPANY_BUSINESS_SCOPE = '食品安全快检设备、耗材与合格证打印配套';

const DEFAULT_TERMS = {
  invoiceNote: '以上报价为含税价格，可开具增值税普通发票。',
  shippingNote: '运输方式及费用根据实际订单确认。',
  deliveryNote: '收到货款后3-7个工作日内安排发货，特殊产品或项目以双方确认时间为准。',
  paymentNote: '客户确认报价后付款，款到安排采购及发货。',
  afterSalesNote: '提供产品使用指导及相关售后支持，具体服务内容以本报价单备注或双方签订的合同为准。',
};

type QuoteWithRelations = Prisma.SalesQuoteGetPayload<{
  include: ReturnType<SalesQuotesService['quoteInclude']>;
}>;

@Injectable()
export class SalesQuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async list(query: SalesQuoteQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.SalesQuoteWhereInput = { deletedAt: null };
    if (query.customer_id) where.customerId = parseBigIntId(query.customer_id, 'customer_id');
    if (query.status) where.status = query.status;
    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { quoteNo: { contains: keyword } },
        { customer: { companyName: { contains: keyword } } },
      ];
    }

    const [total, quotes] = await this.prisma.$transaction([
      this.prisma.salesQuote.count({ where }),
      this.prisma.salesQuote.findMany({
        where,
        include: this.quoteInclude(),
        orderBy: [{ quoteDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: quotes.map(serializeSalesQuote),
    };
  }

  async get(id: bigint) {
    return serializeSalesQuote(await this.findQuote(id));
  }

  async create(dto: CreateSalesQuoteDto, request: RequestWithAdmin) {
    const customerId = parseBigIntId(dto.customer_id, 'customer_id');
    await this.ensureCustomer(customerId);
    const quoteDate = this.parseDate(dto.quote_date) || new Date();
    const seriesNo = await this.generateQuoteSeriesNo(quoteDate);
    const itemData = await this.buildQuoteItems(dto.items);
    const totalAmount = this.sumSubtotal(itemData);

    const quote = await this.prisma.salesQuote.create({
      data: {
        quoteNo: `${seriesNo}-V1`,
        quoteSeriesNo: seriesNo,
        versionNo: 1,
        customerId,
        quoteDate,
        validUntil: this.parseDate(dto.valid_until) || this.addDays(quoteDate, 7),
        isTaxIncluded: dto.is_tax_included !== false,
        invoiceNote: dto.invoice_note || DEFAULT_TERMS.invoiceNote,
        shippingNote: dto.shipping_note || DEFAULT_TERMS.shippingNote,
        deliveryNote: dto.delivery_note || DEFAULT_TERMS.deliveryNote,
        paymentNote: dto.payment_note || DEFAULT_TERMS.paymentNote,
        afterSalesNote: dto.after_sales_note || DEFAULT_TERMS.afterSalesNote,
        remark: dto.remark || null,
        totalAmount,
        totalAmountCn: amountToChinese(totalAmount.toNumber()),
        createdBy: request.adminUser!.id,
        items: { create: itemData },
      },
      include: this.quoteInclude(),
    });

    await this.writeLog(request, quote.id, 'sales_quote.create', {
      quote_no: quote.quoteNo,
      customer_id: customerId.toString(),
    });
    return serializeSalesQuote(quote);
  }

  async update(id: bigint, dto: UpdateSalesQuoteDto, request: RequestWithAdmin) {
    const existing = await this.findQuote(id);
    if (existing.status !== SalesQuoteStatus.DRAFT) {
      throw new BadRequestException({
        message: '已生成正式文件的报价不能直接修改，请创建新版本。',
        code: 'SALES_QUOTE_LOCKED',
      });
    }

    const itemData = await this.buildQuoteItems(dto.items);
    const totalAmount = this.sumSubtotal(itemData);
    await this.prisma.$transaction([
      this.prisma.salesQuoteItem.deleteMany({ where: { salesQuoteId: id } }),
      this.prisma.salesQuote.update({
        where: { id },
        data: {
          quoteDate: this.parseDate(dto.quote_date) || existing.quoteDate,
          validUntil: this.parseDate(dto.valid_until) || existing.validUntil,
          isTaxIncluded: dto.is_tax_included !== false,
          invoiceNote: dto.invoice_note || DEFAULT_TERMS.invoiceNote,
          shippingNote: dto.shipping_note || DEFAULT_TERMS.shippingNote,
          deliveryNote: dto.delivery_note || DEFAULT_TERMS.deliveryNote,
          paymentNote: dto.payment_note || DEFAULT_TERMS.paymentNote,
          afterSalesNote: dto.after_sales_note || DEFAULT_TERMS.afterSalesNote,
          remark: dto.remark || null,
          totalAmount,
          totalAmountCn: amountToChinese(totalAmount.toNumber()),
          items: { create: itemData },
        },
      }),
    ]);

    await this.writeLog(request, id, 'sales_quote.update', { quote_no: existing.quoteNo });
    return serializeSalesQuote(await this.findQuote(id));
  }

  async createVersion(id: bigint, request: RequestWithAdmin) {
    const source = await this.findQuote(id);
    const nextVersion =
      (await this.prisma.salesQuote.aggregate({
        where: { quoteSeriesNo: source.quoteSeriesNo, deletedAt: null },
        _max: { versionNo: true },
      }))._max.versionNo || source.versionNo;
    const versionNo = nextVersion + 1;
    const quote = await this.prisma.salesQuote.create({
      data: {
        quoteNo: `${source.quoteSeriesNo}-V${versionNo}`,
        quoteSeriesNo: source.quoteSeriesNo,
        versionNo,
        customerId: source.customerId,
        sourceQuoteId: source.id,
        quoteDate: new Date(),
        validUntil: this.addDays(new Date(), 7),
        status: SalesQuoteStatus.DRAFT,
        isTaxIncluded: source.isTaxIncluded,
        invoiceNote: source.invoiceNote,
        shippingNote: source.shippingNote,
        deliveryNote: source.deliveryNote,
        paymentNote: source.paymentNote,
        afterSalesNote: source.afterSalesNote,
        remark: source.remark,
        totalAmount: source.totalAmount,
        totalAmountCn: source.totalAmountCn,
        createdBy: request.adminUser!.id,
        items: {
          create: source.items.map((item) => ({
            salesProduct: item.salesProductId ? { connect: { id: item.salesProductId } } : undefined,
            sourcePackage: item.sourcePackageId ? { connect: { id: item.sourcePackageId } } : undefined,
            sourcePackageNameSnapshot: item.sourcePackageNameSnapshot,
            productNameSnapshot: item.productNameSnapshot,
            brandSnapshot: item.brandSnapshot,
            modelSnapshot: item.modelSnapshot,
            specificationSnapshot: item.specificationSnapshot,
            unitSnapshot: item.unitSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            itemRemark: item.itemRemark,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: this.quoteInclude(),
    });

    await this.writeLog(request, quote.id, 'sales_quote.version.create', {
      source_quote_no: source.quoteNo,
      quote_no: quote.quoteNo,
    });
    return serializeSalesQuote(quote);
  }

  async updateStatus(id: bigint, status: SalesQuoteStatus, request: RequestWithAdmin) {
    const quote = await this.findQuote(id);
    if (status === SalesQuoteStatus.ACCEPTED) {
      await this.prisma.salesQuote.updateMany({
        where: {
          quoteSeriesNo: quote.quoteSeriesNo,
          id: { not: id },
          status: SalesQuoteStatus.ACCEPTED,
          deletedAt: null,
        },
        data: { status: SalesQuoteStatus.SUPERSEDED },
      });
    }
    const updated = await this.prisma.salesQuote.update({
      where: { id },
      data: { status },
      include: this.quoteInclude(),
    });
    await this.writeLog(request, id, 'sales_quote.status.update', {
      quote_no: quote.quoteNo,
      status,
    });
    return serializeSalesQuote(updated);
  }

  async generateFiles(id: bigint, request: RequestWithAdmin) {
    const quote = await this.findQuote(id);
    if (!quote.items.length) {
      throw new BadRequestException({ message: '报价单至少需要一项产品。', code: 'QUOTE_ITEMS_REQUIRED' });
    }
    const dir = await this.getQuoteDir(quote);
    const safeCustomer = sanitizeFileName(quote.customer.companyName);
    const pdfName = `${quote.quoteNo}_${safeCustomer}.pdf`;
    const excelName = `${quote.quoteNo}_${safeCustomer}.xlsx`;
    const pdfFullPath = join(dir.fullPath, pdfName);
    const excelFullPath = join(dir.fullPath, excelName);

    await this.writePdfFormal(quote, pdfFullPath);
    await this.writeExcelFormal(quote, excelFullPath);

    const updated = await this.prisma.salesQuote.update({
      where: { id },
      data: {
        pdfPath: `${dir.relativePath}/${pdfName}`,
        excelPath: `${dir.relativePath}/${excelName}`,
        status: quote.status === SalesQuoteStatus.DRAFT ? SalesQuoteStatus.GENERATED : quote.status,
      },
      include: this.quoteInclude(),
    });
    await this.writeLog(request, id, 'sales_quote.files.generate', { quote_no: quote.quoteNo });
    return serializeSalesQuote(updated);
  }

  async convertToOrder(id: bigint, dto: ConvertQuoteToOrderDto, request: RequestWithAdmin) {
    const quote = await this.findQuote(id);
    const convertibleStatuses: SalesQuoteStatus[] = [
      SalesQuoteStatus.ACCEPTED,
      SalesQuoteStatus.CONFIRMING,
      SalesQuoteStatus.SENT,
      SalesQuoteStatus.GENERATED,
    ];
    if (!convertibleStatuses.includes(quote.status)) {
      throw new BadRequestException({
        message: '请先生成并确认报价后再转为成交订单。',
        code: 'QUOTE_STATUS_NOT_CONVERTIBLE',
      });
    }
    if (quote.orders?.length) {
      throw new BadRequestException({ message: '该报价已经转为成交订单。', code: 'QUOTE_ALREADY_CONVERTED' });
    }

    const dealDate = this.parseDate(dto.deal_date) || new Date();
    const itemOverrides = new Map((dto.items || []).map((item) => [item.quote_item_id, item]));
    const orderItems = quote.items.map((item) =>
      this.buildOrderItemFromQuoteItem(item, dealDate, itemOverrides.get(item.id.toString())),
    );

    const order = await this.prisma.customerPurchaseOrder.create({
      data: {
        orderNo: await this.generateOrderNo(),
        customerId: quote.customerId,
        salesQuoteId: quote.id,
        quoteNoSnapshot: quote.quoteNo,
        purchaseDate: dealDate,
        dealDate,
        totalAmount: quote.totalAmount,
        paymentStatus: dto.payment_status || PurchasePaymentStatus.UNPAID,
        deliveryStatus: dto.delivery_status || PurchaseDeliveryStatus.PENDING,
        expectedDeliveryDate: this.parseDate(dto.expected_delivery_date),
        actualDeliveryDate: this.parseDate(dto.actual_delivery_date),
        expressCompany: dto.express_company || null,
        trackingNo: dto.tracking_no || null,
        invoiceIssued: dto.invoice_issued === true,
        invoiceType: dto.invoice_type || null,
        remark: dto.remark || quote.remark || null,
        createdBy: request.adminUser!.id,
        items: { create: orderItems },
      },
      include: { items: true },
    });

    await this.updateStatus(quote.id, SalesQuoteStatus.ACCEPTED, request);
    await this.writeLog(request, order.id, 'sales_quote.convert_to_order', {
      quote_no: quote.quoteNo,
      order_no: order.orderNo,
    });
    return serializeConvertedOrder(order);
  }

  async createRepurchaseQuote(itemId: bigint, dto: RepurchaseQuoteDto, request: RequestWithAdmin) {
    const item = await this.prisma.customerPurchaseItem.findFirst({
      where: { id: itemId, purchaseOrder: { deletedAt: null } },
      include: { salesProduct: true, purchaseOrder: { include: { customer: true } } },
    });
    if (!item) {
      throw new NotFoundException({ message: '复购提醒不存在。', code: 'REPURCHASE_ITEM_NOT_FOUND' });
    }

    const quoteDate = new Date();
    const seriesNo = await this.generateQuoteSeriesNo(quoteDate);
    const quantity = new Prisma.Decimal(dto.quantity || item.quantity.toString());
    const unitPrice = new Prisma.Decimal(dto.unit_price || item.unitPrice.toString());
    const quote = await this.prisma.salesQuote.create({
      data: {
        quoteNo: `${seriesNo}-V1`,
        quoteSeriesNo: seriesNo,
        versionNo: 1,
        customerId: item.purchaseOrder.customerId,
        sourceOrderItemId: item.id,
        quoteDate,
        validUntil: this.addDays(quoteDate, 7),
        invoiceNote: DEFAULT_TERMS.invoiceNote,
        shippingNote: DEFAULT_TERMS.shippingNote,
        deliveryNote: DEFAULT_TERMS.deliveryNote,
        paymentNote: DEFAULT_TERMS.paymentNote,
        afterSalesNote: DEFAULT_TERMS.afterSalesNote,
        remark: `由复购提醒生成，上次订单：${item.purchaseOrder.orderNo}`,
        totalAmount: quantity.mul(unitPrice),
        totalAmountCn: amountToChinese(quantity.mul(unitPrice).toNumber()),
        createdBy: request.adminUser!.id,
        items: {
          create: [
            {
              salesProduct: item.salesProductId ? { connect: { id: item.salesProductId } } : undefined,
              productNameSnapshot: item.productNameSnapshot,
              brandSnapshot: item.brandSnapshot,
              modelSnapshot: item.modelSnapshot,
              specificationSnapshot: item.specificationSnapshot,
              unitSnapshot: item.unitSnapshot,
              quantity,
              unitPrice,
              subtotal: quantity.mul(unitPrice),
              itemRemark: item.remark,
              sortOrder: 1,
            },
          ],
        },
      },
      include: this.quoteInclude(),
    });

    await this.writeLog(request, quote.id, 'sales_quote.repurchase.create', {
      source_item_id: item.id.toString(),
      quote_no: quote.quoteNo,
    });
    return serializeSalesQuote(quote);
  }

  async getDownloadFile(id: bigint, type: 'pdf' | 'excel') {
    const quote = await this.findQuote(id);
    const relativePath = type === 'pdf' ? quote.pdfPath : quote.excelPath;
    if (!relativePath) {
      throw new NotFoundException({ message: '报价文件尚未生成。', code: 'QUOTE_FILE_NOT_FOUND' });
    }
    const fullPath = this.resolveUploadPath(relativePath);
    return {
      stream: createReadStream(fullPath),
      fileName: basename(relativePath),
      mimeType:
        type === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private buildOrderItemFromQuoteItem(
    item: QuoteWithRelations['items'][number],
    dealDate: Date,
    override?: ConvertQuoteToOrderItemDto,
  ): Prisma.CustomerPurchaseItemCreateWithoutPurchaseOrderInput {
    const product = item.salesProduct;
    const repeatEnabled =
      override?.repeat_reminder_enabled ??
      product?.repeatReminderEnabled ??
      Boolean(item.salesProductId && product?.referenceCycleDays);
    const actualCycleDays = override?.actual_cycle_days ?? product?.referenceCycleDays ?? null;
    const nextRepurchaseDate =
      this.parseDate(override?.next_repurchase_date) ||
      (repeatEnabled && actualCycleDays
        ? new Date(dealDate.getTime() + actualCycleDays * 24 * 60 * 60 * 1000)
        : null);

    return {
      salesProduct: item.salesProductId ? { connect: { id: item.salesProductId } } : undefined,
      productNameSnapshot: item.productNameSnapshot,
      brandSnapshot: item.brandSnapshot,
      modelSnapshot: item.modelSnapshot,
      specificationSnapshot: item.specificationSnapshot,
      unitSnapshot: item.unitSnapshot,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      expectedCycleDays: product?.referenceCycleDays || null,
      repeatReminderEnabled: repeatEnabled,
      actualCycleDays,
      reminderDaysBefore: override?.reminder_days_before ?? product?.defaultReminderDaysBefore ?? 7,
      nextRepurchaseDate,
      repurchaseStatus: RepurchaseStatus.PENDING,
      remark: item.itemRemark,
    };
  }

  private async buildQuoteItems(items: SalesQuoteItemDto[]) {
    if (!items?.length) {
      throw new BadRequestException({ message: '请至少添加一项报价产品。', code: 'QUOTE_ITEMS_REQUIRED' });
    }
    const result: Prisma.SalesQuoteItemCreateWithoutSalesQuoteInput[] = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const quantity = new Prisma.Decimal(item.quantity || '0');
      const unitPrice = new Prisma.Decimal(item.unit_price || '0');
      if (quantity.lte(0)) {
        throw new BadRequestException({ message: '产品数量必须大于0。', code: 'INVALID_QUANTITY' });
      }
      if (unitPrice.lt(0)) {
        throw new BadRequestException({ message: '报价单价不能小于0。', code: 'INVALID_UNIT_PRICE' });
      }
      const salesProduct = item.sales_product_id
        ? await this.prisma.salesProduct.findFirst({
            where: { id: parseBigIntId(item.sales_product_id, 'sales_product_id'), deletedAt: null },
          })
        : null;
      const sourcePackage = item.source_package_id
        ? await this.prisma.salesProductPackage.findFirst({
            where: { id: parseBigIntId(item.source_package_id, 'source_package_id') },
          })
        : null;
      const productName = item.product_name || salesProduct?.name;
      if (!productName?.trim()) {
        throw new BadRequestException({ message: '请选择或填写产品名称。', code: 'PRODUCT_NAME_REQUIRED' });
      }
      result.push({
        salesProduct: salesProduct ? { connect: { id: salesProduct.id } } : undefined,
        sourcePackage: sourcePackage ? { connect: { id: sourcePackage.id } } : undefined,
        sourcePackageNameSnapshot: item.source_package_name || sourcePackage?.name || null,
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

  private sumSubtotal(items: Prisma.SalesQuoteItemCreateWithoutSalesQuoteInput[]) {
    return items.reduce(
      (sum, item) => sum.plus(new Prisma.Decimal(String(item.subtotal || 0))),
      new Prisma.Decimal(0),
    );
  }

  private async findQuote(id: bigint) {
    const quote = await this.prisma.salesQuote.findFirst({
      where: { id, deletedAt: null },
      include: this.quoteInclude(),
    });
    if (!quote) {
      throw new NotFoundException({ message: '报价单不存在。', code: 'SALES_QUOTE_NOT_FOUND' });
    }
    return quote;
  }

  private quoteInclude() {
    return {
      customer: true,
      items: {
        include: { salesProduct: true },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
      },
      orders: { where: { deletedAt: null } },
    };
  }

  private async ensureCustomer(id: bigint) {
    const customer = await this.prisma.customer.findFirst({ where: { id, deletedAt: null } });
    if (!customer) {
      throw new NotFoundException({ message: '客户不存在。', code: 'CUSTOMER_NOT_FOUND' });
    }
    return customer;
  }

  private async generateQuoteSeriesNo(date: Date) {
    const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `GX-BJ-${yyyymm}-`;
    const count = await this.prisma.salesQuote.groupBy({
      by: ['quoteSeriesNo'],
      where: { quoteSeriesNo: { startsWith: prefix } },
    });
    return `${prefix}${String(count.length + 1).padStart(4, '0')}`;
  }

  private async generateOrderNo() {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const prefix = `SO${datePart}`;
    const count = await this.prisma.customerPurchaseOrder.count({
      where: { orderNo: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(4, '0')}`;
  }

  private async getQuoteDir(quote: QuoteWithRelations) {
    const relativePath = `sales-quotes/${quote.customerId.toString()}/${quote.id.toString()}`;
    const fullPath = join(getUploadRoot(), relativePath);
    await mkdir(fullPath, { recursive: true });
    return { relativePath, fullPath };
  }

  private resolveUploadPath(relativePath: string) {
    const root = getUploadRoot();
    const normalized = normalize(join(root, relativePath));
    const rel = relative(root, normalized);
    if (rel.startsWith('..') || rel === '..') {
      throw new BadRequestException({ message: '文件路径不合法。', code: 'INVALID_FILE_PATH' });
    }
    return normalized;
  }

  private async writePdf(quote: QuoteWithRelations, fullPath: string) {
    const fontPath = join(process.cwd(), 'assets', 'fonts', 'Deng.ttf');
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42 });
      const stream = createWriteStream(fullPath);
      stream.on('finish', resolve);
      stream.on('error', reject);
      doc.on('error', reject);
      doc.pipe(stream);
      doc.font(fontPath);
      doc.fontSize(18).text('报价单', { align: 'center' });
      doc.moveDown(0.4);
      doc.fontSize(11).text(COMPANY_NAME);
      doc.text(`联系电话：${COMPANY_PHONE}`);
      doc.text(COMPANY_BUSINESS_SCOPE);
      doc.moveDown(0.6);
      doc.text(`客户单位：${quote.customer.companyName}`);
      if (quote.customer.contactName) doc.text(`联系人：${quote.customer.contactName}`);
      if (quote.customer.phone) doc.text(`联系电话：${quote.customer.phone}`);
      doc.text(`报价编号：${quote.quoteNo}`);
      doc.text(`报价日期：${formatDate(quote.quoteDate)}`);
      if (quote.validUntil) doc.text(`报价有效期：${formatDate(quote.validUntil)}前`);
      doc.moveDown(0.7);

      const startX = 42;
      const widths = [32, 86, 72, 90, 42, 36, 54, 58, 70];
      const headers = ['序号', '产品名称', '型号', '规格或配置', '数量', '单位', '单价', '小计', '备注'];
      drawRow(doc, startX, doc.y, widths, headers, true);
      quote.items.forEach((item, index) => {
        if (doc.y > 720) {
          doc.addPage();
          doc.font(fontPath);
          drawRow(doc, startX, doc.y, widths, headers, true);
        }
        drawRow(doc, startX, doc.y, widths, [
          String(index + 1),
          item.productNameSnapshot,
          item.modelSnapshot || '',
          item.specificationSnapshot || '',
          item.quantity.toString(),
          item.unitSnapshot || '',
          money(item.unitPrice),
          money(item.subtotal),
          item.itemRemark || '',
        ]);
      });
      doc.moveDown(0.8);
      doc.fontSize(11).text(`合计金额：${money(quote.totalAmount)} 元`, { align: 'right' });
      doc.text(`人民币大写金额：${quote.totalAmountCn || amountToChinese(quote.totalAmount.toNumber())}`, { align: 'right' });
      doc.moveDown(0.8);
      doc.text('商务条款', { underline: true });
      [
        ['价格说明', quote.invoiceNote],
        ['运输方式及费用', quote.shippingNote],
        ['交付时间', quote.deliveryNote],
        ['付款方式', quote.paymentNote],
        ['售后及服务', quote.afterSalesNote],
      ].forEach(([title, text]) => doc.text(`${title}：${text || ''}`));
      doc.moveDown(0.5);
      doc.text('本报价单用于产品配置及价格沟通，最终产品、数量、付款、交付和服务内容以双方确认的订单或正式合同为准。');
      if (quote.remark) {
        doc.moveDown(0.4);
        doc.text(`备注：${quote.remark}`);
      }
      doc.end();
    });
  }

  private async writeExcel(quote: QuoteWithRelations, fullPath: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('报价单');
    sheet.columns = [
      { width: 8 },
      { width: 24 },
      { width: 18 },
      { width: 28 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 24 },
    ];
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = '报价单';
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getCell('A1').font = { bold: true, size: 16 };
    [
      [COMPANY_NAME],
      [`联系电话：${COMPANY_PHONE}`],
      [COMPANY_BUSINESS_SCOPE],
      [`客户单位：${quote.customer.companyName}`],
      [`联系人：${quote.customer.contactName || ''}`],
      [`联系电话：${quote.customer.phone || ''}`],
      [`报价编号：${quote.quoteNo}`],
      [`报价日期：${formatDate(quote.quoteDate)}`],
      [`报价有效期：${quote.validUntil ? formatDate(quote.validUntil) : ''}`],
    ].forEach((row) => sheet.addRow(row));
    sheet.addRow([]);
    const header = sheet.addRow(['序号', '产品名称', '型号', '规格或配置', '数量', '单位', '单价', '小计', '备注']);
    header.font = { bold: true };
    quote.items.forEach((item, index) =>
      sheet.addRow([
        index + 1,
        item.productNameSnapshot,
        item.modelSnapshot || '',
        item.specificationSnapshot || '',
        item.quantity.toNumber(),
        item.unitSnapshot || '',
        item.unitPrice.toNumber(),
        item.subtotal.toNumber(),
        item.itemRemark || '',
      ]),
    );
    sheet.addRow([]);
    sheet.addRow(['合计金额', '', '', '', '', '', '', quote.totalAmount.toNumber()]);
    sheet.addRow(['人民币大写金额', quote.totalAmountCn || amountToChinese(quote.totalAmount.toNumber())]);
    sheet.addRow([]);
    sheet.addRow(['商务条款']);
    [
      ['价格说明', quote.invoiceNote],
      ['运输方式及费用', quote.shippingNote],
      ['交付时间', quote.deliveryNote],
      ['付款方式', quote.paymentNote],
      ['售后及服务', quote.afterSalesNote],
      ['底部说明', '本报价单用于产品配置及价格沟通，最终产品、数量、付款、交付和服务内容以双方确认的订单或正式合同为准。'],
    ].forEach((row) => sheet.addRow(row));
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
    await workbook.xlsx.writeFile(fullPath);
  }

  private async writePdfV2(quote: QuoteWithRelations, fullPath: string) {
    const fontPath = join(process.cwd(), 'assets', 'fonts', 'Deng.ttf');
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42 });
      const stream = createWriteStream(fullPath);
      stream.on('finish', resolve);
      stream.on('error', reject);
      doc.on('error', reject);
      doc.pipe(stream);
      doc.font(fontPath);

      doc.fontSize(18).text('报价单', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).text(COMPANY_NAME);
      doc.text(`联系电话：${COMPANY_PHONE}`);
      doc.text(COMPANY_BUSINESS_SCOPE);
      doc.moveDown(0.6);
      doc.text(`客户单位：${quote.customer.companyName}`);
      if (quote.customer.contactName) doc.text(`联系人：${quote.customer.contactName}`);
      if (quote.customer.phone) doc.text(`联系电话：${quote.customer.phone}`);
      doc.text(`报价编号：${quote.quoteNo}`);
      doc.text(`报价日期：${formatDate(quote.quoteDate)}`);
      if (quote.validUntil) doc.text(`报价有效期：${formatDate(quote.validUntil)} 前`);
      doc.moveDown(0.7);

      const startX = 42;
      const widths = [30, 88, 72, 92, 40, 36, 54, 58, 74];
      const headers = ['序号', '产品名称', '型号', '规格或配置', '数量', '单位', '单价', '小计', '备注'];
      drawRow(doc, startX, doc.y, widths, headers, true);
      quote.items.forEach((item, index) => {
        if (doc.y > 720) {
          doc.addPage();
          doc.font(fontPath);
          drawRow(doc, startX, doc.y, widths, headers, true);
        }
        drawRow(doc, startX, doc.y, widths, [
          String(index + 1),
          item.productNameSnapshot,
          item.modelSnapshot || '',
          item.specificationSnapshot || '',
          item.quantity.toString(),
          item.unitSnapshot || '',
          money(item.unitPrice),
          money(item.subtotal),
          item.itemRemark || '',
        ]);
      });

      doc.moveDown(0.8);
      doc.fontSize(11).text(`合计金额：${money(quote.totalAmount)} 元`, { align: 'right' });
      doc.text(`人民币大写金额：${quote.totalAmountCn || amountToChinese(quote.totalAmount.toNumber())}`, { align: 'right' });
      doc.moveDown(0.8);
      doc.fontSize(11).text('商务条款', { underline: true });
      [
        ['价格说明', quote.invoiceNote],
        ['运输方式及费用', quote.shippingNote],
        ['交付时间', quote.deliveryNote],
        ['付款方式', quote.paymentNote],
        ['售后及服务', quote.afterSalesNote],
      ].forEach(([title, text]) => doc.text(`${title}：${text || ''}`));
      doc.moveDown(0.5);
      doc.text('本报价单用于产品配置及价格沟通，最终产品、数量、付款、交付和服务内容以双方确认的订单或正式合同为准。');
      if (quote.remark) {
        doc.moveDown(0.4);
        doc.text(`备注：${quote.remark}`);
      }
      doc.end();
    });
  }

  private async writeExcelV2(quote: QuoteWithRelations, fullPath: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('报价单');
    sheet.columns = [
      { width: 8 },
      { width: 24 },
      { width: 18 },
      { width: 28 },
      { width: 10 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 24 },
    ];
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = '报价单';
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('A1').font = { bold: true, size: 16 };

    const infoRows = [
      [COMPANY_NAME],
      [`联系电话：${COMPANY_PHONE}`],
      [COMPANY_BUSINESS_SCOPE],
      [`客户单位：${quote.customer.companyName}`],
      quote.customer.contactName ? [`联系人：${quote.customer.contactName}`] : null,
      quote.customer.phone ? [`联系电话：${quote.customer.phone}`] : null,
      [`报价编号：${quote.quoteNo}`],
      [`报价日期：${formatDate(quote.quoteDate)}`],
      quote.validUntil ? [`报价有效期：${formatDate(quote.validUntil)} 前`] : null,
    ].filter((row): row is string[] => Boolean(row));
    infoRows.forEach((row) => sheet.addRow(row));

    sheet.addRow([]);
    const header = sheet.addRow(['序号', '产品名称', '型号', '规格或配置', '数量', '单位', '单价', '小计', '备注']);
    header.font = { bold: true };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF5EF' } };
    quote.items.forEach((item, index) =>
      sheet.addRow([
        index + 1,
        item.productNameSnapshot,
        item.modelSnapshot || '',
        item.specificationSnapshot || '',
        item.quantity.toNumber(),
        item.unitSnapshot || '',
        item.unitPrice.toNumber(),
        item.subtotal.toNumber(),
        item.itemRemark || '',
      ]),
    );
    sheet.addRow([]);
    sheet.addRow(['合计金额', '', '', '', '', '', '', quote.totalAmount.toNumber()]);
    sheet.addRow(['人民币大写金额', quote.totalAmountCn || amountToChinese(quote.totalAmount.toNumber())]);
    sheet.addRow([]);
    sheet.addRow(['商务条款']);
    [
      ['价格说明', quote.invoiceNote],
      ['运输方式及费用', quote.shippingNote],
      ['交付时间', quote.deliveryNote],
      ['付款方式', quote.paymentNote],
      ['售后及服务', quote.afterSalesNote],
      ['底部说明', '本报价单用于产品配置及价格沟通，最终产品、数量、付款、交付和服务内容以双方确认的订单或正式合同为准。'],
    ].forEach((row) => sheet.addRow(row));

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });
    await workbook.xlsx.writeFile(fullPath);
  }

  private async writePdfFormal(quote: QuoteWithRelations, fullPath: string) {
    const fontPath = join(process.cwd(), 'assets', 'fonts', 'Deng.ttf');
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 42 });
      const stream = createWriteStream(fullPath);
      stream.on('finish', resolve);
      stream.on('error', reject);
      doc.on('error', reject);
      doc.pipe(stream);
      doc.font(fontPath);

      const pageWidth = doc.page.width - 84;
      doc.rect(42, 34, pageWidth, 86).fill('#f7fbf9');
      doc.rect(42, 34, 5, 86).fill('#0b7a4b');
      doc.moveTo(42, 120).lineTo(42 + pageWidth, 120).strokeColor('#dbe7e2').stroke();
      doc.fillColor('#063b31').fontSize(21).text(COMPANY_NAME, 58, 48, { width: 310 });
      doc.fillColor('#475569').fontSize(9.5).text(`联系电话：${COMPANY_PHONE}`, 58, 78, { width: 240 });
      doc.fillColor('#475569').fontSize(9.5).text(COMPANY_BUSINESS_SCOPE, 58, 94, { width: 310 });
      doc.fillColor('#063b31').fontSize(32).text('报价单', 398, 48, { width: 126, align: 'right' });
      doc.fillColor('#64748b').fontSize(9.5).text(quote.quoteNo, 342, 88, { width: 182, align: 'right' });

      let y = 142;
      y = drawPdfSectionTitle(doc, '客户与报价信息', y);
      const infoRows = [
        ['客户单位', quote.customer.companyName, '报价编号', quote.quoteNo],
        ['联系人', quote.customer.contactName || '-', '报价日期', formatDate(quote.quoteDate)],
        ['联系电话', quote.customer.phone || '-', '有效期至', quote.validUntil ? formatDate(quote.validUntil) : '-'],
      ];
      y = drawPdfInfoGrid(doc, 42, y, pageWidth, infoRows);

      y += 14;
      y = drawPdfSectionTitle(doc, '产品及服务明细', y);
      const headers = ['序号', '产品名称', '型号', '规格或配置', '数量', '单位', '单价', '小计', '备注'];
      const widths = [30, 92, 72, 96, 38, 34, 52, 56, 66];
      y = drawPdfTableRow(doc, 42, y, widths, headers, true);
      quote.items.forEach((item, index) => {
        if (y > 700) {
          doc.addPage();
          doc.font(fontPath);
          y = 42;
          y = drawPdfTableRow(doc, 42, y, widths, headers, true);
        }
        y = drawPdfTableRow(doc, 42, y, widths, [
          String(index + 1),
          item.productNameSnapshot,
          item.modelSnapshot || '',
          item.specificationSnapshot || '',
          item.quantity.toString(),
          item.unitSnapshot || '',
          money(item.unitPrice),
          money(item.subtotal),
          item.itemRemark || '',
        ]);
      });

      y += 12;
      doc.roundedRect(42, y, pageWidth, 64, 4).fillAndStroke('#f8fafc', '#dbe7e2');
      doc.moveTo(356, y).lineTo(356, y + 64).strokeColor('#dbe7e2').stroke();
      doc.fillColor('#64748b').fontSize(9).text('人民币大写', 58, y + 13, { width: 260 });
      doc.fillColor('#063b31').fontSize(11).text(quote.totalAmountCn || amountToChinese(quote.totalAmount.toNumber()), 58, y + 34, { width: 260 });
      doc.fillColor('#64748b').fontSize(9).text('合计金额', 374, y + 13, { width: 150, align: 'right' });
      doc.fillColor('#063b31').fontSize(20).text(`¥ ${money(quote.totalAmount)}`, 374, y + 32, { width: 150, align: 'right' });
      y += 82;

      if (y > 630) {
        doc.addPage();
        doc.font(fontPath);
        y = 42;
      }
      y = drawPdfSectionTitle(doc, '商务条款', y);
      const terms = getQuoteTerms(quote);
      terms.forEach(([title, text]) => {
        const textHeight = doc.heightOfString(text, { width: 410, lineGap: 2 });
        doc.fillColor('#0f6f52').fontSize(9).text(`${title}：`, 42, y, { width: 72 });
        doc.fillColor('#334155').fontSize(9).text(text, 116, y, { width: 410, lineGap: 2 });
        y += Math.max(20, textHeight + 6);
      });
      y += 8;
      doc.roundedRect(42, y, pageWidth, 40, 3).fillAndStroke('#fffdf4', '#eee4bd');
      doc.fillColor('#7c5e10').fontSize(8.8).text('说明：本报价单用于产品配置及价格沟通，最终产品、数量、付款、交付和服务内容以双方确认的订单或正式合同为准。', 54, y + 11, { width: pageWidth - 24 });
      y += 56;

      doc.end();
    });
  }

  private async writeExcelFormal(quote: QuoteWithRelations, fullPath: string) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('报价单');
    workbook.creator = COMPANY_NAME;
    sheet.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
    sheet.columns = [
      { width: 7 },
      { width: 24 },
      { width: 18 },
      { width: 28 },
      { width: 10 },
      { width: 8 },
      { width: 12 },
      { width: 12 },
      { width: 22 },
    ];

    sheet.mergeCells('A1:F1');
    sheet.mergeCells('G1:I1');
    sheet.getCell('A1').value = COMPANY_NAME;
    sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF0F6F52' } };
    sheet.getCell('G1').value = '报价单';
    sheet.getCell('G1').font = { bold: true, size: 18, color: { argb: 'FF063B31' } };
    sheet.getCell('G1').alignment = { horizontal: 'right' };
    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `联系电话：${COMPANY_PHONE}    ${COMPANY_BUSINESS_SCOPE}`;
    sheet.getCell('A2').font = { size: 10, color: { argb: 'FF475569' } };
    sheet.getRow(1).height = 26;
    sheet.getRow(2).height = 22;
    sheet.addRow([]);

    sheet.addRow(['客户与报价信息']);
    sheet.mergeCells(`A${sheet.rowCount}:I${sheet.rowCount}`);
    sheet.getRow(4).font = { bold: true, color: { argb: 'FF0F6F52' } };
    const info = [
      ['客户单位', quote.customer.companyName, '', '报价编号', quote.quoteNo],
      ['联系人', quote.customer.contactName || '-', '', '报价日期', formatDate(quote.quoteDate)],
      ['联系电话', quote.customer.phone || '-', '', '有效期至', quote.validUntil ? formatDate(quote.validUntil) : '-'],
    ];
    info.forEach((row) => sheet.addRow(row));
    sheet.addRow([]);

    const header = sheet.addRow(['序号', '产品名称', '型号', '规格或配置', '数量', '单位', '单价', '小计', '备注']);
    header.font = { bold: true, color: { argb: 'FF063B31' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF5EF' } };
    quote.items.forEach((item, index) =>
      sheet.addRow([
        index + 1,
        item.productNameSnapshot,
        item.modelSnapshot || '',
        item.specificationSnapshot || '',
        item.quantity.toNumber(),
        item.unitSnapshot || '',
        item.unitPrice.toNumber(),
        item.subtotal.toNumber(),
        item.itemRemark || '',
      ]),
    );
    sheet.addRow([]);
    const totalRow = sheet.addRow(['', '', '', '', '', '', '合计金额', quote.totalAmount.toNumber()]);
    totalRow.font = { bold: true };
    sheet.addRow(['', '', '', '', '', '', '大写金额', quote.totalAmountCn || amountToChinese(quote.totalAmount.toNumber())]);
    sheet.addRow([]);
    sheet.addRow(['商务条款']);
    sheet.mergeCells(`A${sheet.rowCount}:I${sheet.rowCount}`);
    const startTermsRow = sheet.rowCount;
    getQuoteTerms(quote).forEach((row) => sheet.addRow(row));
    sheet.addRow(['说明', '本报价单用于产品配置及价格沟通，最终产品、数量、付款、交付和服务内容以双方确认的订单或正式合同为准。']);
    sheet.getRow(startTermsRow).font = { bold: true, color: { argb: 'FF0F6F52' } };

    sheet.eachRow((row) => {
      row.height = row.height || 24;
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD9E5DF' } },
          left: { style: 'thin', color: { argb: 'FFD9E5DF' } },
          bottom: { style: 'thin', color: { argb: 'FFD9E5DF' } },
          right: { style: 'thin', color: { argb: 'FFD9E5DF' } },
        };
      });
    });
    for (let rowNo = 1; rowNo <= sheet.rowCount; rowNo += 1) {
      const row = sheet.getRow(rowNo);
      if (rowNo >= startTermsRow) row.height = 32;
    }
    ['G', 'H'].forEach((col) => {
      sheet.getColumn(col).numFmt = '#,##0.00';
    });
    await workbook.xlsx.writeFile(fullPath);
  }

  private parseDate(value?: string) {
    return value ? new Date(value) : null;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    next.setHours(23, 59, 59, 999);
    return next;
  }

  private async writeLog(
    request: RequestWithAdmin,
    targetId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'sales_quote',
      targetId,
      action,
      content,
      ip: request.ip,
    });
  }
}

function drawRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  widths: number[],
  values: string[],
  bold = false,
) {
  const height = 34;
  let cursor = x;
  doc.fontSize(8);
  values.forEach((value, index) => {
    doc.rect(cursor, y, widths[index], height).stroke();
    doc.text(value || '', cursor + 3, y + 5, {
      width: widths[index] - 6,
      height: height - 8,
      ellipsis: true,
    });
    cursor += widths[index];
  });
  doc.y = y + height;
}

function drawPdfSectionTitle(doc: PDFKit.PDFDocument, title: string, y: number) {
  doc.fillColor('#0f6f52').fontSize(11).text(title, 42, y);
  doc.strokeColor('#0f9b6f').moveTo(42, y + 17).lineTo(538, y + 17).stroke();
  return y + 25;
}

function drawPdfInfoGrid(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  rows: string[][],
) {
  const rowHeight = 26;
  const colWidths = [68, width / 2 - 68, 68, width / 2 - 68];
  rows.forEach((row) => {
    let cursor = x;
    row.forEach((value, index) => {
      const isLabel = index === 0 || index === 2;
      doc.rect(cursor, y, colWidths[index], rowHeight).fillAndStroke(isLabel ? '#f3faf7' : '#ffffff', '#dbe7e2');
      doc.fillColor(isLabel ? '#0f6f52' : '#334155').fontSize(9).text(value || '-', cursor + 5, y + 8, {
        width: colWidths[index] - 10,
      });
      cursor += colWidths[index];
    });
    y += rowHeight;
  });
  return y;
}

function drawPdfTableRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  widths: number[],
  values: string[],
  header = false,
) {
  const textHeights = values.map((value, index) =>
    doc.heightOfString(value || '', { width: widths[index] - 6 }),
  );
  const height = Math.max(header ? 28 : 36, Math.max(...textHeights) + 12);
  let cursor = x;
  values.forEach((value, index) => {
    doc.rect(cursor, y, widths[index], height).fillAndStroke(header ? '#eaf5ef' : '#ffffff', '#dbe7e2');
    doc.fillColor(header ? '#063b31' : '#334155').fontSize(header ? 8.5 : 8).text(value || '', cursor + 3, y + 6, {
      width: widths[index] - 6,
      height: height - 8,
      ellipsis: true,
    });
    cursor += widths[index];
  });
  return y + height;
}

function money(value: unknown) {
  return Number(String(value || 0)).toFixed(2);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getQuoteTerms(quote: QuoteWithRelations): [string, string][] {
  return [
    ['价格说明', quote.invoiceNote || DEFAULT_TERMS.invoiceNote],
    ['运输费用', quote.shippingNote || DEFAULT_TERMS.shippingNote],
    ['交付时间', quote.deliveryNote || DEFAULT_TERMS.deliveryNote],
    ['付款方式', quote.paymentNote || DEFAULT_TERMS.paymentNote],
    ['售后服务', quote.afterSalesNote || DEFAULT_TERMS.afterSalesNote],
  ];
}

function sanitizeFileName(value: string) {
  return (value || '客户')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '')
    .slice(0, 80);
}

function amountToChinese(amount: number) {
  if (!Number.isFinite(amount)) return '零元整';
  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [
    ['元', '万', '亿'],
    ['', '拾', '佰', '仟'],
  ];
  let head = amount < 0 ? '负' : '';
  amount = Math.abs(amount);
  let suffix = '';
  for (let i = 0; i < fraction.length; i += 1) {
    suffix += (digit[Math.floor(amount * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '');
  }
  suffix = suffix || '整';
  amount = Math.floor(amount);
  for (let i = 0; i < unit[0].length && amount > 0; i += 1) {
    let part = '';
    for (let j = 0; j < unit[1].length && amount > 0; j += 1) {
      part = digit[amount % 10] + unit[1][j] + part;
      amount = Math.floor(amount / 10);
    }
    head = part.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + head;
  }
  return `${head.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整')}${suffix}`;
}
