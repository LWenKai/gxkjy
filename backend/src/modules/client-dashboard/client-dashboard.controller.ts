import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { ClientDashboardService } from './client-dashboard.service';

@UseGuards(ClientAuthGuard)
@Controller('client/dashboard')
export class ClientDashboardController {
  constructor(private readonly clientDashboardService: ClientDashboardService) {}

  @Get('summary')
  summary(@Req() request: RequestWithClientUser) {
    return this.clientDashboardService.summary(request);
  }
}
