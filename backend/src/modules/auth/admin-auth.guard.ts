import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminUserStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithAdmin } from './admin-auth.types';

interface AdminJwtPayload {
  sub?: string;
  username?: string;
  role?: string;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const token = this.getBearerToken(request);

    if (!token) {
      throw this.getUnauthorizedError();
    }

    try {
      const payload = await this.jwtService.verifyAsync<AdminJwtPayload>(token);

      if (!payload.sub || payload.role !== 'admin') {
        throw this.getUnauthorizedError();
      }

      const adminUser = await this.prisma.adminUser.findUnique({
        where: {
          id: BigInt(payload.sub),
        },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
        },
      });

      if (!adminUser || adminUser.status !== AdminUserStatus.normal) {
        throw this.getUnauthorizedError();
      }

      request.adminUser = {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      };

      return true;
    } catch {
      throw this.getUnauthorizedError();
    }
  }

  private getBearerToken(request: RequestWithAdmin) {
    const authorization = request.headers.authorization;
    const headerValue = Array.isArray(authorization)
      ? authorization[0]
      : authorization;

    if (!headerValue?.startsWith('Bearer ')) {
      return null;
    }

    return headerValue.slice('Bearer '.length).trim();
  }

  private getUnauthorizedError() {
    return new UnauthorizedException({
      message: '未登录或登录已失效',
      code: 'UNAUTHORIZED',
    });
  }
}
