import { Injectable } from '@nestjs/common';
import { CertificateStatus, DetectionRecordStatus, DetectionResult } from '../../generated/prisma';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { serializeCertificate } from '../certificates/certificates.serializer';
import {
  detectionRecordListInclude,
  serializeDetectionRecord,
} from '../detection-records/detection-records.serializer';
import { serializeCompany } from '../companies/companies.serializer';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientDashboardService {
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
        defaultCertificateType: true,
      },
    });

    const [
      todayDetectionCount,
      certifiableCount,
      todayCertificateCount,
      recentDetectionRecords,
      recentCertificates,
    ] = await this.prisma.$transaction([
      this.prisma.detectionRecord.count({
        where: {
          companyId,
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
        where: { companyId },
        include: detectionRecordListInclude,
        orderBy: { testTime: 'desc' },
        take: 5,
      }),
      this.prisma.certificate.findMany({
        where: { companyId },
        include: {
          company: {
            select: { id: true, name: true },
          },
        },
        orderBy: { issueTime: 'desc' },
        take: 5,
      }),
    ]);

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
            default_certificate_type: company.defaultCertificateType,
          }
        : null,
      service: {
        status: 'normal',
        expire_at: company?.serviceExpireAt || null,
        expire_warning:
          daysLeft !== null && daysLeft <= 30
            ? {
                days_left: daysLeft,
                service_expire_at: company!.serviceExpireAt,
              }
            : null,
      },
      stats: {
        today_detection_count: todayDetectionCount,
        certifiable_count: certifiableCount,
        today_certificate_count: todayCertificateCount,
      },
      recent_detection_records: recentDetectionRecords.map(serializeDetectionRecord),
      recent_certificates: recentCertificates.map((certificate) => {
        const item = serializeCertificate(certificate);
        delete (item as { public_token?: string }).public_token;
        return item;
      }),
    };
  }

  async getCompany(request: RequestWithClientUser) {
    const company = await this.prisma.company.findUnique({
      where: { id: request.clientUser!.companyId },
    });
    if (!company) {
      throw new Error('企业不存在');
    }
    return serializeCompany(company);
  }
}
