import { CertificateType, Prisma } from '../../generated/prisma';
import { toApiResult } from '../detection-records/detection-records.serializer';

export const certificateListInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.CertificateInclude;

export const certificateDetailInclude = {
  company: {
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      originAddress: true,
    },
  },
  detectionRecord: {
    include: {
      items: {
        orderBy: {
          id: 'asc',
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
    },
  },
  issuedByUser: {
    select: {
      id: true,
      username: true,
      realName: true,
    },
  },
  printLogs: {
    orderBy: {
      printedAt: 'desc',
    },
    take: 20,
  },
  evidenceAssets: {
    where: {
      deletedAt: null,
    },
    orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
  },
} satisfies Prisma.CertificateInclude;

export type CertificateListItem = Prisma.CertificateGetPayload<{
  include: typeof certificateListInclude;
}>;

export type CertificateDetail = Prisma.CertificateGetPayload<{
  include: typeof certificateDetailInclude;
}>;

export function getCertificateTitle(type: CertificateType) {
  if (type === CertificateType.agri_commitment_certificate) {
    return '承诺达标合格证';
  }

  return '企业快检合格标签';
}

export function serializeCertificate(certificate: CertificateListItem) {
  return {
    id: certificate.id.toString(),
    company_id: certificate.companyId.toString(),
    company_name: certificate.company?.name || null,
    detection_record_id: certificate.detectionRecordId?.toString() || null,
    certificate_no: certificate.certificateNo,
    public_token: certificate.publicToken,
    certificate_type: certificate.certificateType,
    title: getCertificateTitle(certificate.certificateType),
    product_name: certificate.productName,
    quantity: certificate.quantity.toString(),
    unit: certificate.unit,
    origin: certificate.origin,
    issuer_name: certificate.issuerName,
    contact_phone: certificate.contactPhone,
    commitment_basis: certificate.commitmentBasis,
    commitment_basis_type: certificate.commitmentBasisType,
    commitment_statement: certificate.commitmentStatement,
    print_copies: certificate.printCopies,
    evidence_visibility: certificate.evidenceVisibility,
    remark: certificate.remark,
    status: certificate.status,
    issue_time: certificate.issueTime,
    void_time: certificate.voidTime,
    qr_url: certificate.qrUrl,
    created_at: certificate.createdAt,
    updated_at: certificate.updatedAt,
  };
}

export function serializeCertificateDetail(certificate: CertificateDetail) {
  return {
    ...serializeCertificate(certificate),
    detection_record: certificate.detectionRecord
      ? {
          id: certificate.detectionRecord.id.toString(),
          record_no: certificate.detectionRecord.recordNo,
          product_name: certificate.detectionRecord.productName,
          sample_name: certificate.detectionRecord.sampleName,
          overall_result: toApiResult(certificate.detectionRecord.overallResult),
          status: certificate.detectionRecord.status,
          test_time: certificate.detectionRecord.testTime,
          manufacturer_code: certificate.detectionRecord.manufacturerCode,
          device_sn: certificate.detectionRecord.deviceSn,
          device_name: certificate.detectionRecord.device?.deviceName || null,
          items: certificate.detectionRecord.items.map((item) => ({
            id: item.id.toString(),
            test_item: item.testItem,
            test_method: item.testMethod,
            test_value: item.testValue,
            unit: item.unit,
            standard_limit: item.standardLimit,
            result: toApiResult(item.result),
          })),
        }
      : null,
    evidence_assets: certificate.evidenceAssets.map((asset) => ({
      id: asset.id.toString(),
      file_name: asset.fileName,
      file_type: asset.fileType,
      file_url: asset.fileUrl,
      mime_type: asset.mimeType,
      file_size: asset.fileSize?.toString() || null,
      is_public: asset.isPublic,
      uploaded_at: asset.uploadedAt,
    })),
    issued_by_user: certificate.issuedByUser
      ? {
          id: certificate.issuedByUser.id.toString(),
          username: certificate.issuedByUser.username,
          real_name: certificate.issuedByUser.realName,
        }
      : null,
    print_logs: certificate.printLogs.map((log) => ({
      id: log.id.toString(),
      printer_id: log.printerId?.toString() || null,
      print_client: log.printClient,
      adapter_type: log.adapterType,
      printer_name: log.printerName,
      printer_model: log.printerModel,
      connection_type: log.connectionType,
      print_status: log.printStatus,
      copies: log.copies,
      operator_name: log.operatorName,
      error_message: log.errorMessage,
      printed_at: log.printedAt,
    })),
  };
}
