import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.gxkjy.com/api';

export type CertificateStatus = 'normal' | 'voided';
export type PublicResult = 'qualified' | 'unqualified';
export type CertificateType =
  | 'agri_commitment_certificate'
  | 'enterprise_quick_test_label';
export type CommitmentBasisType =
  | 'quality_control'
  | 'self_test_qualified'
  | 'entrusted_test_qualified';

export interface PublicEvidenceAsset {
  id?: string;
  file_url: string;
  file_name: string;
  file_type: string;
  mime_type?: string | null;
  file_size?: string | null;
  is_public?: boolean;
}

export interface PublicCertificateResponse {
  valid: boolean;
  status: 'invalid' | CertificateStatus;
  message?: string;
  certificate?: {
    certificate_no: string;
    certificate_type: CertificateType;
    certificate_title: string;
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
    status: CertificateStatus;
    issue_time: string;
    void_time?: string | null;
  };
  detection?: {
    product_name: string;
    sample_name?: string | null;
    overall_result: PublicResult;
    test_time: string;
    items: Array<{
      test_item: string;
      test_method?: string | null;
      test_value: string;
      unit?: string | null;
      standard_limit?: string | null;
      result: PublicResult;
    }>;
  } | null;
  evidence_assets?: PublicEvidenceAsset[];
  company?: {
    name: string;
    intro?: string | null;
    main_products?: string | null;
    display_address?: string | null;
    display_phone?: string | null;
    qualification_description?: string | null;
    images: PublicEvidenceAsset[];
    qualification_images: PublicEvidenceAsset[];
    documents?: PublicEvidenceAsset[];
  };
  support?: {
    provider_name: string;
    support_text: string;
  };
  notice?: string;
}

export interface PublicSettings {
  platform_name: string;
  service_phone: string;
  support_text: string;
  public_footer_notice: string;
  certificate_public_notice: string;
  show_support_info: boolean;
  show_company_public_profile: boolean;
}

export async function getPublicCertificate(publicToken: string) {
  const response = await axios.get<{
    success: boolean;
    data: PublicCertificateResponse;
    message: string;
  }>(`${API_BASE_URL}/public/certificates/${encodeURIComponent(publicToken)}`);

  return response.data.data;
}

export async function getPublicSettings() {
  const response = await axios.get<{
    success: boolean;
    data: PublicSettings;
    message: string;
  }>(`${API_BASE_URL}/public/settings`);

  return response.data.data;
}

export interface ScreenLoginResult {
  access_token: string;
  company_user: {
    id: string;
    username: string;
    real_name?: string | null;
    status?: string;
  };
  company: {
    id: string;
    name: string;
  };
}

export type ScreenResult = 'qualified' | 'unqualified';

export interface ScreenSummary {
  company: {
    id: string;
    name: string;
    contact_name?: string | null;
    phone?: string | null;
    address?: string | null;
    origin_address?: string | null;
    service_expire_at?: string | null;
  } | null;
  stats: {
    today_detection_count: number;
    today_qualified_count: number;
    today_unqualified_count: number;
    today_qualified_rate: number;
    today_certificate_count: number;
    certifiable_count: number;
  };
  hourly_detection: Array<{
    hour: number;
    total: number;
    qualified: number;
    unqualified: number;
  }>;
  result_distribution: {
    qualified: number;
    unqualified: number;
  };
  recent_records: Array<{
    id: string;
    record_no: string;
    product_name: string;
    sample_name?: string | null;
    overall_result: ScreenResult;
    status: string;
    test_time: string;
    item_count: number;
    certificate_count: number;
  }>;
  recent_certificates: Array<{
    id: string;
    certificate_no: string;
    product_name: string;
    quantity: string;
    unit: string;
    status: CertificateStatus;
    issue_time: string;
  }>;
  printer: {
    printer_name?: string | null;
    printer_model?: string | null;
    connection_type?: string | null;
    status: string;
    last_connected_at?: string | null;
    print_log_count: number;
  };
  profile?: {
    intro?: string | null;
    main_products?: string | null;
    display_address?: string | null;
    display_phone?: string | null;
  } | null;
  service_warning?: {
    days_left: number;
    service_expire_at: string;
  } | null;
  updated_at: string;
}

export async function loginScreen(username: string, password: string) {
  const response = await axios.post<{
    success: boolean;
    data: ScreenLoginResult;
    message: string;
  }>(`${API_BASE_URL}/client/auth/login`, { username, password });

  return response.data.data;
}

export async function getScreenSummary(token: string) {
  const response = await axios.get<{
    success: boolean;
    data: ScreenSummary;
    message: string;
  }>(`${API_BASE_URL}/client/screen/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.data;
}
