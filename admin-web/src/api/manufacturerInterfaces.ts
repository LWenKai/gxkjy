import { request } from './request';
import type {
  IntegrationType,
  ManufacturerInterface,
  PageResult,
  StatusValue,
} from '@/types/api';

export interface ManufacturerInterfaceQuery {
  page: number;
  page_size: number;
  manufacturer_name?: string;
  manufacturer_code?: string;
  integration_type?: IntegrationType | '';
  status?: StatusValue | '';
}

export interface ManufacturerInterfacePayload {
  manufacturer_name: string;
  manufacturer_code?: string;
  access_secret?: string;
  integration_type: IntegrationType;
  status?: StatusValue;
  sign_rule?: string;
  allowed_ips?: string;
}

export function listManufacturerInterfaces(params: ManufacturerInterfaceQuery) {
  return request<PageResult<ManufacturerInterface>>({
    url: '/admin/manufacturer-interfaces',
    method: 'GET',
    params,
  });
}

export function createManufacturerInterface(data: ManufacturerInterfacePayload) {
  return request<ManufacturerInterface>({
    url: '/admin/manufacturer-interfaces',
    method: 'POST',
    data,
  });
}

export function getManufacturerInterface(id: string) {
  return request<ManufacturerInterface>({
    url: `/admin/manufacturer-interfaces/${id}`,
    method: 'GET',
  });
}

export function updateManufacturerInterface(
  id: string,
  data: ManufacturerInterfacePayload,
) {
  return request<ManufacturerInterface>({
    url: `/admin/manufacturer-interfaces/${id}`,
    method: 'PUT',
    data,
  });
}

export function enableManufacturerInterface(id: string) {
  return request<ManufacturerInterface>({
    url: `/admin/manufacturer-interfaces/${id}/enable`,
    method: 'POST',
  });
}

export function disableManufacturerInterface(id: string) {
  return request<ManufacturerInterface>({
    url: `/admin/manufacturer-interfaces/${id}/disable`,
    method: 'POST',
  });
}

export function regenerateManufacturerSecret(id: string) {
  return request<ManufacturerInterface>({
    url: `/admin/manufacturer-interfaces/${id}/regenerate-secret`,
    method: 'POST',
  });
}
