import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesProductPackagesController } from './sales-product-packages.controller';
import { SalesProductPackagesService } from './sales-product-packages.service';

@Module({
  imports: [PrismaModule, AuthModule, OperationLogsModule],
  controllers: [SalesProductPackagesController],
  providers: [SalesProductPackagesService],
})
export class SalesProductPackagesModule {}
