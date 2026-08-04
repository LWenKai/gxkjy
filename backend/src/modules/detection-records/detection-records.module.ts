import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  AdminDetectionRecordsController,
  AdminTestDetectionRecordsController,
  ClientDetectionRecordsController,
} from './detection-records.controller';
import { DetectionRecordsService } from './detection-records.service';

@Module({
  imports: [AuthModule, PrismaModule, OperationLogsModule],
  controllers: [
    AdminTestDetectionRecordsController,
    ClientDetectionRecordsController,
    AdminDetectionRecordsController,
  ],
  providers: [DetectionRecordsService],
})
export class DetectionRecordsModule {}
