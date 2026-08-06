export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  code?: string;
}

export interface PageResult<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface AdminUser {
  id: string;
  username: string;
  real_name?: string | null;
  role?: 'super_admin' | 'admin';
  status: string;
  last_login_at?: string | null;
}

export interface LoginResult {
  access_token: string;
  admin_user: AdminUser;
}

export type ClientModuleKey = 'unit' | 'detection' | 'certificate';

export interface ClientCompany {
  id: string;
  name: string;
  contact_name?: string | null;
  phone?: string | null;
  address?: string | null;
  origin_address?: string | null;
  service_expire_at: string;
  default_certificate_type:
    | 'agri_commitment_certificate'
    | 'enterprise_quick_test_label';
  modules: ClientModuleKey[];
}

export interface ClientUser {
  id: string;
  company_id: string;
  username: string;
  real_name?: string | null;
  status: string;
  last_login_at?: string | null;
}

export interface ClientLoginResult {
  access_token: string;
  company_user: ClientUser;
  company: ClientCompany;
  expire_warning?: {
    days_left: number;
    service_expire_at: string;
  } | null;
}

export interface ClientDashboardSummary {
  company: ClientCompany | null;
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
  };
  recent_detection_records: DetectionRecord[];
  recent_certificates: Certificate[];
}

export interface ClientCompanyProfileAsset {
  id: string;
  file_type: string;
  file_name: string;
  file_url: string;
  is_public: boolean;
  sort_order: number;
}

export interface ClientCompanyProfile {
  intro: string;
  main_products: string;
  display_address: string;
  display_phone: string;
  qualification_description: string;
  is_public_enabled: boolean;
  assets: ClientCompanyProfileAsset[];
}

export interface ClientChangePasswordResult {
  updated: boolean;
}

export type CustomerType =
  | 'DELIVERY_COMPANY'
  | 'FOOD_PROCESSING'
  | 'COOPERATIVE'
  | 'FARM_BASE'
  | 'CANTEEN'
  | 'MARKET'
  | 'GOVERNMENT'
  | 'OTHER';

export type CustomerSource =
  | 'DOUYIN'
  | 'WECHAT'
  | 'OLD_CUSTOMER'
  | 'GOVERNMENT_RELATION'
  | 'SUPPLIER_REFERRAL'
  | 'ACTIVE_DEVELOP'
  | 'OTHER';

export type CustomerStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'NEED_CONFIRMED'
  | 'QUOTED'
  | 'NEGOTIATING'
  | 'WON'
  | 'FOLLOW_UP'
  | 'LOST';

export type CustomerValueLevel = 'PROJECT' | 'REPEAT' | 'NORMAL' | 'UNKNOWN';
export type CustomerNeedType =
  | 'EQUIPMENT'
  | 'LAB_BUILD'
  | 'CONSUMABLE'
  | 'CERTIFICATE'
  | 'REPAIR';
export type CustomerFollowType = 'PHONE' | 'WECHAT' | 'VISIT' | 'OTHER';
export type CustomerQuoteStatus = 'WAITING' | 'FOLLOWING' | 'SUCCESS' | 'FAILED';
export type SalesProductCategory =
  | 'DETECTION_EQUIPMENT'
  | 'ENZYME_REAGENT'
  | 'COLLOIDAL_GOLD_CARD'
  | 'LAB_CONSUMABLE'
  | 'CERTIFICATE_PRINTER'
  | 'PRINTING_CONSUMABLE'
  | 'DATA_TERMINAL'
  | 'SOFTWARE'
  | 'SERVICE'
  | 'OTHER';
export type PurchasePaymentStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_PAID' | 'REFUNDED';
export type PurchaseDeliveryStatus =
  | 'PENDING'
  | 'PURCHASING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';
export type RepurchaseStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'REPURCHASED'
  | 'NO_NEED'
  | 'CANCELLED';

export type SalesQuoteStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'SENT'
  | 'CONFIRMING'
  | 'ACCEPTED'
  | 'LOST'
  | 'EXPIRED'
  | 'SUPERSEDED';

export interface Customer {
  id: string;
  customer_no: string;
  company_name: string;
  contact_name?: string | null;
  phone?: string | null;
  wechat?: string | null;
  province?: string | null;
  city?: string | null;
  address?: string | null;
  customer_type: CustomerType;
  source: CustomerSource;
  status: CustomerStatus;
  value_level: CustomerValueLevel;
  remark?: string | null;
  latest_follow_time?: string | null;
  last_purchase_product?: string | null;
  last_purchase_date?: string | null;
  next_repurchase_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerNeed {
  id: string;
  customer_id: string;
  need_type: CustomerNeedType;
  product_category?: string | null;
  test_project?: string | null;
  remark?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerDeviceRecord {
  id: string;
  customer_id: string;
  manufacturer?: string | null;
  model?: string | null;
  device_count: number;
  purchase_date?: string | null;
  image_url?: string | null;
  remark?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFollowRecord {
  id: string;
  customer_id: string;
  follow_time: string;
  follow_type: CustomerFollowType;
  content: string;
  next_follow_date?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerQuote {
  id: string;
  customer_id: string;
  product_name: string;
  amount?: string | null;
  quote_date: string;
  status: CustomerQuoteStatus;
  remark?: string | null;
  attachments?: CustomerQuoteAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CustomerQuoteAttachment {
  id: string;
  quote_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  file_extension: string;
  file_size: string;
  created_at: string;
}

export interface SalesProduct {
  id: string;
  product_no: string;
  name: string;
  category: SalesProductCategory;
  brand?: string | null;
  model?: string | null;
  sales_model?: string | null;
  specification?: string | null;
  unit: string;
  default_sale_price?: string | null;
  reference_cost_price?: string | null;
  default_cycle_days?: number | null;
  repeat_reminder_enabled?: boolean;
  reference_cycle_days?: number | null;
  default_reminder_days_before?: number | null;
  image_url?: string | null;
  description?: string | null;
  remark?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SalesProductPackageType = 'BASIC' | 'UPGRADE' | 'PREMIUM' | 'CUSTOM';

export interface SalesProductPackageItem {
  id: string;
  package_id: string;
  sales_product_id?: string | null;
  product_name: string;
  brand?: string | null;
  model?: string | null;
  specification?: string | null;
  unit?: string | null;
  quantity: string;
  unit_price: string;
  subtotal: string;
  item_remark?: string | null;
  sort_order?: number;
  sales_product?: {
    id: string;
    product_no: string;
    name: string;
    sales_model?: string | null;
    default_sale_price?: string | null;
    repeat_reminder_enabled?: boolean;
    reference_cycle_days?: number | null;
    default_reminder_days_before?: number | null;
  } | null;
}

export interface SalesProductPackage {
  id: string;
  package_no: string;
  name: string;
  type: SalesProductPackageType;
  description?: string | null;
  is_active: boolean;
  sort_order: number;
  remark?: string | null;
  item_count: number;
  total_amount: string;
  items: SalesProductPackageItem[];
  created_at: string;
  updated_at: string;
}

export interface CustomerPurchaseItem {
  id: string;
  purchase_order_id: string;
  sales_product_id?: string | null;
  product_name: string;
  brand?: string | null;
  model?: string | null;
  specification?: string | null;
  unit?: string | null;
  quantity: string;
  unit_price: string;
  subtotal: string;
  expected_cycle_days?: number | null;
  repeat_reminder_enabled?: boolean;
  actual_cycle_days?: number | null;
  reminder_days_before?: number | null;
  next_repurchase_date?: string | null;
  repurchase_status: RepurchaseStatus;
  remark?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerPurchaseOrder {
  id: string;
  order_no: string;
  customer_id: string;
  sales_quote_id?: string | null;
  quote_no_snapshot?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  purchase_date: string;
  deal_date?: string | null;
  total_amount: string;
  payment_status: PurchasePaymentStatus;
  delivery_status: PurchaseDeliveryStatus;
  expected_delivery_date?: string | null;
  actual_delivery_date?: string | null;
  express_company?: string | null;
  tracking_no?: string | null;
  invoice_issued?: boolean;
  invoice_type?: string | null;
  remark?: string | null;
  item_count: number;
  nearest_repurchase_date?: string | null;
  items: CustomerPurchaseItem[];
  created_at: string;
  updated_at: string;
}

export interface CustomerPurchase {
  id: string;
  customer_id: string;
  product_name: string;
  quantity?: string | null;
  amount?: string | null;
  purchase_date: string;
  expected_cycle_days?: number | null;
  next_repurchase_date?: string | null;
  remark?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerDetail extends Customer {
  needs: CustomerNeed[];
  devices: CustomerDeviceRecord[];
  follow_records: CustomerFollowRecord[];
  quotes: CustomerQuote[];
  purchases: CustomerPurchase[];
  purchase_orders?: CustomerPurchaseOrder[];
  sales_quotes?: SalesQuote[];
  repurchase_reminders: Array<CustomerPurchase | CustomerPurchaseItem>;
}

export interface CustomerRepurchaseReminder {
  id: string;
  customer_id: string;
  company_name: string;
  contact_name?: string | null;
  phone?: string | null;
  product_name: string;
  quantity?: string | null;
  amount?: string | null;
  unit_price?: string | null;
  subtotal?: string | null;
  order_id?: string;
  order_no?: string;
  purchase_date: string;
  next_repurchase_date?: string | null;
  expected_cycle_days?: number | null;
  repurchase_status?: RepurchaseStatus;
  remark?: string | null;
}

export interface SalesQuoteItem {
  id: string;
  sales_quote_id?: string;
  sales_product_id?: string | null;
  source_package_id?: string | null;
  source_package_name?: string | null;
  product_name: string;
  brand?: string | null;
  model?: string | null;
  specification?: string | null;
  unit?: string | null;
  quantity: string;
  unit_price: string;
  subtotal: string;
  item_remark?: string | null;
  sort_order?: number;
  sales_product?: {
    id: string;
    product_no: string;
    name: string;
    sales_model?: string | null;
    repeat_reminder_enabled?: boolean;
    reference_cycle_days?: number | null;
    default_reminder_days_before?: number | null;
  } | null;
}

export interface SalesQuote {
  id: string;
  quote_no: string;
  quote_series_no: string;
  version_no: number;
  customer_id: string;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  source_quote_id?: string | null;
  source_order_item_id?: string | null;
  quote_date: string;
  valid_until?: string | null;
  status: SalesQuoteStatus;
  is_tax_included: boolean;
  invoice_note?: string | null;
  shipping_note?: string | null;
  delivery_note?: string | null;
  payment_note?: string | null;
  after_sales_note?: string | null;
  remark?: string | null;
  total_amount: string;
  total_amount_cn?: string | null;
  has_pdf: boolean;
  has_excel: boolean;
  item_count: number;
  converted_order_count?: number;
  items: SalesQuoteItem[];
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  contact_name: string;
  phone: string;
  address?: string | null;
  origin_address?: string | null;
  customer_type?: string | null;
  service_note?: string | null;
  follow_up_note?: string | null;
  status: 'normal' | 'disabled';
  service_start_at?: string | null;
  service_expire_at: string;
  default_certificate_type:
    | 'agri_commitment_certificate'
    | 'enterprise_quick_test_label';
  client_modules?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  username: string;
  real_name?: string | null;
  status: 'normal' | 'disabled';
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyUserWithInitialPassword extends CompanyUser {
  initial_password?: string;
}

export interface CompanySummary {
  device_count: number;
  detection_record_count: number;
  certificate_count: number;
  normal_certificate_count: number;
  voided_certificate_count: number;
  account_count?: number;
  print_log_count?: number;
  last_login_at?: string | null;
  last_detection_at?: string | null;
  last_certificate_at?: string | null;
  service_status?: 'normal' | 'expiring_soon' | 'expired' | 'disabled';
  expire_days?: number;
  has_bound_device?: boolean;
}

export type StatusValue = 'normal' | 'disabled';

export type IntegrationType = 'http_api' | 'mqtt' | 'tcp_socket';

export interface ManufacturerInterface {
  id: string;
  manufacturer_name: string;
  manufacturer_code: string;
  access_secret_masked?: string | null;
  access_secret_once?: string;
  integration_type: IntegrationType;
  status: StatusValue;
  sign_rule?: string | null;
  allowed_ips?: string | null;
  last_sync_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceCompanySummary {
  id: string;
  name: string;
  status: StatusValue;
}

export interface DeviceManufacturerSummary {
  id: string;
  manufacturer_name: string;
  manufacturer_code: string;
  status: StatusValue;
}

export interface Device {
  id: string;
  manufacturer_code: string;
  device_sn: string;
  device_name?: string | null;
  model?: string | null;
  company_id?: string | null;
  status: StatusValue;
  last_upload_at?: string | null;
  remark?: string | null;
  company?: DeviceCompanySummary | null;
  manufacturer?: DeviceManufacturerSummary;
  created_at: string;
  updated_at: string;
}

export type DetectionResultValue = 'qualified' | 'unqualified';
export type DetectionRecordStatusValue =
  | 'normal'
  | 'hidden'
  | 'voided'
  | 'marked_abnormal';

export interface DetectionRecordItem {
  id: string;
  test_item: string;
  test_method?: string | null;
  test_value: string;
  unit?: string | null;
  standard_limit?: string | null;
  result: DetectionResultValue;
}

export interface DetectionRecordCertificateSummary {
  id: string;
  certificate_no: string;
  status: CertificateStatusValue;
  issue_time: string;
  public_token?: string;
}

export interface DetectionRecord {
  id: string;
  record_no: string;
  company_id: string;
  company_name?: string | null;
  device_id: string;
  device_name?: string | null;
  manufacturer_code?: string;
  device_sn?: string;
  manufacturer_record_id?: string;
  sample_name?: string | null;
  product_name: string;
  overall_result: DetectionResultValue;
  status: DetectionRecordStatusValue;
  test_time: string;
  upload_time: string;
  item_count?: number;
  certificate_count?: number;
  raw_payload_json?: unknown;
  items?: DetectionRecordItem[];
  certificates?: DetectionRecordCertificateSummary[];
  created_at: string;
  updated_at: string;
}

export type CertificateStatusValue = 'normal' | 'voided';
export type CertificateTypeValue =
  | 'agri_commitment_certificate'
  | 'enterprise_quick_test_label';

export interface Certificate {
  id: string;
  company_id: string;
  company_name?: string | null;
  detection_record_id?: string | null;
  certificate_no: string;
  public_token?: string;
  certificate_type: CertificateTypeValue;
  title: string;
  product_name: string;
  quantity: string;
  unit: string;
  origin?: string | null;
  issuer_name: string;
  contact_phone: string;
  commitment_basis: string;
  commitment_basis_type?: 'quality_control' | 'self_test_qualified' | 'entrusted_test_qualified';
  commitment_statement?: string | null;
  print_copies?: number;
  evidence_visibility?: string;
  remark?: string | null;
  status: CertificateStatusValue;
  issue_time: string;
  void_time?: string | null;
  qr_url: string;
  created_at: string;
  updated_at: string;
  evidence_assets?: CompanyProfileAsset[];
  detection_record?: {
    id: string;
    record_no: string;
    product_name: string;
    sample_name?: string | null;
    overall_result: DetectionResultValue;
    status: DetectionRecordStatusValue;
    test_time: string;
    device_name?: string | null;
    manufacturer_code?: string;
    device_sn?: string;
    items: DetectionRecordItem[];
  } | null;
  issued_by_user?: {
    id: string;
    username: string;
    real_name?: string | null;
  } | null;
  print_logs?: Array<{
    id: string;
    printer_id?: string | null;
    print_client: string;
    adapter_type?: string | null;
    printer_name?: string | null;
    printer_model?: string | null;
    connection_type?: string | null;
    print_status: 'success' | 'failed';
    copies: number;
    operator_name?: string | null;
    error_message?: string | null;
    printed_at: string;
  }>;
}

export interface Printer {
  id: string;
  company_id?: string | null;
  company_name?: string | null;
  printer_name: string;
  printer_model: string;
  manufacturer?: string | null;
  connection_type: 'mock' | 'bluetooth' | 'usb' | 'wifi';
  serial_no?: string | null;
  mac_address?: string | null;
  status: 'inactive' | 'available' | 'connected' | 'disabled';
  last_connected_at?: string | null;
  print_log_count: number;
  remark?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  stats: {
    customer_total: number;
    customer_this_year: number;
    sales_order_this_year: number;
    sales_amount_this_year: string;
    sales_profit_estimate_this_year: string;
    repurchase_due_soon: number;
    company_total: number;
    company_enabled: number;
    company_expiring_soon: number;
    company_expired: number;
    device_total: number;
    device_bound: number;
    detection_record_total: number;
    detection_record_today: number;
    detection_record_abnormal: number;
    certificate_total: number;
    certificate_today: number;
  };
  recent_detection_records: DetectionRecord[];
  recent_certificates: Certificate[];
}

export interface MiniappPreviewRecordItem {
  test_item: string;
  test_method?: string | null;
  test_value: string;
  unit?: string | null;
  standard_limit?: string | null;
  result: DetectionResultValue;
}

export interface MiniappPreviewRecord {
  sample_name?: string | null;
  product_name: string;
  overall_result: DetectionResultValue;
  status: DetectionRecordStatusValue;
  test_time: string;
  item_count: number;
  can_issue: boolean;
  unavailable_reason?: string | null;
  items: MiniappPreviewRecordItem[];
}

export interface MiniappPreviewCertificate {
  certificate_no: string;
  certificate_type: CertificateTypeValue;
  certificate_title: string;
  product_name: string;
  quantity: string;
  unit: string;
  origin?: string | null;
  issuer_name: string;
  contact_phone: string;
  commitment_basis_type?: 'quality_control' | 'self_test_qualified' | 'entrusted_test_qualified';
  commitment_statement?: string | null;
  print_copies?: number;
  status: CertificateStatusValue;
  issue_time: string;
  void_time?: string | null;
  qr_url?: string | null;
  detection?: {
    product_name: string;
    sample_name?: string | null;
    overall_result: DetectionResultValue;
    status: DetectionRecordStatusValue;
    test_time: string;
    items: MiniappPreviewRecordItem[];
  } | null;
}

export interface MiniappPreviewData {
  mode: 'demo' | 'empty';
  message: string;
  company: null | {
    name: string;
    contact_name?: string | null;
    phone: string;
    address?: string | null;
    origin?: string | null;
    service_expire_at: string;
    service_status: 'normal' | 'expired';
    account_username: string;
  };
  summary: {
    detection_today: number;
    certifiable_count: number;
    certificate_today: number;
  };
  records: MiniappPreviewRecord[];
  certifiable_records: MiniappPreviewRecord[];
  certificates: MiniappPreviewCertificate[];
  selected_record: MiniappPreviewRecord | null;
  selected_certificate: MiniappPreviewCertificate | null;
}

export interface OperationLog {
  id: string;
  operator_type: string;
  operator_id?: string | null;
  target_type: string;
  target_id?: string | null;
  action: string;
  content?: string | null;
  ip?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManufacturerUploadLog {
  id: string;
  manufacturer_code: string;
  device_sn?: string | null;
  manufacturer_record_id?: string | null;
  result: string;
  error_reason?: string | null;
  company_name?: string | null;
  request_summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  platform_name: string;
  service_phone: string;
  support_text: string;
  public_footer_notice: string;
  certificate_public_notice: string;
  show_support_info: boolean;
  show_company_public_profile: boolean;
}

export interface Product {
  id: string;
  company_id: string;
  company_name?: string | null;
  product_name: string;
  product_category?: string | null;
  spec_model?: string | null;
  origin?: string | null;
  default_unit: string;
  remark?: string | null;
  status: StatusValue;
  created_at: string;
  updated_at: string;
}

export interface CompanyProfileAsset {
  id: string;
  company_id?: string | null;
  biz_type: string;
  file_type: string;
  file_name: string;
  file_url: string;
  mime_type?: string | null;
  file_size?: string | null;
  storage_driver?: string | null;
  is_public: boolean;
  sort_order: number;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyProfile {
  intro: string;
  main_products: string;
  display_address: string;
  display_phone: string;
  qualification_description: string;
  is_public_enabled: boolean;
  assets: CompanyProfileAsset[];
}

export interface WebsiteMaterial {
  id: string;
  title: string;
  category: string;
  description: string;
  file_name: string;
  file_type: string;
  file_url: string;
  mime_type?: string | null;
  file_size?: string | null;
  is_public: boolean;
  is_recommended: boolean;
  sort_order: number;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  home_title: string;
  home_subtitle: string;
  primary_button_text: string;
  secondary_button_text: string;
  contact_phone: string;
  wechat_tip: string;
  company_intro: string;
  show_materials: boolean;
  show_cloud_module: boolean;
}

export interface BigScreenRecentRecord {
  id: string;
  record_no: string;
  sample_name: string | null;
  product_name: string;
  overall_result: DetectionResultValue;
  test_time: string;
  device_name: string | null;
  certificate_count: number;
}

export interface BigScreenRecentCertificate {
  id: string;
  certificate_no: string;
  product_name: string;
  origin: string | null;
  issue_time: string;
  public_token: string;
}

export interface BigScreenAbnormalRecord {
  id: string;
  record_no: string;
  sample_name: string | null;
  product_name: string;
  test_time: string;
  device_name: string | null;
}

export interface BigScreenTrendPoint {
  date: string;
  total: number;
  pass: number;
}

export interface BigScreenCategory {
  name: string;
  count: number;
}

export interface BigScreenDevice {
  name: string;
  status: string;
  online: boolean;
  last_upload_at?: string | null;
}

export interface BigScreenData {
  total_count: number;
  pass_count: number;
  pass_rate: number | null;
  today_count: number;
  today_pass_count: number;
  today_pass_rate: number | null;
  certificate_count: number;
  device_count: number;
  online_device_count: number;
  trend: BigScreenTrendPoint[];
  categories: BigScreenCategory[];
  devices: BigScreenDevice[];
  recent_records: BigScreenRecentRecord[];
  recent_certificates: BigScreenRecentCertificate[];
  abnormal_records: BigScreenAbnormalRecord[];
}
