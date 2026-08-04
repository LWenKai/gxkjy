export type CertificateType =
  | 'agri_commitment_certificate'
  | 'enterprise_quick_test_label';

export type DetectionResult = 'pass' | 'fail';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
