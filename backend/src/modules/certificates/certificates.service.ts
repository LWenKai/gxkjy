import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import {
  CertificateStatus,
  CertificateType,
  DetectionRecordStatus,
  DetectionResult,
  Prisma,
  PrintClient,
  PrintStatus,
} from '../../generated/prisma';
import { formatCsvDate, toCsv } from '../../common/csv';
import { formatChinaDateCompact, getChinaDayRange } from '../../common/date';
import { parseBigIntId } from '../../common/id';
import { getPagination } from '../../common/pagination.dto';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  certificateDetailInclude,
  certificateListInclude,
  getCertificateTitle,
  serializeCertificate,
  serializeCertificateDetail,
} from './certificates.serializer';
import {
  AdminCertificateQueryDto,
  ClientCertificateQueryDto,
} from './dto/certificate-query.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { CommitmentBasisType } from './dto/create-certificate.dto';
import { CreatePrintLogDto } from './dto/create-print-log.dto';

const DEFAULT_COMMITMENT_STATEMENT =
  '本主体承诺所销售农产品未使用禁用农药、兽药及其他化合物，使用的常规农药、兽药残留不超标，并对承诺内容真实性负责。';
const EVIDENCE_BIZ_TYPE = 'certificate_evidence';
const EVIDENCE_TEMP_BIZ_TYPE = 'certificate_evidence_temp';
const ALLOWED_EVIDENCE_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
const ALLOWED_EVIDENCE_FILE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

interface UploadedEvidenceFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class CertificatesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async create(dto: CreateCertificateDto, request: RequestWithClientUser) {
    const companyId = request.clientUser!.companyId;
    const basisType = dto.commitment_basis_type || CommitmentBasisType.self_test_qualified;
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });

    if (!company) {
      throw new NotFoundException({ message: '企业不存在', code: 'COMPANY_NOT_FOUND' });
    }

    let detectionRecordId: bigint | null = null;
    let record: Prisma.DetectionRecordGetPayload<{ include: { company: true } }> | null = null;

    if (basisType === CommitmentBasisType.self_test_qualified) {
      if (!dto.detection_record_id) {
        throw new BadRequestException({ message: '自行检测合格必须选择一条合格检测记录', code: 'DETECTION_RECORD_REQUIRED' });
      }
      detectionRecordId = parseBigIntId(dto.detection_record_id, 'detection_record_id');
      record = await this.prisma.detectionRecord.findFirst({
        where: { id: detectionRecordId, companyId },
        include: { company: true },
      });

      if (!record) {
        throw new NotFoundException({ message: '检测记录不存在', code: 'DETECTION_RECORD_NOT_FOUND' });
      }
      if (record.overallResult !== DetectionResult.pass) {
        throw new BadRequestException({ message: '不合格检测记录不能开具合格证', code: 'DETECTION_RECORD_NOT_QUALIFIED' });
      }
      if (record.status !== DetectionRecordStatus.normal) {
        throw new BadRequestException({ message: '异常、隐藏或作废的检测记录不能开具合格证', code: 'DETECTION_RECORD_NOT_CERTIFIABLE' });
      }
    } else if (!dto.evidence_asset_ids?.length) {
      throw new BadRequestException({
        message: basisType === CommitmentBasisType.quality_control ? '请上传至少一份质量控制相关资料' : '请上传至少一份委托检测报告或相关证明',
        code: 'CERTIFICATE_EVIDENCE_REQUIRED',
      });
    }

    const evidenceAssetIds = (dto.evidence_asset_ids || []).map((id) => parseBigIntId(id, 'evidence_asset_ids'));
    if (evidenceAssetIds.length) {
      const count = await this.prisma.fileAsset.count({
        where: { id: { in: evidenceAssetIds }, companyId, bizType: EVIDENCE_TEMP_BIZ_TYPE, certificateId: null, deletedAt: null },
      });
      if (count !== evidenceAssetIds.length) {
        throw new BadRequestException({ message: '依据资料不存在或已被使用，请重新上传', code: 'CERTIFICATE_EVIDENCE_INVALID' });
      }
    }

    const now = new Date();
    const certificateType = dto.certificate_type || CertificateType.agri_commitment_certificate;
    const origin = dto.origin?.trim() || company.address || company.originAddress || null;
    const publicToken = await this.generatePublicToken();
    const certificateNo = await this.generateCertificateNo(now);
    const qrUrl = this.buildQrUrl(publicToken);
    const evidenceVisibility = basisType === CommitmentBasisType.entrusted_test_qualified ? 'public' : 'private';

    const certificate = await this.prisma.certificate.create({
      data: {
        companyId,
        detectionRecordId,
        issuedByUserId: request.clientUser!.id,
        certificateNo,
        publicToken,
        certificateType,
        productName: dto.product_name,
        quantity: new Prisma.Decimal(dto.quantity),
        unit: dto.unit,
        origin,
        issuerName: dto.issuer_name,
        contactPhone: dto.contact_phone,
        commitmentBasis: dto.commitment_basis?.trim() || this.resolveCommitmentBasisLabel(basisType),
        commitmentBasisType: basisType,
        commitmentStatement: dto.commitment_statement?.trim() || DEFAULT_COMMITMENT_STATEMENT,
        issueDate: now,
        printCopies: dto.print_copies || 1,
        evidenceVisibility,
        remark: dto.remark?.trim() || null,
        status: CertificateStatus.normal,
        issueTime: now,
        qrUrl,
      },
    });

    if (evidenceAssetIds.length) {
      await this.prisma.fileAsset.updateMany({
        where: { id: { in: evidenceAssetIds }, companyId, certificateId: null, bizType: EVIDENCE_TEMP_BIZ_TYPE },
        data: { certificateId: certificate.id, bizType: EVIDENCE_BIZ_TYPE, isPublic: evidenceVisibility === 'public' },
      });
    }

    const certificateWithEvidence = await this.prisma.certificate.findUniqueOrThrow({
      where: { id: certificate.id },
      include: certificateDetailInclude,
    });

    await this.operationLogs.writeCompanyUserLog({
      userId: request.clientUser!.id,
      targetType: 'certificate',
      targetId: certificate.id,
      action: 'certificate.create',
      content: { detection_record_id: detectionRecordId?.toString() || null, certificate_no: certificateNo, commitment_basis_type: basisType },
      ip: request.ip,
    });

    return this.serializeClientCertificateDetail(certificateWithEvidence);
  }

  async uploadEvidenceFile(
    file: UploadedEvidenceFile | undefined,
    dto: { file_name?: string; file_type?: string; is_public?: string | boolean },
    request: RequestWithClientUser,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException({
        message: '请选择要上传的依据资料',
        code: 'UPLOAD_FILE_REQUIRED',
      });
    }

    const companyId = request.clientUser!.companyId;
    const extension = this.resolveEvidenceExtension(file, dto.file_name);
    const mimeType = this.resolveEvidenceMimeType(file.mimetype, extension);
    const rootDir = this.getUploadRoot();
    const relativeDir = join('certificate-evidence', companyId.toString(), 'temp');
    const targetDir = join(rootDir, relativeDir);
    await mkdir(targetDir, { recursive: true });

    const randomName = `${Date.now()}-${randomBytes(12).toString('hex')}${extension}`;
    const storageKey = `certificate-evidence/${companyId.toString()}/temp/${randomName}`;
    await writeFile(join(targetDir, randomName), file.buffer);

    const asset = await this.prisma.fileAsset.create({
      data: {
        companyId,
        bizType: EVIDENCE_TEMP_BIZ_TYPE,
        fileType: dto.file_type || this.defaultEvidenceFileType(mimeType),
        fileName: dto.file_name || this.sanitizeOriginalName(file.originalname),
        ossKey: storageKey,
        fileUrl: `${this.getUploadPublicBaseUrl()}/${storageKey}`,
        mimeType,
        fileSize: BigInt(file.size),
        storageDriver: 'local',
        isPublic: this.toBoolean(dto.is_public, false),
        sortOrder: 0,
        uploadedBy: `company_user:${request.clientUser!.id.toString()}`,
      },
    });

    await this.operationLogs.writeCompanyUserLog({
      userId: request.clientUser!.id,
      targetType: 'certificate_evidence',
      targetId: asset.id,
      action: 'certificate.evidence_upload',
      content: {
        file_type: asset.fileType,
        mime_type: asset.mimeType,
        file_size: asset.fileSize?.toString(),
      },
      ip: request.ip,
    });

    return this.serializeEvidenceAsset(asset);
  }

  async listClient(query: ClientCertificateQueryDto, request: RequestWithClientUser) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where: Prisma.CertificateWhereInput = {
      companyId: request.clientUser!.companyId,
    };
    if (query.status) where.status = query.status;
    if (query.product_name) {
      where.OR = [
        { productName: { contains: query.product_name } },
        { certificateNo: { contains: query.product_name } },
      ];
    }

    const [total, certificates] = await this.prisma.$transaction([
      this.prisma.certificate.count({ where }),
      this.prisma.certificate.findMany({
        where,
        include: certificateListInclude,
        orderBy: { issueTime: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: certificates.map((certificate) =>
        this.serializeClientCertificate(certificate),
      ),
    };
  }

  async getClient(id: bigint, request: RequestWithClientUser) {
    const certificate = await this.prisma.certificate.findFirst({
      where: {
        id,
        companyId: request.clientUser!.companyId,
      },
      include: certificateDetailInclude,
    });

    if (!certificate) {
      throw new NotFoundException({
        message: '合格证不存在',
        code: 'CERTIFICATE_NOT_FOUND',
      });
    }

    return this.serializeClientCertificateDetail(certificate);
  }

  async getLatestClient(request: RequestWithClientUser) {
    const certificate = await this.prisma.certificate.findFirst({
      where: {
        companyId: request.clientUser!.companyId,
        status: CertificateStatus.normal,
      },
      include: certificateDetailInclude,
      orderBy: { issueTime: 'desc' },
    });

    if (!certificate) return null;

    const item = this.serializeClientCertificateDetail(certificate) as Record<string, unknown>;
    delete item.detection_record_id;
    delete item.detection_record;
    return item;
  }

  async voidClient(id: bigint, request: RequestWithClientUser) {
    const certificate = await this.prisma.certificate.findFirst({
      where: {
        id,
        companyId: request.clientUser!.companyId,
      },
    });

    if (!certificate) {
      throw new NotFoundException({
        message: '合格证不存在',
        code: 'CERTIFICATE_NOT_FOUND',
      });
    }
    if (certificate.status === CertificateStatus.voided) {
      throw new BadRequestException({
        message: '合格证已作废，不能重复作废',
        code: 'CERTIFICATE_ALREADY_VOIDED',
      });
    }

    const updated = await this.prisma.certificate.update({
      where: { id },
      data: {
        status: CertificateStatus.voided,
        voidTime: new Date(),
      },
      include: certificateDetailInclude,
    });

    await this.operationLogs.writeCompanyUserLog({
      userId: request.clientUser!.id,
      targetType: 'certificate',
      targetId: id,
      action: 'certificate.void',
      ip: request.ip,
    });

    return this.serializeClientCertificateDetail(updated);
  }

  async voidAdmin(id: bigint, request: RequestWithAdmin, reason?: string) {
    const certificate = await this.prisma.certificate.findFirst({
      where: { id },
      include: certificateDetailInclude,
    });

    if (!certificate) {
      throw new NotFoundException({
        message: '合格证不存在',
        code: 'CERTIFICATE_NOT_FOUND',
      });
    }
    if (certificate.status === CertificateStatus.voided) {
      throw new BadRequestException({
        message: '合格证已作废，不能重复作废',
        code: 'CERTIFICATE_ALREADY_VOIDED',
      });
    }

    const updated = await this.prisma.certificate.update({
      where: { id },
      data: {
        status: CertificateStatus.voided,
        voidTime: new Date(),
      },
      include: certificateDetailInclude,
    });

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'certificate',
      targetId: id,
      action: 'certificate.void',
      ip: request.ip,
      content: reason || undefined,
    });

    return serializeCertificateDetail(updated);
  }

  async getPrintData(id: bigint, request: RequestWithClientUser) {
    const certificate = await this.prisma.certificate.findFirst({
      where: {
        id,
        companyId: request.clientUser!.companyId,
      },
      include: certificateDetailInclude,
    });

    if (!certificate) {
      throw new NotFoundException({
        message: '合格证不存在',
        code: 'CERTIFICATE_NOT_FOUND',
      });
    }
    if (certificate.status === CertificateStatus.voided) {
      throw new BadRequestException({
        message: '作废合格证不能打印',
        code: 'CERTIFICATE_VOIDED_NOT_PRINTABLE',
      });
    }

    return {
      paper: {
        width_mm: 60,
        height_mm: 80,
      },
      adapter: {
        mode: 'simulated',
        real_print_enabled: false,
      },
      label: {
        title: getCertificateTitle(certificate.certificateType),
        certificate_type: certificate.certificateType,
        product_name: certificate.productName,
        quantity: certificate.quantity.toString(),
        unit: certificate.unit,
          origin: certificate.origin,
          company_name: certificate.company.name,
          contact_phone: certificate.contactPhone,
          commitment_basis: certificate.commitmentBasis,
          test_items:
            certificate.detectionRecord?.items.map((item) => ({
              name: item.testItem,
              value: item.testValue,
              unit: item.unit,
              limit_value: item.standardLimit,
              result: item.result === DetectionResult.pass ? '合格' : '不合格',
            })) || [],
          issue_date: certificate.issueTime,
          certificate_no: certificate.certificateNo,
          qr_url: certificate.qrUrl,
        tip: '扫码查看详情及检测记录',
      },
    };
  }

  async createPrintLog(
    id: bigint,
    dto: CreatePrintLogDto,
    request: RequestWithClientUser,
  ) {
    const companyId = request.clientUser!.companyId;
    const certificate = await this.prisma.certificate.findFirst({
      where: {
        id,
        companyId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException({
        message: '合格证不存在',
        code: 'CERTIFICATE_NOT_FOUND',
      });
    }
    if (certificate.status === CertificateStatus.voided) {
      throw new BadRequestException({
        message: '作废合格证不能打印',
        code: 'CERTIFICATE_VOIDED_NOT_PRINTABLE',
      });
    }

    const printerId = dto.printer_id
      ? parseBigIntId(dto.printer_id, 'printer_id')
      : null;
    if (printerId) {
      const printer = await this.prisma.printer.findFirst({
        where: {
          id: printerId,
          OR: [{ companyId }, { companyId: null }],
        },
        select: { id: true },
      });
      if (!printer) {
        throw new NotFoundException({
          message: '打印机不存在',
          code: 'PRINTER_NOT_FOUND',
        });
      }
    }

    const log = await this.prisma.certificatePrintLog.create({
      data: {
        certificateId: id,
        printerId,
        printClient: PrintClient.miniapp,
        adapterType: dto.adapter_type || 'simulated',
        printerName: dto.printer_name || null,
        printerModel: dto.printer_model || null,
        connectionType: dto.connection_type || null,
        printStatus:
          dto.print_status === 'success' ? PrintStatus.success : PrintStatus.failed,
        copies: dto.copies || 1,
        operatorName: request.clientUser!.username || null,
        errorMessage: dto.error_message || null,
      },
    });

    await this.operationLogs.writeCompanyUserLog({
      userId: request.clientUser!.id,
      targetType: 'certificate',
      targetId: id,
      action: 'certificate.print_log',
      content: {
        print_status: dto.print_status,
        copies: dto.copies || 1,
        printer_name: dto.printer_name || null,
        printer_model: dto.printer_model || null,
        connection_type: dto.connection_type || null,
      },
      ip: request.ip,
    });

    return {
      id: log.id.toString(),
      certificate_id: log.certificateId.toString(),
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
    };
  }

  async listAdmin(query: AdminCertificateQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildAdminCertificateWhere(query);

    const [total, certificates] = await this.prisma.$transaction([
      this.prisma.certificate.count({ where }),
      this.prisma.certificate.findMany({
        where,
        include: certificateListInclude,
        orderBy: { issueTime: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: certificates.map(serializeCertificate),
    };
  }

  async exportAdmin(query: AdminCertificateQueryDto) {
    const certificates = await this.prisma.certificate.findMany({
      where: this.buildAdminCertificateWhere(query),
      include: certificateListInclude,
      orderBy: { issueTime: 'desc' },
    });

    return toCsv(
      [
        '合格证编号',
        '企业名称',
        '产品名称',
        '数量',
        '单位',
        '产地',
        '合格证类型',
        '状态',
        '开证日期',
        '扫码链接',
      ],
      certificates.map((certificate) => [
        certificate.certificateNo,
        certificate.company?.name,
        certificate.productName,
        certificate.quantity.toString(),
        certificate.unit,
        certificate.origin,
        getCertificateTitle(certificate.certificateType),
        certificate.status === CertificateStatus.normal ? '正常' : '已作废',
        formatCsvDate(certificate.issueTime),
        certificate.qrUrl,
      ]),
    );
  }

  async getAdmin(id: bigint) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id },
      include: certificateDetailInclude,
    });

    if (!certificate) {
      throw new NotFoundException({
        message: '合格证不存在',
        code: 'CERTIFICATE_NOT_FOUND',
      });
    }

    return serializeCertificateDetail(certificate);
  }

  private serializeClientCertificate(certificate: Parameters<typeof serializeCertificate>[0]) {
    const item = serializeCertificate(certificate);
    delete (item as { public_token?: string }).public_token;
    return item;
  }

  private serializeClientCertificateDetail(
    certificate: Parameters<typeof serializeCertificateDetail>[0],
  ) {
    const item = serializeCertificateDetail(certificate);
    delete (item as { public_token?: string }).public_token;
    return item;
  }

  async getPublicCertificate(publicToken: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { publicToken },
      include: {
        company: {
          include: {
            profile: true,
            fileAssets: {
              where: {
                isPublic: true,
                deletedAt: null,
              },
              orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
            },
          },
        },
        detectionRecord: {
          include: {
            items: {
              orderBy: {
                id: 'asc',
              },
            },
          },
        },
        evidenceAssets: {
          where: {
            isPublic: true,
            deletedAt: null,
          },
          orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
        },
      },
    });

    if (!certificate) {
      return {
        valid: false,
        status: 'invalid',
        message: '未查询到对应合格证信息',
      };
    }

    const profile = certificate.company.profile;
    const publicAssets = (certificate.company.fileAssets || []).filter((asset) =>
      this.isPublicAssetAvailable(asset),
    );
    const qualificationImages = publicAssets
      .filter((asset) => this.isImageAsset(asset) && this.isQualificationAsset(asset))
      .map((asset) => ({
        file_url: asset.fileUrl,
        file_name: asset.fileName,
        file_type: asset.fileType,
        mime_type: asset.mimeType,
        file_size: asset.fileSize?.toString() || null,
      }));
    const images = publicAssets
      .filter((asset) => this.isImageAsset(asset) && !this.isQualificationAsset(asset))
      .map((asset) => ({
        file_url: asset.fileUrl,
        file_name: asset.fileName,
        file_type: asset.fileType,
        mime_type: asset.mimeType,
        file_size: asset.fileSize?.toString() || null,
      }));
    const documents = publicAssets
      .filter((asset) => this.isDocumentAsset(asset))
      .map((asset) => ({
        file_url: asset.fileUrl,
        file_name: asset.fileName,
        file_type: asset.fileType,
        mime_type: asset.mimeType,
        file_size: asset.fileSize?.toString() || null,
      }));
    const shouldShowProfile = Boolean(
      profile?.isPublicEnabled ||
        images.length ||
        qualificationImages.length ||
        documents.length,
    );
    const evidenceAssets = certificate.evidenceAssets.map((asset) => ({
      file_url: asset.fileUrl,
      file_name: asset.fileName,
      file_type: asset.fileType,
      mime_type: asset.mimeType,
      file_size: asset.fileSize?.toString() || null,
    }));

    return {
      valid: true,
      status: certificate.status,
      certificate: {
        certificate_no: certificate.certificateNo,
        certificate_type: certificate.certificateType,
        certificate_title: getCertificateTitle(certificate.certificateType),
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
        status: certificate.status,
        issue_time: certificate.issueTime,
        void_time: certificate.voidTime,
      },
      detection: certificate.detectionRecord
        ? {
            product_name: certificate.detectionRecord.productName,
            sample_name: certificate.detectionRecord.sampleName,
            overall_result: this.toPublicResult(
              certificate.detectionRecord.overallResult,
            ),
            test_time: certificate.detectionRecord.testTime,
            items: certificate.detectionRecord.items.map((item) => ({
              test_item: item.testItem,
              test_method: item.testMethod,
              test_value: item.testValue,
              unit: item.unit,
              standard_limit: item.standardLimit,
              result: this.toPublicResult(item.result),
            })),
          }
        : null,
      evidence_assets: evidenceAssets,
      company: {
        name: certificate.company.name,
        ...(shouldShowProfile
          ? {
              intro: profile?.intro || null,
              main_products: profile?.mainProducts || null,
              display_address: profile?.displayAddress || null,
              display_phone: profile?.displayPhone || null,
              qualification_description:
                profile?.qualificationDescription || null,
              images,
              qualification_images: qualificationImages,
              documents,
            }
          : {
              intro: null,
              main_products: null,
              display_address: null,
              display_phone: null,
              qualification_description: null,
              images: [],
              qualification_images: [],
              documents: [],
            }),
      },
      support: {
        provider_name: '山西谷芯科技有限公司',
        support_text: '由谷芯快检云提供技术支持',
      },
      notice:
        '本页面展示的检测数据来源于企业快检记录，用于日常自检、留档和合格证信息展示，不等同于第三方检验检测机构出具的检验报告。',
    };
  }

  private isImageAsset(asset: { mimeType?: string | null; fileUrl: string }) {
    if (asset.mimeType) return asset.mimeType.startsWith('image/');
    return /\.(jpg|jpeg|png|webp)$/i.test(asset.fileUrl);
  }

  private isDocumentAsset(asset: { mimeType?: string | null; fileUrl: string }) {
    if (asset.mimeType) return asset.mimeType === 'application/pdf';
    return /\.pdf$/i.test(asset.fileUrl);
  }

  private async generateCertificateNo(date: Date) {
    const day = formatChinaDateCompact(date);
    const prefix = `GX${day}`;
    const { start, end } = getChinaDayRange(date);
    const dailyCount = await this.prisma.certificate.count({
      where: {
        issueTime: {
          gte: start,
          lt: end,
        },
      },
    });

    for (let offset = 1; offset <= 100; offset += 1) {
      const sequence = String(dailyCount + offset).padStart(6, '0');
      const certificateNo = `${prefix}${sequence}`;
      const exists = await this.prisma.certificate.findUnique({
        where: { certificateNo },
        select: { id: true },
      });
      if (!exists) return certificateNo;
    }

    throw new BadRequestException({
      message: '合格证编号生成失败，请重试',
      code: 'CERTIFICATE_NO_GENERATE_FAILED',
    });
  }

  private buildAdminCertificateWhere(query: AdminCertificateQueryDto) {
    const where: Prisma.CertificateWhereInput = {};

    if (query.company_id) {
      where.companyId = parseBigIntId(query.company_id, 'company_id');
    }
    if (query.product_name) {
      where.productName = { contains: query.product_name };
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.date_from || query.date_to) {
      where.issueTime = {};
      if (query.date_from) where.issueTime.gte = new Date(query.date_from);
      if (query.date_to) where.issueTime.lte = new Date(query.date_to);
    }

    return where;
  }

  private async generatePublicToken() {
    for (let i = 0; i < 20; i += 1) {
      const token = randomBytes(16).toString('hex');
      const exists = await this.prisma.certificate.findUnique({
        where: { publicToken: token },
        select: { id: true },
      });
      if (!exists) return token;
    }

    throw new BadRequestException({
      message: '\u516c\u5f00\u8bbf\u95ee token \u751f\u6210\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
      code: 'PUBLIC_TOKEN_GENERATE_FAILED',
    });
  }

  private buildQrUrl(publicToken: string) {
    const baseUrl = this.configService.get<string>(
      'CERT_PUBLIC_BASE_URL',
      this.configService.get<string>(
        'PUBLIC_CERT_BASE_URL',
        'https://cert.xxx.com',
      ),
    );
    return `${baseUrl.replace(/\/$/, '')}/c/${publicToken}`;
  }

  private resolveCommitmentBasisLabel(type: CommitmentBasisType) {
    if (type === CommitmentBasisType.quality_control) {
      return '质量安全控制符合要求';
    }
    if (type === CommitmentBasisType.entrusted_test_qualified) {
      return '委托检测合格';
    }
    return '自行检测合格';
  }

  private serializeEvidenceAsset(asset: {
    id: bigint;
    fileName: string;
    fileType: string;
    fileUrl: string;
    mimeType: string | null;
    fileSize: bigint | null;
    isPublic: boolean;
    uploadedAt: Date;
  }) {
    return {
      id: asset.id.toString(),
      file_name: asset.fileName,
      file_type: asset.fileType,
      file_url: asset.fileUrl,
      mime_type: asset.mimeType,
      file_size: asset.fileSize?.toString() || null,
      is_public: asset.isPublic,
      uploaded_at: asset.uploadedAt,
    };
  }

  private resolveEvidenceExtension(file: UploadedEvidenceFile, fallbackName?: string) {
    const originalExtension = extname(file.originalname || '').toLowerCase();
    const fallbackExtension = extname(fallbackName || '').toLowerCase();
    const allowedExtension = [originalExtension, fallbackExtension].find((extension) =>
      ALLOWED_EVIDENCE_FILE_EXTENSIONS.has(extension),
    );

    const mimeExtension = ALLOWED_EVIDENCE_MIME_EXTENSIONS[file.mimetype];
    if (mimeExtension) return mimeExtension;

    if (['application/octet-stream', ''].includes(file.mimetype || '') && allowedExtension) {
      return allowedExtension === '.jpeg' ? '.jpg' : allowedExtension;
    }

    const unsupportedExtension = [originalExtension, fallbackExtension].find(
      (extension) => extension && !ALLOWED_EVIDENCE_FILE_EXTENSIONS.has(extension),
    );
    if (unsupportedExtension) {
      throw new BadRequestException({
        message: '文件扩展名不支持',
        code: 'UNSUPPORTED_FILE_EXTENSION',
      });
    }

    throw new BadRequestException({
      message: '无法识别文件类型，请上传 jpg、png、webp 或 pdf 文件',
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  }

  private sanitizeOriginalName(fileName: string) {
    return (fileName || '依据资料').replace(/[\\/:*?"<>|]/g, '_').slice(0, 120);
  }

  private resolveEvidenceMimeType(mimeType: string, extension: string) {
    if (ALLOWED_EVIDENCE_MIME_EXTENSIONS[mimeType]) return mimeType;
    if (extension === '.pdf') return 'application/pdf';
    if (extension === '.png') return 'image/png';
    if (extension === '.webp') return 'image/webp';
    return 'image/jpeg';
  }

  private defaultEvidenceFileType(mimeType: string) {
    return mimeType === 'application/pdf' ? 'evidence_pdf' : 'evidence_image';
  }

  private toBoolean(value: string | boolean | undefined, defaultValue: boolean) {
    if (typeof value === 'boolean') return value;
    if (value === undefined) return defaultValue;
    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }

  private getUploadRoot() {
    return resolve(
      this.configService.get<string>('UPLOAD_DIR') ||
        this.configService.get<string>('UPLOAD_STORAGE_DIR') ||
        join(process.cwd(), 'uploads'),
    );
  }

  private getUploadPublicBaseUrl() {
    const configured = this.configService.get<string>('UPLOAD_PUBLIC_BASE_URL');
    if (configured) return configured.replace(/\/$/, '');
    const apiBase =
      this.configService.get<string>('API_BASE_URL') || 'https://api.xxx.com/api';
    return apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/uploads';
  }

  private isPublicAssetAvailable(asset: {
    storageDriver: string | null;
    ossKey: string | null;
    fileUrl: string;
  }) {
    if (asset.storageDriver && asset.storageDriver !== 'local') return true;
    if (!asset.ossKey) return Boolean(asset.fileUrl);
    return existsSync(join(this.getUploadRoot(), asset.ossKey));
  }

  private toPublicResult(result: DetectionResult) {
    return result === DetectionResult.pass ? 'qualified' : 'unqualified';
  }

  private isQualificationAsset(asset: {
    bizType: string;
    fileType: string;
    fileName: string;
  }) {
    const text = `${asset.bizType} ${asset.fileType} ${asset.fileName}`.toLowerCase();
    return (
      text.includes('qualification') ||
      text.includes('license') ||
      text.includes('certificate') ||
      text.includes('\u8d44\u8d28') ||
      text.includes('\u8425\u4e1a\u6267\u7167') ||
      text.includes('\u8bc1\u7167')
    );
  }
}
