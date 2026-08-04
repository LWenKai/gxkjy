import type {
  K329BluetoothBridge,
  K329BluetoothBridgeCharacteristic,
  K329BluetoothBridgeDevice,
  K329BluetoothBridgeService,
} from '@guxin/print-core';

type UniCallback<T> = {
  success?: (result: T) => void;
  fail?: (error: unknown) => void;
};

function formatUniError(name: string, error: unknown) {
  if (error instanceof Error) return error;

  if (error && typeof error === 'object') {
    const value = error as Record<string, unknown>;
    const errMsg = String(value.errMsg || value.message || '');
    const errCode = value.errCode || value.code;
    const detail = errCode ? `${errMsg} (${errCode})` : errMsg;
    const readable = detail || JSON.stringify(value);
    return new Error(`${name} 失败：${readable}`);
  }

  return new Error(`${name} 失败：${String(error || '未知错误')}`);
}

function callUni<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    const api = (uni as unknown as Record<string, Function>)[name];
    if (typeof api !== 'function') {
      reject(new Error('当前环境不支持蓝牙打印'));
      return;
    }
    api({
      ...args,
      success: (result: T) => resolve(result),
      fail: (error: unknown) => reject(formatUniError(name, error)),
    } as UniCallback<T>);
  });
}

export class UniK329BluetoothBridge implements K329BluetoothBridge {
  openBluetoothAdapter(): Promise<void> {
    return callUni<void>('openBluetoothAdapter');
  }

  async getBluetoothAdapterState() {
    return callUni<{ available: boolean; discovering: boolean }>('getBluetoothAdapterState');
  }

  startBluetoothDevicesDiscovery(): Promise<void> {
    return callUni<void>('startBluetoothDevicesDiscovery', { allowDuplicatesKey: false });
  }

  stopBluetoothDevicesDiscovery(): Promise<void> {
    return callUni<void>('stopBluetoothDevicesDiscovery');
  }

  async getBluetoothDevices(): Promise<K329BluetoothBridgeDevice[]> {
    const result = await callUni<{ devices: K329BluetoothBridgeDevice[] }>('getBluetoothDevices');
    return result.devices || [];
  }

  createBLEConnection(deviceId: string): Promise<void> {
    return callUni<void>('createBLEConnection', { deviceId });
  }

  closeBLEConnection(deviceId: string): Promise<void> {
    return callUni<void>('closeBLEConnection', { deviceId });
  }

  async getBLEDeviceServices(deviceId: string): Promise<K329BluetoothBridgeService[]> {
    const result = await callUni<{ services: K329BluetoothBridgeService[] }>('getBLEDeviceServices', {
      deviceId,
    });
    return result.services || [];
  }

  async getBLEDeviceCharacteristics(
    deviceId: string,
    serviceId: string,
  ): Promise<K329BluetoothBridgeCharacteristic[]> {
    const result = await callUni<{ characteristics: K329BluetoothBridgeCharacteristic[] }>(
      'getBLEDeviceCharacteristics',
      { deviceId, serviceId },
    );
    return result.characteristics || [];
  }

  writeBLECharacteristicValue(args: {
    deviceId: string;
    serviceId: string;
    characteristicId: string;
    value: ArrayBuffer;
  }): Promise<void> {
    return callUni<void>('writeBLECharacteristicValue', args);
  }

  notifyBLECharacteristicValueChange(args: {
    deviceId: string;
    serviceId: string;
    characteristicId: string;
    state: boolean;
  }): Promise<void> {
    return callUni<void>('notifyBLECharacteristicValueChange', args);
  }

  onBLECharacteristicValueChange(handler: (value: ArrayBuffer) => void): void {
    const api = (uni as unknown as Record<string, Function>).onBLECharacteristicValueChange;
    if (typeof api !== 'function') return;
    api((result: { value: ArrayBuffer }) => handler(result.value));
  }
}
