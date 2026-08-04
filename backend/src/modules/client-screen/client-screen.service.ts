import { Injectable } from '@nestjs/common';
import {
  CertificateStatus,
  DetectionRecordStatus,
  DetectionResult,
  PrinterRuntimeStatus,
} from '../../generated/prisma';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientScreenService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(request: RequestWithClientUser) {
    const companyId = request.clientUser!.companyId;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        contactName: true,
        phone: true,
        address: true,
        originAddress: true,
        serviceExpireAt: true,
      },
    });

    const [
      todayTotal,
      todayQualified,
      todayUnqualified,
      certifiableCount,
      todayCertificateCount,
      hourlyRecords,
      recentRecords,
      recentCertificates,
      latestPrinter,
      profile,
      printLogCount,
    ] = await this.prisma.$transaction([
      this.prisma.detectionRecord.count({
        where: { companyId, testTime: { gte: todayStart, lt: tomorrowStart } },
      }),
      this.prisma.detectionRecord.count({
        where: {
          companyId,
          overallResult: DetectionResult.pass,
          testTime: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.detectionRecord.count({
        where: {
          companyId,
          overallResult: DetectionResult.fail,
          testTime: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.detectionRecord.count({
        where: {
          companyId,
          overallResult: DetectionResult.pass,
          status: DetectionRecordStatus.normal,
        },
      }),
      this.prisma.certificate.count({
        where: {
          companyId,
          status: CertificateStatus.normal,
          issueTime: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.detectionRecord.findMany({
        where: { companyId, testTime: { gte: todayStart, lt: tomorrowStart } },
        select: { testTime: true, overallResult: true },
        orderBy: { testTime: 'asc' },
      }),
      this.prisma.detectionRecord.findMany({
        where: { companyId },
        select: {
          id: true,
          recordNo: true,
          sampleName: true,
          productName: true,
          overallResult: true,
          status: true,
          testTime: true,
          _count: { select: { items: true, certificates: true } },
        },
        orderBy: { testTime: 'desc' },
        take: 12,
      }),
      this.prisma.certificate.findMany({
        where: { companyId },
        select: {
          id: true,
          certificateNo: true,
          productName: true,
          quantity: true,
          unit: true,
          status: true,
          issueTime: true,
        },
        orderBy: { issueTime: 'desc' },
        take: 8,
      }),
      this.prisma.printer.findFirst({
        where: { companyId },
        select: {
          printerName: true,
          printerModel: true,
          connectionType: true,
          status: true,
          lastConnectedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.companyProfile.findUnique({
        where: { companyId },
        select: {
          intro: true,
          mainProducts: true,
          displayAddress: true,
          displayPhone: true,
          isPublicEnabled: true,
        },
      }),
      this.prisma.certificatePrintLog.count({
        where: { certificate: { companyId } },
      }),
    ]);

    const hourlyDetection = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      total: 0,
      qualified: 0,
      unqualified: 0,
    }));

    for (const record of hourlyRecords) {
      const hour = record.testTime.getHours();
      hourlyDetection[hour].total += 1;
      if (record.overallResult === DetectionResult.pass) {
        hourlyDetection[hour].qualified += 1;
      } else {
        hourlyDetection[hour].unqualified += 1;
      }
    }

    const qualifiedRate = todayTotal
      ? Number(((todayQualified / todayTotal) * 100).toFixed(1))
      : 0;
    const daysLeft = company
      ? Math.ceil(
          (company.serviceExpireAt.getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000),
        )
      : null;

    return {
      company: company
        ? {
            id: company.id.toString(),
            name: company.name,
            contact_name: company.contactName,
            phone: company.phone,
            address: company.address,
            origin_address: company.originAddress,
            service_expire_at: company.serviceExpireAt,
          }
        : null,
      stats: {
        today_detection_count: todayTotal,
        today_qualified_count: todayQualified,
        today_unqualified_count: todayUnqualified,
        today_qualified_rate: qualifiedRate,
        today_certificate_count: todayCertificateCount,
        certifiable_count: certifiableCount,
      },
      hourly_detection: hourlyDetection,
      result_distribution: {
        qualified: todayQualified,
        unqualified: todayUnqualified,
      },
      recent_records: recentRecords.map((record) => ({
        id: record.id.toString(),
        record_no: record.recordNo,
        product_name: record.productName,
        sample_name: record.sampleName,
        overall_result:
          record.overallResult === DetectionResult.pass
            ? 'qualified'
            : 'unqualified',
        status: record.status,
        test_time: record.testTime,
        item_count: record._count.items,
        certificate_count: record._count.certificates,
      })),
      recent_certificates: recentCertificates.map((certificate) => ({
        id: certificate.id.toString(),
        certificate_no: certificate.certificateNo,
        product_name: certificate.productName,
        quantity: certificate.quantity.toString(),
        unit: certificate.unit,
        status: certificate.status,
        issue_time: certificate.issueTime,
      })),
      printer: latestPrinter
        ? {
            printer_name: latestPrinter.printerName,
            printer_model: latestPrinter.printerModel,
            connection_type: latestPrinter.connectionType,
            status: latestPrinter.status,
            last_connected_at: latestPrinter.lastConnectedAt,
            print_log_count: printLogCount,
          }
        : {
            printer_name: null,
            printer_model: null,
            connection_type: null,
            status: PrinterRuntimeStatus.inactive,
            last_connected_at: null,
            print_log_count: printLogCount,
          },
      profile:
        profile && profile.isPublicEnabled
          ? {
              intro: profile.intro,
              main_products: profile.mainProducts,
              display_address: profile.displayAddress,
              display_phone: profile.displayPhone,
            }
          : null,
      service_warning:
        daysLeft !== null && daysLeft <= 30
          ? {
              days_left: daysLeft,
              service_expire_at: company!.serviceExpireAt,
            }
          : null,
      updated_at: new Date(),
    };
  }
}
