import { request } from './request';
import type { DashboardSummary } from '@/types/api';

export function getDashboardSummary() {
  return request<DashboardSummary>({
    url: '/admin/dashboard/summary',
    method: 'GET',
  });
}
