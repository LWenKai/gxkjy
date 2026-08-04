import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { MiniappPreviewService } from './miniapp-preview.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/miniapp-preview')
export class MiniappPreviewController {
  constructor(private readonly miniappPreviewService: MiniappPreviewService) {}

  @Get('demo')
  getDemoPreview() {
    return this.miniappPreviewService.getDemoPreview();
  }
}
