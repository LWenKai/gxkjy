import { downloadCsv, request } from './request';
import type {
  Company,
  CompanySummary,
  CompanyUser,
  CompanyUserWithInitialPassword,
  PageResult,
} from '@/types/api';

export interface CompanyQuery {
  page: number;
  page_size: number;
  name?: string;
  status?: string;
  expire?: 'soon' | 'expired' | '';
}

export interface CompanyPayload {
  name: string;
  contact_name: string;
  phone: string;
  address?: string;
  origin_address?: string;
  customer_type?: string;
  service_note?: string;
  follow_up_note?: string;
  default_certificate_type:
    | 'agri_commitment_certificate'
    | 'enterprise_quick_test_label';
  service_start_at?: string;
  service_expire_at?: string;
}

export interface CompanyUserPayload {
  username: string;
  real_name?: string;
  password?: string;
}

export function listCompanies(params: CompanyQuery) {
  return request<PageResult<Company>>({
    url: '/admin/companies',
    method: 'GET',
    params,
  });
}

export function exportCompanies(params: Omit<CompanyQuery, 'page' | 'page_size'>) {
  return downloadCsv(
    {
      url: '/admin/companies/export',
      method: 'GET',
      params,
    },
    '企业管理导出.csv',
  );
}

export function createCompany(data: CompanyPayload) {
  return request<Company>({
    url: '/admin/companies',
    method: 'POST',
    data,
  });
}

export function getCompany(id: string) {
  return request<Company>({
    url: `/admin/companies/${id}`,
    method: 'GET',
  });
}

export function getCompanySummary(id: string) {
  return request<CompanySummary>({
    url: `/admin/companies/${id}/summary`,
    method: 'GET',
  });
}

export function updateCompany(id: string, data: CompanyPayload) {
  return request<Company>({
    url: `/admin/companies/${id}`,
    method: 'PUT',
    data,
  });
}

export function enableCompany(id: string) {
  return request<Company>({
    url: `/admin/companies/${id}/enable`,
    method: 'POST',
  });
}

export function disableCompany(id: string) {
  return request<Company>({
    url: `/admin/companies/${id}/disable`,
    method: 'POST',
  });
}

export function renewCompany(id: string, serviceExpireAt: string) {
  return request<Company>({
    url: `/admin/companies/${id}/renew`,
    method: 'POST',
    data: {
      service_expire_at: serviceExpireAt,
    },
  });
}

export function updateCompanyClientModules(id: string, modules: string[]) {
  return request<Company>({
    url: `/admin/companies/${id}/client-modules`,
    method: 'PUT',
    data: {
      client_modules: modules.join(','),
    },
  });
}

export function listCompanyUsers(companyId: string, params = { page: 1, page_size: 20 }) {
  return request<PageResult<CompanyUser>>({
    url: `/admin/companies/${companyId}/users`,
    method: 'GET',
    params,
  });
}

export function createCompanyUser(companyId: string, data: CompanyUserPayload) {
  return request<CompanyUserWithInitialPassword>({
    url: `/admin/companies/${companyId}/users`,
    method: 'POST',
    data,
  });
}

export function resetCompanyUserPassword(id: string, password?: string) {
  return request<CompanyUserWithInitialPassword>({
    url: `/admin/company-users/${id}/reset-password`,
    method: 'POST',
    data: password ? { password } : {},
  });
}

export function enableCompanyUser(id: string) {
  return request<CompanyUser>({
    url: `/admin/company-users/${id}/enable`,
    method: 'POST',
  });
}

export function disableCompanyUser(id: string) {
  return request<CompanyUser>({
    url: `/admin/company-users/${id}/disable`,
    method: 'POST',
  });
}
