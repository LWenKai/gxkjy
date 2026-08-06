import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { extname, join, resolve } from 'path';
import { Prisma } from '../../generated/prisma';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { ClientRequestUser } from '../auth/client-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCompanyProfileAssetDto,
  UpdateCompanyProfileAssetDto,
} from './dto/company-profile-asset.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { serializeCompanyProfile, serializeFileAsset } from './company-profiles.serializer';

const PROFILE_BIZ_TYPE = 'company_profile';
const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

interface UploadedProfileFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class CompanyProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
    private readonly config: ConfigService,
  ) {}

  async getProfile(companyId: bigint) {
    await this.ensureCompanyExists(companyId);
    const [profile, assets] = await Promise.all([
      this.prisma.companyProfile.findUnique({ where: { companyId } }),
      this.prisma.fileAsset.findMany({
        where: { companyId, bizType: PROFILE_BIZ_TYPE, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
      }),
    ]);

    return serializeCompanyProfile(profile, assets);
  }

  async updateProfile(
    companyId: bigint,
    dto: UpdateCompanyProfileDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCompanyExists(companyId);
    await this.prisma.companyProfile.upsert({
      where: { companyId },
      create: {
        companyId,
        intro: dto.intro || null,
        mainProducts: dto.main_products || null,
        displayAddress: dto.display_address || null,
        displayPhone: dto.display_phone || null,
        qualificationDescription: dto.qualification_description || null,
        isPublicEnabled: dto.is_public_enabled || false,
      },
      update: {
        intro: dto.intro || null,
        mainProducts: dto.main_products || null,
        displayAddress: dto.display_address || null,
        displayPhone: dto.display_phone || null,
        qualificationDescription: dto.qualification_description || null,
        isPublicEnabled: dto.is_public_enabled || false,
      },
    });

    await this.writeLog(request, companyId, 'company_profile.update', dto);
    return this.getProfile(companyId);
  }

  async createAsset(
    companyId: bigint,
    dto: CreateCompanyProfileAssetDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCompanyExists(companyId);
    const asset = await this.prisma.fileAsset.create({
      data: {
        companyId,
        bizType: PROFILE_BIZ_TYPE,
        fileType: dto.file_type,
        fileName: dto.file_name,
        ossKey: dto.file_url,
        fileUrl: dto.file_url,
        storageDriver: 'url',
        isPublic: dto.is_public ?? true,
        sortOrder: dto.sort_order || 0,
        uploadedBy: `admin:${request.adminUser!.id.toString()}`,
      },
    });

    await this.writeLog(request, companyId, 'company_profile.asset_create', {
      asset_id: asset.id.toString(),
      file_type: dto.file_type,
    });

    return serializeFileAsset(asset);
  }

  async getProfileFiles(companyId: bigint) {
    await this.ensureCompanyExists(companyId);
    const assets = await this.prisma.fileAsset.findMany({
      where: { companyId, bizType: PROFILE_BIZ_TYPE, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
    });

    return assets.map(serializeFileAsset);
  }

  async uploadFile(
    companyId: bigint,
    file: UploadedProfileFile | undefined,
    dto: UpdateCompanyProfileAssetDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCompanyExists(companyId);
    if (!file?.buffer) {
      throw new BadRequestException({
        message: '请选择要上传的文件',
        code: 'UPLOAD_FILE_REQUIRED',
      });
    }

    const extension = this.resolveExtension(file);
    const rootDir = this.getUploadRoot();
    const relativeDir = join('company-profiles', companyId.toString());
    const targetDir = join(rootDir, relativeDir);
    await mkdir(targetDir, { recursive: true });

    const randomName = `${Date.now()}-${randomBytes(12).toString('hex')}${extension}`;
    const targetPath = join(targetDir, randomName);
    await writeFile(targetPath, file.buffer);

    const storageKey = `company-profiles/${companyId.toString()}/${randomName}`;
    const fileUrl = `${this.getUploadPublicBaseUrl()}/${storageKey}`;
    const displayName = dto.file_name || this.sanitizeOriginalName(file.originalname);
    const asset = await this.prisma.fileAsset.create({
      data: {
        companyId,
        bizType: PROFILE_BIZ_TYPE,
        fileType: dto.file_type || this.defaultFileType(file.mimetype),
        fileName: displayName,
        ossKey: storageKey,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        storageDriver: 'local',
        isPublic: dto.is_public ?? true,
        sortOrder: dto.sort_order || 0,
        uploadedBy: `admin:${request.adminUser!.id.toString()}`,
      },
    });

    await this.writeLog(request, companyId, 'company_profile.file_upload', {
      asset_id: asset.id.toString(),
      file_type: asset.fileType,
      mime_type: asset.mimeType,
      file_size: asset.fileSize?.toString(),
    });

    return serializeFileAsset(asset);
  }

  async updateAsset(
    id: bigint,
    dto: UpdateCompanyProfileAssetDto,
    request: RequestWithAdmin,
  ) {
    const existing = await this.findAssetOrThrow(id);
    const data: Prisma.FileAssetUpdateInput = {};
    if (dto.file_name !== undefined) data.fileName = dto.file_name;
    if (dto.file_type !== undefined) data.fileType = dto.file_type;
    if (dto.file_url !== undefined) {
      data.fileUrl = dto.file_url;
      data.ossKey = dto.file_url;
      data.storageDriver = 'url';
    }
    if (dto.is_public !== undefined) data.isPublic = dto.is_public;
    if (dto.sort_order !== undefined) data.sortOrder = dto.sort_order;

    const asset = await this.prisma.fileAsset.update({
      where: { id },
      data,
    });

    await this.writeLog(
      request,
      existing.companyId!,
      'company_profile.asset_update',
      { asset_id: id.toString(), ...dto },
    );

    return serializeFileAsset(asset);
  }

  async setAssetPublic(
    id: bigint,
    isPublic: boolean,
    request: RequestWithAdmin,
  ) {
    const existing = await this.findAssetOrThrow(id);
    const asset = await this.prisma.fileAsset.update({
      where: { id },
      data: { isPublic },
    });

    await this.writeLog(
      request,
      existing.companyId!,
      isPublic ? 'company_profile.asset_enable_public' : 'company_profile.asset_disable_public',
      { asset_id: id.toString(), is_public: isPublic },
    );

    return serializeFileAsset(asset);
  }

  async deleteAsset(id: bigint, request: RequestWithAdmin) {
    const existing = await this.findAssetOrThrow(id);
    await this.prisma.fileAsset.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isPublic: false,
      },
    });

    await this.writeLog(
      request,
      existing.companyId!,
      'company_profile.file_delete',
      { asset_id: id.toString(), file_name: existing.fileName },
    );

    return { deleted: true };
  }

  private async ensureCompanyExists(companyId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException({
        message: '企业不存在',
        code: 'COMPANY_NOT_FOUND',
      });
    }
  }

  private async findAssetOrThrow(id: bigint) {
    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id,
        bizType: PROFILE_BIZ_TYPE,
        companyId: { not: null },
        deletedAt: null,
      },
    });

    if (!asset) {
      throw new NotFoundException({
        message: '公开图片不存在',
        code: 'COMPANY_PROFILE_ASSET_NOT_FOUND',
      });
    }

    return asset;
  }

  private async writeLog(
    request: RequestWithAdmin,
    companyId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'company_profile',
      targetId: companyId,
      action,
      content,
      ip: request.ip,
    });
  }

  private resolveExtension(file: UploadedProfileFile) {
    const extension = ALLOWED_MIME_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new BadRequestException({
        message: '仅支持 jpg、jpeg、png、webp、pdf 文件',
        code: 'UNSUPPORTED_FILE_TYPE',
      });
    }

    const originalExtension = extname(file.originalname || '').toLowerCase();
    if (originalExtension && !['.jpg', '.jpeg', '.png', '.webp', '.pdf'].includes(originalExtension)) {
      throw new BadRequestException({
        message: '文件扩展名不支持',
        code: 'UNSUPPORTED_FILE_EXTENSION',
      });
    }

    return extension;
  }

  private sanitizeOriginalName(fileName: string) {
    return (fileName || '企业资料')
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 120);
  }

  private defaultFileType(mimeType: string) {
    return mimeType === 'application/pdf' ? 'qualification' : 'company_photo';
  }

  private getUploadRoot() {
    return resolve(
      this.config.get<string>('UPLOAD_DIR') ||
        this.config.get<string>('UPLOAD_STORAGE_DIR') ||
        join(process.cwd(), 'uploads'),
    );
  }

  private getUploadPublicBaseUrl() {
    const configured = this.config.get<string>('UPLOAD_PUBLIC_BASE_URL');
    if (configured) return configured.replace(/\/$/, '');
    const apiBase =
      this.config.get<string>('API_BASE_URL') || 'https://api.xxx.com/api';
    return apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '') + '/uploads';
  }

  private async removeLocalFile(storageKey: string) {
    if (!storageKey || storageKey.includes('..') || storageKey.startsWith('/')) {
      return;
    }

    try {
      await unlink(join(this.getUploadRoot(), storageKey));
    } catch {
      // 文件可能已被人工清理，数据库软删除仍然有效。
    }
  }

  // ===== 客户端（企业账号）自助维护公开资料，仅可操作本企业 =====

  async clientUpdateProfile(
    clientUser: ClientRequestUser,
    dto: UpdateCompanyProfileDto,
  ) {
    const companyId = clientUser.companyId;
    await this.ensureCompanyExists(companyId);
    await this.prisma.companyProfile.upsert({
      where: { companyId },
      create: {
        companyId,
        intro: dto.intro || null,
        mainProducts: dto.main_products || null,
        displayAddress: dto.display_address || null,
        displayPhone: dto.display_phone || null,
        qualificationDescription: dto.qualification_description || null,
        isPublicEnabled: dto.is_public_enabled || false,
      },
      update: {
        intro: dto.intro || null,
        mainProducts: dto.main_products || null,
        displayAddress: dto.display_address || null,
        displayPhone: dto.display_phone || null,
        qualificationDescription: dto.qualification_description || null,
        isPublicEnabled: dto.is_public_enabled || false,
      },
    });

    await this.writeClientLog(clientUser, companyId, 'company_profile.update', dto);
    return this.getProfile(companyId);
  }

  async clientUploadFile(
    clientUser: ClientRequestUser,
    file: UploadedProfileFile | undefined,
    dto: UpdateCompanyProfileAssetDto,
  ) {
    const companyId = clientUser.companyId;
    await this.ensureCompanyExists(companyId);
    if (!file?.buffer) {
      throw new BadRequestException({
        message: '请选择要上传的文件',
        code: 'UPLOAD_FILE_REQUIRED',
      });
    }

    const extension = this.resolveExtension(file);
    const rootDir = this.getUploadRoot();
    const relativeDir = join('company-profiles', companyId.toString());
    const targetDir = join(rootDir, relativeDir);
    await mkdir(targetDir, { recursive: true });

    const randomName = `${Date.now()}-${randomBytes(12).toString('hex')}${extension}`;
    const targetPath = join(targetDir, randomName);
    await writeFile(targetPath, file.buffer);

    const storageKey = `company-profiles/${companyId.toString()}/${randomName}`;
    const fileUrl = `${this.getUploadPublicBaseUrl()}/${storageKey}`;
    const displayName = dto.file_name || this.sanitizeOriginalName(file.originalname);
    const asset = await this.prisma.fileAsset.create({
      data: {
        companyId,
        bizType: PROFILE_BIZ_TYPE,
        fileType: dto.file_type || this.defaultFileType(file.mimetype),
        fileName: displayName,
        ossKey: storageKey,
        fileUrl,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        storageDriver: 'local',
        isPublic: dto.is_public ?? true,
        sortOrder: dto.sort_order || 0,
        uploadedBy: `company_user:${clientUser.id.toString()}`,
      },
    });

    await this.writeClientLog(clientUser, companyId, 'company_profile.file_upload', {
      asset_id: asset.id.toString(),
      file_type: asset.fileType,
      mime_type: asset.mimeType,
      file_size: asset.fileSize?.toString(),
    });

    return serializeFileAsset(asset);
  }

  async clientUpdateAsset(
    clientUser: ClientRequestUser,
    id: bigint,
    dto: UpdateCompanyProfileAssetDto,
  ) {
    const existing = await this.findOwnedAssetOrThrow(clientUser, id);
    const data: Prisma.FileAssetUpdateInput = {};
    if (dto.file_name !== undefined) data.fileName = dto.file_name;
    if (dto.file_type !== undefined) data.fileType = dto.file_type;
    if (dto.is_public !== undefined) data.isPublic = dto.is_public;
    if (dto.sort_order !== undefined) data.sortOrder = dto.sort_order;

    const asset = await this.prisma.fileAsset.update({
      where: { id },
      data,
    });

    await this.writeClientLog(
      clientUser,
      existing.companyId!,
      'company_profile.asset_update',
      { asset_id: id.toString(), ...dto },
    );

    return serializeFileAsset(asset);
  }

  async clientSetAssetPublic(
    clientUser: ClientRequestUser,
    id: bigint,
    isPublic: boolean,
  ) {
    const existing = await this.findOwnedAssetOrThrow(clientUser, id);
    const asset = await this.prisma.fileAsset.update({
      where: { id },
      data: { isPublic },
    });

    await this.writeClientLog(
      clientUser,
      existing.companyId!,
      isPublic ? 'company_profile.asset_enable_public' : 'company_profile.asset_disable_public',
      { asset_id: id.toString(), is_public: isPublic },
    );

    return serializeFileAsset(asset);
  }

  async clientDeleteAsset(clientUser: ClientRequestUser, id: bigint) {
    const existing = await this.findOwnedAssetOrThrow(clientUser, id);
    await this.prisma.fileAsset.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isPublic: false,
      },
    });

    await this.writeClientLog(
      clientUser,
      existing.companyId!,
      'company_profile.file_delete',
      { asset_id: id.toString(), file_name: existing.fileName },
    );

    return { deleted: true };
  }

  private async findOwnedAssetOrThrow(clientUser: ClientRequestUser, id: bigint) {
    const asset = await this.prisma.fileAsset.findFirst({
      where: {
        id,
        bizType: PROFILE_BIZ_TYPE,
        companyId: clientUser.companyId,
        deletedAt: null,
      },
    });

    if (!asset) {
      throw new NotFoundException({
        message: '公开资料不存在或无权操作',
        code: 'COMPANY_PROFILE_ASSET_FORBIDDEN',
      });
    }

    return asset;
  }

  private async writeClientLog(
    clientUser: ClientRequestUser,
    companyId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeCompanyUserLog({
      userId: clientUser.id,
      targetType: 'company_profile',
      targetId: companyId,
      action,
      content,
      ip: undefined,
    });
  }
}
