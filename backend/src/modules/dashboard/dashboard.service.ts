import { Injectable } from '@nestjs/common';
import {
  CertificateStatus,
  CompanyStatus,
  DetectionRecordStatus,
  DetectionResult,
  RepurchaseStatus,
} from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { serializeCertificate } from '../certificates/certificates.serializer';
import {
  detectionRecordListInclude,
  serializeDetectionRecord,
} from '../detection-records/detection-records.serializer';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const repurchaseSoon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      customerTotal,
      customerThisYear,
      salesOrderThisYear,
      salesOrdersThisYear,
      repurchaseDueSoon,
      companyTotal,
      companyEnabled,
      companyExpiringSoon,
      companyExpired,
      deviceTotal,
      deviceBound,
      detectionTotal,
      detectionToday,
      detectionAbnormal,
      certificateTotal,
      certificateToday,
      recentDetectionRecords,
      recentCertificates,
    ] = await this.prisma.$transaction([
      this.prisma.customer.count({ where: { deletedAt: null } }),
      this.prisma.customer.count({
        where: {
          deletedAt: null,
          createdAt: { gte: yearStart },
        },
      }),
      this.prisma.customerPurchaseOrder.count({
        where: {
          deletedAt: null,
          purchaseDate: { gte: yearStart },
        },
      }),
      this.prisma.customerPurchaseOrder.findMany({
        where: {
          deletedAt: null,
          purchaseDate: { gte: yearStart },
        },
        include: {
          items: {
            include: {
              salesProduct: {
                select: {
                  referenceCostPrice: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.customerPurchaseItem.count({
        where: {
          repurchaseStatus: RepurchaseStatus.PENDING,
          repeatReminderEnabled: true,
          nextRepurchaseDate: { lte: repurchaseSoon },
          purchaseOrder: { deletedAt: null },
        },
      }),
      this.prisma.company.count(),
      this.prisma.company.count({ where: { status: CompanyStatus.normal } }),
      this.prisma.company.count({
        where: {
          status: CompanyStatus.normal,
          serviceExpireAt: { gte: now, lte: soon },
        },
      }),
      this.prisma.company.count({
        where: {
          serviceExpireAt: { lt: now },
        },
      }),
      this.prisma.device.count(),
      this.prisma.device.count({ where: { companyId: { not: null } } }),
      this.prisma.detectionRecord.count(),
      this.prisma.detectionRecord.count({
        where: {
          testTime: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.detectionRecord.count({
        where: {
          OR: [
            { overallResult: DetectionResult.fail },
            { status: DetectionRecordStatus.marked_abnormal },
          ],
        },
      }),
      this.prisma.certificate.count(),
      this.prisma.certificate.count({
        where: {
          status: CertificateStatus.normal,
          issueTime: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.detectionRecord.findMany({
        include: detectionRecordListInclude,
        orderBy: { testTime: 'desc' },
        take: 10,
      }),
      this.prisma.certificate.findMany({
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { issueTime: 'desc' },
        take: 10,
      }),
    ]);

    return {
      stats: {
        customer_total: customerTotal,
        customer_this_year: customerThisYear,
        sales_order_this_year: salesOrderThisYear,
        sales_amount_this_year: salesOrdersThisYear
          .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
          .toFixed(2),
        sales_profit_estimate_this_year: salesOrdersThisYear
          .reduce((sum, order) => {
            return (
              sum +
              order.items.reduce((itemSum, item) => {
                const cost = Number(item.salesProduct?.referenceCostPrice || 0);
                if (!cost) return itemSum;
                return itemSum + (Number(item.unitPrice || 0) - cost) * Number(item.quantity || 0);
              }, 0)
            );
          }, 0)
          .toFixed(2),
        repurchase_due_soon: repurchaseDueSoon,
        company_total: companyTotal,
        company_enabled: companyEnabled,
        company_expiring_soon: companyExpiringSoon,
        company_expired: companyExpired,
        device_total: deviceTotal,
        device_bound: deviceBound,
        detection_record_total: detectionTotal,
        detection_record_today: detectionToday,
        detection_record_abnormal: detectionAbnormal,
        certificate_total: certificateTotal,
        certificate_today: certificateToday,
      },
      recent_detection_records: recentDetectionRecords.map(serializeDetectionRecord),
      recent_certificates: recentCertificates.map(serializeCertificate),
    };
  }
}
