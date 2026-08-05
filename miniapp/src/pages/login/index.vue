<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { loginClient } from '@/api/client';
import { getLastRequestError } from '@/api/http';
import {
  getAgreedProtocol,
  getSavedPassword,
  getSavedUsername,
  saveAgreedProtocol,
  savePassword,
  saveUsername,
  clearSavedPassword,
  setSession,
} from '@/utils/auth';

const INPUT_REQUIRED = '\u8bf7\u8f93\u5165\u8d26\u53f7\u548c\u5bc6\u7801';
const LOGIN_SUCCESS = '\u767b\u5f55\u6210\u529f';
const DOMAIN_ERROR = '\u5c0f\u7a0b\u5e8f\u672a\u914d\u7f6e\u63a5\u53e3\u57df\u540d\uff0c\u8bf7\u8054\u7cfb\u7ba1\u7406\u5458';
const TIMEOUT_ERROR = '\u8fde\u63a5\u8d85\u65f6\uff0c\u8bf7\u68c0\u67e5\u624b\u673a\u7f51\u7edc\u540e\u91cd\u8bd5';
const LOGIN_FAILED = '\u767b\u5f55\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u8d26\u53f7\u5bc6\u7801';
const EXPIRE_TITLE = '\u670d\u52a1\u5373\u5c06\u5230\u671f';
const EXPIRE_CONFIRM = '\u6211\u77e5\u9053\u4e86';

const username = ref('');
const password = ref('');
const rememberPassword = ref(false);
const agreeProtocol = ref(false);
const loading = ref(false);
const networkDetail = ref('');

const PROTOCOL_TITLE = {
  user: '\u7528\u6237\u534f\u8bae',
  privacy: '\u9690\u79c1\u653f\u7b56',
};

onMounted(() => {
  username.value = getSavedUsername();
  const savedPassword = getSavedPassword();
  if (savedPassword) {
    password.value = savedPassword;
    rememberPassword.value = true;
  }
  agreeProtocol.value = getAgreedProtocol();
});

function normalizeError(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: string }).message || '') : '';
  const errMsg = error && typeof error === 'object' && 'errMsg' in error ? String((error as { errMsg?: string }).errMsg || '') : '';
  const raw = `${message} ${errMsg}`;
  if (raw.includes('url not in domain list')) {
    return DOMAIN_ERROR;
  }
  if (raw.includes('timeout')) return TIMEOUT_ERROR;
  if (message && !message.includes('request:fail')) return message;
  return LOGIN_FAILED;
}

function formatExpireDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function expireWarningText(warning?: { days_left: number; service_expire_at: string } | null) {
  if (!warning) return '';
  const daysText = warning.days_left <= 0 ? '\u4eca\u5929' : `${warning.days_left} \u5929`;
  const dateText = formatExpireDate(warning.service_expire_at);
  return `\u4f01\u4e1a\u670d\u52a1\u8fd8\u5269 ${daysText} \u5230\u671f${dateText ? `\uff0c\u5230\u671f\u65e5\uff1a${dateText}` : ''}\u3002\u5230\u671f\u540e\u5c06\u65e0\u6cd5\u767b\u5f55\u4f7f\u7528\uff0c\u8bf7\u53ca\u65f6\u8054\u7cfb\u8c37\u82af\u79d1\u6280\u7eed\u671f\u3002`;
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' });
}

function openProtocol(type: 'user' | 'privacy') {
  uni.showModal({
    title: PROTOCOL_TITLE[type],
    content: type === 'user'
      ? '\u8bf7\u5728\u5fae\u4fe1\u516c\u4f17\u5e73\u53f0\u586b\u5199\u5e76\u53d1\u5e03\u300a\u7528\u6237\u534f\u8bae\u300b\u540e\uff0c\u5c06\u94fe\u63a5\u586b\u5165\u6b64\u5904\u8df3\u8f6c\u3002'
      : '\u8bf7\u5728\u5fae\u4fe1\u516c\u4f17\u5e73\u53f0\u586b\u5199\u5e76\u53d1\u5e03\u300a\u9690\u79c1\u4fdd\u62a4\u6307\u5f15\u300b\u540e\uff0c\u5c06\u94fe\u63a5\u586b\u5165\u6b64\u5904\u8df3\u8f6c\u3002',
    showCancel: false,
    confirmText: '\u6211\u77e5\u9053\u4e86',
  });
}

function toggleAgree() {
  agreeProtocol.value = !agreeProtocol.value;
  saveAgreedProtocol(agreeProtocol.value);
}

async function submit() {
  const account = username.value.trim();
  const pwd = password.value;
  if (!account || !pwd) {
    uni.showToast({ title: INPUT_REQUIRED, icon: 'none' });
    return;
  }
  if (!agreeProtocol.value) {
    uni.showToast({ title: '\u8bf7\u5148\u9605\u8bfb\u5e76\u540c\u610f\u7528\u6237\u534f\u8bae\u4e0e\u9690\u79c1\u653f\u7b56', icon: 'none' });
    return;
  }

  loading.value = true;
  networkDetail.value = '';
  try {
    const data = await loginClient({ username: account, password: pwd });
    setSession({
      access_token: data.access_token,
      company_user: data.company_user as never,
      company: data.company as never,
      expire_warning: (data.expire_warning || null) as never,
    });
    saveUsername(account);
    if (rememberPassword.value) {
      savePassword(pwd);
    } else {
      clearSavedPassword();
    }
    saveAgreedProtocol(true);

    const warning = data.expire_warning as { days_left: number; service_expire_at: string } | null | undefined;
    if (warning) {
      uni.showModal({
        title: EXPIRE_TITLE,
        content: expireWarningText(warning),
        showCancel: false,
        confirmText: EXPIRE_CONFIRM,
        success: goHome,
      });
    } else {
      uni.showToast({ title: LOGIN_SUCCESS, icon: 'success' });
      setTimeout(goHome, 450);
    }
  } catch (error) {
    const message = normalizeError(error);
    const lastError = getLastRequestError() as { raw?: string } | null;
    networkDetail.value = lastError?.raw ? '网络连接异常，请检查手机网络后重试。' : '';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <view class="login-page">
    <view class="bg-bubble bg-bubble-1"></view>
    <view class="bg-bubble bg-bubble-2"></view>

    <view class="login-inner">
      <view class="brand">
        <text class="brand-name">谷芯快检云</text>
        <text class="brand-sub">企业快检记录与合格证管理</text>
      </view>

      <view class="login-card">
        <view class="form-title">账号登录</view>

        <view class="login-fields">
          <view class="input-row">
            <image class="input-icon" src="/static/icons/user.svg" mode="aspectFit" />
            <view class="input-sep"></view>
            <input
              v-model="username"
              class="input"
              placeholder="请输入账号"
              placeholder-class="input-placeholder"
              confirm-type="next"
            />
          </view>
          <view class="fields-divider"></view>
          <view class="input-row">
            <image class="input-icon" src="/static/icons/password.svg" mode="aspectFit" />
            <view class="input-sep"></view>
            <input
              v-model="password"
              class="input"
              password
              placeholder="请输入密码"
              placeholder-class="input-placeholder"
              confirm-type="done"
              @confirm="submit"
            />
          </view>
        </view>

        <view class="form-options">
          <view class="option-item" @tap="rememberPassword = !rememberPassword">
            <view class="option-check" :class="{ checked: rememberPassword }">
              <view v-if="rememberPassword" class="option-tick"></view>
            </view>
            <text class="option-text">记住账号和密码</text>
          </view>
          <text class="option-link" @tap="uni.showToast({ title: '忘记密码请联系管理员重置', icon: 'none' })">忘记密码？</text>
        </view>

        <view class="protocol-row" @tap="toggleAgree">
          <view class="protocol-check" :class="{ checked: agreeProtocol }">
            <view v-if="agreeProtocol" class="option-tick"></view>
          </view>
          <view class="protocol-text">
            <text>登录即表示同意</text>
            <text class="protocol-link" @tap.stop="openProtocol('user')">《用户协议》</text>
            <text>和</text>
            <text class="protocol-link" @tap.stop="openProtocol('privacy')">《隐私政策》</text>
          </view>
        </view>

        <button class="primary-button login-button" :loading="loading" @tap="submit">登 录</button>

        <view v-if="networkDetail" class="network-detail">
          <text>{{ networkDetail }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.login-page {
  background:
    radial-gradient(circle at 80% -8%, rgba(19, 166, 179, 0.14), transparent 28%),
    radial-gradient(circle at 10% 85%, rgba(15, 143, 88, 0.11), transparent 32%),
    linear-gradient(180deg, #e9f8f1 0%, #f5fbf8 55%, #ffffff 100%);
  box-sizing: border-box;
  min-height: 100vh;
  overflow: hidden;
  padding: 0 42rpx 48rpx;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bg-bubble {
  border-radius: 50%;
  position: absolute;
  pointer-events: none;
}

.bg-bubble-1 {
  width: 520rpx;
  height: 520rpx;
  right: -260rpx;
  top: -160rpx;
  background: radial-gradient(circle, rgba(15, 143, 88, 0.12), transparent 68%);
}

.bg-bubble-2 {
  width: 380rpx;
  height: 380rpx;
  left: -180rpx;
  bottom: 120rpx;
  background: radial-gradient(circle, rgba(19, 166, 179, 0.1), transparent 68%);
}

.login-inner {
  position: relative;
  width: 100%;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: auto;
  margin-bottom: auto;
  padding-top: 8vh;
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 54rpx;
  position: relative;
  z-index: 1;
}

.brand-name {
  color: #083d32;
  font-size: 58rpx;
  font-weight: 900;
  letter-spacing: 3rpx;
}

.brand-sub {
  color: #0f8f58;
  font-size: 28rpx;
  font-weight: 600;
  letter-spacing: 1rpx;
}

.login-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.96);
  border: 1rpx solid rgba(218, 236, 228, 0.9);
  border-radius: 36rpx;
  box-shadow: 0 24rpx 64rpx rgba(12, 65, 43, 0.12);
  padding: 48rpx 38rpx 44rpx;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

.form-title {
  color: #1f2937;
  font-size: 34rpx;
  font-weight: 800;
  margin-bottom: 34rpx;
  text-align: center;
}

.login-fields {
  border: 2rpx solid #e0ece5;
  border-radius: 20rpx;
  background: #ffffff;
  overflow: hidden;
  margin-bottom: 30rpx;
}

.input-row {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
}

.input-icon {
  flex: 0 0 auto;
  width: 38rpx;
  height: 38rpx;
  margin-right: 22rpx;
  opacity: 0.62;
}

.input-sep {
  flex: 0 0 auto;
  width: 2rpx;
  height: 40rpx;
  background: #e2ece6;
  margin-right: 22rpx;
}

.input {
  flex: 1;
  min-width: 0;
  height: 100%;
  font-size: 30rpx;
  color: #10281f;
  background: transparent;
  border: none;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.fields-divider {
  height: 2rpx;
  background: #eef3f0;
  margin: 0 24rpx;
}

.input-placeholder {
  color: #9eb0a6;
  font-size: 28rpx;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 34rpx;
  margin-bottom: 38rpx;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.option-text {
  color: #4a5e55;
  font-size: 25rpx;
  font-weight: 500;
}

.option-link {
  color: #0f8f58;
  font-size: 25rpx;
  font-weight: 600;
}

.option-check,
.protocol-check {
  flex: 0 0 auto;
  width: 32rpx;
  height: 32rpx;
  border-radius: 9rpx;
  border: 2rpx solid #c2d6cb;
  background: #f4f9f6;
  display: grid;
  place-items: center;
  transition: all 0.18s ease;
}

.option-check.checked,
.protocol-check.checked {
  background: #0b7a4b;
  border-color: transparent;
}

.option-tick {
  width: 16rpx;
  height: 9rpx;
  border-left: 4rpx solid #ffffff;
  border-bottom: 4rpx solid #ffffff;
  transform: rotate(-45deg) translateY(-1rpx);
}

.protocol-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 44rpx;
  padding: 0 4rpx;
}

.protocol-text {
  color: #4a5e55;
  font-size: 25rpx;
  line-height: 1.5;
  flex: 1;
}

.protocol-link {
  color: #0f8f58;
  font-weight: 600;
}

.login-button {
  width: 100%;
  height: 96rpx;
  background: #0b7a4b;
  border-radius: 20rpx;
  box-shadow: 0 16rpx 36rpx rgba(11, 122, 75, 0.26);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-button::after {
  border: none;
}

.network-detail {
  background: #fff7ed;
  border: 1rpx solid #fed7aa;
  border-radius: 18rpx;
  color: #9a3412;
  font-size: 23rpx;
  line-height: 1.5;
  margin-top: 24rpx;
  padding: 18rpx;
  word-break: break-all;
}
</style>
