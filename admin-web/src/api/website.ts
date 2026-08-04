import { request } from './request';
import type { PageResult, WebsiteMaterial, WebsiteSettings } from '@/types/api';

export interface WebsiteMaterialQuery {
  page?: number;
  page_size?: number;
  category?: string;
  is_public?: boolean | '';
  is_recommended?: boolean | '';
}

export interface WebsiteMaterialPayload {
  title?: string;
  file_name?: string;
  category?: string;
  description?: string;
  is_public?: boolean;
  is_recommended?: boolean;
  sort_order?: number;
}

export function listWebsiteMaterials(params: WebsiteMaterialQuery) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== ''),
  );
  return request<PageResult<WebsiteMaterial>>({
    url: '/admin/website/materials',
    method: 'GET',
    params: cleanParams,
  });
}

export function uploadWebsiteMaterial(data: FormData) {
  return request<WebsiteMaterial>({
    url: '/admin/website/materials/upload',
    method: 'POST',
    data,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function updateWebsiteMaterial(id: string, data: WebsiteMaterialPayload) {
  return request<WebsiteMaterial>({
    url: `/admin/website/materials/${id}`,
    method: 'PUT',
    data,
  });
}

export function deleteWebsiteMaterial(id: string) {
  return request<{ deleted: boolean }>({
    url: `/admin/website/materials/${id}`,
    method: 'DELETE',
  });
}

export function getWebsiteSettings() {
  return request<WebsiteSettings>({
    url: '/admin/website/settings',
    method: 'GET',
  });
}

export function updateWebsiteSettings(data: WebsiteSettings) {
  return request<WebsiteSettings>({
    url: '/admin/website/settings',
    method: 'PUT',
    data,
  });
}
