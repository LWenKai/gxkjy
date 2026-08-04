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
import { getPagination } from '../../common/pagination.dto';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWebsiteMaterialDto } from './dto/update-website-material.dto';
import { WebsiteMaterialQueryDto } from './dto/website-material-query.dto';
import { UpdateWebsiteSettingsDto } from './dto/update-website-settings.dto';
import { serializeWebsiteMaterial } from './website.serializer';

const WEBSITE_MATERIAL_BIZ_TYPE = 'website_material';
const WEBSITE_SETTING_KEYS = [
  'website_home_title',
  'website_home_subtitle',
  'website_primary_button_text',
  'website_secondary_button_text',
  'website_contact_phone',
  'website_wechat_tip',
  'website_company_intro',
  'website_show_materials',
  'website_show_cloud_module',
] as const;

const DEFAULT_WEBSITE_SETTINGS = {
  home_title: '食品安全快检室整体解决方案',
  home_subtitle:
    '检测设备、试剂耗材、合格证打印、数据管理与扫码查询一站式配套',
  primary_button_text: '获取方案报价',
  secondary_button_text: '查看产品服务',
  contact_phone: '13363412262',
  wechat_tip: '微信同手机号，可发送检测项目和现场情况沟通配置建议。',
  company_intro:
    '山西谷芯科技有限公司专注食品安全快检场景，提供检测仪器、试剂耗材、合格证打印、数据平台和快检室配套建议。山西省内可根据项目情况提供上门安装指导、操作培训和售后支持，省外可远程指导或协商服务方式。',
  show_materials: true,
  show_cloud_module: true,
};

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
]);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/octet-stream',
]);

interface UploadedWebsiteFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class WebsiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
    private readonly config: ConfigService,
  ) {}

  async listAdmin(query: WebsiteMaterialQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildMaterialWhere(query, false);
    const [total, materials] = await this.prisma.$transaction([
      this.prisma.fileAsset.count({ where }),
      this.prisma.fileAsset.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: materials.map(serializeWebsiteMaterial),
    };
  }

  async listPublic(query: WebsiteMaterialQueryDto) {
    const { page, pageSize, skip, take } = getPagination(query);
    const where = this.buildMaterialWhere(query, true);
    const [total, materials] = await this.prisma.$transaction([
      this.prisma.fileAsset.count({ where }),
      this.prisma.fileAsset.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { uploadedAt: 'desc' }],
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: materials.map(serializeWebsiteMaterial),
    };
  }

  async uploadMaterial(
    file: UploadedWebsiteFile | undefined,
    dto: UpdateWebsiteMaterialDto,
    request: RequestWithAdmin,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException({
        message: '请选择要上传的官网资料',
        code: 'UPLOAD_FILE_REQUIRED',
      });
    }

    const extension = this.resolveExtension(file);
    const rootDir = this.getUploadRoot();
    const relativeDir = 'website-materials';
    const targetDir = join(rootDir, relativeDir);
    await mkdir(targetDir, { recursive: true });

    const randomName = `${Date.now()}-${randomBytes(12).toString('hex')}${extension}`;
    const storageKey = `${relativeDir}/${randomName}`;
    await writeFile(join(targetDir, randomName), file.buffer);

    const originalName = this.sanitizeOriginalName(file.originalname);
    const asset = await this.prisma.fileAsset.create({
      data: {
        bizType: WEBSITE_MATERIAL_BIZ_TYPE,
        fileType: dto.category || this.defaultCategory(file.mimetype),
        fileName: dto.file_name || dto.title || originalName,
        title: dto.title || dto.file_name || originalName.replace(/\.[^.]+$/, ''),
        category: dto.category || this.defaultCategory(file.mimetype),
        description: dto.description || '',
        isRecommended: dto.is_recommended || false,
        ossKey: storageKey,
        fileUrl: `${this.getUploadPublicBaseUrl()}/${storageKey}`,
        mimeType: file.mimetype,
        fileSize: BigInt(file.size),
        storageDriver: 'local',
        isPublic: dto.is_public ?? true,
        sortOrder: dto.sort_order || 0,
        uploadedBy: `admin:${request.adminUser!.id.toString()}`,
      },
    });

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'website_material',
      targetId: asset.id,
      action: 'website.material.upload',
      content: {
        title: asset.title,
        category: asset.category,
        mime_type: asset.mimeType,
        file_size: asset.fileSize?.toString(),
      },
      ip: request.ip,
    });

    return serializeWebsiteMaterial(asset);
  }

  async updateMaterial(
    id: bigint,
    dto: UpdateWebsiteMaterialDto,
    request: RequestWithAdmin,
  ) {
    const existing = await this.findMaterialOrThrow(id);
    const data: Prisma.FileAssetUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title || null;
    if (dto.file_name !== undefined) data.fileName = dto.file_name;
    if (dto.category !== undefined) {
      data.category = dto.category || null;
      data.fileType = dto.category || existing.fileType;
    }
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.is_public !== undefined) data.isPublic = dto.is_public;
    if (dto.is_recommended !== undefined) data.isRecommended = dto.is_recommended;
    if (dto.sort_order !== undefined) data.sortOrder = dto.sort_order;

    const asset = await this.prisma.fileAsset.update({ where: { id }, data });
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'website_material',
      targetId: id,
      action: 'website.material.update',
      content: dto,
      ip: request.ip,
    });

    return serializeWebsiteMaterial(asset);
  }

  async deleteMaterial(id: bigint, request: RequestWithAdmin) {
    const existing = await this.findMaterialOrThrow(id);
    await this.prisma.fileAsset.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isPublic: false,
        isRecommended: false,
      },
    });

    if (existing.storageDriver === 'local') {
      await this.removeLocalFile(existing.ossKey);
    }

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'website_material',
      targetId: id,
      action: 'website.material.delete',
      content: { title: existing.title || existing.fileName },
      ip: request.ip,
    });

    return { deleted: true };
  }

  async getSettings() {
    const rows = await this.prisma.systemSetting.findMany({
      where: { settingKey: { in: [...WEBSITE_SETTING_KEYS] } },
    });
    const map = Object.fromEntries(
      rows.map((row) => [row.settingKey, row.settingValue]),
    );
    return this.serializeSettings(map);
  }

  async getPublicSettings() {
    return this.getSettings();
  }

  async updateSettings(dto: UpdateWebsiteSettingsDto, request: RequestWithAdmin) {
    const entries = Object.entries(dto).filter(([, value]) => value !== undefined);

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.systemSetting.upsert({
          where: { settingKey: `website_${key}` },
          create: {
            settingKey: `website_${key}`,
            settingValue: String(value),
            remark: '官网展示配置',
          },
          update: { settingValue: String(value) },
        }),
      ),
    );

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'website_setting',
      action: 'website.setting.update',
      content: Object.fromEntries(entries),
      ip: request.ip,
    });

    return this.getSettings();
  }

  private buildMaterialWhere(
    query: WebsiteMaterialQueryDto,
    publicOnly: boolean,
  ): Prisma.FileAssetWhereInput {
    const where: Prisma.FileAssetWhereInput = {
      bizType: WEBSITE_MATERIAL_BIZ_TYPE,
      deletedAt: null,
    };
    if (publicOnly) where.isPublic = true;
    else if (query.is_public !== undefined) where.isPublic = query.is_public;
    if (query.category) where.category = query.category;
    if (query.is_recommended !== undefined) {
      where.isRecommended = query.is_recommended;
    }
    return where;
  }

  private async findMaterialOrThrow(id: bigint) {
    const asset = await this.prisma.fileAsset.findFirst({
      where: { id, bizType: WEBSITE_MATERIAL_BIZ_TYPE, deletedAt: null },
    });
    if (!asset) {
      throw new NotFoundException({
        message: '官网资料不存在',
        code: 'WEBSITE_MATERIAL_NOT_FOUND',
      });
    }
    return asset;
  }

  private resolveExtension(file: UploadedWebsiteFile) {
    const extension = extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      throw new BadRequestException({
        message: '文件扩展名不支持',
        code: 'UNSUPPORTED_FILE_EXTENSION',
      });
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException({
        message: '文件类型不支持',
        code: 'UNSUPPORTED_FILE_TYPE',
      });
    }
    return extension === '.jpeg' ? '.jpg' : extension;
  }

  private sanitizeOriginalName(fileName: string) {
    return (fileName || '官网资料')
      .replace(/[\\/:*?"<>|]/g, '_')
      .slice(0, 160);
  }

  private defaultCategory(mimeType: string) {
    if (mimeType.startsWith('image/')) return '产品资料';
    if (mimeType === 'application/pdf') return '快检室方案';
    return '公司介绍';
  }

  private serializeSettings(map: Record<string, string>) {
    return {
      home_title: map.website_home_title || DEFAULT_WEBSITE_SETTINGS.home_title,
      home_subtitle:
        map.website_home_subtitle || DEFAULT_WEBSITE_SETTINGS.home_subtitle,
      primary_button_text:
        map.website_primary_button_text ||
        DEFAULT_WEBSITE_SETTINGS.primary_button_text,
      secondary_button_text:
        map.website_secondary_button_text ||
        DEFAULT_WEBSITE_SETTINGS.secondary_button_text,
      contact_phone:
        map.website_contact_phone || DEFAULT_WEBSITE_SETTINGS.contact_phone,
      wechat_tip: map.website_wechat_tip || DEFAULT_WEBSITE_SETTINGS.wechat_tip,
      company_intro:
        map.website_company_intro || DEFAULT_WEBSITE_SETTINGS.company_intro,
      show_materials:
        (map.website_show_materials ??
          String(DEFAULT_WEBSITE_SETTINGS.show_materials)) === 'true',
      show_cloud_module:
        (map.website_show_cloud_module ??
          String(DEFAULT_WEBSITE_SETTINGS.show_cloud_module)) === 'true',
    };
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
      this.config.get<string>('API_BASE_URL') || 'https://api.gxkjy.com/api';
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
}
