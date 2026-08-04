import { API_BASE_URL } from '@/config';
import { getToken } from '@/utils/auth';
import { request } from './http';

export type ApiResult = 'qualified' | 'unqualified';
export type RecordStatus = 'normal' | 'marked_abnormal' | 'hidden' | 'voided';
export type CertificateStatus = 'normal' | 'voided';
export type CertificateType =
  | 'agri_commitment_certificate'
  | 'enterprise_quick_test_label';
export type CommitmentBasisType =
  | 'quality_control'
  | 'self_test_qualified'
  | 'entrusted_test_qualified';

export interface PageResult<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface DetectionRecord {
  id: string;
  record_no: string;
  product_name: string;
  sample_name?: string | null;
  overall_result: ApiResult;
  status: RecordStatus;
  test_time: string;
  upload_time?: string;
  item_count?: number;
  certificate_count?: number;
}

export interface ClientDashboardSummary {
  company: {
    id: string;
    name: string;
    contact_name?: string;
    phone?: string;
    address?: string | null;
    origin_address?: string | null;
    service_expire_at?: string;
    default_certificate_type?: CertificateType;
  } | null;
  service: {
    status: string;
    expire_at?: string | null;
    expire_warning?: {
      days_left: number;
      service_expire_at: string;
    } | null;
  };
  stats: {
    today_detection_count: number;
    certifiable_count: number;
    today_certificate_count: number;
    certificate_total?: number;
  };
  recent_detection_records: DetectionRecord[];
  recent_certificates: Certificate[];
}

export interface DetectionRecordDetail extends DetectionRecord {
  items: Array<{
    id: string;
    test_item: string;
    test_method?: string | null;
    test_value: string;
    unit?: string | null;
    standard_limit?: string | null;
    result: ApiResult;
  }>;
}

export interface Certificate {
  id: string;
  certificate_no: string;
  certificate_type: CertificateType;
  title: string;
  product_name: string;
  quantity: string;
  unit: string;
  origin?: string | null;
  issuer_name: string;
  contact_phone: string;
  commitment_basis: string;
  commitment_basis_type?: CommitmentBasisType;
  commitment_statement?: string | null;
  print_copies?: number;
  evidence_assets?: EvidenceAsset[];
  status: CertificateStatus;
  issue_time: string;
  void_time?: string | null;
  qr_url?: string | null;
}

export interface CertificateDetail extends Certificate {
  company_name?: string | null;
  detection_record: DetectionRecordDetail | null;
  print_logs?: Array<{
    id: string;
    print_status: 'success' | 'failed' | 'simulated';
    copies: number;
    printed_at: string;
    error_message?: string | null;
  }>;
}

export interface EvidenceAsset {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  mime_type?: string | null;
  file_size?: string | null;
  is_public?: boolean;
  uploaded_at?: string;
}

export interface ClientProduct {
  id: string;
  product_name: string;
  origin?: string | null;
  default_unit: string;
  remark?: string | null;
  status: string;
}

export interface PrintData {
  paper: {
    width_mm: number;
    height_mm: number;
  };
  adapter: {
    mode: string;
    real_print_enabled: boolean;
  };
  label: {
    title: string;
    certificate_type: CertificateType;
    product_name: string;
    quantity: string;
    unit: string;
    origin?: string | null;
    company_name: string;
    contact_phone: string;
    commitment_basis?: string | null;
    test_items?: Array<{
      name: string;
      value?: string | null;
      unit?: string | null;
      limit_value?: string | null;
      result?: string | null;
    }>;
    issue_date: string;
    certificate_no: string;
    qr_url?: string | null;
    tip: string;
  };
}

export function loginClient(data: { username: string; password: string }) {
  return request<{
    access_token: string;
    company_user: unknown;
    company: unknown;
    expire_warning?: unknown;
  }>('/client/auth/login', {
    method: 'POST',
    data,
    auth: false,
    silent: true,
  });
}

export function getClientDashboardSummary() {
  return request<ClientDashboardSummary>('/client/dashboard/summary');
}

export function listDetectionRecords(data: {
  page?: number;
  page_size?: number;
  overall_result?: ApiResult | '';
  sample_name?: string;
}) {
  return request<PageResult<DetectionRecord>>('/client/detection-records', {
    data,
  });
}

export function getDetectionRecord(id: string) {
  return request<DetectionRecordDetail>(`/client/detection-records/${id}`);
}

export function listCertifiableRecords(data: {
  page?: number;
  page_size?: number;
  sample_name?: string;
}) {
  return request<PageResult<DetectionRecord>>('/client/certifiable-records', {
    data,
  });
}

export function createCertificate(data: {
  commitment_basis_type: CommitmentBasisType;
  detection_record_id?: string;
  evidence_asset_ids?: string[];
  certificate_type?: CertificateType;
  product_name: string;
  quantity: string;
  unit: string;
  origin?: string;
  issuer_name: string;
  contact_phone: string;
  commitment_basis?: string;
  commitment_statement?: string;
  print_copies?: number;
  remark?: string;
}) {
  return request<CertificateDetail>('/client/certificates', {
    method: 'POST',
    data,
  });
}

export function getLatestCertificate() {
  return request<CertificateDetail | null>('/client/certificates/latest');
}

export function listClientProducts(data?: { keyword?: string }) {
  return request<ClientProduct[]>('/client/products', { data });
}

export function saveClientProduct(data: {
  product_name: string;
  default_unit?: string;
  origin?: string;
  remark?: string;
}) {
  return request<ClientProduct>('/client/products', {
    method: 'POST',
    data,
  });
}

export function updateClientProduct(
  id: string,
  data: {
    product_name: string;
    default_unit?: string;
    origin?: string;
    remark?: string;
  },
) {
  return request<ClientProduct>(`/client/products/${id}`, {
    method: 'PUT',
    data,
  });
}

export function deleteClientProduct(id: string) {
  return request<{ deleted: boolean }>(`/client/products/${id}`, {
    method: 'DELETE',
  });
}

export function uploadEvidenceFile(
  filePath: string,
  data: {
    file_name?: string;
    file_type?: string;
    is_public?: boolean;
  },
) {
  return new Promise<EvidenceAsset>((resolve, reject) => {
    const token = getToken();
    uni.uploadFile({
      url: `${API_BASE_URL}/client/certificates/evidence-files`,
      filePath,
      name: 'file',
      formData: {
        file_name: data.file_name || '',
        file_type: data.file_type || 'certificate_evidence',
        is_public: data.is_public ? 'true' : 'false',
      },
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const body = JSON.parse(res.data || '{}');
          if (!body.success) {
            uni.showToast({ title: body.message || '上传失败', icon: 'none' });
            reject(body);
            return;
          }
          resolve(body.data as EvidenceAsset);
        } catch (error) {
          reject(error);
        }
      },
      fail: (error) => {
        uni.showToast({ title: '上传失败，请重试', icon: 'none' });
        reject(error);
      },
    });
  });
}

export function listCertificates(data: {
  page?: number;
  page_size?: number;
  status?: CertificateStatus | '';
  product_name?: string;
}) {
  return request<PageResult<Certificate>>('/client/certificates', { data });
}

export function getCertificate(id: string) {
  return request<CertificateDetail>(`/client/certificates/${id}`);
}

export function voidCertificate(id: string) {
  return request<CertificateDetail>(`/client/certificates/${id}/void`, {
    method: 'POST',
  });
}

export function getPrintData(id: string) {
  return request<PrintData>(`/client/certificates/${id}/print-data`);
}

export function createPrintLog(
  id: string,
  data: {
    print_status: 'success' | 'failed';
    copies?: number;
    adapter_type?: string;
    printer_id?: string;
    printer_name?: string;
    printer_model?: string;
    connection_type?: string;
    error_message?: string;
  },
) {
  return request(`/client/certificates/${id}/print-logs`, {
    method: 'POST',
    data,
  });
}
