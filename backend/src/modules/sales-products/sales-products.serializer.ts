import { SalesProduct } from '../../generated/prisma';

function formatDecimal(value: unknown) {
  return value == null ? null : String(value);
}

export function serializeSalesProduct(product: SalesProduct) {
  return {
    id: product.id.toString(),
    product_no: product.productNo,
    name: product.name,
    category: product.category,
    brand: product.brand,
    model: product.model,
    sales_model: product.salesModel,
    specification: product.specification,
    unit: product.unit,
    default_sale_price: formatDecimal(product.defaultSalePrice),
    reference_cost_price: formatDecimal(product.referenceCostPrice),
    default_cycle_days: product.defaultCycleDays,
    repeat_reminder_enabled: product.repeatReminderEnabled,
    reference_cycle_days: product.referenceCycleDays,
    default_reminder_days_before: product.defaultReminderDaysBefore,
    image_url: product.imageUrl,
    description: product.description,
    remark: product.remark,
    is_active: product.isActive,
    sort_order: product.sortOrder,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}
