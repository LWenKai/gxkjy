import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientDashboardController } from './client-dashboard.controller';
import { ClientDashboardService } from './client-dashboard.service';

@Module({
  imports: [AuthModule],
  controllers: [ClientDashboardController],
  providers: [ClientDashboardService],
})
export class ClientDashboardModule {}
