import { downloadCsv, request } from './request';
import type { Device, PageResult, StatusValue } from '@/types/api';

export interface DeviceQuery {
  page: number;
  page_size: number;
  manufacturer_code?: string;
  company_id?: string;
  status?: StatusValue | '';
  bind_status?: 'bound' | 'unbound' | '';
}

export interface DevicePayload {
  manufacturer_code: string;
  device_sn: string;
  device_name?: string;
  model?: string;
  company_id?: string;
  status?: StatusValue;
  remark?: string;
}

export function listDevices(params: DeviceQuery) {
  return request<PageResult<Device>>({
    url: '/admin/devices',
    method: 'GET',
    params,
  });
}

export function exportDevices(params: Omit<DeviceQuery, 'page' | 'page_size'>) {
  return downloadCsv(
    {
      url: '/admin/devices/export',
      method: 'GET',
      params,
    },
    '设备管理导出.csv',
  );
}

export function createDevice(data: DevicePayload) {
  return request<Device>({
    url: '/admin/devices',
    method: 'POST',
    data,
  });
}

export function getDevice(id: string) {
  return request<Device>({
    url: `/admin/devices/${id}`,
    method: 'GET',
  });
}

export function updateDevice(id: string, data: DevicePayload) {
  return request<Device>({
    url: `/admin/devices/${id}`,
    method: 'PUT',
    data,
  });
}

export function bindDevice(id: string, companyId: string) {
  return request<Device>({
    url: `/admin/devices/${id}/bind`,
    method: 'POST',
    data: {
      company_id: companyId,
    },
  });
}

export function unbindDevice(id: string) {
  return request<Device>({
    url: `/admin/devices/${id}/unbind`,
    method: 'POST',
  });
}

export function enableDevice(id: string) {
  return request<Device>({
    url: `/admin/devices/${id}/enable`,
    method: 'POST',
  });
}

export function disableDevice(id: string) {
  return request<Device>({
    url: `/admin/devices/${id}/disable`,
    method: 'POST',
  });
}
