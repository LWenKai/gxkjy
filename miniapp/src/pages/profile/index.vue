<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getClientDashboardSummary } from '@/api/client';
import {
  clearSavedPassword,
  clearSavedUsername,
  ensureLogin,
  getClientUser,
  getCompany,
  logout,
  setCompany,
  type ClientCompany,
  type ClientUser,
} from '@/utils/auth';
import { formatDate } from '@/utils/format';

const company = ref<ClientCompany | null>(null);
const user = ref<ClientUser | null>(null);
const loading = ref(false);
const error = ref('');
const servicePhone = '13363412262';

const companyName = computed(() => company.value?.name || '\u4f01\u4e1a\u8d26\u53f7');
const username = computed(() => user.value?.username || '-');
const contactName = computed(() => company.value?.contact_name || '-');
const phone = computed(() => company.value?.phone || '-');
const address = computed(() => company.value?.address || company.value?.origin_address || '-');
const expireDate = computed(() => formatDate(company.value?.service_expire_at) || '-');
const serviceStatus = computed(() => {
  const expire = company.value?.service_expire_at;
  if (!expire) return '\u670d\u52a1\u6b63\u5e38';
  const expireAt = new Date(expire).getTime();
  if (Number.isNaN(expireAt)) return '\u670d\u52a1\u6b63\u5e38';
  return expireAt < Date.now() ? '\u670d\u52a1\u5230\u671f' : '\u670d\u52a1\u6b63\u5e38';
});

const cacheSizeText = computed(() => {
  try {
    const info = uni.getStorageInfoSync();
    return `${Number(info.currentSize || 0).toFixed(1)}KB`;
  } catch {
    return '-';
  }
});

async function loadProfile() {
  company.value = (getCompany() || null) as ClientCompany | null;
  user.value = (getClientUser() || null) as ClientUser | null;
  loading.value = true;
  error.value = '';
  try {
    const data = await getClientDashboardSummary();
    if (data.company) {
      setCompany(data.company);
      company.value = data.company;
    }
  } catch {
    error.value = '\u4f01\u4e1a\u4fe1\u606f\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5';
  } finally {
    loading.value = false;
  }
}

function goProducts() {
  uni.navigateTo({ url: '/pages/products/index' });
}

function goPrinter() {
  uni.navigateTo({ url: '/pages/printer/index' });
}

function changePassword() {
  uni.showModal({
    title: '\u4fee\u6539\u5bc6\u7801',
    content: `\u5982\u9700\u4fee\u6539\u5bc6\u7801\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458\u5904\u7406\u3002\n\u8054\u7cfb\u7535\u8bdd\uff1a${servicePhone}`,
    showCancel: false,
    confirmColor: '#16A34A',
  });
}

async function clearCache() {
  const result = await new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({
      title: '\u6e05\u9664\u7f13\u5b58',
      content: '\u5c06\u6e05\u9664\u5df2\u4fdd\u5b58\u7684\u8d26\u53f7\u5bc6\u7801\u548c\u672c\u5730\u7f13\u5b58\uff0c\u4e0d\u5f71\u54cd\u68c0\u6d4b\u8bb0\u5f55\u548c\u5408\u683c\u8bc1\u6570\u636e\u3002',
      cancelText: '\u53d6\u6d88',
      confirmText: '\u6e05\u9664',
      confirmColor: '#16A34A',
      success: resolve,
    });
  });
  if (!result.confirm) return;
  clearSavedUsername();
  clearSavedPassword();
  uni.showToast({ title: '\u7f13\u5b58\u5df2\u6e05\u9664', icon: 'success' });
}

function showAbout() {
  uni.showModal({
    title: '\u5173\u4e8e\u8c37\u82af\u5feb\u68c0\u4e91',
    content: '\u8c37\u82af\u5feb\u68c0\u4e91\u7528\u4e8e\u4f01\u4e1a\u5feb\u68c0\u8bb0\u5f55\u7ba1\u7406\u3001\u5408\u683c\u8bc1\u5f00\u5177\u548c\u6807\u7b7e\u6253\u5370\u3002\n\u7248\u672c\uff1aV2.0.0',
    showCancel: false,
    confirmColor: '#16A34A',
  });
}

async function logoutCurrent() {
  const result = await new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({
      title: '\u9000\u51fa\u767b\u5f55',
      content: '\u786e\u8ba4\u9000\u51fa\u5f53\u524d\u8d26\u53f7\uff1f',
      cancelText: '\u53d6\u6d88',
      confirmText: '\u9000\u51fa',
      confirmColor: '#dc2626',
      success: resolve,
    });
  });
  if (!result.confirm) return;
  logout();
}

onShow(() => {
  if (!ensureLogin()) return;
  loadProfile().catch(() => {
    error.value = '\u4f01\u4e1a\u4fe1\u606f\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5';
    loading.value = false;
  });
});
</script>

<template>
  <view class="page profile-v2">
    <view class="profile-header">
      <view class="avatar">
        <view class="avatar-head"></view>
        <view class="avatar-body"></view>
      </view>
      <view class="account-main">
        <view class="name-row">
          <text class="company-name">{{ companyName }}</text>
          <text class="version-pill">&#x4F01;&#x4E1A;&#x7248;</text>
        </view>
        <text class="account-line">&#x5F53;&#x524D;&#x8D26;&#x53F7;&#xFF1A;{{ username }}</text>
        <text class="account-line">&#x4F01;&#x4E1A;&#x7BA1;&#x7406;&#x5458;</text>
      </view>
    </view>

    <view v-if="loading && !company" class="empty">&#x6B63;&#x5728;&#x52A0;&#x8F7D;&#x4F01;&#x4E1A;&#x8D44;&#x6599;&#x2E;&#x2E;&#x2E;</view>
    <view v-else-if="error && !company" class="empty">{{ error }}</view>

    <view class="info-card">
      <view class="card-head">
        <text class="card-title">&#x4F01;&#x4E1A;&#x8D44;&#x6599;</text>
        <text class="readonly-pill">&#x4E0D;&#x53EF;&#x7F16;&#x8F91;</text>
      </view>
      <view class="info-row">
        <text class="info-label">&#x4F01;&#x4E1A;&#x540D;&#x79F0;</text>
        <text class="info-value">{{ companyName }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">&#x8054;&#x7CFB;&#x4EBA;</text>
        <text class="info-value">{{ contactName }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">&#x8054;&#x7CFB;&#x7535;&#x8BDD;</text>
        <text class="info-value">{{ phone }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">&#x4F01;&#x4E1A;&#x5730;&#x5740;</text>
        <text class="info-value">{{ address }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">&#x670D;&#x52A1;&#x671F;&#x9650;</text>
        <text class="info-value">{{ expireDate }}</text>
      </view>
    </view>

    <view class="info-card service-card">
      <text class="card-title">&#x670D;&#x52A1;&#x4FE1;&#x606F;</text>
      <view class="info-row">
        <text class="info-label">&#x670D;&#x52A1;&#x72B6;&#x6001;</text>
        <text class="service-status">
          <text class="service-dot"></text>
          {{ serviceStatus }}
        </text>
      </view>
      <view class="info-row">
        <text class="info-label">&#x5230;&#x671F;&#x65F6;&#x95F4;</text>
        <text class="info-value">{{ expireDate }}</text>
      </view>
    </view>

    <view class="menu-card">
      <text class="card-title">&#x529F;&#x80FD;&#x8BBE;&#x7F6E;</text>
      <view class="menu-row" @tap="goProducts">
        <image class="menu-icon" src="/static/profile-icons/products.png" mode="aspectFit" />
        <text class="menu-text">&#x5E38;&#x7528;&#x4EA7;&#x54C1;&#x7BA1;&#x7406;</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-row" @tap="goPrinter">
        <image class="menu-icon" src="/static/profile-icons/printer.png" mode="aspectFit" />
        <text class="menu-text">&#x6253;&#x5370;&#x673A;&#x7BA1;&#x7406;</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-row" @tap="changePassword">
        <image class="menu-icon" src="/static/profile-icons/password.png" mode="aspectFit" />
        <text class="menu-text">&#x4FEE;&#x6539;&#x5BC6;&#x7801;</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-row" @tap="clearCache">
        <image class="menu-icon" src="/static/profile-icons/cache.png" mode="aspectFit" />
        <text class="menu-text">&#x6E05;&#x9664;&#x7F13;&#x5B58;</text>
        <text class="menu-side">{{ cacheSizeText }}</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-row" @tap="showAbout">
        <image class="menu-icon" src="/static/profile-icons/about.png" mode="aspectFit" />
        <text class="menu-text">&#x5173;&#x4E8E;&#x8C37;&#x82AF;&#x5FEB;&#x68C0;&#x4E91;</text>
        <text class="menu-side">V2.0.0</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <button class="logout-button" @tap="logoutCurrent">&#x9000;&#x51FA;&#x767B;&#x5F55;</button>
    <view v-if="error && company" class="inline-error">{{ error }}</view>
  </view>
</template>

<style scoped>
.profile-v2 {
  background: #f7faf8;
  padding: 0 24rpx 38rpx;
}

.profile-header {
  align-items: center;
  background: #16a34a;
  border-bottom-left-radius: 42rpx;
  border-bottom-right-radius: 42rpx;
  box-sizing: border-box;
  color: #ffffff;
  display: flex;
  gap: 22rpx;
  margin: 0 -24rpx 22rpx;
  min-height: 250rpx;
  padding: 70rpx 36rpx 42rpx;
}

.avatar {
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  border-radius: 999rpx;
  display: flex;
  flex-direction: column;
  height: 104rpx;
  justify-content: center;
  overflow: hidden;
  width: 104rpx;
}

.avatar-head {
  background: #77c69a;
  border-radius: 999rpx;
  height: 34rpx;
  width: 34rpx;
}

.avatar-body {
  background: #77c69a;
  border-radius: 40rpx 40rpx 0 0;
  height: 38rpx;
  margin-top: 8rpx;
  width: 62rpx;
}

.account-main {
  flex: 1;
  min-width: 0;
}

.name-row {
  align-items: center;
  display: flex;
  gap: 12rpx;
}

.company-name {
  color: #ffffff;
  flex: 1;
  font-size: 30rpx;
  font-weight: 900;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.version-pill {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 999rpx;
  color: #ffffff;
  flex: 0 0 auto;
  font-size: 22rpx;
  font-weight: 800;
  padding: 6rpx 12rpx;
}

.account-line {
  color: rgba(255, 255, 255, 0.94);
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  margin-top: 12rpx;
}

.info-card,
.menu-card {
  background: #ffffff;
  border: 1rpx solid #e5e7eb;
  border-radius: 32rpx;
  box-shadow: 0 12rpx 28rpx rgba(31, 41, 55, 0.06);
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.card-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.card-title {
  color: #1f2937;
  display: block;
  font-size: 30rpx;
  font-weight: 900;
  margin-bottom: 18rpx;
}

.readonly-pill {
  background: #f3f4f6;
  border-radius: 999rpx;
  color: #6b7280;
  font-size: 24rpx;
  font-weight: 800;
  padding: 7rpx 16rpx;
}

.info-row {
  align-items: center;
  border-bottom: 1rpx solid #f0f2f1;
  display: flex;
  justify-content: space-between;
  min-height: 82rpx;
}

.info-row:last-child {
  border-bottom: 0;
}

.info-label {
  color: #1f2937;
  flex: 0 0 170rpx;
  font-size: 27rpx;
  font-weight: 800;
}

.info-value {
  color: #111827;
  flex: 1;
  font-size: 27rpx;
  font-weight: 800;
  line-height: 1.45;
  text-align: right;
  word-break: break-all;
}

.service-status {
  align-items: center;
  background: #ecfdf5;
  border-radius: 999rpx;
  color: #15803d;
  display: flex;
  font-size: 26rpx;
  font-weight: 900;
  gap: 8rpx;
  padding: 8rpx 16rpx;
}

.service-dot {
  background: #16a34a;
  border-radius: 999rpx;
  height: 12rpx;
  width: 12rpx;
}

.menu-row {
  align-items: center;
  border-bottom: 1rpx solid #f0f2f1;
  display: flex;
  gap: 0;
  min-height: 86rpx;
}

.menu-row:last-child {
  border-bottom: 0;
}

.menu-icon {
  display: block;
  flex: 0 0 auto;
  height: 44rpx;
  margin-right: 22rpx;
  width: 44rpx;
}

.menu-text {
  color: #111827;
  flex: 1;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 36rpx;
  min-width: 0;
}

.menu-side {
  color: #6b7280;
  flex: 0 0 auto;
  font-size: 26rpx;
  font-weight: 700;
  line-height: 32rpx;
  margin-right: 12rpx;
  text-align: right;
}

.menu-arrow {
  align-self: center;
  color: #9aa6a1;
  display: block;
  flex: 0 0 30rpx;
  font-size: 40rpx;
  font-weight: 300;
  height: 30rpx;
  line-height: 28rpx;
  opacity: 0.75;
  text-align: center;
  width: 30rpx;
}

.logout-button {
  background: #ffffff;
  border: 1rpx solid #16a34a;
  border-radius: 24rpx;
  color: #15803d;
  font-size: 30rpx;
  font-weight: 900;
  height: 88rpx;
  line-height: 88rpx;
  margin-top: 28rpx;
}

.logout-button::after {
  border: 0;
}

.empty,
.inline-error {
  color: #dc2626;
  font-size: 24rpx;
  padding: 20rpx;
  text-align: center;
}
</style>
