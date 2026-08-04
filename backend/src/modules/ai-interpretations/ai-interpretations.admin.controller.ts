import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AiInterpretationsService } from './ai-interpretations.service';

@UseGuards(AdminAuthGuard)
@Controller('admin/ai-interpretations')
export class AiInterpretationsAdminController {
  constructor(private readonly aiService: AiInterpretationsService) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    return this.aiService.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.aiService.getAdmin(parseBigIntId(id, 'AI 判读任务'));
  }
}
