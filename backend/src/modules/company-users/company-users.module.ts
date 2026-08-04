import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CompanyUsersController } from './company-users.controller';
import { CompanyUsersService } from './company-users.service';

@Module({
  imports: [AuthModule],
  controllers: [CompanyUsersController],
  providers: [CompanyUsersService],
})
export class CompanyUsersModule {}
