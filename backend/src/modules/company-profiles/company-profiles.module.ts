import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { ClientCompanyProfileController } from './client-company-profile.controller';
import { CompanyProfilesController } from './company-profiles.controller';
import { CompanyProfilesService } from './company-profiles.service';

@Module({
  imports: [AuthModule],
  controllers: [CompanyProfilesController, ClientCompanyProfileController],
  providers: [CompanyProfilesService, ClientAuthGuard],
})
export class CompanyProfilesModule {}
