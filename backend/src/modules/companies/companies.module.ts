import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { CompaniesController } from './companies.controller';
import { ClientCompanyController } from './client-company.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [AuthModule],
  controllers: [CompaniesController, ClientCompanyController],
  providers: [CompaniesService, ClientAuthGuard],
  exports: [CompaniesService],
})
export class CompaniesModule {}
