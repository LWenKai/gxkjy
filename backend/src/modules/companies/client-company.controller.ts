import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { CompaniesService } from './companies.service';
import { ClientUpdateCompanyDto } from './dto/client-update-company.dto';

@UseGuards(ClientAuthGuard)
@Controller('client')
export class ClientCompanyController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('company')
  getCompany(@Req() request: RequestWithClientUser) {
    return this.companiesService.getCompany(request.clientUser!.companyId);
  }

  @Put('company')
  updateCompany(
    @Req() request: RequestWithClientUser,
    @Body() dto: ClientUpdateCompanyDto,
  ) {
    return this.companiesService.updateClientCompany(
      request.clientUser!.companyId,
      dto,
    );
  }
}
