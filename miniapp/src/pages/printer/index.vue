<script setup lang="ts">
import { ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import type { PrinterDeviceInfo, PrinterStatus } from '@guxin/print-core';
import {
  connectPrinter,
  getPrinterStatus,
  getPrinterStatusText,
  getSavedPrinter,
  reconnectSavedPrinter,
  scanPrinters,
} from '@/print/printer';

interface MiniappPrinterState {
  currentDevice: PrinterDeviceInfo | null;
  status: PrinterStatus;
  devices: PrinterDeviceInfo[];
}

const TEXT = {
  disconnected: '\u6253\u5370\u673a\u672a\u8fde\u63a5',
  noDevice: '\u672a\u9009\u62e9',
  currentPrinter: '\u5f53\u524d\u6253\u5370\u673a',
  connected: '\u5df2\u8fde\u63a5',
  notConnected: '\u672a\u8fde\u63a5',
  noFound: '\u6682\u672a\u53d1\u73b0\u6253\u5370\u673a',
  scanFailed: '\u641c\u7d22\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u84dd\u7259',
  connectedToast: '\u6253\u5370\u673a\u5df2\u8fde\u63a5',
  connectFailed: '\u8fde\u63a5\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5',
  autoConnecting: '\u6b63\u5728\u81ea\u52a8\u8fde\u63a5\u4e0a\u6b21\u4f7f\u7528\u7684\u6253\u5370\u673a',
  autoFailed: '\u672a\u81ea\u52a8\u8fde\u63a5\u6210\u529f\uff0c\u53ef\u624b\u52a8\u641c\u7d22\u6253\u5370\u673a',
  bluetoothPrinter: '\u84dd\u7259\u6253\u5370\u673a',
  signal: '\u4fe1\u53f7',
  connecting: '\u8fde\u63a5\u4e2d',
  connect: '\u8fde\u63a5',
  changePrinter: '\u66f4\u6362\u6253\u5370\u673a',
};

const state = ref<MiniappPrinterState>({
  currentDevice: getSavedPrinter(),
  devices: [],
  status: {
    code: 'disconnected',
    message: TEXT.disconnected,
    connected: false,
  },
});
const scanning = ref(false);
const connectingId = ref('');
const autoConnecting = ref(false);
const showSearchPanel = ref(!getSavedPrinter());

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.switchTab({ url: '/pages/profile/index' });
}

async function refreshStatus() {
  state.value.status = await getPrinterStatus();
}

async function scan() {
  showSearchPanel.value = true;
  scanning.value = true;
  try {
    state.value.status = {
      code: 'scanning',
      message: getPrinterStatusText('scanning'),
      connected: false,
    };
    state.value.devices = await scanPrinters();
    if (!state.value.devices.length) {
      uni.showToast({ title: TEXT.noFound, icon: 'none' });
    }
  } catch (error) {
    uni.showToast({
      title: error instanceof Error ? error.message : TEXT.scanFailed,
      icon: 'none',
    });
  } finally {
    scanning.value = false;
    await refreshStatus();
  }
}

async function connect(device: PrinterDeviceInfo) {
  connectingId.value = device.id;
  try {
    state.value.status = {
      code: 'connecting',
      message: getPrinterStatusText('connecting'),
      connected: false,
    };
    state.value.currentDevice = await connectPrinter(device);
    await refreshStatus();
    state.value.devices = [];
    showSearchPanel.value = false;
    uni.showToast({ title: TEXT.connectedToast, icon: 'success' });
  } catch (error) {
    state.value.status = {
      code: 'failed',
      message: getPrinterStatusText('failed'),
      connected: false,
    };
    uni.showToast({
      title: error instanceof Error ? error.message : TEXT.connectFailed,
      icon: 'none',
    });
  } finally {
    connectingId.value = '';
  }
}

async function autoConnectSaved() {
  const saved = getSavedPrinter();
  if (!saved || state.value.status.connected || autoConnecting.value) return;
  autoConnecting.value = true;
  connectingId.value = saved.id;
  state.value.currentDevice = saved;
  state.value.status = {
    code: 'connecting',
    message: TEXT.autoConnecting,
    connected: false,
  };
  try {
    state.value.currentDevice = await reconnectSavedPrinter();
    showSearchPanel.value = false;
  } catch {
    state.value.status = {
      code: 'disconnected',
      message: TEXT.autoFailed,
      connected: false,
    };
    showSearchPanel.value = true;
  } finally {
    connectingId.value = '';
    autoConnecting.value = false;
    await refreshStatus().catch(() => undefined);
  }
}

function changePrinter() {
  showSearchPanel.value = true;
  state.value.devices = [];
}

onShow(() => {
  state.value.currentDevice = getSavedPrinter();
  showSearchPanel.value = !state.value.currentDevice;
  refreshStatus()
    .then(() => autoConnectSaved())
    .catch(() => autoConnectSaved());
});
</script>

<template>
  <view class="page">
    <view class="top-nav">
      <view class="back-btn" @tap="goBack">&#x8FD4;&#x56DE;</view>
      <view>
        <text class="page-title">&#x6253;&#x5370;&#x673A;&#x7BA1;&#x7406;</text>
        <text class="page-subtitle">连接打印设备后即可打印合格证</text>
      </view>
    </view>

    <view class="card status-card">
      <view class="status-row">
        <view>
          <text class="status-kicker">{{ TEXT.currentPrinter }}</text>
          <text class="status-main">{{ state.currentDevice?.name || TEXT.noDevice }}</text>
          <text class="status-sub">{{ state.status.message }}</text>
        </view>
        <text class="status-pill" :class="{ ok: state.status.connected }">
          {{ state.status.connected ? TEXT.connected : TEXT.notConnected }}
        </text>
      </view>
      <view v-if="state.status.connected" class="connected-tools">
        <view>
          <text class="connected-title">&#x6253;&#x5370;&#x673A;&#x5DF2;&#x5C31;&#x7EEA;</text>
          <text class="connected-sub">&#x53EF;&#x8FD4;&#x56DE;&#x5408;&#x683C;&#x8BC1;&#x9875;&#x76F4;&#x63A5;&#x6253;&#x5370;&#x3002;</text>
        </view>
        <button class="plain-button change-button" @tap="changePrinter">{{ TEXT.changePrinter }}</button>
      </view>
    </view>

    <view v-if="showSearchPanel || !state.status.connected" class="card">
      <view class="section-head">
        <view>
          <text class="section-title compact-title">&#x641C;&#x7D22;&#x8BBE;&#x5907;</text>
          <text class="section-sub">&#x8BF7;&#x5148;&#x6253;&#x5F00;&#x6253;&#x5370;&#x673A;&#x7535;&#x6E90;&#xFF0C;&#x5E76;&#x786E;&#x8BA4;&#x624B;&#x673A;&#x84DD;&#x7259;&#x5DF2;&#x5F00;&#x542F;&#x3002;</text>
        </view>
        <button class="plain-button mini-button" :loading="scanning" @tap="scan">&#x641C;&#x7D22;</button>
      </view>

      <view v-if="!state.devices.length" class="empty mini-empty">&#x6682;&#x65E0;&#x8BBE;&#x5907;&#x3002;&#x70B9;&#x51FB;&#x201C;&#x641C;&#x7D22;&#x201D;&#x540E;&#x9009;&#x62E9;&#x6253;&#x5370;&#x673A;&#x3002;</view>
      <view v-for="device in state.devices" :key="device.id" class="device-item" @tap="connect(device)">
        <view>
          <text class="device-name">{{ device.name }}</text>
          <text class="device-meta">{{ device.model || TEXT.bluetoothPrinter }} / {{ TEXT.signal }} {{ device.rssi || '-' }}</text>
        </view>
        <text class="device-action">{{ connectingId === device.id ? TEXT.connecting : TEXT.connect }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.status-card {
  background: linear-gradient(180deg, #ffffff 0%, #f3fbf7 100%);
  margin-bottom: 22rpx;
}

.status-row,
.section-head,
.device-item {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.status-kicker,
.status-sub,
.device-meta,
.section-sub {
  color: #6d7b72;
  display: block;
  font-size: 25rpx;
}

.status-main {
  color: #14231a;
  display: block;
  font-size: 42rpx;
  font-weight: 900;
  margin: 12rpx 0 10rpx;
}

.status-pill {
  background: #fff7e8;
  border-radius: 999rpx;
  color: #b97000;
  font-size: 24rpx;
  font-weight: 800;
  padding: 10rpx 18rpx;
}

.status-pill.ok {
  background: #e8f8ef;
  color: #0f8f58;
}

.compact-title {
  margin-bottom: 8rpx;
}

.connected-tools {
  align-items: center;
  background: #f2fbf6;
  border: 1rpx solid #d7efe2;
  border-radius: 22rpx;
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
  padding: 18rpx 20rpx;
}

.connected-title {
  color: #0d6f48;
  display: block;
  font-size: 30rpx;
  font-weight: 900;
}

.connected-sub {
  color: #6d7b72;
  display: block;
  font-size: 24rpx;
  margin-top: 6rpx;
}

.change-button {
  flex: 0 0 auto;
  font-size: 26rpx !important;
  height: 64rpx !important;
  line-height: 64rpx !important;
  margin-left: 18rpx;
  width: 176rpx !important;
}

.mini-button {
  font-size: 28rpx !important;
  height: 72rpx !important;
  line-height: 72rpx !important;
  width: 144rpx !important;
}

.mini-empty {
  margin-top: 18rpx;
}

.device-item {
  border-top: 1rpx solid #edf3ef;
  margin-top: 18rpx;
  padding-top: 18rpx;
}

.device-name {
  color: #14231a;
  display: block;
  font-size: 30rpx;
  font-weight: 900;
}

.device-action {
  color: #0f8f58;
  font-size: 27rpx;
  font-weight: 800;
}
</style>
