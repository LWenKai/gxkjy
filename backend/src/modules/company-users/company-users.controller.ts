import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from '../../common/pagination.dto';
import { parseBigIntId } from '../../common/id';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { CompanyUsersService } from './company-users.service';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { ResetCompanyUserPasswordDto } from './dto/reset-company-user-password.dto';

@UseGuards(AdminAuthGuard)
@Controller('admin')
export class CompanyUsersController {
  constructor(private readonly companyUsersService: CompanyUsersService) {}

  @Get('companies/:companyId/users')
  listCompanyUsers(
    @Param('companyId') companyId: string,
    @Query() query: PaginationDto,
  ) {
    return this.companyUsersService.listCompanyUsers(
      parseBigIntId(companyId),
      query,
    );
  }

  @Post('companies/:companyId/users')
  createCompanyUser(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCompanyUserDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companyUsersService.createCompanyUser(
      parseBigIntId(companyId),
      dto,
      request,
    );
  }

  @Post('company-users/:id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetCompanyUserPasswordDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companyUsersService.resetPassword(
      parseBigIntId(id),
      dto,
      request,
    );
  }

  @Post('company-users/:id/enable')
  enableUser(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companyUsersService.enableUser(parseBigIntId(id), request);
  }

  @Post('company-users/:id/disable')
  disableUser(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companyUsersService.disableUser(parseBigIntId(id), request);
  }
}
