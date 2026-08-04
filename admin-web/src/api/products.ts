import { downloadCsv, request } from './request';
import type { PageResult, Product, StatusValue } from '@/types/api';

export interface ProductQuery {
  page: number;
  page_size: number;
  company_id?: string;
  product_name?: string;
  product_category?: string;
  status?: StatusValue | '';
}

export interface ProductPayload {
  company_id: string;
  product_name: string;
  product_category?: string;
  spec_model?: string;
  origin?: string;
  default_unit?: string;
  remark?: string;
  status?: StatusValue;
}

export function listProducts(params: ProductQuery) {
  return request<PageResult<Product>>({
    url: '/admin/products',
    method: 'GET',
    params,
  });
}

export function exportProducts(params: Omit<ProductQuery, 'page' | 'page_size'>) {
  return downloadCsv(
    {
      url: '/admin/products/export',
      method: 'GET',
      params,
    },
    '产品库导出.csv',
  );
}

export function createProduct(data: ProductPayload) {
  return request<Product>({
    url: '/admin/products',
    method: 'POST',
    data,
  });
}

export function updateProduct(id: string, data: ProductPayload) {
  return request<Product>({
    url: `/admin/products/${id}`,
    method: 'PUT',
    data,
  });
}

export function enableProduct(id: string) {
  return request<Product>({
    url: `/admin/products/${id}/enable`,
    method: 'POST',
  });
}

export function disableProduct(id: string) {
  return request<Product>({
    url: `/admin/products/${id}/disable`,
    method: 'POST',
  });
}
