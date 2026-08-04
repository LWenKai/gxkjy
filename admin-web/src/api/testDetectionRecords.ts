import { request } from './request';
import type { DetectionRecord, DetectionResultValue } from '@/types/api';

export interface TestDetectionRecordPayload {
  company_id: string;
  device_id: string;
  product_name: string;
  sample_name?: string;
  sample_category?: string;
  overall_result: DetectionResultValue;
  test_time?: string;
  items: Array<{
    test_item: string;
    test_method?: string;
    test_value: string;
    unit?: string;
    standard_limit?: string;
    result: DetectionResultValue;
  }>;
}

export function createTestDetectionRecord(data: TestDetectionRecordPayload) {
  return request<DetectionRecord>({
    url: '/admin/test-detection-records',
    method: 'POST',
    data,
  });
}
