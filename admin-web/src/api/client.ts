import { request } from './request';
import { getStoredClientToken } from '@/stores/clientAuth';
import type {
  BigScreenData,
  Certificate,
  ClientChangePasswordResult,
  ClientCompany,
  ClientCompanyProfile,
  ClientCompanyProfileAsset,
  ClientDashboardSummary,
  ClientLoginResult,
  DetectionRecord,
  PageResult,
  Product,
} from '@/types/api';

export interface ClientLoginPayload {
  username: string;
  password: string;
}

export function loginClient(payload: ClientLoginPayload) {
  return request<ClientLoginResult>({
    url: '/client/auth/login',
    method: 'POST',
    data: payload,
    skipAuth: false,
    silent: true,
  });
}

export function getClientDashboardSummary() {
  return request<ClientDashboardSummary>({
    url: '/client/dashboard/summary',
    method: 'GET',
    clientAuth: true,
  });
}

export interface ClientDetectionRecordQuery {
  page: number;
  page_size: number;
  overall_result?: 'qualified' | 'unqualified' | '';
  sample_name?: string;
  product_name?: string;
  date_from?: string;
  date_to?: string;
}

export function listClientDetectionRecords(params: ClientDetectionRecordQuery) {
  return request<PageResult<DetectionRecord>>({
    url: '/client/detection-records',
    method: 'GET',
    params,
    clientAuth: true,
  });
}

export function getClientDetectionRecord(id: string) {
  return request<DetectionRecord>({
    url: `/client/detection-records/${id}`,
    method: 'GET',
    clientAuth: true,
  });
}

export interface ClientDetectionExportPayload {
  fields?: string[];
  overall_result?: 'qualified' | 'unqualified' | '';
  sample_name?: string;
  product_name?: string;
  date_from?: string;
  date_to?: string;
}

export async function exportClientDetectionRecords(payload: ClientDetectionExportPayload) {
  const params: Record<string, string> = {
    fields: (payload.fields || []).join(','),
  };
  if (payload.overall_result) params.overall_result = payload.overall_result;
  if (payload.sample_name) params.sample_name = payload.sample_name;
  if (payload.product_name) params.product_name = payload.product_name;
  if (payload.date_from) params.date_from = payload.date_from;
  if (payload.date_to) params.date_to = payload.date_to;

  const token = getStoredClientToken();
  const query = new URLSearchParams(params).toString();
  const url = `/api/client/detection-records/export?${query}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (response.status === 204) {
    const err = new Error('当前筛选条件下没有可导出的数据');
    err.name = 'NO_DATA';
    throw err;
  }
  if (!response.ok) {
    throw new Error('导出失败');
  }

  const blob = await response.blob();
  downloadBlob(blob, `检测记录导出_${new Date().toISOString().slice(0, 10)}.csv`);
}

export async function exportClientDetectionRecordsExcel(payload: ClientDetectionExportPayload) {
  const params: Record<string, string> = {};
  if (payload.overall_result) params.overall_result = payload.overall_result;
  if (payload.sample_name) params.sample_name = payload.sample_name;
  if (payload.product_name) params.product_name = payload.product_name;
  if (payload.date_from) params.date_from = payload.date_from;
  if (payload.date_to) params.date_to = payload.date_to;

  const token = getStoredClientToken();
  const query = new URLSearchParams(params).toString();
  const url = `/api/client/detection-records/export-excel?${query}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error('导出失败');
  }

  const blob = await response.blob();
  downloadBlob(blob, `检测记录报表_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function downloadBlob(blob: Blob, filename: string) {
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export interface ClientCertificateQuery {
  page: number;
  page_size: number;
  status?: 'normal' | 'voided' | '';
  product_name?: string;
}

export function listClientCertificates(params: ClientCertificateQuery) {
  return request<PageResult<Certificate>>({
    url: '/client/certificates',
    method: 'GET',
    params,
    clientAuth: true,
  });
}

export function getClientCertificate(id: string) {
  return request<Certificate>({
    url: `/client/certificates/${id}`,
    method: 'GET',
    clientAuth: true,
  });
}

export function getClientCompany() {
  return request<ClientCompany>({
    url: '/client/company',
    method: 'GET',
    clientAuth: true,
  });
}

export interface ClientUpdateCompanyPayload {
  name?: string;
  contact_name?: string;
  phone?: string;
  address?: string;
  origin_address?: string;
}

export function updateClientCompany(payload: ClientUpdateCompanyPayload) {
  return request<ClientCompany>({
    url: '/client/company',
    method: 'PUT',
    data: payload,
    clientAuth: true,
  });
}

export function getClientCompanyProfile() {
  return request<ClientCompanyProfile>({
    url: '/client/company-profile',
    method: 'GET',
    clientAuth: true,
  });
}

export interface ClientCompanyProfilePayload {
  intro?: string;
  main_products?: string;
  display_address?: string;
  display_phone?: string;
  qualification_description?: string;
  is_public_enabled?: boolean;
}

export function updateClientCompanyProfile(payload: ClientCompanyProfilePayload) {
  return request<ClientCompanyProfile>({
    url: '/client/company-profile',
    method: 'PUT',
    data: payload,
    clientAuth: true,
  });
}

export interface ClientProfileAssetPayload {
  file_name?: string;
  file_type?: string;
  is_public?: boolean;
  sort_order?: number;
}

export function uploadClientProfileFile(formData: FormData) {
  return request<ClientCompanyProfileAsset>({
    url: '/client/company-profile/files',
    method: 'POST',
    data: formData,
    clientAuth: true,
  });
}

export function updateClientProfileFile(id: string, payload: ClientProfileAssetPayload) {
  return request<ClientCompanyProfileAsset>({
    url: `/client/company-profile-files/${id}`,
    method: 'PUT',
    data: payload,
    clientAuth: true,
  });
}

export function setClientProfileFilePublic(id: string, isPublic: boolean) {
  return request<ClientCompanyProfileAsset>({
    url: `/client/company-profile-files/${id}/${isPublic ? 'enable' : 'disable'}-public`,
    method: 'POST',
    clientAuth: true,
  });
}

export function deleteClientProfileFile(id: string) {
  return request<{ deleted: boolean }>({
    url: `/client/company-profile-files/${id}`,
    method: 'DELETE',
    clientAuth: true,
  });
}

export interface ClientChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export function changeClientPassword(payload: ClientChangePasswordPayload) {
  return request<ClientChangePasswordResult>({
    url: '/client/auth/password',
    method: 'PUT',
    data: payload,
    clientAuth: true,
  });
}

export function getClientBigScreen() {
  return request<BigScreenData>({
    url: '/client/big-screen',
    method: 'GET',
    clientAuth: true,
  });
}

export interface ClientProductPayload {
  product_name: string;
  product_category?: string;
  spec_model?: string;
  default_unit?: string;
  origin?: string;
  remark?: string;
}

export interface ClientProductQuery {
  keyword?: string;
  category?: string;
  status?: 'normal' | 'disabled' | 'all';
}

export interface ClientProductCategory {
  id: string;
  name: string;
}

export function listClientProducts(query?: ClientProductQuery) {
  return request<Product[]>({
    url: '/client/products',
    method: 'GET',
    params: query,
    clientAuth: true,
  });
}

export function listClientProductCategories() {
  return request<ClientProductCategory[]>({
    url: '/client/products/meta/categories',
    method: 'GET',
    clientAuth: true,
  });
}

export function createClientProductCategory(name: string, sort?: number) {
  return request<ClientProductCategory>({
    url: '/client/product-categories',
    method: 'POST',
    data: { name, sort },
    clientAuth: true,
  });
}

export function deleteClientCategory(id: string) {
  return request<{ deleted: boolean }>({
    url: `/client/product-categories/${id}`,
    method: 'DELETE',
    clientAuth: true,
  });
}

export function saveClientProduct(data: ClientProductPayload) {
  return request<Product>({
    url: '/client/products',
    method: 'POST',
    data,
    clientAuth: true,
  });
}

export function updateClientProduct(id: string, data: ClientProductPayload) {
  return request<Product>({
    url: `/client/products/${id}`,
    method: 'PUT',
    data,
    clientAuth: true,
  });
}

export function enableClientProduct(id: string) {
  return request<Product>({
    url: `/client/products/${id}/enable`,
    method: 'POST',
    clientAuth: true,
  });
}

export function deleteClientProduct(id: string) {
  return request<{ deleted: boolean }>({
    url: `/client/products/${id}`,
    method: 'DELETE',
    clientAuth: true,
  });
}

export function importClientProducts(rows: ClientProductPayload[]) {
  return request<{
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors: string[];
  }>({
    url: '/client/products/import',
    method: 'POST',
    data: { rows },
    clientAuth: true,
  });
}

// ---- Disposal (不合格处理闭环) ----

export interface DetectionRecordDisposal {
  id: string;
  companyId: string;
  detectionRecordId: string;
  disposition: string;
  description?: string;
  recheckRecordId?: string;
  status: 'pending' | 'done';
  handledBy?: string;
  handledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisposalPayload {
  disposition: string;
  description?: string;
}

export function listDetectionRecordDisposals(recordId: string) {
  return request<DetectionRecordDisposal[]>({
    url: `/client/detection-records/${recordId}/disposals`,
    method: 'GET',
    clientAuth: true,
  });
}

export function createDetectionRecordDisposal(recordId: string, payload: CreateDisposalPayload) {
  return request<DetectionRecordDisposal>({
    url: `/client/detection-records/${recordId}/disposals`,
    method: 'POST',
    data: payload,
    clientAuth: true,
  });
}

export function deleteDetectionRecordDisposal(recordId: string, disposalId: string) {
  return request<{ deleted: boolean }>({
    url: `/client/detection-records/${recordId}/disposals/${disposalId}/delete`,
    method: 'POST',
    clientAuth: true,
  });
}
