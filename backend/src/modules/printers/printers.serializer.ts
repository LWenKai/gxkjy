import { Prisma } from '../../generated/prisma';

export const printerInclude = {
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: {
      printLogs: true,
    },
  },
} satisfies Prisma.PrinterInclude;

export type PrinterWithRelations = Prisma.PrinterGetPayload<{
  include: typeof printerInclude;
}>;

export function serializePrinter(printer: PrinterWithRelations) {
  return {
    id: printer.id.toString(),
    company_id: printer.companyId?.toString() || null,
    company_name: printer.company?.name || null,
    printer_name: printer.printerName,
    printer_model: printer.printerModel,
    manufacturer: printer.manufacturer,
    connection_type: printer.connectionType,
    serial_no: printer.serialNo,
    mac_address: printer.macAddress,
    status: printer.status,
    last_connected_at: printer.lastConnectedAt,
    print_log_count: printer._count.printLogs,
    remark: printer.remark,
    created_at: printer.createdAt,
    updated_at: printer.updatedAt,
  };
}
