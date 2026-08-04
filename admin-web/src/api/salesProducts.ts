import { request } from './request';
import type { PageResult, SalesProduct } from '@/types/api';

export interface SalesProductParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  category?: string;
  is_active?: boolean;
}

export function listSalesProducts(params: SalesProductParams) {
  return request<PageResult<SalesProduct>>({
    url: '/admin/sales-products',
    method: 'GET',
    params,
  });
}

export function createSalesProduct(data: Record<string, unknown>) {
  return request<SalesProduct>({
    url: '/admin/sales-products',
    method: 'POST',
    data,
  });
}

export function ensureDefaultSalesProducts() {
  return request<{ created: number; skipped: number; total: number }>({
    url: '/admin/sales-products/ensure-defaults',
    method: 'POST',
  });
}

export function updateSalesProduct(id: string, data: Record<string, unknown>) {
  return request<SalesProduct>({
    url: `/admin/sales-products/${id}`,
    method: 'PUT',
    data,
  });
}

export function setSalesProductActive(id: string, isActive: boolean) {
  return request<SalesProduct>({
    url: `/admin/sales-products/${id}/active`,
    method: 'PATCH',
    data: { is_active: isActive },
  });
}

export function deleteSalesProduct(id: string) {
  return request<{ deleted: boolean }>({
    url: `/admin/sales-products/${id}`,
    method: 'DELETE',
  });
}

export function uploadSalesProductImage(id: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return request<SalesProduct>({
    url: `/admin/sales-products/${id}/image`,
    method: 'POST',
    data: form,
  });
}
