import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ClientAuthGuard } from '../auth/client-auth.guard';
import { RequestWithClientUser } from '../auth/client-auth.types';
import { ClientScreenService } from './client-screen.service';

@UseGuards(ClientAuthGuard)
@Controller('client/screen')
export class ClientScreenController {
  constructor(private readonly clientScreenService: ClientScreenService) {}

  @Get('summary')
  summary(@Req() request: RequestWithClientUser) {
    return this.clientScreenService.summary(request);
  }
}
