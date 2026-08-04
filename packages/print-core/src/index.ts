export type CertificateType = 'agri_commitment_certificate' | 'enterprise_quick_test_label';

export type PrintAdapterType = 'mock' | 'k329_bluetooth' | 'usb' | 'wifi';

export type PrinterConnectionType = 'mock' | 'bluetooth' | 'usb' | 'wifi';

export type PrintJobStatus = 'pending' | 'printing' | 'success' | 'failed' | 'simulated';

export type PrinterStatusCode =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'printing'
  | 'completed'
  | 'paper_out'
  | 'cover_open'
  | 'low_battery'
  | 'overheated'
  | 'gap_error'
  | 'black_mark_error'
  | 'failed'
  | 'unsupported';

export interface LabelSize {
  widthMm: number;
  heightMm: number;
}

export interface CertificatePrintItem {
  name: string;
  value?: string;
  unit?: string;
  limitValue?: string;
  result?: string;
}

export interface CertificatePrintPayload {
  certificateId?: string;
  certificateNo: string;
  certificateType: CertificateType;
  title: string;
  productName: string;
  quantity: string;
  unit?: string;
  origin: string;
  promiseSubject: string;
  contactPhone: string;
  commitmentBasis?: string;
  testItems?: CertificatePrintItem[];
  issueTime: string;
  qrUrl: string;
  remark?: string;
}

export interface LabelTextLine {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface CertificateLabelTemplate {
  size: LabelSize;
  title: string;
  lines: LabelTextLine[];
  qrUrl: string;
  footer: string;
  meta: {
    dpi: number;
    commandPreference: 'tspl' | 'cpcl' | 'escpos' | 'image';
  };
}

export interface PrinterDeviceInfo {
  id: string;
  name: string;
  adapterType: PrintAdapterType;
  connectionType: PrinterConnectionType;
  model?: string;
  manufacturer?: string;
  connected: boolean;
  rssi?: number;
  deviceId?: string;
  serviceId?: string;
  writeCharacteristicId?: string;
  notifyCharacteristicId?: string;
  readCharacteristicId?: string;
  lastConnectedAt?: string;
}

export interface PrinterStatus {
  code: PrinterStatusCode;
  message: string;
  connected: boolean;
  batteryPercent?: number;
  paperReady?: boolean;
  coverClosed?: boolean;
}

export interface PrintJob {
  jobId: string;
  certificateId?: string;
  copies: number;
  label: CertificateLabelTemplate;
  rawPayload: CertificatePrintPayload;
}

export interface PrintResult {
  status: PrintJobStatus;
  adapterType: PrintAdapterType;
  connectionType: PrinterConnectionType;
  printerName?: string;
  printerModel?: string;
  message: string;
  failReason?: string;
  printedAt: string;
}

export interface PrinterAdapter {
  type: PrintAdapterType;
  displayName: string;
  scanDevices(): Promise<PrinterDeviceInfo[]>;
  connect(device?: PrinterDeviceInfo): Promise<PrinterDeviceInfo>;
  disconnect(): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
  printLabel(job: PrintJob): Promise<PrintResult>;
  getBattery(): Promise<number | null>;
  getPaperStatus(): Promise<Pick<PrinterStatus, 'paperReady' | 'coverClosed' | 'code' | 'message'>>;
}

export interface K329BluetoothBridgeDevice {
  deviceId: string;
  name?: string;
  localName?: string;
  RSSI?: number;
}

export interface K329BluetoothBridgeService {
  uuid: string;
}

export interface K329BluetoothBridgeCharacteristic {
  uuid: string;
  properties: {
    read?: boolean;
    write?: boolean;
    notify?: boolean;
    indicate?: boolean;
  };
}

export interface K329BluetoothBridge {
  openBluetoothAdapter(): Promise<void>;
  getBluetoothAdapterState(): Promise<{ available: boolean; discovering: boolean }>;
  startBluetoothDevicesDiscovery(): Promise<void>;
  stopBluetoothDevicesDiscovery(): Promise<void>;
  getBluetoothDevices(): Promise<K329BluetoothBridgeDevice[]>;
  createBLEConnection(deviceId: string): Promise<void>;
  closeBLEConnection(deviceId: string): Promise<void>;
  getBLEDeviceServices(deviceId: string): Promise<K329BluetoothBridgeService[]>;
  getBLEDeviceCharacteristics(
    deviceId: string,
    serviceId: string,
  ): Promise<K329BluetoothBridgeCharacteristic[]>;
  writeBLECharacteristicValue(args: {
    deviceId: string;
    serviceId: string;
    characteristicId: string;
    value: ArrayBuffer;
  }): Promise<void>;
  notifyBLECharacteristicValueChange?(args: {
    deviceId: string;
    serviceId: string;
    characteristicId: string;
    state: boolean;
  }): Promise<void>;
  onBLECharacteristicValueChange?(handler: (value: ArrayBuffer) => void): void;
}

export interface K329BluetoothAdapterOptions {
  bridge: K329BluetoothBridge;
  encodeText: (value: string) => number[];
  scanDurationMs?: number;
  packetSize?: number;
  packetDelayMs?: number;
}

export const DEFAULT_LABEL_SIZE: LabelSize = {
  widthMm: 75,
  heightMm: 60,
};

export const K329_CAPABILITY = {
  manufacturer: '优博讯',
  model: 'K329',
  dpi: 203,
  maxPrintWidthMm: 72,
  supportedPaperWidthMm: [42, 80],
  supportedCommands: ['ESC/POS', 'CPCL', 'TSPL'],
  preferredCommand: 'tspl' as const,
  supportsQrCode: true,
  supportsLabelPaper: true,
  supportsStatusBack: true,
};

export function getPrinterStatusText(code: PrinterStatusCode) {
  const map: Record<PrinterStatusCode, string> = {
    idle: '打印机空闲',
    scanning: '正在搜索打印机',
    connecting: '正在连接打印机',
    connected: '打印机已连接',
    disconnected: '打印机未连接',
    printing: '正在打印',
    completed: '打印完成',
    paper_out: '请装纸',
    cover_open: '请关闭打印机盖',
    low_battery: '打印机电量不足',
    overheated: '打印头过热，请稍后重试',
    gap_error: '标签纸间隙识别失败',
    black_mark_error: '黑标识别失败',
    failed: '打印失败，请重新打印',
    unsupported: '当前环境暂不支持真实打印',
  };
  return map[code];
}

function safeText(value: string | undefined, fallback = '-') {
  return (value || fallback).replace(/[\r\n"]/g, ' ').trim();
}

function mmToDot(mm: number) {
  return Math.round(mm * 8);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dateOnlyText(value: string) {
  return safeText(value).slice(0, 10).replace(/-/g, '/');
}

function shortText(value: string | undefined, length: number) {
  return safeText(value).slice(0, length);
}

function basisText(current: string | undefined) {
  const value = current || '\u81ea\u884c\u68c0\u6d4b\u5408\u683c';
  if (value.includes('\u8d28\u91cf\u5b89\u5168\u63a7\u5236')) return '\u8d28\u91cf\u5b89\u5168\u63a7\u5236\u7b26\u5408\u8981\u6c42';
  if (value.includes('\u59d4\u6258\u68c0\u6d4b')) return '\u59d4\u6258\u68c0\u6d4b\u5408\u683c';
  return '\u81ea\u884c\u68c0\u6d4b\u5408\u683c';
}

export function buildCertificateLabel(payload: CertificatePrintPayload): CertificateLabelTemplate {
  const quantity = [payload.quantity, payload.unit].filter(Boolean).join(' ');

  return {
    size: DEFAULT_LABEL_SIZE,
    title: '\u627f\u8bfa\u8fbe\u6807\u5408\u683c\u8bc1',
    qrUrl: payload.qrUrl,
    footer: '\u626b\u7801\u67e5\u770b',
    meta: {
      dpi: K329_CAPABILITY.dpi,
      commandPreference: K329_CAPABILITY.preferredCommand,
    },
    lines: [
      { label: '\u627f\u8bfa\u4f9d\u636e', value: basisText(payload.commitmentBasis) },
      { label: '\u5408\u683c\u8bc1\u53f7', value: payload.certificateNo },
      { label: '\u4ea7\u54c1\u540d\u79f0', value: payload.productName },
      { label: '\u91cd\u91cf\u6570\u91cf', value: quantity || payload.quantity },
      { label: '\u5f00\u5177\u65e5\u671f', value: dateOnlyText(payload.issueTime) },
      { label: '\u8054\u7cfb\u65b9\u5f0f', value: payload.contactPhone },
      { label: '\u4ea7\u5730', value: payload.origin || '-' },
      { label: '\u627f\u8bfa\u4e3b\u4f53', value: payload.promiseSubject },
    ],
  };
}

export function buildK329TsplCommand(job: PrintJob): string {
  const label = job.label;
  const width = label.size.widthMm;
  const height = label.size.heightMm;
  const isWidePaper = width >= 70;
  const qrX = mmToDot(isWidePaper ? 56 : 41);
  const qrY = mmToDot(isWidePaper ? 12 : 8);
  const qrCell = isWidePaper ? 5 : 4;
  const rightTextX = mmToDot(isWidePaper ? 55 : 41);
  const pageRight = mmToDot(width) - 12;
  const pageBottom = mmToDot(height) - 12;
  const lines = label.lines.slice(0, isWidePaper ? 10 : 9);
  const maxLineLength = isWidePaper ? 31 : 22;
  const text = (x: number, y: number, font: string, scaleX: number, scaleY: number, value: string) =>
    `TEXT ${x},${y},"${font}",0,${scaleX},${scaleY},"${safeText(value)}"\r\n`;

  let command = '';
  command += `SIZE ${width} mm,${height} mm\r\n`;
  command += 'GAP 2 mm,0 mm\r\n';
  command += 'DIRECTION 1\r\n';
  command += 'REFERENCE 0,0\r\n';
  command += 'SPEED 4\r\n';
  command += 'DENSITY 8\r\n';
  command += 'CLS\r\n';

  if (isWidePaper) {
    const payload = job.rawPayload;
    const quantity = [payload.quantity, payload.unit].filter(Boolean).join(' ') || payload.quantity;
    const qrDotX = mmToDot(52);
    const qrDotY = mmToDot(17);
    command += text(134, 18, 'TSS24.BF2', 2, 2, label.title);
    command += text(28, 84, 'TSS24.BF2', 1, 1, `\u627f\u8bfa\u4f9d\u636e: ${basisText(payload.commitmentBasis)}`);
    command += `QRCODE ${qrDotX},${qrDotY},L,4,A,0,"${safeText(label.qrUrl)}"\r\n`;
    command += text(qrDotX + 20, qrDotY + 150, 'TSS16.BF2', 1, 1, '\u626b\u7801\u67e5\u770b');

    command += text(28, 124, 'TSS24.BF2', 1, 1, `\u5408\u683c\u8bc1\u53f7: ${shortText(payload.certificateNo, 18)}`);
    command += text(28, 164, 'TSS24.BF2', 1, 1, `\u4ea7\u54c1\u540d\u79f0: ${shortText(payload.productName, 13)}`);
    command += text(28, 204, 'TSS24.BF2', 1, 1, `\u91cd\u91cf\u6570\u91cf: ${shortText(quantity, 10)}`);
    command += text(28, 244, 'TSS24.BF2', 1, 1, `\u5f00\u5177\u65e5\u671f: ${dateOnlyText(payload.issueTime)}`);
    command += text(28, 284, 'TSS24.BF2', 1, 1, `\u8054\u7cfb\u65b9\u5f0f: ${shortText(payload.contactPhone, 13)}`);
    command += text(28, 324, 'TSS24.BF2', 1, 1, `\u4ea7\u5730: ${shortText(payload.origin, 20)}`);
    command += text(28, 364, 'TSS24.BF2', 1, 1, `\u627f\u8bfa\u4e3b\u4f53: ${shortText(payload.promiseSubject, 18)}`);

    command += `PRINT ${job.copies},1\r\n`;
    return command;
  }

  command += `BOX 10,10,${pageRight},${pageBottom},2\r\n`;
  command += text(28, 22, 'TSS24.BF2', 1, 1, label.title);
  command += `BAR 18,58,${pageRight - 18},2\r\n`;
  command += `QRCODE ${qrX},${qrY},L,${qrCell},A,0,"${safeText(label.qrUrl)}"\r\n`;
  command += `BAR ${mmToDot(54)},62,2,${pageBottom - 92}\r\n`;
  command += text(rightTextX, mmToDot(47), 'TSS16.BF2', 1, 1, label.footer);

  let y = 82;
  for (const line of lines) {
    const value = `${line.label}: ${line.value}`;
    command += text(22, y, line.emphasis ? 'TSS24.BF2' : 'TSS20.BF2', 1, 1, value.slice(0, maxLineLength));
    y += line.emphasis ? 32 : isWidePaper ? 27 : 25;
  }

  command += `PRINT ${job.copies},1\r\n`;
  return command;
}

export function encodeTsplCommand(command: string, encoder: (value: string) => number[]) {
  return encoder(command);
}

export function createPrintJob(payload: CertificatePrintPayload, copies = 1): PrintJob {
  return {
    jobId: `print_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`,
    certificateId: payload.certificateId,
    copies: Math.max(1, Math.floor(copies || 1)),
    label: buildCertificateLabel(payload),
    rawPayload: payload,
  };
}

export class MockPrinterAdapter implements PrinterAdapter {
  type: PrintAdapterType = 'mock';
  displayName = '模拟打印机';

  private device: PrinterDeviceInfo = {
    id: 'mock-printer',
    name: '模拟打印机',
    adapterType: 'mock',
    connectionType: 'mock',
    model: 'Mock',
    connected: false,
  };

  async scanDevices(): Promise<PrinterDeviceInfo[]> {
    return [this.device];
  }

  async connect(): Promise<PrinterDeviceInfo> {
    this.device = {
      ...this.device,
      connected: true,
      lastConnectedAt: new Date().toISOString(),
    };
    return this.device;
  }

  async disconnect(): Promise<void> {
    this.device = { ...this.device, connected: false };
  }

  async getStatus(): Promise<PrinterStatus> {
    return {
      code: this.device.connected ? 'connected' : 'disconnected',
      message: this.device.connected ? '模拟打印机已连接' : '模拟打印机未连接',
      connected: this.device.connected,
      batteryPercent: 100,
      paperReady: true,
      coverClosed: true,
    };
  }

  async printLabel(job: PrintJob): Promise<PrintResult> {
    if (!this.device.connected) {
      await this.connect();
    }

    return {
      status: 'simulated',
      adapterType: this.type,
      connectionType: this.device.connectionType,
      printerName: this.device.name,
      printerModel: this.device.model,
      message: `模拟打印成功，共 ${job.copies} 份`,
      printedAt: new Date().toISOString(),
    };
  }

  async getBattery(): Promise<number> {
    return 100;
  }

  async getPaperStatus() {
    return {
      code: 'connected' as PrinterStatusCode,
      message: '模拟打印机纸张正常',
      paperReady: true,
      coverClosed: true,
    };
  }
}

export class K329BluetoothAdapter implements PrinterAdapter {
  type: PrintAdapterType = 'k329_bluetooth';
  displayName = '优博讯 K329 蓝牙打印';

  private bridge: K329BluetoothBridge;
  private encodeText: (value: string) => number[];
  private scanDurationMs: number;
  private packetSize: number;
  private packetDelayMs: number;
  private device: PrinterDeviceInfo | null = null;
  private status: PrinterStatus = {
    code: 'disconnected',
    message: getPrinterStatusText('disconnected'),
    connected: false,
  };

  constructor(options: K329BluetoothAdapterOptions) {
    this.bridge = options.bridge;
    this.encodeText = options.encodeText;
    this.scanDurationMs = options.scanDurationMs ?? 5000;
    this.packetSize = options.packetSize ?? 20;
    this.packetDelayMs = options.packetDelayMs ?? 20;
  }

  async scanDevices(): Promise<PrinterDeviceInfo[]> {
    this.status = { code: 'scanning', message: getPrinterStatusText('scanning'), connected: false };
    await this.bridge.openBluetoothAdapter();
    const adapterState = await this.bridge.getBluetoothAdapterState();
    if (!adapterState.available) {
      throw new Error('本机蓝牙不可用，请先打开蓝牙');
    }
    if (adapterState.discovering) {
      await this.bridge.stopBluetoothDevicesDiscovery().catch(() => undefined);
    }
    await this.bridge.startBluetoothDevicesDiscovery();
    await delay(this.scanDurationMs);
    const devices = await this.bridge.getBluetoothDevices();
    await this.bridge.stopBluetoothDevicesDiscovery().catch(() => undefined);
    this.status = { code: 'disconnected', message: getPrinterStatusText('disconnected'), connected: false };
    return devices
      .filter((device) => {
        const name = device.name || device.localName || '';
        return Boolean(name && name !== '未知设备');
      })
      .map((device) => {
        const name = device.name || device.localName || 'K329 打印机';
        return {
          id: device.deviceId,
          deviceId: device.deviceId,
          name,
          adapterType: this.type,
          connectionType: 'bluetooth',
          model: name.toUpperCase().includes('K329') ? 'K329' : undefined,
          manufacturer: '优博讯',
          connected: this.device?.deviceId === device.deviceId && this.status.connected,
          rssi: device.RSSI,
        };
      });
  }

  async connect(device?: PrinterDeviceInfo): Promise<PrinterDeviceInfo> {
    const target = device || this.device;
    if (!target?.deviceId && !target?.id) {
      throw new Error('请先选择打印机');
    }
    const deviceId = target.deviceId || target.id;
    this.status = { code: 'connecting', message: getPrinterStatusText('connecting'), connected: false };
    await this.bridge.createBLEConnection(deviceId);
    const services = await this.bridge.getBLEDeviceServices(deviceId);
    const chars = await this.findCharacteristics(deviceId, services);
    this.device = {
      ...target,
      id: deviceId,
      deviceId,
      name: target.name || '优博讯 K329',
      adapterType: this.type,
      connectionType: 'bluetooth',
      model: target.model || 'K329',
      manufacturer: '优博讯',
      connected: true,
      serviceId: chars.writeServiceId,
      writeCharacteristicId: chars.writeCharacteristicId,
      notifyCharacteristicId: chars.notifyCharacteristicId,
      readCharacteristicId: chars.readCharacteristicId,
      lastConnectedAt: new Date().toISOString(),
    };
    this.status = {
      code: 'connected',
      message: getPrinterStatusText('connected'),
      connected: true,
      paperReady: true,
      coverClosed: true,
    };
    return this.device;
  }

  async disconnect(): Promise<void> {
    if (this.device?.deviceId) {
      await this.bridge.closeBLEConnection(this.device.deviceId).catch(() => undefined);
    }
    if (this.device) {
      this.device = { ...this.device, connected: false };
    }
    this.status = { code: 'disconnected', message: getPrinterStatusText('disconnected'), connected: false };
  }

  async getStatus(): Promise<PrinterStatus> {
    return this.status;
  }

  async printLabel(job: PrintJob): Promise<PrintResult> {
    if (!this.device?.connected) {
      throw new Error('打印机未连接');
    }

    this.status = { ...this.status, code: 'printing', message: getPrinterStatusText('printing'), connected: true };
    try {
      const command = buildK329TsplCommand(job);
      const bytes = encodeTsplCommand(command, this.encodeText);
      await this.write(bytes);
      this.status = { ...this.status, code: 'completed', message: getPrinterStatusText('completed'), connected: true };
      return {
        status: 'success',
        adapterType: this.type,
        connectionType: 'bluetooth',
        printerName: this.device.name,
        printerModel: this.device.model || 'K329',
        message: '打印完成',
        printedAt: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : '打印失败，请重新打印';
      this.status = { ...this.status, code: 'failed', message, connected: true };
      return {
        status: 'failed',
        adapterType: this.type,
        connectionType: 'bluetooth',
        printerName: this.device.name,
        printerModel: this.device.model || 'K329',
        message: '打印失败，请重新打印',
        failReason: message,
        printedAt: new Date().toISOString(),
      };
    }
  }

  async getBattery(): Promise<number | null> {
    return this.status.batteryPercent ?? null;
  }

  async getPaperStatus() {
    return {
      code: this.status.code,
      message: this.status.message,
      paperReady: this.status.paperReady,
      coverClosed: this.status.coverClosed,
    };
  }

  async write(bytes: number[] | Uint8Array): Promise<void> {
    if (!this.device?.deviceId || !this.device.serviceId || !this.device.writeCharacteristicId) {
      throw new Error('打印机连接信息不完整');
    }
    const data = Array.from(bytes);
    for (let offset = 0; offset < data.length; offset += this.packetSize) {
      const chunk = data.slice(offset, offset + this.packetSize);
      const buffer = new ArrayBuffer(chunk.length);
      const view = new DataView(buffer);
      chunk.forEach((value, index) => view.setUint8(index, value));
      await this.bridge.writeBLECharacteristicValue({
        deviceId: this.device.deviceId,
        serviceId: this.device.serviceId,
        characteristicId: this.device.writeCharacteristicId,
        value: buffer,
      });
      if (this.packetDelayMs > 0) {
        await delay(this.packetDelayMs);
      }
    }
  }

  private async findCharacteristics(deviceId: string, services: K329BluetoothBridgeService[]) {
    for (const service of services) {
      const characteristics = await this.bridge.getBLEDeviceCharacteristics(deviceId, service.uuid);
      let writeCharacteristicId = '';
      let notifyCharacteristicId = '';
      let readCharacteristicId = '';

      for (const item of characteristics) {
        if (!writeCharacteristicId && item.properties.write) writeCharacteristicId = item.uuid;
        if (!notifyCharacteristicId && (item.properties.notify || item.properties.indicate)) {
          notifyCharacteristicId = item.uuid;
        }
        if (!readCharacteristicId && item.properties.read) readCharacteristicId = item.uuid;
      }

      if (writeCharacteristicId) {
        return {
          writeServiceId: service.uuid,
          writeCharacteristicId,
          notifyCharacteristicId,
          readCharacteristicId,
        };
      }
    }
    throw new Error('未找到可写入的打印机蓝牙通道');
  }
}

export class UsbPrinterAdapter extends K329BluetoothAdapter {
  type: PrintAdapterType = 'usb';
  displayName = 'USB 打印适配器预留';
}

export class WifiPrinterAdapter extends K329BluetoothAdapter {
  type: PrintAdapterType = 'wifi';
  displayName = 'WiFi 打印适配器预留';
}
