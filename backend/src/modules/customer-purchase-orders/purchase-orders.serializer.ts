import {
  Customer,
  CustomerPurchaseItem,
  CustomerPurchaseOrder,
  SalesProduct,
} from '../../generated/prisma';

type OrderWithRelations = CustomerPurchaseOrder & {
  customer?: Customer;
  items?: Array<CustomerPurchaseItem & { salesProduct?: SalesProduct | null }>;
};

function decimal(value: unknown) {
  return value == null ? null : String(value);
}

export function serializePurchaseItem(item: CustomerPurchaseItem & { salesProduct?: SalesProduct | null }) {
  return {
    id: item.id.toString(),
    purchase_order_id: item.purchaseOrderId.toString(),
    sales_product_id: item.salesProductId?.toString() || null,
    product_name: item.productNameSnapshot,
    brand: item.brandSnapshot,
    model: item.modelSnapshot,
    specification: item.specificationSnapshot,
    unit: item.unitSnapshot,
    quantity: decimal(item.quantity),
    unit_price: decimal(item.unitPrice),
    subtotal: decimal(item.subtotal),
    expected_cycle_days: item.expectedCycleDays,
    repeat_reminder_enabled: item.repeatReminderEnabled,
    actual_cycle_days: item.actualCycleDays,
    reminder_days_before: item.reminderDaysBefore,
    next_repurchase_date: item.nextRepurchaseDate,
    repurchase_status: item.repurchaseStatus,
    remark: item.remark,
    sales_product: item.salesProduct
      ? {
          id: item.salesProduct.id.toString(),
          product_no: item.salesProduct.productNo,
          name: item.salesProduct.name,
          is_active: item.salesProduct.isActive,
        }
      : null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function serializePurchaseOrder(order: OrderWithRelations) {
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
    company_name: order.customer?.companyName || null,
    contact_name: order.customer?.contactName || null,
    phone: order.customer?.phone || null,
    purchase_date: order.purchaseDate,
    deal_date: order.dealDate,
    total_amount: decimal(order.totalAmount),
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
    items: items.map(serializePurchaseItem),
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

export function serializeRepurchaseReminder(item: CustomerPurchaseItem & {
  purchaseOrder: CustomerPurchaseOrder & { customer: Customer };
  salesProduct?: SalesProduct | null;
}) {
  return {
    id: item.id.toString(),
    customer_id: item.purchaseOrder.customerId.toString(),
    company_name: item.purchaseOrder.customer.companyName,
    contact_name: item.purchaseOrder.customer.contactName,
    phone: item.purchaseOrder.customer.phone,
    order_id: item.purchaseOrder.id.toString(),
    order_no: item.purchaseOrder.orderNo,
    purchase_date: item.purchaseOrder.purchaseDate,
    product_name: item.productNameSnapshot,
    quantity: decimal(item.quantity),
    unit_price: decimal(item.unitPrice),
    subtotal: decimal(item.subtotal),
    expected_cycle_days: item.expectedCycleDays,
    repeat_reminder_enabled: item.repeatReminderEnabled,
    actual_cycle_days: item.actualCycleDays,
    reminder_days_before: item.reminderDaysBefore,
    next_repurchase_date: item.nextRepurchaseDate,
    repurchase_status: item.repurchaseStatus,
    remark: item.remark,
  };
}
