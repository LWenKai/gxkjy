import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import {
  AdminCertificatesController,
  ClientCertificatesController,
} from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { PublicCertificatesController } from './public-certificates.controller';

@Module({
  imports: [AuthModule, PrismaModule, OperationLogsModule],
  controllers: [
    ClientCertificatesController,
    AdminCertificatesController,
    PublicCertificatesController,
  ],
  providers: [CertificatesService],
})
export class CertificatesModule {}
