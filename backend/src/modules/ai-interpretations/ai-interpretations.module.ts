import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AiInterpretationsController } from './ai-interpretations.controller';
import { AiInterpretationsAdminController } from './ai-interpretations.admin.controller';
import { AiInterpretationsService } from './ai-interpretations.service';
import {
  AI_VISION_PROVIDER,
  DashScopeQwenVisionProvider,
} from './ai-vision.provider';
import { ImageQualityService } from './image-quality.service';

@Module({
  imports: [AuthModule, PrismaModule, OperationLogsModule],
  controllers: [AiInterpretationsController, AiInterpretationsAdminController],
  providers: [
    AiInterpretationsService,
    DashScopeQwenVisionProvider,
    ImageQualityService,
    { provide: AI_VISION_PROVIDER, useExisting: DashScopeQwenVisionProvider },
  ],
})
export class AiInterpretationsModule {}
