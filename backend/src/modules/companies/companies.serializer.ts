import { Company } from '../../generated/prisma';

export function serializeCompany(company: Company) {
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
    created_at: company.createdAt,
    updated_at: company.updatedAt,
  };
}
