import { downloadCsv, request } from './request';
import type { PageResult, Printer } from '@/types/api';

export interface PrinterQuery {
  page: number;
  page_size: number;
  keyword?: string;
  company_id?: string;
  connection_type?: 'mock' | 'bluetooth' | 'usb' | 'wifi' | '';
  status?: 'inactive' | 'available' | 'connected' | 'disabled' | '';
}

export interface PrinterPayload {
  company_id?: string;
  printer_name: string;
  printer_model: string;
  manufacturer?: string;
  connection_type: 'mock' | 'bluetooth' | 'usb' | 'wifi';
  serial_no?: string;
  mac_address?: string;
  status?: 'inactive' | 'available' | 'connected' | 'disabled';
  remark?: string;
}

export interface PrinterTestPayload {
  title: string;
  printer_model: string;
  connection_type: string;
  label_size: string;
  tests: Array<{ name: string; status: string; remark: string }>;
  note: string;
}

export function listPrinters(params: PrinterQuery) {
  return request<PageResult<Printer>>({
    url: '/admin/printers',
    method: 'GET',
    params,
  });
}

export function createPrinter(data: PrinterPayload) {
  return request<Printer>({
    url: '/admin/printers',
    method: 'POST',
    data,
  });
}

export function getPrinterTestPayload() {
  return request<PrinterTestPayload>({
    url: '/admin/printers/test-payload',
    method: 'GET',
  });
}

export function exportPrinters(params: Omit<PrinterQuery, 'page' | 'page_size'>) {
  return downloadCsv(
    {
      url: '/admin/printers/export',
      method: 'GET',
      params,
    },
    '打印设备导出.csv',
  );
}
