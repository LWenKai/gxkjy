import {
  Customer,
  CustomerPurchaseItem,
  CustomerPurchaseOrder,
  SalesProduct,
  SalesQuote,
  SalesQuoteItem,
} from '../../generated/prisma';

type QuoteWithRelations = SalesQuote & {
  customer?: Customer;
  items?: Array<SalesQuoteItem & { salesProduct?: SalesProduct | null }>;
  orders?: CustomerPurchaseOrder[];
};

function decimal(value: unknown) {
  return value == null ? null : String(value);
}

export function serializeSalesQuoteItem(
  item: SalesQuoteItem & { salesProduct?: SalesProduct | null },
) {
  return {
    id: item.id.toString(),
    sales_quote_id: item.salesQuoteId.toString(),
    sales_product_id: item.salesProductId?.toString() || null,
    source_package_id: item.sourcePackageId?.toString() || null,
    source_package_name: item.sourcePackageNameSnapshot,
    product_name: item.productNameSnapshot,
    brand: item.brandSnapshot,
    model: item.modelSnapshot,
    specification: item.specificationSnapshot,
    unit: item.unitSnapshot,
    quantity: decimal(item.quantity),
    unit_price: decimal(item.unitPrice),
    subtotal: decimal(item.subtotal),
    item_remark: item.itemRemark,
    sort_order: item.sortOrder,
    sales_product: item.salesProduct
      ? {
          id: item.salesProduct.id.toString(),
          product_no: item.salesProduct.productNo,
          name: item.salesProduct.name,
          sales_model: item.salesProduct.salesModel,
          repeat_reminder_enabled: item.salesProduct.repeatReminderEnabled,
          reference_cycle_days: item.salesProduct.referenceCycleDays,
          default_reminder_days_before: item.salesProduct.defaultReminderDaysBefore,
        }
      : null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function serializeSalesQuote(quote: QuoteWithRelations) {
  const items = quote.items || [];
  return {
    id: quote.id.toString(),
    quote_no: quote.quoteNo,
    quote_series_no: quote.quoteSeriesNo,
    version_no: quote.versionNo,
    customer_id: quote.customerId.toString(),
    company_name: quote.customer?.companyName || null,
    contact_name: quote.customer?.contactName || null,
    phone: quote.customer?.phone || null,
    source_quote_id: quote.sourceQuoteId?.toString() || null,
    source_order_item_id: quote.sourceOrderItemId?.toString() || null,
    quote_date: quote.quoteDate,
    valid_until: quote.validUntil,
    status: quote.status,
    is_tax_included: quote.isTaxIncluded,
    invoice_note: quote.invoiceNote,
    shipping_note: quote.shippingNote,
    delivery_note: quote.deliveryNote,
    payment_note: quote.paymentNote,
    after_sales_note: quote.afterSalesNote,
    remark: quote.remark,
    total_amount: decimal(quote.totalAmount),
    total_amount_cn: quote.totalAmountCn,
    has_pdf: Boolean(quote.pdfPath),
    has_excel: Boolean(quote.excelPath),
    item_count: items.length,
    converted_order_count: quote.orders?.length || 0,
    items: items.map(serializeSalesQuoteItem),
    created_at: quote.createdAt,
    updated_at: quote.updatedAt,
  };
}

export function serializeConvertedOrder(order: CustomerPurchaseOrder & {
  items?: CustomerPurchaseItem[];
}) {
  return {
    id: order.id.toString(),
    order_no: order.orderNo,
    sales_quote_id: order.salesQuoteId?.toString() || null,
    quote_no_snapshot: order.quoteNoSnapshot,
    total_amount: decimal(order.totalAmount),
    item_count: order.items?.length || 0,
    created_at: order.createdAt,
  };
}
