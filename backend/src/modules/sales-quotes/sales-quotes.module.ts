import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SalesQuotesController } from './sales-quotes.controller';
import { SalesQuotesService } from './sales-quotes.service';

@Module({
  imports: [PrismaModule, AuthModule, OperationLogsModule],
  controllers: [SalesQuotesController],
  providers: [SalesQuotesService],
})
export class SalesQuotesModule {}
