import { Company } from '../../generated/prisma';

export function parseClientModules(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === 'string')
      .filter(Boolean);
  }
  if (typeof raw === 'string' && raw.trim()) {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function serializeCompany(company: Company) {
  const modules = parseClientModules(company.clientModules);
  return {
    id: company.id.toString(),
    name: company.name,
    contact_name: company.contactName,
    phone: company.phone,
    address: company.address,
    origin_address: company.originAddress,
    customer_type: company.customerType,
    service_note: company.serviceNote,
    follow_up_note: company.followUpNote,
    status: company.status,
    service_start_at: company.serviceStartAt,
    service_expire_at: company.serviceExpireAt,
    default_certificate_type: company.defaultCertificateType,
    client_modules: company.clientModules,
    modules,
    created_at: company.createdAt,
    updated_at: company.updatedAt,
  };
}
