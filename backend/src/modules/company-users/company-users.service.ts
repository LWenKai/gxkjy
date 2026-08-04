import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AccountStatus } from '../../generated/prisma';
import { getPagination, PaginationDto } from '../../common/pagination.dto';
import { generateTemporaryPassword } from '../../common/random';
import { isPrismaUniqueError } from '../../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { RequestWithAdmin } from '../auth/admin-auth.types';
import { CreateCompanyUserDto } from './dto/create-company-user.dto';
import { ResetCompanyUserPasswordDto } from './dto/reset-company-user-password.dto';
import { serializeCompanyUser } from './company-users.serializer';

@Injectable()
export class CompanyUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operationLogs: OperationLogsService,
  ) {}

  async listCompanyUsers(companyId: bigint, query: PaginationDto) {
    await this.ensureCompanyExists(companyId);
    const { page, pageSize, skip, take } = getPagination(query);

    const [total, users] = await this.prisma.$transaction([
      this.prisma.companyUser.count({ where: { companyId } }),
      this.prisma.companyUser.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: users.map(serializeCompanyUser),
    };
  }

  async createCompanyUser(
    companyId: bigint,
    dto: CreateCompanyUserDto,
    request: RequestWithAdmin,
  ) {
    await this.ensureCompanyExists(companyId);

    const generatedPassword = dto.password ? null : generateTemporaryPassword();
    const plainPassword = dto.password || generatedPassword!;
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    try {
      const user = await this.prisma.companyUser.create({
        data: {
          companyId,
          username: dto.username,
          passwordHash,
          realName: dto.real_name || null,
          status: dto.status || AccountStatus.normal,
        },
      });

      await this.writeLog(request, user.id, 'company_user.create', {
        company_id: companyId.toString(),
        username: dto.username,
      });

      return {
        ...serializeCompanyUser(user),
        ...(generatedPassword ? { initial_password: generatedPassword } : {}),
      };
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        throw new ConflictException({
          message: '账号已存在',
          code: 'USERNAME_EXISTS',
        });
      }
      throw error;
    }
  }

  async resetPassword(
    userId: bigint,
    dto: ResetCompanyUserPasswordDto,
    request: RequestWithAdmin,
  ) {
    await this.findCompanyUserOrThrow(userId);

    const generatedPassword = dto.password ? null : generateTemporaryPassword();
    const plainPassword = dto.password || generatedPassword!;
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    const user = await this.prisma.companyUser.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.writeLog(request, userId, 'company_user.reset_password');

    return {
      ...serializeCompanyUser(user),
      ...(generatedPassword ? { initial_password: generatedPassword } : {}),
    };
  }

  async enableUser(userId: bigint, request: RequestWithAdmin) {
    return this.setUserStatus(userId, AccountStatus.normal, request);
  }

  async disableUser(userId: bigint, request: RequestWithAdmin) {
    return this.setUserStatus(userId, AccountStatus.disabled, request);
  }

  private async setUserStatus(
    userId: bigint,
    status: AccountStatus,
    request: RequestWithAdmin,
  ) {
    await this.findCompanyUserOrThrow(userId);

    const user = await this.prisma.companyUser.update({
      where: { id: userId },
      data: { status },
    });

    await this.writeLog(request, userId, `company_user.${status}`, { status });

    return serializeCompanyUser(user);
  }

  private async ensureCompanyExists(companyId: bigint) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new NotFoundException({
        message: '企业不存在',
        code: 'COMPANY_NOT_FOUND',
      });
    }
  }

  private async findCompanyUserOrThrow(userId: bigint) {
    const user = await this.prisma.companyUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException({
        message: '企业账号不存在',
        code: 'COMPANY_USER_NOT_FOUND',
      });
    }

    return user;
  }

  private async writeLog(
    request: RequestWithAdmin,
    userId: bigint,
    action: string,
    content?: unknown,
  ) {
    await this.operationLogs.writeAdminLog({
      adminId: request.adminUser!.id,
      targetType: 'company_user',
      targetId: userId,
      action,
      content,
      ip: request.ip,
    });
  }
}
