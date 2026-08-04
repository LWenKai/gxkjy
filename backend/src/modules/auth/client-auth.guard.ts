import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccountStatus, CompanyStatus } from '../../generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithClientUser } from './client-auth.types';

interface ClientJwtPayload {
  sub?: string;
  username?: string;
  role?: string;
  company_id?: string;
}

@Injectable()
export class ClientAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithClientUser>();
    const token = this.getBearerToken(request);

    if (!token) {
      throw this.getUnauthorizedError();
    }

    try {
      const payload = await this.jwtService.verifyAsync<ClientJwtPayload>(token);

      if (!payload.sub || payload.role !== 'company_user') {
        throw this.getUnauthorizedError();
      }

      const user = await this.prisma.companyUser.findUnique({
        where: { id: BigInt(payload.sub) },
        include: {
          company: {
            select: {
              id: true,
              status: true,
              serviceExpireAt: true,
            },
          },
        },
      });

      if (!user || user.status !== AccountStatus.normal) {
        throw this.getUnauthorizedError();
      }
      if (
        !user.company ||
        user.company.status !== CompanyStatus.normal ||
        user.company.serviceExpireAt.getTime() < Date.now()
      ) {
        throw this.getUnauthorizedError();
      }

      request.clientUser = {
        id: user.id,
        username: user.username,
        companyId: user.companyId,
      };

      return true;
    } catch {
      throw this.getUnauthorizedError();
    }
  }

  private getBearerToken(request: RequestWithClientUser) {
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
      message: '未登录、登录已失效或企业服务不可用',
      code: 'CLIENT_UNAUTHORIZED',
    });
  }
}
