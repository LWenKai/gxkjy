import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomerQuoteAttachmentsController } from './customer-quote-attachments.controller';
import { CustomerQuoteAttachmentsService } from './customer-quote-attachments.service';

@Module({
  imports: [PrismaModule, AuthModule, OperationLogsModule],
  controllers: [CustomerQuoteAttachmentsController],
  providers: [CustomerQuoteAttachmentsService],
})
export class CustomerQuoteAttachmentsModule {}
