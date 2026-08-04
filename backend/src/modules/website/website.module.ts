import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminWebsiteController, PublicWebsiteController } from './website.controller';
import { WebsiteService } from './website.service';

@Module({
  imports: [AuthModule, PrismaModule, OperationLogsModule],
  controllers: [AdminWebsiteController, PublicWebsiteController],
  providers: [WebsiteService],
})
export class WebsiteModule {}
