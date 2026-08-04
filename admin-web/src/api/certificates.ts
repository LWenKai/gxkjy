import { downloadCsv, request } from './request';
import type { Certificate, CertificateStatusValue, PageResult } from '@/types/api';

export interface CertificateQuery {
  page: number;
  page_size: number;
  company_id?: string;
  product_name?: string;
  status?: CertificateStatusValue | '';
  date_from?: string;
  date_to?: string;
}

export function listCertificates(params: CertificateQuery) {
  return request<PageResult<Certificate>>({
    url: '/admin/certificates',
    method: 'GET',
    params,
  });
}

export function exportCertificates(
  params: Omit<CertificateQuery, 'page' | 'page_size'>,
) {
  return downloadCsv(
    {
      url: '/admin/certificates/export',
      method: 'GET',
      params,
    },
    '合格证导出.csv',
  );
}

export function getCertificate(id: string) {
  return request<Certificate>({
    url: `/admin/certificates/${id}`,
    method: 'GET',
  });
}
