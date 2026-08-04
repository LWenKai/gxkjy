import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthController, ClientAuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientAuthGuard } from './client-auth.guard';
import { SuperAdminGuard } from './super-admin.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [AuthController, ClientAuthController],
  providers: [AuthService, AdminAuthGuard, ClientAuthGuard, SuperAdminGuard],
  exports: [AdminAuthGuard, ClientAuthGuard, SuperAdminGuard, JwtModule],
})
export class AuthModule {}
