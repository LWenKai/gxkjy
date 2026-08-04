import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { SystemSettingsService } from './system-settings.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/system-settings')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  getSettings() {
    return this.systemSettingsService.getSettings();
  }

  @Patch()
  updateSettings(
    @Body() dto: UpdateSystemSettingsDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.systemSettingsService.updateSettings(dto, request);
  }
}

@Controller('public/settings')
export class PublicSystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  getPublicSettings() {
    return this.systemSettingsService.getPublicSettings();
  }
}
