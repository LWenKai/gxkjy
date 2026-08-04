import { downloadCsv, request } from './request';
import type { PageResult, SalesQuote, SalesQuoteStatus } from '@/types/api';

export interface SalesQuoteParams {
  page?: number;
  page_size?: number;
  customer_id?: string;
  status?: SalesQuoteStatus;
  keyword?: string;
}

export function listSalesQuotes(params: SalesQuoteParams) {
  return request<PageResult<SalesQuote>>({
    url: '/admin/sales-quotes',
    method: 'GET',
    params,
  });
}

export function getSalesQuote(id: string) {
  return request<SalesQuote>({
    url: `/admin/sales-quotes/${id}`,
    method: 'GET',
  });
}

export function createSalesQuote(data: Record<string, unknown>) {
  return request<SalesQuote>({
    url: '/admin/sales-quotes',
    method: 'POST',
    data,
  });
}

export function updateSalesQuote(id: string, data: Record<string, unknown>) {
  return request<SalesQuote>({
    url: `/admin/sales-quotes/${id}`,
    method: 'PUT',
    data,
  });
}

export function generateSalesQuoteFiles(id: string) {
  return request<SalesQuote>({
    url: `/admin/sales-quotes/${id}/generate-files`,
    method: 'POST',
  });
}

export function createSalesQuoteVersion(id: string) {
  return request<SalesQuote>({
    url: `/admin/sales-quotes/${id}/create-version`,
    method: 'POST',
  });
}

export function updateSalesQuoteStatus(id: string, status: SalesQuoteStatus) {
  return request<SalesQuote>({
    url: `/admin/sales-quotes/${id}/status`,
    method: 'PATCH',
    data: { status },
  });
}

export function convertSalesQuoteToOrder(id: string, data: Record<string, unknown>) {
  return request<Record<string, unknown>>({
    url: `/admin/sales-quotes/${id}/convert-to-order`,
    method: 'POST',
    data,
  });
}

export function createRepurchaseQuote(itemId: string, data?: Record<string, unknown>) {
  return request<SalesQuote>({
    url: `/admin/sales-quotes/repurchase-items/${itemId}/create-quote`,
    method: 'POST',
    data: data || {},
  });
}

export function salesQuoteDownloadUrl(id: string, type: 'pdf' | 'excel') {
  return `/api/admin/sales-quotes/${id}/download/${type}`;
}

export function downloadSalesQuoteFile(id: string, type: 'pdf' | 'excel') {
  return downloadCsv(
    {
      url: `/admin/sales-quotes/${id}/download/${type}`,
      method: 'GET',
    },
    type === 'pdf' ? '报价单.pdf' : '报价单.xlsx',
  );
}
