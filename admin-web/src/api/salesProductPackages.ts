import { request } from './request';
import type { PageResult, SalesProductPackage, SalesProductPackageType } from '@/types/api';

export interface SalesProductPackageParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  type?: SalesProductPackageType;
  is_active?: boolean;
}

export function listSalesProductPackages(params: SalesProductPackageParams) {
  return request<PageResult<SalesProductPackage>>({
    url: '/admin/sales-product-packages',
    method: 'GET',
    params,
  });
}

export function getSalesProductPackage(id: string) {
  return request<SalesProductPackage>({
    url: `/admin/sales-product-packages/${id}`,
    method: 'GET',
  });
}

export function createSalesProductPackage(data: Record<string, unknown>) {
  return request<SalesProductPackage>({
    url: '/admin/sales-product-packages',
    method: 'POST',
    data,
  });
}

export function updateSalesProductPackage(id: string, data: Record<string, unknown>) {
  return request<SalesProductPackage>({
    url: `/admin/sales-product-packages/${id}`,
    method: 'PUT',
    data,
  });
}

export function setSalesProductPackageActive(id: string, isActive: boolean) {
  return request<SalesProductPackage>({
    url: `/admin/sales-product-packages/${id}/active`,
    method: 'PATCH',
    data: { is_active: isActive },
  });
}

export function deleteSalesProductPackage(id: string) {
  return request<{ deleted: boolean }>({
    url: `/admin/sales-product-packages/${id}`,
    method: 'DELETE',
  });
}
