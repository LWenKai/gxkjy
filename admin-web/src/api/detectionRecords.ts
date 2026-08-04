import { downloadCsv, request } from './request';
import type {
  DetectionRecord,
  DetectionRecordStatusValue,
  DetectionResultValue,
  PageResult,
} from '@/types/api';

export interface DetectionRecordQuery {
  page: number;
  page_size: number;
  company_id?: string;
  device_id?: string;
  overall_result?: DetectionResultValue | '';
  status?: DetectionRecordStatusValue | '';
  date_from?: string;
  date_to?: string;
  attention?: 'abnormal';
}

export interface DetectionRecordActionPayload {
  reason?: string;
}

export function listDetectionRecords(params: DetectionRecordQuery) {
  return request<PageResult<DetectionRecord>>({
    url: '/admin/detection-records',
    method: 'GET',
    params,
  });
}

export function exportDetectionRecords(
  params: Omit<DetectionRecordQuery, 'page' | 'page_size'>,
) {
  return downloadCsv(
    {
      url: '/admin/detection-records/export',
      method: 'GET',
      params,
    },
    '检测记录导出.csv',
  );
}

export function getDetectionRecord(id: string) {
  return request<DetectionRecord>({
    url: `/admin/detection-records/${id}`,
    method: 'GET',
  });
}

export function markDetectionRecordAbnormal(id: string, data?: DetectionRecordActionPayload) {
  return request<DetectionRecord>({
    url: `/admin/detection-records/${id}/mark-abnormal`,
    method: 'POST',
    data,
  });
}

export function hideDetectionRecord(id: string, data?: DetectionRecordActionPayload) {
  return request<DetectionRecord>({
    url: `/admin/detection-records/${id}/hide`,
    method: 'POST',
    data,
  });
}

export function voidDetectionRecord(id: string, data?: DetectionRecordActionPayload) {
  return request<DetectionRecord>({
    url: `/admin/detection-records/${id}/void`,
    method: 'POST',
    data,
  });
}

export function restoreDetectionRecord(id: string, data?: DetectionRecordActionPayload) {
  return request<DetectionRecord>({
    url: `/admin/detection-records/${id}/restore`,
    method: 'POST',
    data,
  });
}

export function cancelDetectionRecordAbnormal(id: string, data?: DetectionRecordActionPayload) {
  return request<DetectionRecord>({
    url: `/admin/detection-records/${id}/cancel-abnormal`,
    method: 'POST',
    data,
  });
}
