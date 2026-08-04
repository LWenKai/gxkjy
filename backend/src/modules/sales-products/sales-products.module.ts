import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesProductsController } from './sales-products.controller';
import { SalesProductsService } from './sales-products.service';

@Module({
  imports: [PrismaModule, AuthModule, OperationLogsModule],
  controllers: [SalesProductsController],
  providers: [SalesProductsService],
})
export class SalesProductsModule {}
