import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AdminRole } from '../../generated/prisma';
import { RequestWithAdmin } from './admin-auth.types';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();

    if (request.adminUser?.role !== AdminRole.super_admin) {
      throw new ForbiddenException({
        message: '仅超级管理员可使用客户管理',
        code: 'SUPER_ADMIN_ONLY',
      });
    }

    return true;
  }
}
