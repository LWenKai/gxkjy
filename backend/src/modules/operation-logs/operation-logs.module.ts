import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OperationLogsController } from './operation-logs.controller';
import { OperationLogsService } from './operation-logs.service';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [OperationLogsController],
  providers: [OperationLogsService],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
