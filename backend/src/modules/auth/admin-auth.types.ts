import { AdminRole } from '../../generated/prisma';

export interface AdminRequestUser {
  id: bigint;
  username: string;
  role: AdminRole;
}

export interface RequestWithAdmin {
  headers: Record<string, string | string[] | undefined>;
  adminUser?: AdminRequestUser;
  ip?: string;
}
