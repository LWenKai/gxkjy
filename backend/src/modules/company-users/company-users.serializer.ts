import { CompanyUser } from '../../generated/prisma';

export function serializeCompanyUser(user: CompanyUser) {
  return {
    id: user.id.toString(),
    company_id: user.companyId.toString(),
    username: user.username,
    real_name: user.realName,
    status: user.status,
    last_login_at: user.lastLoginAt,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}
