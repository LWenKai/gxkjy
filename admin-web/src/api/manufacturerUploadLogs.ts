import { downloadCsv, request } from './request';
import type { ManufacturerUploadLog, PageResult } from '@/types/api';

export interface ManufacturerUploadLogQuery {
  page: number;
  page_size: number;
  manufacturer_code?: string;
  device_sn?: string;
  result?: string;
  date_from?: string;
  date_to?: string;
}

export function listManufacturerUploadLogs(params: ManufacturerUploadLogQuery) {
  return request<PageResult<ManufacturerUploadLog>>({
    url: '/admin/manufacturer-upload-logs',
    method: 'GET',
    params,
  });
}

export function exportManufacturerUploadLogs(
  params: Omit<ManufacturerUploadLogQuery, 'page' | 'page_size'>,
) {
  return downloadCsv(
    {
      url: '/admin/manufacturer-upload-logs/export',
      method: 'GET',
      params,
    },
    '厂家上传日志导出.csv',
  );
}
