import { request } from './request';
import type {
  Customer,
  CustomerDetail,
  CustomerDeviceRecord,
  CustomerFollowRecord,
  CustomerNeed,
  CustomerPurchase,
  CustomerQuote,
  CustomerQuoteAttachment,
  CustomerRepurchaseReminder,
  PageResult,
} from '@/types/api';

export interface CustomerListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  source?: string;
  customer_type?: string;
  status?: string;
  value_level?: string;
}

export interface CustomerPayload {
  company_name: string;
  contact_name?: string;
  phone?: string;
  wechat?: string;
  province?: string;
  city?: string;
  address?: string;
  customer_type?: string;
  source?: string;
  status?: string;
  value_level?: string;
  remark?: string;
}

export function listCustomers(params: CustomerListParams) {
  return request<PageResult<Customer>>({
    url: '/admin/customers',
    method: 'GET',
    params,
  });
}

export function getCustomer(id: string) {
  return request<CustomerDetail>({
    url: `/admin/customers/${id}`,
    method: 'GET',
  });
}

export function createCustomer(data: CustomerPayload) {
  return request<CustomerDetail>({
    url: '/admin/customers',
    method: 'POST',
    data,
  });
}

export function updateCustomer(id: string, data: Partial<CustomerPayload>) {
  return request<CustomerDetail>({
    url: `/admin/customers/${id}`,
    method: 'PUT',
    data,
  });
}

export function deleteCustomer(id: string) {
  return request<{ deleted: boolean }>({
    url: `/admin/customers/${id}`,
    method: 'DELETE',
  });
}

export function listCustomerRepurchaseReminders() {
  return request<CustomerRepurchaseReminder[]>({
    url: '/admin/customers/repurchase-reminders',
    method: 'GET',
  });
}

export function addCustomerNeed(customerId: string, data: Record<string, unknown>) {
  return request<CustomerNeed>({
    url: `/admin/customers/${customerId}/needs`,
    method: 'POST',
    data,
  });
}

export function addCustomerDevice(customerId: string, data: Record<string, unknown>) {
  return request<CustomerDeviceRecord>({
    url: `/admin/customers/${customerId}/devices`,
    method: 'POST',
    data,
  });
}

export function addCustomerFollowRecord(
  customerId: string,
  data: Record<string, unknown>,
) {
  return request<CustomerFollowRecord>({
    url: `/admin/customers/${customerId}/follow-records`,
    method: 'POST',
    data,
  });
}

export function addCustomerQuote(customerId: string, data: Record<string, unknown>) {
  return request<CustomerQuote>({
    url: `/admin/customers/${customerId}/quotes`,
    method: 'POST',
    data,
  });
}

export function addCustomerPurchase(customerId: string, data: Record<string, unknown>) {
  return request<CustomerPurchase>({
    url: `/admin/customers/${customerId}/purchases`,
    method: 'POST',
    data,
  });
}

export function deleteCustomerRecord(
  recordType: 'needs' | 'devices' | 'follow-records' | 'quotes' | 'purchases',
  recordId: string,
) {
  return request<{ deleted: boolean }>({
    url: `/admin/customers/${recordType}/${recordId}`,
    method: 'DELETE',
  });
}

export function uploadQuoteAttachments(quoteId: string, files: File[]) {
  const form = new FormData();
  files.forEach((file) => form.append('files', file));
  return request<CustomerQuoteAttachment[]>({
    url: `/admin/customer-quotes/${quoteId}/attachments`,
    method: 'POST',
    data: form,
  });
}

export function deleteQuoteAttachment(id: string) {
  return request<{ deleted: boolean }>({
    url: `/admin/customer-quote-attachments/${id}`,
    method: 'DELETE',
  });
}

export function quoteAttachmentDownloadUrl(id: string) {
  return `/api/admin/customer-quote-attachments/${id}/download`;
}
