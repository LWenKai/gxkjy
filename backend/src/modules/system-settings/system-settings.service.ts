import { Injectable } from '@nestjs/common';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';

const DEFAULT_SETTINGS: Record<string, string> = {
  platform_name: '谷芯快检云',
  service_phone: '13363412262',
  support_text: '由谷芯快检云提供技术支持',
  public_footer_notice:
    '本页面展示的检测数据来源于企业快检记录，用于日常自检、留档和合格证信息展示，不等同于第三方检验检测机构出具的检验报告。',
  certificate_public_notice: '扫码查看合格证信息、检测结果和企业公开资料。',
  show_support_info: 'true',
  show_company_public_profile: 'true',
};

@Injectable()
export class SystemSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const map = { ...DEFAULT_SETTINGS };
    for (const item of settings) {
      if (item.settingKey in DEFAULT_SETTINGS) {
        map[item.settingKey] = item.settingValue;
      }
    }
    return this.serialize(map);
  }

  async getPublicSettings() {
    const settings = await this.getSettings();
    return {
      platform_name: settings.platform_name,
      service_phone: settings.service_phone,
      support_text: settings.support_text,
      public_footer_notice: settings.public_footer_notice,
      certificate_public_notice: settings.certificate_public_notice,
      show_support_info: settings.show_support_info,
      show_company_public_profile: settings.show_company_public_profile,
    };
  }

  async updateSettings(dto: UpdateSystemSettingsDto, request: RequestWithAdmin) {
    const entries = Object.entries(dto).filter(
      ([key, value]) => key in DEFAULT_SETTINGS && value !== undefined,
    );

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.systemSetting.upsert({
          where: { settingKey: key },
          create: {
            settingKey: key,
            settingValue: String(value),
            remark: '后台展示配置',
          },
          update: {
            settingValue: String(value),
          },
        }),
      ),
    );

    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'system_setting',
      action: 'system_setting.update',
      content: Object.fromEntries(entries),
      ip: request.ip,
    });

    return this.getSettings();
  }

  private serialize(settings: Record<string, string>) {
    return {
      platform_name: settings.platform_name,
      service_phone: settings.service_phone,
      support_text: settings.support_text,
      public_footer_notice: settings.public_footer_notice,
      certificate_public_notice: settings.certificate_public_notice,
      show_support_info: settings.show_support_info === 'true',
      show_company_public_profile:
        settings.show_company_public_profile === 'true',
    };
  }
}
