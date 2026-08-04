import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import {
  AccountStatus,
  AdminUserStatus,
  CompanyStatus,
} from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ClientLoginDto } from './dto/client-login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async loginAdmin(dto: AdminLoginDto) {
    const loginError = new UnauthorizedException({
      message: '账号或密码错误',
      code: 'INVALID_CREDENTIALS',
    });

    const adminUser = await this.prisma.adminUser.findUnique({
      where: {
        username: dto.username,
      },
    });

    if (!adminUser || adminUser.status !== AdminUserStatus.normal) {
      throw loginError;
    }

    const passwordMatched = await bcrypt.compare(
      dto.password,
      adminUser.passwordHash,
    );

    if (!passwordMatched) {
      throw loginError;
    }

    const updatedAdminUser = await this.prisma.adminUser.update({
      where: {
        id: adminUser.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        username: true,
        realName: true,
        role: true,
        status: true,
        lastLoginAt: true,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: updatedAdminUser.id.toString(),
      username: updatedAdminUser.username,
      role: 'admin',
    });

    return {
      access_token: accessToken,
      admin_user: {
        id: updatedAdminUser.id.toString(),
        username: updatedAdminUser.username,
        real_name: updatedAdminUser.realName,
        role: updatedAdminUser.role,
        status: updatedAdminUser.status,
        last_login_at: updatedAdminUser.lastLoginAt,
      },
    };
  }

  async loginClient(dto: ClientLoginDto) {
    const loginError = new UnauthorizedException({
      message: '账号或密码错误',
      code: 'INVALID_CREDENTIALS',
    });

    const user = await this.prisma.companyUser.findUnique({
      where: { username: dto.username },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            contactName: true,
            phone: true,
            address: true,
            originAddress: true,
            status: true,
            serviceExpireAt: true,
            defaultCertificateType: true,
          },
        },
      },
    });

    if (!user || user.status !== AccountStatus.normal) {
      throw loginError;
    }

    const passwordMatched = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatched) {
      throw loginError;
    }

    if (!user.company || user.company.status !== CompanyStatus.normal) {
      throw new UnauthorizedException({
        message: '企业已停用，暂不能登录',
        code: 'COMPANY_DISABLED',
      });
    }

    const now = new Date();
    if (user.company.serviceExpireAt.getTime() < now.getTime()) {
      throw new UnauthorizedException({
        message: '企业服务已到期，暂不能登录',
        code: 'SERVICE_EXPIRED',
      });
    }

    const updatedUser = await this.prisma.companyUser.update({
      where: { id: user.id },
      data: { lastLoginAt: now },
      select: {
        id: true,
        companyId: true,
        username: true,
        realName: true,
        status: true,
        lastLoginAt: true,
      },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: updatedUser.id.toString(),
      username: updatedUser.username,
      role: 'company_user',
      company_id: updatedUser.companyId.toString(),
    });

    const daysLeft = Math.ceil(
      (user.company.serviceExpireAt.getTime() - now.getTime()) /
        (24 * 60 * 60 * 1000),
    );

    return {
      access_token: accessToken,
      company_user: {
        id: updatedUser.id.toString(),
        company_id: updatedUser.companyId.toString(),
        username: updatedUser.username,
        real_name: updatedUser.realName,
        status: updatedUser.status,
        last_login_at: updatedUser.lastLoginAt,
      },
      company: {
        id: user.company.id.toString(),
        name: user.company.name,
        contact_name: user.company.contactName,
        phone: user.company.phone,
        address: user.company.address,
        origin_address: user.company.originAddress,
        service_expire_at: user.company.serviceExpireAt,
        default_certificate_type: user.company.defaultCertificateType,
      },
      expire_warning:
        daysLeft <= 30
          ? {
              days_left: daysLeft,
              service_expire_at: user.company.serviceExpireAt,
            }
          : null,
    };
  }

  getJwtSecret() {
    return this.configService.get<string>('JWT_SECRET', '');
  }
}
