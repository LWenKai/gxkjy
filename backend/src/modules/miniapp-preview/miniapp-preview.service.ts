import { Injectable } from '@nestjs/common';
import {
  CertificateStatus,
  CertificateType,
  DetectionRecordStatus,
  DetectionResult,
  Prisma,
} from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { getCertificateTitle } from '../certificates/certificates.serializer';
import { toApiResult } from '../detection-records/detection-records.serializer';

@Injectable()
export class MiniappPreviewService {
  constructor(private readonly prisma: PrismaService) {}

  async getDemoPreview() {
    const demoUser = await this.prisma.companyUser.findUnique({
      where: { username: 'demo' },
      include: {
        company: true,
      },
    });

    if (!demoUser?.company) {
      return {
        mode: 'empty',
        message: '未找到 demo 企业账号，请先准备演示企业和客户账号。',
        company: null,
        summary: this.emptySummary(),
        records: [],
        certifiable_records: [],
        certificates: [],
        selected_record: null,
        selected_certificate: null,
      };
    }

    const company = demoUser.company;
    const now = new Date();
    const todayStart = this.getChinaTodayStart();
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const [
      detectionToday,
      certifiableCount,
      certificateToday,
      records,
      certifiableRecords,
      certificates,
    ] = await this.prisma.$transaction([
      this.prisma.detectionRecord.count({
        where: {
          companyId: company.id,
          testTime: { gte: todayStart, lt: todayEnd },
        },
      }),
      this.prisma.detectionRecord.count({
        where: {
          companyId: company.id,
          overallResult: DetectionResult.pass,
          status: DetectionRecordStatus.normal,
        },
      }),
      this.prisma.certificate.count({
        where: {
          companyId: company.id,
          issueTime: { gte: todayStart, lt: todayEnd },
        },
      }),
      this.prisma.detectionRecord.findMany({
        where: { companyId: company.id },
        orderBy: { testTime: 'desc' },
        take: 10,
        include: {
          items: { orderBy: { id: 'asc' } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.detectionRecord.findMany({
        where: {
          companyId: company.id,
          overallResult: DetectionResult.pass,
          status: DetectionRecordStatus.normal,
        },
        orderBy: { testTime: 'desc' },
        take: 6,
        include: {
          items: { orderBy: { id: 'asc' } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.certificate.findMany({
        where: { companyId: company.id },
        orderBy: { issueTime: 'desc' },
        take: 10,
        include: {
          detectionRecord: {
            include: {
              items: { orderBy: { id: 'asc' } },
            },
          },
        },
      }),
    ]);

    const selectedRecord =
      certifiableRecords[0] ||
      records.find((record) => record.status === DetectionRecordStatus.normal) ||
      records[0] ||
      null;
    const selectedCertificate =
      certificates.find((certificate) => certificate.status === CertificateStatus.normal) ||
      certificates[0] ||
      null;

    return {
      mode: 'demo',
      message: '使用 demo 企业真实演示数据，仅用于后台浏览器预览。',
      company: {
        name: company.name,
        contact_name: company.contactName,
        phone: company.phone,
        address: company.address,
        origin: company.originAddress || company.address,
        service_expire_at: company.serviceExpireAt,
        service_status:
          company.serviceExpireAt.getTime() < now.getTime()
            ? 'expired'
            : 'normal',
        account_username: demoUser.username,
      },
      summary: {
        detection_today: detectionToday,
        certifiable_count: certifiableCount,
        certificate_today: certificateToday,
      },
      records: records.map((record) => this.serializeRecord(record)),
      certifiable_records: certifiableRecords.map((record) =>
        this.serializeRecord(record),
      ),
      certificates: certificates.map((certificate) =>
        this.serializeCertificate(certificate),
      ),
      selected_record: selectedRecord ? this.serializeRecord(selectedRecord) : null,
      selected_certificate: selectedCertificate
        ? this.serializeCertificate(selectedCertificate)
        : null,
    };
  }

  private serializeRecord(record: {
    id: bigint;
    sampleName: string | null;
    productName: string;
    overallResult: DetectionResult;
    status: DetectionRecordStatus;
    testTime: Date;
    items: Array<{
      testItem: string;
      testMethod: string | null;
      testValue: string;
      unit: string | null;
      standardLimit: string | null;
      result: DetectionResult;
    }>;
    _count?: { items: number };
  }) {
    return {
      sample_name: record.sampleName,
      product_name: record.productName,
      overall_result: toApiResult(record.overallResult),
      status: record.status,
      test_time: record.testTime,
      item_count: record._count?.items || record.items.length,
      can_issue:
        record.overallResult === DetectionResult.pass &&
        record.status === DetectionRecordStatus.normal,
      unavailable_reason: this.getUnavailableReason(record),
      items: record.items.map((item) => ({
        test_item: item.testItem,
        test_method: item.testMethod,
        test_value: item.testValue,
        unit: item.unit,
        standard_limit: item.standardLimit,
        result: toApiResult(item.result),
      })),
    };
  }

  private serializeCertificate(certificate: {
    certificateNo: string;
    certificateType: CertificateType;
    productName: string;
    quantity: Prisma.Decimal;
    unit: string;
    origin: string | null;
    issuerName: string;
    contactPhone: string;
    status: CertificateStatus;
    issueTime: Date;
    voidTime: Date | null;
    qrUrl: string | null;
    detectionRecord: {
      productName: string;
      sampleName: string | null;
      overallResult: DetectionResult;
      status: DetectionRecordStatus;
      testTime: Date;
      items: Array<{
        testItem: string;
        testMethod: string | null;
        testValue: string;
        unit: string | null;
        standardLimit: string | null;
        result: DetectionResult;
      }>;
    } | null;
  }) {
    return {
      certificate_no: certificate.certificateNo,
      certificate_type: certificate.certificateType,
      certificate_title: getCertificateTitle(certificate.certificateType),
      product_name: certificate.productName,
      quantity: certificate.quantity.toString(),
      unit: certificate.unit,
      origin: certificate.origin,
      issuer_name: certificate.issuerName,
      contact_phone: certificate.contactPhone,
      status: certificate.status,
      issue_time: certificate.issueTime,
      void_time: certificate.voidTime,
      qr_url: certificate.qrUrl,
      detection: certificate.detectionRecord ? {
        product_name: certificate.detectionRecord.productName,
        sample_name: certificate.detectionRecord.sampleName,
        overall_result: toApiResult(certificate.detectionRecord.overallResult),
        status: certificate.detectionRecord.status,
        test_time: certificate.detectionRecord.testTime,
        items: certificate.detectionRecord.items.map((item) => ({
          test_item: item.testItem,
          test_method: item.testMethod,
          test_value: item.testValue,
          unit: item.unit,
          standard_limit: item.standardLimit,
          result: toApiResult(item.result),
        })),
      } : null,
    };
  }

  private getUnavailableReason(record: {
    overallResult: DetectionResult;
    status: DetectionRecordStatus;
  }) {
    if (record.status === DetectionRecordStatus.voided) {
      return '记录已作废，不能开证';
    }
    if (record.status === DetectionRecordStatus.hidden) {
      return '记录已隐藏，不能开证';
    }
    if (record.status === DetectionRecordStatus.marked_abnormal) {
      return '记录已标记异常，不能开证';
    }
    if (record.overallResult === DetectionResult.fail) {
      return '检测结果不合格，不能开证';
    }
    return '';
  }

  private getChinaTodayStart() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);
    return new Date(Date.UTC(year, month - 1, day, -8, 0, 0, 0));
  }

  private emptySummary() {
    return {
      detection_today: 0,
      certifiable_count: 0,
      certificate_today: 0,
    };
  }
}

