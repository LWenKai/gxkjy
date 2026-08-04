import {
  Customer,
  CustomerDevice,
  CustomerFollowRecord,
  CustomerNeed,
  CustomerPurchase,
  CustomerPurchaseItem,
  CustomerPurchaseOrder,
  CustomerQuote,
  CustomerQuoteAttachment,
  Prisma,
  SalesProduct,
  SalesQuote,
  SalesQuoteItem,
} from '../../generated/prisma';

type CustomerWithRelations = Customer & {
  needs?: CustomerNeed[];
  devices?: CustomerDevice[];
  followRecords?: CustomerFollowRecord[];
  quotes?: Array<CustomerQuote & { attachments?: CustomerQuoteAttachment[] }>;
  salesQuotes?: Array<
    SalesQuote & {
      items?: Array<SalesQuoteItem & { salesProduct?: SalesProduct | null }>;
    }
  >;
  purchases?: CustomerPurchase[];
  purchaseOrders?: Array<
    CustomerPurchaseOrder & {
      items?: Array<CustomerPurchaseItem & { salesProduct?: SalesProduct | null }>;
    }
  >;
};

export function serializeCustomer(customer: CustomerWithRelations) {
  return {
    id: customer.id.toString(),
    customer_no: customer.customerNo,
    company_name: customer.companyName,
    contact_name: customer.contactName,
    phone: customer.phone,
    wechat: customer.wechat,
    province: customer.province,
    city: customer.city,
    address: customer.address,
    customer_type: customer.customerType,
    source: customer.source,
    status: customer.status,
    value_level: customer.valueLevel,
    remark: customer.remark,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt,
    needs: customer.needs?.map(serializeNeed),
    devices: customer.devices?.map(serializeDevice),
    follow_records: customer.followRecords?.map(serializeFollowRecord),
    quotes: customer.quotes?.map(serializeQuote),
    sales_quotes: customer.salesQuotes?.map(serializeSalesQuoteBrief),
    purchases: customer.purchases?.map(serializePurchase),
    purchase_orders: customer.purchaseOrders?.map(serializePurchaseOrder),
  };
}

export function serializeCustomerListItem(customer: CustomerWithRelations) {
  const lastFollow = customer.followRecords?.[0];
  const lastOrder = customer.purchaseOrders?.[0];
  const lastItem = lastOrder?.items?.[0];
  const lastPurchase = customer.purchases?.[0];
  return {
    ...serializeCustomer(customer),
    latest_follow_time: lastFollow?.followTime || null,
    last_purchase_product: lastItem?.productNameSnapshot || lastPurchase?.productName || null,
    last_purchase_date: lastOrder?.purchaseDate || lastPurchase?.purchaseDate || null,
    next_repurchase_date: lastItem?.nextRepurchaseDate || lastPurchase?.nextRepurchaseDate || null,
    needs: undefined,
    devices: undefined,
    follow_records: undefined,
    quotes: undefined,
    sales_quotes: undefined,
    purchases: undefined,
    purchase_orders: undefined,
  };
}

export function serializeNeed(need: CustomerNeed) {
  return {
    id: need.id.toString(),
    customer_id: need.customerId.toString(),
    need_type: need.needType,
    product_category: need.productCategory,
    test_project: need.testProject,
    remark: need.remark,
    created_at: need.createdAt,
    updated_at: need.updatedAt,
  };
}

export function serializeDevice(device: CustomerDevice) {
  return {
    id: device.id.toString(),
    customer_id: device.customerId.toString(),
    manufacturer: device.manufacturer,
    model: device.model,
    device_count: device.deviceCount,
    purchase_date: device.purchaseDate,
    image_url: device.imageUrl,
    remark: device.remark,
    created_at: device.createdAt,
    updated_at: device.updatedAt,
  };
}

export function serializeFollowRecord(record: CustomerFollowRecord) {
  return {
    id: record.id.toString(),
    customer_id: record.customerId.toString(),
    follow_time: record.followTime,
    follow_type: record.followType,
    content: record.content,
    next_follow_date: record.nextFollowDate,
    created_by: record.createdBy?.toString() || null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function serializeQuote(quote: CustomerQuote & { attachments?: CustomerQuoteAttachment[] }) {
  return {
    id: quote.id.toString(),
    customer_id: quote.customerId.toString(),
    product_name: quote.productName,
    amount: formatDecimal(quote.amount),
    quote_date: quote.quoteDate,
    status: quote.status,
    remark: quote.remark,
    attachments: quote.attachments?.map(serializeQuoteAttachment) || [],
    created_at: quote.createdAt,
    updated_at: quote.updatedAt,
  };
}

export function serializeQuoteAttachment(attachment: CustomerQuoteAttachment) {
  return {
    id: attachment.id.toString(),
    quote_id: attachment.quoteId.toString(),
    original_name: attachment.originalName,
    stored_name: attachment.storedName,
    mime_type: attachment.mimeType,
    file_extension: attachment.fileExtension,
    file_size: attachment.fileSize.toString(),
    created_at: attachment.createdAt,
  };
}

export function serializeSalesQuoteBrief(
  quote: SalesQuote & {
    items?: Array<SalesQuoteItem & { salesProduct?: SalesProduct | null }>;
  },
) {
  return {
    id: quote.id.toString(),
    quote_no: quote.quoteNo,
    quote_series_no: quote.quoteSeriesNo,
    version_no: quote.versionNo,
    customer_id: quote.customerId.toString(),
    quote_date: quote.quoteDate,
    valid_until: quote.validUntil,
    status: quote.status,
    total_amount: formatDecimal(quote.totalAmount),
    total_amount_cn: quote.totalAmountCn,
    has_pdf: Boolean(quote.pdfPath),
    has_excel: Boolean(quote.excelPath),
    item_count: quote.items?.length || 0,
    items: quote.items?.map((item) => ({
      id: item.id.toString(),
      sales_product_id: item.salesProductId?.toString() || null,
      product_name: item.productNameSnapshot,
      brand: item.brandSnapshot,
      model: item.modelSnapshot,
      specification: item.specificationSnapshot,
      unit: item.unitSnapshot,
      quantity: formatDecimal(item.quantity),
      unit_price: formatDecimal(item.unitPrice),
      subtotal: formatDecimal(item.subtotal),
      item_remark: item.itemRemark,
      sort_order: item.sortOrder,
    })) || [],
    created_at: quote.createdAt,
    updated_at: quote.updatedAt,
  };
}

export function serializePurchaseOrder(
  order: CustomerPurchaseOrder & {
    items?: Array<CustomerPurchaseItem & { salesProduct?: SalesProduct | null }>;
  },
) {
  const items = order.items || [];
  const nextDates = items
    .map((item) => item.nextRepurchaseDate)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime());
  return {
    id: order.id.toString(),
    order_no: order.orderNo,
    customer_id: order.customerId.toString(),
    sales_quote_id: order.salesQuoteId?.toString() || null,
    quote_no_snapshot: order.quoteNoSnapshot,
    purchase_date: order.purchaseDate,
    deal_date: order.dealDate,
    total_amount: formatDecimal(order.totalAmount),
    payment_status: order.paymentStatus,
    delivery_status: order.deliveryStatus,
    expected_delivery_date: order.expectedDeliveryDate,
    actual_delivery_date: order.actualDeliveryDate,
    express_company: order.expressCompany,
    tracking_no: order.trackingNo,
    invoice_issued: order.invoiceIssued,
    invoice_type: order.invoiceType,
    remark: order.remark,
    item_count: items.length,
    nearest_repurchase_date: nextDates[0] || null,
    items: items.map((item) => ({
      id: item.id.toString(),
      purchase_order_id: item.purchaseOrderId.toString(),
      sales_product_id: item.salesProductId?.toString() || null,
      product_name: item.productNameSnapshot,
      brand: item.brandSnapshot,
      model: item.modelSnapshot,
      specification: item.specificationSnapshot,
      unit: item.unitSnapshot,
      quantity: formatDecimal(item.quantity),
      unit_price: formatDecimal(item.unitPrice),
      subtotal: formatDecimal(item.subtotal),
      expected_cycle_days: item.expectedCycleDays,
      repeat_reminder_enabled: item.repeatReminderEnabled,
      actual_cycle_days: item.actualCycleDays,
      reminder_days_before: item.reminderDaysBefore,
      next_repurchase_date: item.nextRepurchaseDate,
      repurchase_status: item.repurchaseStatus,
      remark: item.remark,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    })),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

export function serializePurchase(purchase: CustomerPurchase) {
  return {
    id: purchase.id.toString(),
    customer_id: purchase.customerId.toString(),
    product_name: purchase.productName,
    quantity: purchase.quantity,
    amount: formatDecimal(purchase.amount),
    purchase_date: purchase.purchaseDate,
    expected_cycle_days: purchase.expectedCycleDays,
    next_repurchase_date: purchase.nextRepurchaseDate,
    remark: purchase.remark,
    created_at: purchase.createdAt,
    updated_at: purchase.updatedAt,
  };
}

function formatDecimal(value: Prisma.Decimal | null) {
  return value === null ? null : value.toString();
}
