import { ManufacturerInterface } from '../../generated/prisma';
import { maskSecret } from '../../common/random';

export function serializeManufacturerInterface(item: ManufacturerInterface) {
  return {
    id: item.id.toString(),
    manufacturer_name: item.manufacturerName,
    manufacturer_code: item.manufacturerCode,
    access_secret_masked: maskSecret(item.accessSecret),
    integration_type: item.integrationType,
    status: item.status,
    sign_rule: item.signRule,
    allowed_ips: item.allowedIps,
    last_sync_at: item.lastSyncAt,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  };
}
