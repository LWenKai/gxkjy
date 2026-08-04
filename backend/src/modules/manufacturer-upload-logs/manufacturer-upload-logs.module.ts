import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ManufacturerUploadLogsController } from './manufacturer-upload-logs.controller';
import { ManufacturerUploadLogsService } from './manufacturer-upload-logs.service';

@Module({
  imports: [AuthModule],
  controllers: [ManufacturerUploadLogsController],
  providers: [ManufacturerUploadLogsService],
})
export class ManufacturerUploadLogsModule {}
