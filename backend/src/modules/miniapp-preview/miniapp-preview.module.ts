import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MiniappPreviewController } from './miniapp-preview.controller';
import { MiniappPreviewService } from './miniapp-preview.service';

@Module({
  imports: [AuthModule],
  controllers: [MiniappPreviewController],
  providers: [MiniappPreviewService],
})
export class MiniappPreviewModule {}
