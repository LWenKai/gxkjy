export interface ClientRequestUser {
  id: bigint;
  username: string;
  companyId: bigint;
}

export interface RequestWithClientUser {
  headers: Record<string, string | string[] | undefined>;
  clientUser?: ClientRequestUser;
  ip?: string;
}
