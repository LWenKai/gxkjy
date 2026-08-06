import { Body, Controller, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ClientChangePasswordDto } from './dto/client-change-password.dto';
import { ClientLoginDto } from './dto/client-login.dto';
import { ClientAuthGuard } from './client-auth.guard';
import { RequestWithClientUser } from './client-auth.types';

@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.authService.loginAdmin(dto);
  }
}

@Controller('client/auth')
export class ClientAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  loginClient(@Body() dto: ClientLoginDto) {
    return this.authService.loginClient(dto);
  }

  @UseGuards(ClientAuthGuard)
  @Put('password')
  changePassword(
    @Req() request: RequestWithClientUser,
    @Body() dto: ClientChangePasswordDto,
  ) {
    return this.authService.changeClientPassword(
      request.clientUser!.id,
      dto.old_password,
      dto.new_password,
    );
  }
}
