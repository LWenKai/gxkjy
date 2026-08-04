import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';

@Module({
  imports: [AuthModule, PrismaModule, OperationLogsModule],
  controllers: [PrintersController],
  providers: [PrintersService],
})
export class PrintersModule {}
