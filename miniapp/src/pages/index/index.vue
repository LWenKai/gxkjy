<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import {
  getClientDashboardSummary,
  type ClientDashboardSummary,
  type DetectionRecord,
} from '@/api/client';
import {
  ensureLogin,
  getCompany,
  getExpireWarning,
  setCompany,
  setExpireWarning,
  type ClientCompany,
  type ExpireWarning,
} from '@/utils/auth';
import { formatDate, formatDateTime, resultClass, resultText } from '@/utils/format';

type HomeRecord = {
  id: number | string;
  name: string;
  project: string;
  time: string;
  resultLabel: string;
  resultClassName: string;
  detailUrl: string;
};

const company = ref<ClientCompany | null>(null);
const expireWarning = ref<ExpireWarning | null>(null);
const summary = ref<ClientDashboardSummary | null>(null);
const loading = ref(false);
let hasShownExpireModal = false;

const companyName = computed(() => company.value?.name || '\u4f01\u4e1a\u540d\u79f0');
const stats = computed(() => ({
  todayDetection: summary.value?.stats.today_detection_count || 0,
  certifiable: summary.value?.stats.certifiable_count || 0,
  todayCertificates: summary.value?.stats.today_certificate_count || 0,
}));
const recentRecords = computed<HomeRecord[]>(() => {
  const records = summary.value?.recent_detection_records || [];
  return records.slice(0, 1).map((record) => ({
    id: record.id,
    name: record.sample_name || record.product_name || '-',
    project: detectionProject(record),
    time: formatDateTime(record.test_time),
    resultLabel: resultText(record.overall_result),
    resultClassName: resultClass(record.overall_result),
    detailUrl: `/pages/detection-records/detail?id=${record.id}`,
  }));
});

function go(url: string) {
  uni.navigateTo({ url });
}

function goSmartDetection() {
  uni.showToast({
    title: '\u667a\u80fd\u5224\u8bfb\u529f\u80fd\u6b63\u5728\u51c6\u5907\u4e2d',
    icon: 'none',
  });
}

function goDeviceManagement() {
  uni.showToast({
    title: '\u68c0\u6d4b\u8bbe\u5907\u7ba1\u7406\u529f\u80fd\u6b63\u5728\u51c6\u5907\u4e2d',
    icon: 'none',
  });
}

function expireWarningText(warning: ExpireWarning) {
  const daysText = warning.days_left <= 0 ? '\u4eca\u5929' : `${warning.days_left} \u5929`;
  const dateText = formatDate(warning.service_expire_at);
  return `\u4f01\u4e1a\u670d\u52a1\u8fd8\u5269 ${daysText} \u5230\u671f${dateText ? `\uff0c\u5230\u671f\u65e5\uff1a${dateText}` : ''}\u3002\u8bf7\u53ca\u65f6\u8054\u7cfb\u8c37\u82af\u79d1\u6280\u7eed\u671f\u3002`;
}

function maybeShowExpireWarning(warning: ExpireWarning | null) {
  if (!warning || hasShownExpireModal) return;
  hasShownExpireModal = true;
  uni.showModal({
    title: '\u670d\u52a1\u5373\u5c06\u5230\u671f',
    content: expireWarningText(warning),
    showCancel: false,
    confirmText: '\u6211\u77e5\u9053\u4e86',
  });
}

function detectionProject(record: DetectionRecord) {
  const count = record.item_count || 0;
  return count > 0 ? `\u519c\u6b8b\u68c0\u6d4b\uff08${count}\u9879\uff09` : '\u98df\u54c1\u5b89\u5168\u5feb\u68c0';
}

async function loadDashboard() {
  company.value = (getCompany() || null) as ClientCompany | null;
  expireWarning.value = getExpireWarning();
  loading.value = true;

  try {
    const data = await getClientDashboardSummary();
    summary.value = data;
    if (data.company) {
      setCompany(data.company);
      company.value = data.company;
    }
    setExpireWarning(data.service.expire_warning || null);
    expireWarning.value = data.service.expire_warning || null;
    maybeShowExpireWarning(expireWarning.value);
  } catch {
    uni.showToast({
      title: '\u9996\u9875\u6570\u636e\u52a0\u8f7d\u5931\u8d25',
      icon: 'none',
    });
  } finally {
    loading.value = false;
  }
}

onShow(() => {
  if (!ensureLogin()) return;
  loadDashboard().catch(() => undefined);
});
</script>

<template>
  <view class="home-page">
    <view class="company-card">
      <view class="company-copy">
        <view class="company-title-line">
          <text class="company-name">{{ companyName }}</text>
          <text class="company-tag">&#x4F01;&#x4E1A;&#x7248;</text>
        </view>
        <text class="company-sub">&#x6B22;&#x8FCE;&#x4F7F;&#x7528;&#x8C37;&#x82AF;&#x5FEB;&#x68C0;&#x4E91;&#x670D;&#x52A1;</text>
      </view>
      <image class="shield-mark" src="/static/home-icons/company-shield.png" mode="aspectFit" />
    </view>

    <view class="stats-card">
      <view class="stat-block" @tap="go('/pages/detection-records/index?date=today')">
        <text class="stat-label">&#x4ECA;&#x65E5;&#x68C0;&#x6D4B;</text>
        <text class="stat-value">{{ stats.todayDetection }}</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-block" @tap="go('/pages/certifiable/index')">
        <text class="stat-label">&#x5F85;&#x5F00;&#x8BC1;</text>
        <text class="stat-value">{{ stats.certifiable }}</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-block" @tap="go('/pages/certificates/index?date=today')">
        <text class="stat-label">&#x4ECA;&#x65E5;&#x5F00;&#x8BC1;</text>
        <text class="stat-value">{{ stats.todayCertificates }}</text>
      </view>
    </view>

    <view class="action-grid">
      <view class="action-card" @tap="go('/pages/certifiable/index')">
        <view class="action-icon-box">
          <image class="action-icon" src="/static/home-icons/issue-plus.png" mode="aspectFit" />
        </view>
        <view class="action-copy">
          <text class="action-title">&#x5F00;&#x5408;&#x683C;&#x8BC1;</text>
          <text class="action-sub">&#x9009;&#x62E9;&#x5408;&#x683C;&#x68C0;&#x6D4B;&#x8BB0;&#x5F55;</text>
        </view>
      </view>
      <view class="action-card" @tap="goSmartDetection">
        <view class="action-icon-box">
          <image class="action-icon" src="/static/home-icons/scan-detect.png" mode="aspectFit" />
        </view>
        <view class="action-copy">
          <text class="action-title">&#x667A;&#x80FD;&#x5224;&#x8BFB;</text>
          <text class="action-sub">&#x5FEB;&#x901F;&#x8BC6;&#x522B;&#x68C0;&#x6D4B;&#x7ED3;&#x679C;</text>
        </view>
      </view>
    </view>

    <view class="quick-card">
      <text class="section-title">&#x5FEB;&#x6377;&#x529F;&#x80FD;</text>
      <view class="quick-grid">
        <view class="quick-item" @tap="go('/pages/detection-records/index')">
          <image class="quick-icon" src="/static/home-icons/detection-records.png" mode="aspectFit" />
          <view class="quick-copy">
            <text class="quick-title">&#x68C0;&#x6D4B;&#x8BB0;&#x5F55;</text>
            <text class="quick-sub">&#x67E5;&#x770B;&#x68C0;&#x6D4B;&#x7ED3;&#x679C;</text>
          </view>
        </view>
        <view class="quick-item" @tap="go('/pages/certificates/index')">
          <image class="quick-icon" src="/static/home-icons/certificates.png" mode="aspectFit" />
          <view class="quick-copy">
            <text class="quick-title">&#x5408;&#x683C;&#x8BC1;&#x7BA1;&#x7406;</text>
            <text class="quick-sub">&#x67E5;&#x770B;&#x2F;&#x4F5C;&#x5E9F;&#x2F;&#x6253;&#x5370;</text>
          </view>
        </view>
        <view class="quick-item" @tap="go('/pages/products/index')">
          <image class="quick-icon" src="/static/home-icons/products.png" mode="aspectFit" />
          <view class="quick-copy">
            <text class="quick-title">&#x4EA7;&#x54C1;&#x7BA1;&#x7406;</text>
            <text class="quick-sub">&#x7BA1;&#x7406;&#x5E38;&#x7528;&#x4EA7;&#x54C1;</text>
          </view>
        </view>
        <view class="quick-item" @tap="go('/pages/printer/index')">
          <image class="quick-icon" src="/static/home-icons/printer.png" mode="aspectFit" />
          <view class="quick-copy">
            <text class="quick-title">&#x6253;&#x5370;&#x673A;&#x7BA1;&#x7406;</text>
            <text class="quick-sub">&#x8FDE;&#x63A5;&#x4E0E;&#x7BA1;&#x7406;&#x8BBE;&#x5907;</text>
          </view>
        </view>
        <view class="quick-item" @tap="goDeviceManagement">
          <image class="quick-icon" src="/static/home-icons/devices.png" mode="aspectFit" />
          <view class="quick-copy">
            <text class="quick-title">&#x8BBE;&#x5907;&#x7BA1;&#x7406;</text>
            <text class="quick-sub">&#x7BA1;&#x7406;&#x68C0;&#x6D4B;&#x8BBE;&#x5907;</text>
          </view>
        </view>
        <view class="quick-item" @tap="go('/pages/help/index')">
          <image class="quick-icon" src="/static/home-icons/help.png" mode="aspectFit" />
          <view class="quick-copy">
            <text class="quick-title">&#x4F7F;&#x7528;&#x5E2E;&#x52A9;</text>
            <text class="quick-sub">&#x64CD;&#x4F5C;&#x6307;&#x5357;&#x4E0E;&#x8BF4;&#x660E;</text>
          </view>
        </view>
      </view>
    </view>

    <view class="recent-card">
      <view class="recent-head">
        <text class="section-title">&#x6700;&#x8FD1;&#x68C0;&#x6D4B;&#x8BB0;&#x5F55;</text>
        <view class="more-link" @tap="go('/pages/detection-records/index')">
          <text>&#x67E5;&#x770B;&#x66F4;&#x591A;</text>
          <image class="more-icon" src="/static/home-icons/chevron-small.png" mode="aspectFit" />
        </view>
      </view>
      <view v-if="loading && !recentRecords.length" class="empty-row">&#x6B63;&#x5728;&#x52A0;&#x8F7D;&#x2E;&#x2E;&#x2E;</view>
      <view
        v-for="record in recentRecords"
        :key="record.id"
        class="record-item"
        @tap="go(record.detailUrl)"
      >
        <view class="record-left">
          <view class="record-title-row">
            <text class="record-dot"></text>
            <text class="record-name">{{ record.name }}</text>
            <text class="result-badge" :class="record.resultClassName">{{ record.resultLabel }}</text>
          </view>
          <text class="record-project">{{ record.project }}</text>
          <view class="record-time">
            <view class="clock-icon"></view>
            <text>{{ record.time }}</text>
          </view>
        </view>
        <view class="record-icon">
          <view class="record-icon-board"></view>
        </view>
        <text class="record-arrow">›</text>
      </view>
      <view v-if="!loading && !recentRecords.length" class="empty-row">&#x6682;&#x65E0;&#x68C0;&#x6D4B;&#x8BB0;&#x5F55;</view>
    </view>
  </view>
</template>

<style scoped>
.home-page {
  background: #f7faf8;
  box-sizing: border-box;
  min-height: 100vh;
  padding: 38rpx 30rpx 34rpx;
}

.company-card {
  align-items: center;
  background: #16a34a;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 30rpx rgba(22, 163, 74, 0.22);
  display: flex;
  height: 146rpx;
  justify-content: space-between;
  margin-bottom: 22rpx;
  overflow: hidden;
  padding: 0 30rpx;
  position: relative;
}

.company-copy {
  min-width: 0;
  position: relative;
  z-index: 1;
}

.company-title-line {
  align-items: center;
  display: flex;
  gap: 12rpx;
  max-width: 570rpx;
}

.company-name {
  color: #ffffff;
  display: block;
  flex: 0 1 auto;
  font-size: 31rpx;
  font-weight: 800;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-tag {
  background: #dcfce7;
  border-radius: 16rpx;
  color: #15803d;
  flex: 0 0 auto;
  font-size: 22rpx;
  font-weight: 700;
  line-height: 34rpx;
  padding: 0 10rpx;
}

.company-sub {
  color: #ffffff;
  display: block;
  font-size: 25rpx;
  font-weight: 500;
  margin-top: 17rpx;
}

.shield-mark {
  flex: 0 0 auto;
  height: 94rpx;
  opacity: 0.92;
  position: relative;
  width: 94rpx;
  z-index: 1;
}

.stats-card {
  align-items: stretch;
  background: #ffffff;
  border: 1rpx solid #eef2f7;
  border-radius: 32rpx;
  box-shadow: 0 10rpx 26rpx rgba(31, 41, 55, 0.06);
  display: grid;
  grid-template-columns: 1fr 1rpx 1fr 1rpx 1fr;
  height: 138rpx;
  margin-bottom: 22rpx;
}

.stat-block {
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-label {
  color: #6b7280;
  font-size: 25rpx;
  font-weight: 600;
  line-height: 1;
}

.stat-value {
  color: #16a34a;
  font-size: 46rpx;
  font-weight: 800;
  line-height: 1;
  margin-top: 25rpx;
}

.stat-divider {
  background: #eef2f7;
  height: 92rpx;
  margin-top: 21rpx;
}

.action-grid {
  column-gap: 18rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 22rpx;
}

.action-card {
  align-items: center;
  background: #ffffff;
  border: 1rpx solid #dcfce7;
  border-radius: 32rpx;
  box-sizing: border-box;
  box-shadow: 0 10rpx 24rpx rgba(31, 41, 55, 0.05);
  display: flex;
  min-height: 144rpx;
  padding: 22rpx 20rpx;
}

.action-icon-box {
  align-items: center;
  background: #ecfdf5;
  border-radius: 24rpx;
  display: flex;
  flex: 0 0 auto;
  height: 68rpx;
  justify-content: center;
  margin-right: 16rpx;
  width: 68rpx;
}

.action-icon {
  height: 44rpx;
  width: 44rpx;
}

.action-copy {
  flex: 1;
  min-width: 0;
}

.action-title {
  color: #1f2937;
  display: block;
  font-size: 29rpx;
  font-weight: 900;
  line-height: 1;
}

.action-sub {
  color: #6b7280;
  display: block;
  font-size: 21rpx;
  font-weight: 600;
  line-height: 1.25;
  margin-top: 12rpx;
}

.quick-card {
  background: #ffffff;
  border: 1rpx solid #eef2f7;
  border-radius: 32rpx;
  box-shadow: 0 10rpx 26rpx rgba(31, 41, 55, 0.05);
  margin-bottom: 22rpx;
  padding: 30rpx 24rpx 28rpx;
}

.section-title {
  color: #1f2937;
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  line-height: 1;
}

.quick-grid {
  column-gap: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin-top: 28rpx;
  row-gap: 18rpx;
}

.quick-item {
  align-items: center;
  background: #f8fcfa;
  border: 1rpx solid #eef2f0;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 128rpx;
  min-width: 0;
  padding: 12rpx 6rpx;
}

.quick-icon {
  flex: 0 0 auto;
  height: 54rpx;
  margin-bottom: 12rpx;
  width: 54rpx;
}

.quick-copy {
  min-width: 0;
  text-align: center;
  width: 100%;
}

.quick-title {
  color: #1f2937;
  display: block;
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-sub {
  color: #6b7280;
  display: block;
  font-size: 18rpx;
  font-weight: 500;
  line-height: 1.1;
  margin-top: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-card {
  background: #ffffff;
  border: 1rpx solid #eef2f7;
  border-radius: 32rpx;
  box-shadow: 0 10rpx 26rpx rgba(31, 41, 55, 0.05);
  min-height: 178rpx;
  padding: 28rpx 28rpx 22rpx;
}

.recent-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.more-link {
  align-items: center;
  color: #6b7280;
  display: flex;
  font-size: 24rpx;
  font-weight: 500;
  gap: 4rpx;
}

.more-icon {
  height: 24rpx;
  width: 24rpx;
}

.record-item {
  align-items: center;
  display: flex;
  gap: 16rpx;
  min-height: 104rpx;
}

.record-left {
  flex: 1;
  min-width: 0;
}

.record-title-row {
  align-items: center;
  display: flex;
  gap: 12rpx;
}

.record-dot {
  background: #16a34a;
  border-radius: 50%;
  flex: 0 0 auto;
  height: 12rpx;
  width: 12rpx;
}

.record-name {
  color: #1f2937;
  font-size: 30rpx;
  font-weight: 800;
  max-width: 260rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-badge {
  border-radius: 16rpx;
  font-size: 22rpx;
  font-weight: 800;
  padding: 5rpx 12rpx;
}

.result-badge.success {
  background: #dcfce7;
  color: #16a34a;
}

.result-badge.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.record-project {
  color: #1f2937;
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
  margin: 18rpx 0 0 24rpx;
}

.record-time {
  align-items: center;
  color: #6b7280;
  display: flex;
  font-size: 22rpx;
  font-weight: 500;
  gap: 7rpx;
  line-height: 24rpx;
  margin: 20rpx 0 0 24rpx;
}

.clock-icon {
  border: 2rpx solid #8aa097;
  border-radius: 999rpx;
  box-sizing: border-box;
  display: flex;
  flex: 0 0 22rpx;
  height: 22rpx;
  position: relative;
  width: 22rpx;
}

.clock-icon::before {
  background: #8aa097;
  border-radius: 999rpx;
  content: "";
  height: 7rpx;
  left: 9rpx;
  position: absolute;
  top: 4rpx;
  width: 2rpx;
}

.clock-icon::after {
  background: #8aa097;
  border-radius: 999rpx;
  content: "";
  height: 2rpx;
  left: 9rpx;
  position: absolute;
  top: 10rpx;
  width: 6rpx;
}

.record-time text {
  display: block;
  line-height: 24rpx;
}

.record-icon {
  align-items: center;
  background: #ecfdf5;
  border-radius: 18rpx;
  display: flex;
  flex: 0 0 64rpx;
  height: 64rpx;
  justify-content: center;
  width: 64rpx;
}

.record-icon-board {
  border: 4rpx solid #9fd8bd;
  border-radius: 8rpx;
  box-sizing: border-box;
  height: 34rpx;
  position: relative;
  width: 28rpx;
}

.record-icon-board::before,
.record-icon-board::after {
  background: #16a34a;
  border-radius: 999rpx;
  content: "";
  height: 3rpx;
  left: 5rpx;
  position: absolute;
  right: 5rpx;
}

.record-icon-board::before {
  top: 9rpx;
}

.record-icon-board::after {
  top: 18rpx;
}

.record-arrow {
  color: #9aa6a1;
  display: block;
  flex: 0 0 32rpx;
  font-size: 40rpx;
  font-weight: 300;
  height: 32rpx;
  line-height: 30rpx;
  margin-left: 4rpx;
  opacity: 0.72;
  text-align: center;
  width: 32rpx;
}

.empty-row {
  color: #6b7280;
  font-size: 25rpx;
  padding: 30rpx 0 8rpx;
  text-align: center;
}
</style>
