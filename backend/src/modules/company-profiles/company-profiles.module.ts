import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompanyProfilesController } from './company-profiles.controller';
import { CompanyProfilesService } from './company-profiles.service';

@Module({
  imports: [AuthModule],
  controllers: [CompanyProfilesController],
  providers: [CompanyProfilesService],
})
export class CompanyProfilesModule {}
