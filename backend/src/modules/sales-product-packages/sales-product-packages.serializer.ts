import {
  SalesProduct,
  SalesProductPackage,
  SalesProductPackageItem,
} from '../../generated/prisma';

type PackageItemWithProduct = SalesProductPackageItem & { salesProduct?: SalesProduct | null };

export type SalesProductPackageWithItems = SalesProductPackage & {
  items?: PackageItemWithProduct[];
};

function decimal(value: unknown) {
  return value == null ? null : String(value);
}

export function serializeSalesProductPackageItem(item: PackageItemWithProduct) {
  return {
    id: item.id.toString(),
    package_id: item.packageId.toString(),
    sales_product_id: item.salesProductId?.toString() || null,
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
          default_sale_price: decimal(item.salesProduct.defaultSalePrice),
          repeat_reminder_enabled: item.salesProduct.repeatReminderEnabled,
          reference_cycle_days: item.salesProduct.referenceCycleDays,
          default_reminder_days_before: item.salesProduct.defaultReminderDaysBefore,
        }
      : null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}

export function serializeSalesProductPackage(pkg: SalesProductPackageWithItems) {
  const items = pkg.items || [];
  const totalAmount = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  return {
    id: pkg.id.toString(),
    package_no: pkg.packageNo,
    name: pkg.name,
    type: pkg.type,
    description: pkg.description,
    is_active: pkg.isActive,
    sort_order: pkg.sortOrder,
    remark: pkg.remark,
    item_count: items.length,
    total_amount: totalAmount.toFixed(2),
    items: items.map(serializeSalesProductPackageItem),
    created_at: pkg.createdAt,
    updated_at: pkg.updatedAt,
  };
}
