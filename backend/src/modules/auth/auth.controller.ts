import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ClientLoginDto } from './dto/client-login.dto';

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
}
