import { Prisma } from '../../generated/prisma';

export const productInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithCompany = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

export function serializeProduct(product: ProductWithCompany) {
  return {
    id: product.id.toString(),
    company_id: product.companyId.toString(),
    company_name: product.company?.name || null,
    product_name: product.productName,
    product_category: product.productCategory,
    spec_model: product.specModel,
    origin: product.defaultOrigin,
    default_unit: product.defaultUnit,
    remark: product.remark,
    status: product.status,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };
}
