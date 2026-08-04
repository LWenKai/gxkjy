import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  PublicSystemSettingsController,
  SystemSettingsController,
} from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';

@Module({
  imports: [AuthModule],
  controllers: [SystemSettingsController, PublicSystemSettingsController],
  providers: [SystemSettingsService],
})
export class SystemSettingsModule {}
