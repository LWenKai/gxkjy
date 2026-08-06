import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CertificateStatus,
  CertificateType,
  Company,
  CompanyStatus,
  Prisma,
} from '../../generated/prisma';
import { formatCsvDate, toCsv } from '../../common/csv';
import { getPagination } from '../../common/pagination.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { ClientUpdateCompanyDto } from './dto/client-update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';
import { RenewCompanyDto } from './dto/renew-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { serializeCompany } from './companies.serializer';
import { RequestWithAdmin } from '../auth/admin-auth.types';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async listCompanies(query: CompanyQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildCompanyWhere(query);

    const [total, companies] = await this.prisma.$transaction([
      this.prisma.company.count({ where }),
      this.prisma.company.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: companies.map(serializeCompany),
    };
  }

  async exportCompanies(query: CompanyQueryDto) {
    const companies = await this.prisma.company.findMany({
      where: this.buildCompanyWhere(query),
      orderBy: {
        createdAt: 'desc',
      },
    });

    return toCsv(
      [
        '企业名称',
        '联系人',
        '联系电话',
        '地址',
        '服务开始日期',
        '服务到期日期',
        '状态',
        '创建时间',
      ],
      companies.map((company) => [
        company.name,
        company.contactName,
        company.phone,
        company.address,
        formatCsvDate(company.serviceStartAt),
        formatCsvDate(company.serviceExpireAt),
        company.status === CompanyStatus.normal ? '正常' : '停用',
        formatCsvDate(company.createdAt),
      ]),
    );
  }

  async createCompany(dto: CreateCompanyDto, request: RequestWithAdmin) {
    const existingCompany = await this.findDuplicateCompany(
      dto.name,
      dto.contact_name,
      dto.phone,
    );
    if (existingCompany) {
      throw new ConflictException({
        message: `企业端已存在「${existingCompany.name}」，请直接进入已有企业维护`,
        code: 'COMPANY_ALREADY_EXISTS',
      });
    }

    const serviceStartAt = dto.service_start_at
      ? new Date(dto.service_start_at)
      : this.getChinaBusinessDateStart();
    const serviceExpireAt = dto.service_expire_at
      ? new Date(dto.service_expire_at)
      : this.addOneYear(serviceStartAt);

    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        contactName: dto.contact_name,
        phone: dto.phone,
        address: dto.address || null,
        originAddress: dto.origin_address || null,
        customerType: dto.customer_type || null,
        serviceNote: dto.service_note || null,
        followUpNote: dto.follow_up_note || null,
        defaultCertificateType:
          dto.default_certificate_type ||
          CertificateType.agri_commitment_certificate,
        clientModules: dto.client_modules || 'unit,detection,certificate',
        serviceStartAt,
        serviceExpireAt,
        status: dto.status || CompanyStatus.normal,
      },
    });

    await this.writeLog(request, company.id, 'company.create', dto);

    return serializeCompany(company);
  }

  async getCompany(id: bigint) {
    return serializeCompany(await this.findCompanyOrThrow(id));
  }

  async getCompanySummary(id: bigint) {
    const company = await this.findCompanyOrThrow(id);

    const [
      deviceCount,
      detectionRecordCount,
      certificateCount,
      normalCertificateCount,
      voidedCertificateCount,
      accountCount,
      lastLoginUser,
      lastDetectionRecord,
      lastCertificate,
      printLogCount,
    ] = await this.prisma.$transaction([
      this.prisma.device.count({ where: { companyId: id } }),
      this.prisma.detectionRecord.count({ where: { companyId: id } }),
      this.prisma.certificate.count({ where: { companyId: id } }),
      this.prisma.certificate.count({
        where: { companyId: id, status: CertificateStatus.normal },
      }),
      this.prisma.certificate.count({
        where: { companyId: id, status: CertificateStatus.voided },
      }),
      this.prisma.companyUser.count({ where: { companyId: id } }),
      this.prisma.companyUser.findFirst({
        where: { companyId: id, lastLoginAt: { not: null } },
        orderBy: { lastLoginAt: 'desc' },
        select: { lastLoginAt: true },
      }),
      this.prisma.detectionRecord.findFirst({
        where: { companyId: id },
        orderBy: { testTime: 'desc' },
        select: { testTime: true },
      }),
      this.prisma.certificate.findFirst({
        where: { companyId: id },
        orderBy: { issueTime: 'desc' },
        select: { issueTime: true },
      }),
      this.prisma.certificatePrintLog.count({
        where: { certificate: { companyId: id } },
      }),
    ]);
    const now = new Date();
    const expireDays = Math.ceil(
      (company.serviceExpireAt.getTime() - now.getTime()) /
        (24 * 60 * 60 * 1000),
    );
    const serviceStatus =
      company.status !== CompanyStatus.normal
        ? 'disabled'
        : expireDays < 0
          ? 'expired'
          : expireDays <= 30
            ? 'expiring_soon'
            : 'normal';

    return {
      device_count: deviceCount,
      detection_record_count: detectionRecordCount,
      certificate_count: certificateCount,
      normal_certificate_count: normalCertificateCount,
      voided_certificate_count: voidedCertificateCount,
      account_count: accountCount,
      print_log_count: printLogCount,
      last_login_at: lastLoginUser?.lastLoginAt || null,
      last_detection_at: lastDetectionRecord?.testTime || null,
      last_certificate_at: lastCertificate?.issueTime || null,
      service_status: serviceStatus,
      expire_days: expireDays,
      has_bound_device: deviceCount > 0,
    };
  }

  async updateCompany(
    id: bigint,
    dto: UpdateCompanyDto,
    request: RequestWithAdmin,
  ) {
    await this.findCompanyOrThrow(id);

    const data: Prisma.CompanyUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.contact_name !== undefined) data.contactName = dto.contact_name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.address !== undefined) data.address = dto.address || null;
    if (dto.origin_address !== undefined) {
      data.originAddress = dto.origin_address || null;
    }
    if (dto.customer_type !== undefined) {
      data.customerType = dto.customer_type || null;
    }
    if (dto.service_note !== undefined) data.serviceNote = dto.service_note || null;
    if (dto.follow_up_note !== undefined) {
      data.followUpNote = dto.follow_up_note || null;
    }
    if (dto.default_certificate_type !== undefined) {
      data.defaultCertificateType = dto.default_certificate_type;
    }
    if (dto.service_start_at !== undefined) {
      data.serviceStartAt = dto.service_start_at
        ? new Date(dto.service_start_at)
        : null;
    }
    if (dto.service_expire_at !== undefined) {
      data.serviceExpireAt = new Date(dto.service_expire_at);
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.client_modules !== undefined) {
      data.clientModules = dto.client_modules || 'unit,detection,certificate';
    }

    const company = await this.prisma.company.update({
      where: { id },
      data,
    });

    await this.writeLog(request, id, 'company.update', dto);

    return serializeCompany(company);
  }

  async updateClientModules(
    id: bigint,
    clientModules: string,
    request: RequestWithAdmin,
  ) {
    await this.findCompanyOrThrow(id);

    const modules = clientModules
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(',');

    const company = await this.prisma.company.update({
      where: { id },
      data: { clientModules: modules || 'unit,detection,certificate' },
    });

    await this.writeLog(request, id, 'company.update_client_modules', {
      client_modules: company.clientModules,
    });

    return serializeCompany(company);
  }

  async updateClientCompany(
    companyId: bigint,
    dto: ClientUpdateCompanyDto,
  ) {
    await this.findCompanyOrThrow(companyId);

    const data: Prisma.CompanyUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.contact_name !== undefined) data.contactName = dto.contact_name;
    if (dto.phone !== undefined && dto.phone) data.phone = dto.phone;
    if (dto.address !== undefined) data.address = dto.address || null;
    if (dto.origin_address !== undefined) {
      data.originAddress = dto.origin_address || null;
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data,
    });

    return serializeCompany(company);
  }

  async enableCompany(id: bigint, request: RequestWithAdmin) {
    return this.setCompanyStatus(id, CompanyStatus.normal, request);
  }

  async disableCompany(id: bigint, request: RequestWithAdmin) {
    return this.setCompanyStatus(id, CompanyStatus.disabled, request);
  }

  async renewCompany(
    id: bigint,
    dto: RenewCompanyDto,
    request: RequestWithAdmin,
  ) {
    await this.findCompanyOrThrow(id);

    const company = await this.prisma.company.update({
      where: { id },
      data: {
        serviceExpireAt: new Date(dto.service_expire_at),
      },
    });

    await this.writeLog(request, id, 'company.renew', dto);

    return serializeCompany(company);
  }

  private async setCompanyStatus(
    id: bigint,
    status: CompanyStatus,
    request: RequestWithAdmin,
  ) {
    await this.findCompanyOrThrow(id);

    const company = await this.prisma.company.update({
      where: { id },
      data: { status },
    });

    await this.writeLog(request, id, `company.${status}`, { status });

    return serializeCompany(company);
  }

  private async findCompanyOrThrow(id: bigint): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException({
        message: '企业不存在',
        code: 'COMPANY_NOT_FOUND',
      });
    }

    return company;
  }

  private buildCompanyWhere(query: CompanyQueryDto) {
    const where: Prisma.CompanyWhereInput = {};

    if (query.name) {
      where.name = {
        contains: query.name,
      };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.expire) {
      const now = new Date();
      if (query.expire === 'expired') {
        where.serviceExpireAt = { lt: now };
      } else {
        where.status = CompanyStatus.normal;
        where.serviceExpireAt = {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        };
      }
    }

    return where;
  }

  private async findDuplicateCompany(name: string, contactName: string, phone: string) {
    const normalizedName = name.trim();
    const normalizedContactName = contactName.trim();
    const normalizedPhone = phone.trim().replace(/\s+/g, '');

    return this.prisma.company.findFirst({
      where: {
        OR: [
          { name: normalizedName },
          { phone: normalizedPhone, contactName: normalizedContactName },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private getChinaBusinessDateStart() {
    const compact = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const year = Number(compact.find((part) => part.type === 'year')?.value);
    const month = Number(compact.find((part) => part.type === 'month')?.value);
    const day = Number(compact.find((part) => part.type === 'day')?.value);
    return new Date(Date.UTC(year, month - 1, day, -8, 0, 0, 0));
  }

  private addOneYear(date: Date) {
    const next = new Date(date);
    next.setFullYear(next.getFullYear() + 1);
    return next;
  }

  private async writeLog(
    request: RequestWithAdmin,
    companyId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'company',
      targetId: companyId,
      action,
      content,
      ip: request.ip,
    });
  }
}
