import { request } from './request';
import type { SystemSettings } from '@/types/api';

export function getSystemSettings() {
  return request<SystemSettings>({
    url: '/admin/system-settings',
    method: 'GET',
  });
}

export function updateSystemSettings(data: SystemSettings) {
  return request<SystemSettings>({
    url: '/admin/system-settings',
    method: 'PATCH',
    data,
  });
}
