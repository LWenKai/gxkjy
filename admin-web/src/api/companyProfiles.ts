import { request } from './request';
import type { CompanyProfile, CompanyProfileAsset } from '@/types/api';

export interface CompanyProfilePayload {
  intro?: string;
  main_products?: string;
  display_address?: string;
  display_phone?: string;
  qualification_description?: string;
  is_public_enabled?: boolean;
}

export interface CompanyProfileAssetPayload {
  file_name?: string;
  file_type?: string;
  file_url?: string;
  is_public?: boolean;
  sort_order?: number;
}

export function getCompanyProfile(companyId: string) {
  return request<CompanyProfile>({
    url: `/admin/companies/${companyId}/profile`,
    method: 'GET',
  });
}

export function updateCompanyProfile(
  companyId: string,
  data: CompanyProfilePayload,
) {
  return request<CompanyProfile>({
    url: `/admin/companies/${companyId}/profile`,
    method: 'PUT',
    data,
  });
}

export function createCompanyProfileAsset(
  companyId: string,
  data: Required<Pick<CompanyProfileAssetPayload, 'file_name' | 'file_type' | 'file_url'>> &
    CompanyProfileAssetPayload,
) {
  return request<CompanyProfileAsset>({
    url: `/admin/companies/${companyId}/profile/assets`,
    method: 'POST',
    data,
  });
}

export function uploadCompanyProfileFile(companyId: string, data: FormData) {
  return request<CompanyProfileAsset>({
    url: `/admin/companies/${companyId}/profile/files`,
    method: 'POST',
    data,
  });
}

export function updateCompanyProfileAsset(
  id: string,
  data: CompanyProfileAssetPayload,
) {
  return request<CompanyProfileAsset>({
    url: `/admin/company-profile-assets/${id}`,
    method: 'PUT',
    data,
  });
}

export function enableCompanyProfileAssetPublic(id: string) {
  return request<CompanyProfileAsset>({
    url: `/admin/company-profile-assets/${id}/enable-public`,
    method: 'POST',
  });
}

export function disableCompanyProfileAssetPublic(id: string) {
  return request<CompanyProfileAsset>({
    url: `/admin/company-profile-assets/${id}/disable-public`,
    method: 'POST',
  });
}

export function updateCompanyProfileFile(
  id: string,
  data: CompanyProfileAssetPayload,
) {
  return request<CompanyProfileAsset>({
    url: `/admin/company-profile-files/${id}`,
    method: 'PUT',
    data,
  });
}

export function deleteCompanyProfileFile(id: string) {
  return request<{ deleted: boolean }>({
    url: `/admin/company-profile-files/${id}`,
    method: 'DELETE',
  });
}

export function enableCompanyProfileFilePublic(id: string) {
  return request<CompanyProfileAsset>({
    url: `/admin/company-profile-files/${id}/enable-public`,
    method: 'POST',
  });
}

export function disableCompanyProfileFilePublic(id: string) {
  return request<CompanyProfileAsset>({
    url: `/admin/company-profile-files/${id}/disable-public`,
    method: 'POST',
  });
}
