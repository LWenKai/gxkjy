import { Prisma } from '../../generated/prisma';

export const deviceWithRelations = Prisma.validator<Prisma.DeviceDefaultArgs>()({
  include: {
    company: {
      select: {
        id: true,
        name: true,
        status: true,
      },
    },
    manufacturer: {
      select: {
        id: true,
        manufacturerName: true,
        manufacturerCode: true,
        status: true,
      },
    },
  },
});

export type DeviceWithRelations = Prisma.DeviceGetPayload<
  typeof deviceWithRelations
>;

export function serializeDevice(device: DeviceWithRelations) {
  return {
    id: device.id.toString(),
    manufacturer_code: device.manufacturerCode,
    device_sn: device.deviceSn,
    device_name: device.deviceName,
    model: device.model,
    company_id: device.companyId?.toString() || null,
    status: device.status,
    last_upload_at: device.lastUploadAt,
    remark: device.remark,
    company: device.company
      ? {
          id: device.company.id.toString(),
          name: device.company.name,
          status: device.company.status,
        }
      : null,
    manufacturer: {
      id: device.manufacturer.id.toString(),
      manufacturer_name: device.manufacturer.manufacturerName,
      manufacturer_code: device.manufacturer.manufacturerCode,
      status: device.manufacturer.status,
    },
    created_at: device.createdAt,
    updated_at: device.updatedAt,
  };
}
