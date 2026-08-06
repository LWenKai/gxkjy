import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { parseBigIntId } from '../../common/id';
import { type CsvResponse, sendCsv, todayForFilename } from '../../common/csv';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { CompaniesService } from './companies.service';
import { CompanyQueryDto } from './dto/company-query.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { RenewCompanyDto } from './dto/renew-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@UseGuards(AdminAuthGuard)
@Controller('admin/companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  listCompanies(@Query() query: CompanyQueryDto) {
    return this.companiesService.listCompanies(query);
  }

  @Get('export')
  async exportCompanies(
    @Query() query: CompanyQueryDto,
    @Res() response: CsvResponse,
  ) {
    const csv = await this.companiesService.exportCompanies(query);
    sendCsv(response, `企业管理导出_${todayForFilename()}.csv`, csv);
  }

  @Post()
  createCompany(@Body() dto: CreateCompanyDto, @Req() request: RequestWithAdmin) {
    return this.companiesService.createCompany(dto, request);
  }

  @Get(':id')
  getCompany(@Param('id') id: string) {
    return this.companiesService.getCompany(parseBigIntId(id));
  }

  @Get(':id/summary')
  getCompanySummary(@Param('id') id: string) {
    return this.companiesService.getCompanySummary(parseBigIntId(id));
  }

  @Put(':id')
  updateCompany(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companiesService.updateCompany(
      parseBigIntId(id),
      dto,
      request,
    );
  }

  @Post(':id/enable')
  enableCompany(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companiesService.enableCompany(parseBigIntId(id), request);
  }

  @Post(':id/disable')
  disableCompany(@Param('id') id: string, @Req() request: RequestWithAdmin) {
    return this.companiesService.disableCompany(parseBigIntId(id), request);
  }

  @Post(':id/renew')
  renewCompany(
    @Param('id') id: string,
    @Body() dto: RenewCompanyDto,
    @Req() request: RequestWithAdmin,
  ) {
    return this.companiesService.renewCompany(
      parseBigIntId(id),
      dto,
      request,
    );
  }

  @Put(':id/client-modules')
  updateClientModules(
    @Param('id') id: string,
    @Body() body: { client_modules: string },
    @Req() request: RequestWithAdmin,
  ) {
    return this.companiesService.updateClientModules(
      parseBigIntId(id),
      body?.client_modules || '',
      request,
    );
  }
}

