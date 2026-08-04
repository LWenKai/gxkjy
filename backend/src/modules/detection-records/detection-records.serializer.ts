import { DetectionRecordStatus, DetectionResult, Prisma } from '../../generated/prisma';

export const detectionRecordListInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  device: {
    select: {
      id: true,
      deviceSn: true,
      deviceName: true,
      manufacturerCode: true,
    },
  },
  _count: {
    select: {
      items: true,
      certificates: true,
    },
  },
} satisfies Prisma.DetectionRecordInclude;

export const detectionRecordDetailInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  device: {
    select: {
      id: true,
      deviceSn: true,
      deviceName: true,
      manufacturerCode: true,
    },
  },
  items: {
    orderBy: {
      id: 'asc',
    },
  },
  certificates: {
    select: {
      id: true,
      certificateNo: true,
      status: true,
      issueTime: true,
    },
    orderBy: {
      issueTime: 'desc',
    },
  },
} satisfies Prisma.DetectionRecordInclude;

export type DetectionRecordListItem = Prisma.DetectionRecordGetPayload<{
  include: typeof detectionRecordListInclude;
}>;

export type DetectionRecordDetail = Prisma.DetectionRecordGetPayload<{
  include: typeof detectionRecordDetailInclude;
}>;

export function toApiResult(result: DetectionResult) {
  return result === DetectionResult.pass ? 'qualified' : 'unqualified';
}

export function fromApiResult(result: 'qualified' | 'unqualified') {
  return result === 'qualified' ? DetectionResult.pass : DetectionResult.fail;
}

export function serializeDetectionRecord(record: DetectionRecordListItem) {
  return {
    id: record.id.toString(),
    record_no: record.recordNo,
    company_id: record.companyId.toString(),
    company_name: record.company?.name || null,
    device_id: record.deviceId.toString(),
    device_name: record.device?.deviceName || null,
    manufacturer_code: record.manufacturerCode,
    device_sn: record.deviceSn,
    manufacturer_record_id: record.manufacturerRecordId,
    sample_name: record.sampleName,
    product_name: record.productName,
    overall_result: toApiResult(record.overallResult),
    status: record.status,
    test_time: record.testTime,
    upload_time: record.uploadTime,
    item_count: record._count?.items || 0,
    certificate_count: record._count?.certificates || 0,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function serializeDetectionRecordDetail(record: DetectionRecordDetail) {
  return {
    id: record.id.toString(),
    record_no: record.recordNo,
    company_id: record.companyId.toString(),
    company_name: record.company?.name || null,
    device_id: record.deviceId.toString(),
    device_name: record.device?.deviceName || null,
    manufacturer_code: record.manufacturerCode,
    device_sn: record.deviceSn,
    manufacturer_record_id: record.manufacturerRecordId,
    sample_name: record.sampleName,
    product_name: record.productName,
    overall_result: toApiResult(record.overallResult),
    status: record.status,
    test_time: record.testTime,
    upload_time: record.uploadTime,
    raw_payload_json: record.rawPayloadJson,
    items: record.items.map((item) => ({
      id: item.id.toString(),
      test_item: item.testItem,
      test_method: item.testMethod,
      test_value: item.testValue,
      unit: item.unit,
      standard_limit: item.standardLimit,
      result: toApiResult(item.result),
    })),
    certificates: record.certificates.map((certificate) => ({
      id: certificate.id.toString(),
      certificate_no: certificate.certificateNo,
      status: certificate.status,
      issue_time: certificate.issueTime,
    })),
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export function isOpenForCertificate(status: DetectionRecordStatus) {
  return status === DetectionRecordStatus.normal;
}
