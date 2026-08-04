import { request } from './request';
import type { CustomerPurchaseOrder, CustomerRepurchaseReminder, PageResult, RepurchaseStatus } from '@/types/api';

export interface PurchaseOrderParams {
  page?: number;
  page_size?: number;
  customer_id?: string;
  payment_status?: string;
  delivery_status?: string;
}

export function listPurchaseOrders(params: PurchaseOrderParams) {
  return request<PageResult<CustomerPurchaseOrder>>({
    url: '/admin/customer-purchase-orders',
    method: 'GET',
    params,
  });
}

export function getPurchaseOrder(id: string) {
  return request<CustomerPurchaseOrder>({
    url: `/admin/customer-purchase-orders/${id}`,
    method: 'GET',
  });
}

export function createPurchaseOrder(data: Record<string, unknown>) {
  return request<CustomerPurchaseOrder>({
    url: '/admin/customer-purchase-orders',
    method: 'POST',
    data,
  });
}

export function updatePurchaseOrder(id: string, data: Record<string, unknown>) {
  return request<CustomerPurchaseOrder>({
    url: `/admin/customer-purchase-orders/${id}`,
    method: 'PUT',
    data,
  });
}

export function deletePurchaseOrder(id: string) {
  return request<{ deleted: boolean }>({
    url: `/admin/customer-purchase-orders/${id}`,
    method: 'DELETE',
  });
}

export function listRepurchaseReminders(params?: { range?: string; status?: string }) {
  return request<CustomerRepurchaseReminder[]>({
    url: '/admin/repurchase-reminders',
    method: 'GET',
    params,
  });
}

export function updateRepurchaseStatus(id: string, status: RepurchaseStatus) {
  return request<{ id: string; repurchase_status: RepurchaseStatus }>({
    url: `/admin/customer-purchase-items/${id}/repurchase-status`,
    method: 'PUT',
    data: { repurchase_status: status },
  });
}
