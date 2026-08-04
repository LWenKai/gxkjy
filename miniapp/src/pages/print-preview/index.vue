<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { createPrintLog, getPrintData, type PrintData } from '@/api/client';
import { ensureLogin } from '@/utils/auth';
import { formatDate } from '@/utils/format';
import type { PrinterStatus } from '@guxin/print-core';
import { getPrinterStatus, getSavedPrinter, printCertificate, reconnectSavedPrinter } from '@/print/printer';

const id = ref('');
const printData = ref<PrintData | null>(null);
const printerStatus = ref<PrinterStatus>({
  code: 'disconnected',
  message: '请先连接打印设备',
  connected: false,
});
const loading = ref(false);
const pageLoading = ref(false);
const autoConnecting = ref(false);
const error = ref('');

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.redirectTo({ url: '/pages/certificates/index' });
}

function openPrinter() {
  uni.navigateTo({ url: '/pages/printer/index' });
}

async function autoConnectPrinter() {
  const saved = getSavedPrinter();
  if (!saved || printerStatus.value.connected || autoConnecting.value) return;
  autoConnecting.value = true;
  printerStatus.value = {
    code: 'connecting',
    message: '正在自动连接上次使用的打印机',
    connected: false,
  };
  try {
    await reconnectSavedPrinter();
  } catch {
    printerStatus.value = {
      code: 'disconnected',
      message: '自动连接未成功，请进入打印机管理重新连接',
      connected: false,
    };
  } finally {
    autoConnecting.value = false;
    printerStatus.value = await getPrinterStatus();
  }
}

async function load() {
  if (!id.value) return;
  pageLoading.value = true;
  error.value = '';
  try {
    printData.value = await getPrintData(id.value);
    printerStatus.value = await getPrinterStatus();
    await autoConnectPrinter();
  } catch {
    error.value = '打印内容加载失败，请稍后重试';
  } finally {
    pageLoading.value = false;
  }
}

async function submitPrint() {
  if (!id.value || !printData.value) return;
  if (!printerStatus.value.connected && !getSavedPrinter()) {
    uni.showToast({ title: '请先连接打印设备', icon: 'none' });
    openPrinter();
    return;
  }

  loading.value = true;
  try {
    const label = printData.value.label;
    const result = await printCertificate(
      {
        certificateId: id.value,
        certificateNo: label.certificate_no,
        certificateType: label.certificate_type,
        title: label.title,
        productName: label.product_name,
        quantity: label.quantity,
        unit: label.unit,
        origin: label.origin || '',
        promiseSubject: label.company_name,
        contactPhone: label.contact_phone,
        commitmentBasis: label.commitment_basis || '自行检测合格',
        testItems: label.test_items?.map((item) => ({
          name: item.name,
          value: item.value || '',
          unit: item.unit || '',
          limitValue: item.limit_value || '',
          result: item.result || '',
        })),
        issueTime: formatDate(label.issue_date),
        qrUrl: label.qr_url || '',
      },
      1,
    );

    await createPrintLog(id.value, {
      print_status: result.status === 'failed' ? 'failed' : 'success',
      copies: 1,
      adapter_type: result.adapterType,
      printer_name: result.printerName,
      printer_model: result.printerModel,
      connection_type: result.connectionType,
      error_message: result.failReason,
    });

    printerStatus.value = await getPrinterStatus();
    uni.showToast({ title: result.message || '打印完成', icon: result.status === 'success' ? 'success' : 'none' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '打印失败，请重新打印';
    await createPrintLog(id.value, {
      print_status: 'failed',
      copies: 1,
      adapter_type: 'k329_bluetooth',
      connection_type: 'bluetooth',
      error_message: message,
    }).catch(() => undefined);
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}

onLoad((query) => {
  id.value = String(query?.id || '');
});

onShow(() => {
  if (!ensureLogin()) return;
  load().catch(() => undefined);
});
</script>

<template>
  <view class="page print-page">
    <view class="top-nav">
      <view class="back-btn" @tap="goBack">返回</view>
      <view>
        <text class="page-title">打印预览</text>
        <text class="page-subtitle">75×60mm 承诺达标合格证</text>
      </view>
    </view>

    <view class="printer-line" @tap="openPrinter">
      <view>
        <text class="printer-title">打印设备</text>
        <text class="printer-sub">
          {{ autoConnecting ? '正在自动连接上次使用的打印机' : printerStatus.connected ? '打印机已连接，可直接打印' : '未连接时会优先自动连接上次设备' }}
        </text>
      </view>
      <text class="tag" :class="printerStatus.connected ? 'success' : 'warning'">
        {{ autoConnecting ? '连接中' : printerStatus.connected ? '已连接' : '去连接' }}
      </text>
    </view>

    <view v-if="pageLoading" class="empty">正在加载打印内容...</view>
    <view v-else-if="error" class="empty">{{ error }}</view>

    <view v-if="!printerStatus.connected && !autoConnecting" class="warning">
      系统会优先连接上次使用的打印机。如自动连接失败，请进入打印机管理重新连接。
    </view>

    <view v-if="printData" class="label-preview">
      <text class="label-title">承诺达标合格证</text>
      <view class="basis-line">
        <text>承诺依据</text>
        <text>{{ printData.label.commitment_basis || '自行检测合格' }}</text>
      </view>
      <view class="label-main">
        <view class="label-fields">
          <view class="line"><text>合格证号</text><text>{{ printData.label.certificate_no }}</text></view>
          <view class="line"><text>产品名称</text><text>{{ printData.label.product_name }}</text></view>
          <view class="line"><text>重量数量</text><text>{{ printData.label.quantity }} {{ printData.label.unit }}</text></view>
          <view class="line"><text>开具日期</text><text>{{ formatDate(printData.label.issue_date) }}</text></view>
          <view class="line"><text>联系方式</text><text>{{ printData.label.contact_phone }}</text></view>
        </view>
        <view class="qr-area">
          <view class="qr-box">
            <text class="qr-text">QR</text>
          </view>
          <text class="qr-tip">扫码查看详情</text>
        </view>
      </view>
      <view class="detail-lines">
        <view class="line wide"><text>产地</text><text>{{ printData.label.origin || '-' }}</text></view>
        <view class="line wide"><text>承诺主体</text><text>{{ printData.label.company_name }}</text></view>
      </view>
    </view>

    <view v-if="printData" class="actions">
      <button class="primary-button" :loading="loading" @tap="submitPrint">打印合格证</button>
      <view class="ghost-button" @tap="openPrinter">打印机管理</view>
      <view class="ghost-button" @tap="goBack">返回详情</view>
    </view>
  </view>
</template>

<style scoped>
.printer-line {
  align-items: center;
  background: #fff;
  border: 1rpx solid #dfeee6;
  border-radius: 24rpx;
  box-shadow: 0 12rpx 28rpx rgba(17, 93, 65, 0.07);
  display: flex;
  justify-content: space-between;
  margin-bottom: 24rpx;
  padding: 22rpx 24rpx;
}

.printer-title,
.printer-sub {
  display: block;
}

.printer-title {
  color: #14231a;
  font-size: 30rpx;
  font-weight: 900;
}

.printer-sub {
  color: #6d7b72;
  font-size: 25rpx;
  margin-top: 8rpx;
}

.label-preview {
  background: #fff;
  border: 1rpx solid #d9e5de;
  border-radius: 18rpx;
  box-shadow: 0 18rpx 44rpx rgba(17, 93, 65, 0.12);
  box-sizing: border-box;
  margin: 0 auto 28rpx;
  min-height: 512rpx;
  padding: 26rpx 28rpx 24rpx;
  width: 640rpx;
}

.label-title {
  color: #13231a;
  display: block;
  font-size: 46rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
  line-height: 1.1;
  margin-bottom: 24rpx;
  text-align: center;
}

.basis-line {
  align-items: center;
  display: flex;
  font-size: 28rpx;
  gap: 12rpx;
  line-height: 1.35;
  margin-bottom: 18rpx;
}

.basis-line text:first-child {
  color: #3f4b44;
  flex: 0 0 132rpx;
  font-weight: 800;
}

.basis-line text:last-child {
  color: #13231a;
  flex: 1;
  font-weight: 800;
}

.label-main {
  align-items: flex-start;
  display: grid;
  gap: 18rpx;
  grid-template-columns: 1fr 172rpx;
}

.line {
  display: flex;
  font-size: 28rpx;
  gap: 10rpx;
  line-height: 1.34;
  padding: 6rpx 0;
}

.line text:first-child {
  color: #3f4b44;
  flex: 0 0 132rpx;
  font-weight: 800;
}

.line text:last-child {
  color: #13231a;
  flex: 1;
  font-weight: 750;
  min-width: 0;
  text-align: left;
  word-break: break-all;
}

.detail-lines {
  margin-top: 0;
}

.line.wide {
  font-size: 27rpx;
  padding-top: 6rpx;
}

.line.wide text:first-child {
  flex-basis: 106rpx;
}

.qr-area {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  padding-top: 4rpx;
  width: 172rpx;
}

.qr-box {
  align-items: center;
  aspect-ratio: 1;
  background: repeating-linear-gradient(
    45deg,
    #0b0f0d 0,
    #0b0f0d 10rpx,
    #fff 10rpx,
    #fff 20rpx
  );
  border: 8rpx solid #fff;
  box-shadow: inset 0 0 0 2rpx #111;
  box-sizing: border-box;
  display: grid;
  justify-items: center;
  padding: 18rpx;
  width: 172rpx;
}

.qr-text {
  background: #fff;
  color: #111;
  font-size: 24rpx;
  font-weight: 900;
  padding: 4rpx 8rpx;
}

.qr-tip {
  color: #3f4b44;
  display: block;
  font-size: 20rpx;
  line-height: 1.1;
  text-align: center;
  white-space: nowrap;
  width: 172rpx;
}
</style>
