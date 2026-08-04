import { downloadCsv, request } from './request';
import type { OperationLog, PageResult } from '@/types/api';

export interface OperationLogQuery {
  page: number;
  page_size: number;
  operator?: string;
  target_type?: string;
  action?: string;
  date_from?: string;
  date_to?: string;
}

export function listOperationLogs(params: OperationLogQuery) {
  return request<PageResult<OperationLog>>({
    url: '/admin/operation-logs',
    method: 'GET',
    params,
  });
}

export function exportOperationLogs(
  params: Omit<OperationLogQuery, 'page' | 'page_size'>,
) {
  return downloadCsv(
    {
      url: '/admin/operation-logs/export',
      method: 'GET',
      params,
    },
    '操作日志导出.csv',
  );
}
