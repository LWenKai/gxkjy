import {
  createPrintJob,
  getPrinterStatusText,
  K329BluetoothAdapter,
  MockPrinterAdapter,
  type CertificatePrintPayload,
  type PrintResult,
  type PrinterDeviceInfo,
  type PrinterStatus,
} from '@guxin/print-core';
import { UniK329BluetoothBridge } from './k329Bridge';
import { encodeGb18030 } from './k329Encoding';

const LAST_PRINTER_KEY = 'guxin_last_printer';
const LAST_DEBUG_KEY = 'guxin_printer_debug';

const k329Adapter = new K329BluetoothAdapter({
  bridge: new UniK329BluetoothBridge(),
  encodeText: encodeGb18030,
  scanDurationMs: 5000,
  packetSize: 20,
  packetDelayMs: 20,
});
const mockAdapter = new MockPrinterAdapter();

export interface PrinterDebugInfo {
  stage: 'scan' | 'connect' | 'disconnect' | 'print';
  time: string;
  message: string;
  deviceName?: string;
  deviceId?: string;
  serviceId?: string;
  writeCharacteristicId?: string;
}

export interface MiniappPrinterState {
  currentDevice: PrinterDeviceInfo | null;
  status: PrinterStatus;
  devices: PrinterDeviceInfo[];
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function saveDebug(info: Omit<PrinterDebugInfo, 'time'>) {
  const payload: PrinterDebugInfo = {
    ...info,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
  };
  uni.setStorageSync(LAST_DEBUG_KEY, payload);
}

export function getPrinterDebugInfo(): PrinterDebugInfo | null {
  try {
    return uni.getStorageSync(LAST_DEBUG_KEY) || null;
  } catch {
    return null;
  }
}

export function getSavedPrinter(): PrinterDeviceInfo | null {
  try {
    return uni.getStorageSync(LAST_PRINTER_KEY) || null;
  } catch {
    return null;
  }
}

export function savePrinter(device: PrinterDeviceInfo) {
  uni.setStorageSync(LAST_PRINTER_KEY, device);
}

export async function scanPrinters() {
  try {
    const devices = await k329Adapter.scanDevices();
    saveDebug({
      stage: 'scan',
      message: devices.length ? `已发现 ${devices.length} 台蓝牙设备` : '未发现可连接的打印机',
    });
    return devices;
  } catch (error) {
    saveDebug({ stage: 'scan', message: errorMessage(error, '搜索打印机失败') });
    throw error;
  }
}

export async function connectPrinter(device?: PrinterDeviceInfo) {
  const target = device || getSavedPrinter() || undefined;
  try {
    const connected = await k329Adapter.connect(target);
    savePrinter(connected);
    saveDebug({
      stage: 'connect',
      message: '打印机连接成功',
      deviceName: connected.name,
      deviceId: connected.deviceId || connected.id,
      serviceId: connected.serviceId,
      writeCharacteristicId: connected.writeCharacteristicId,
    });
    return connected;
  } catch (error) {
    saveDebug({
      stage: 'connect',
      message: errorMessage(error, '打印机连接失败'),
      deviceName: target?.name,
      deviceId: target?.deviceId || target?.id,
    });
    throw error;
  }
}

export async function disconnectPrinter() {
  try {
    await k329Adapter.disconnect();
    saveDebug({ stage: 'disconnect', message: '打印机已断开连接' });
  } catch (error) {
    saveDebug({ stage: 'disconnect', message: errorMessage(error, '断开打印机失败') });
    throw error;
  }
}

export async function getPrinterStatus() {
  return k329Adapter.getStatus();
}

export async function reconnectSavedPrinter(): Promise<PrinterDeviceInfo | null> {
  const currentStatus = await k329Adapter.getStatus();
  if (currentStatus.connected) {
    return getSavedPrinter();
  }

  const saved = getSavedPrinter();
  if (!saved) return null;
  return connectPrinter(saved);
}

export async function printCertificate(payload: CertificatePrintPayload, copies = 1): Promise<PrintResult> {
  const job = createPrintJob(payload, copies);
  const status = await k329Adapter.getStatus();
  if (status.connected) {
    const result = await k329Adapter.printLabel(job);
    saveDebug({ stage: 'print', message: result.failReason || result.message, deviceName: result.printerName });
    return result;
  }

  const saved = getSavedPrinter();
  if (saved) {
    await k329Adapter.connect(saved);
    const result = await k329Adapter.printLabel(job);
    saveDebug({ stage: 'print', message: result.failReason || result.message, deviceName: result.printerName });
    return result;
  }

  saveDebug({ stage: 'print', message: '请先连接打印设备' });
  throw new Error('请先连接打印设备');
}

export async function simulatePrint(payload: CertificatePrintPayload, copies = 1): Promise<PrintResult> {
  const job = createPrintJob(payload, copies);
  return mockAdapter.printLabel(job);
}

export { createPrintJob, getPrinterStatusText };
