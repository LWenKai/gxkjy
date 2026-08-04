import type {
  ApiResult,
  CertificateStatus,
  CertificateType,
  CommitmentBasisType,
  DetectionRecord,
  RecordStatus,
} from '@/api/client';

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDate(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayText() {
  return formatDate(new Date());
}

export function resultText(result?: ApiResult | string | null) {
  if (result === 'qualified' || result === 'pass') return '合格';
  if (result === 'unqualified' || result === 'fail') return '不合格';
  return '未知';
}

export function resultClass(result?: ApiResult | string | null) {
  return result === 'qualified' || result === 'pass' ? 'success' : 'danger';
}

export function recordStatusText(status?: RecordStatus | string | null) {
  const labels: Record<string, string> = {
    normal: '正常',
    marked_abnormal: '异常',
    hidden: '已隐藏',
    voided: '已作废',
  };
  return labels[status || ''] || '未知';
}

export function certificateStatusText(status?: CertificateStatus | string | null) {
  const labels: Record<string, string> = {
    normal: '有效',
    voided: '已作废',
  };
  return labels[status || ''] || '未知';
}

export function certificateTypeText(type?: CertificateType | string | null) {
  const labels: Record<string, string> = {
    agri_commitment_certificate: '承诺达标合格证',
    enterprise_quick_test_label: '企业快检合格标签',
  };
  return labels[type || ''] || '合格证';
}

export function commitmentBasisText(type?: CommitmentBasisType | string | null) {
  const labels: Record<string, string> = {
    self_test_qualified: '自行检测合格',
    quality_control: '质量安全控制符合要求',
    entrusted_test_qualified: '委托检测合格',
  };
  return labels[type || ''] || '自行检测合格';
}

export function canIssue(record?: DetectionRecord | null) {
  return Boolean(
    record &&
      record.overall_result === 'qualified' &&
      record.status === 'normal',
  );
}

export function recordIssueBlockReason(record?: DetectionRecord | null) {
  if (!record) return '请选择检测记录';
  if (record.overall_result !== 'qualified') return '检测结果不合格，不能开证';
  if (record.status === 'voided') return '记录已作废，不能开证';
  if (record.status === 'hidden') return '记录已隐藏，不能开证';
  if (record.status === 'marked_abnormal') return '记录已标记异常，不能开证';
  return '';
}
