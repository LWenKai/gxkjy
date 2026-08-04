<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { loginClient } from '@/api/client';
import { getLastRequestError } from '@/api/http';
import { getSavedPassword, getSavedUsername, savePassword, saveUsername, clearSavedPassword, setSession } from '@/utils/auth';

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
const loading = ref(false);
const networkDetail = ref('');

onMounted(() => {
  username.value = getSavedUsername();
  const savedPassword = getSavedPassword();
  if (savedPassword) {
    password.value = savedPassword;
    rememberPassword.value = true;
  }
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

async function submit() {
  const account = username.value.trim();
  const pwd = password.value;
  if (!account || !pwd) {
    uni.showToast({ title: INPUT_REQUIRED, icon: 'none' });
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
    <view class="login-glow"></view>
    <view class="login-orbit"></view>
    <view class="brand">
      <text class="brand-name">&#x8C37;&#x82AF;&#x5FEB;&#x68C0;&#x4E91;</text>
      <text class="brand-sub">&#x4F01;&#x4E1A;&#x5FEB;&#x68C0;&#x8BB0;&#x5F55;&#x4E0E;&#x5408;&#x683C;&#x8BC1;&#x7BA1;&#x7406;</text>
    </view>

    <view class="login-card">
      <view class="login-card-title">
        <text>&#x5BA2;&#x6237;&#x767B;&#x5F55;</text>
        <text>&#x8BF7;&#x8F93;&#x5165;&#x4F01;&#x4E1A;&#x8D26;&#x53F7;&#x7EE7;&#x7EED;&#x4F7F;&#x7528;</text>
      </view>
      <view class="field">
        <text class="field-label">&#x8D26;&#x53F7;</text>
        <input
          v-model="username"
          class="input"
          placeholder="&#x8BF7;&#x8F93;&#x5165;&#x8D26;&#x53F7;"
          confirm-type="next"
        />
      </view>
      <view class="field">
        <text class="field-label">&#x5BC6;&#x7801;</text>
        <input
          v-model="password"
          class="input"
          password
          placeholder="&#x8BF7;&#x8F93;&#x5165;&#x5BC6;&#x7801;"
          confirm-type="done"
          @confirm="submit"
        />
      </view>
      <view class="remember-row" @tap="rememberPassword = !rememberPassword">
        <checkbox :checked="rememberPassword" color="#0f8f58" />
        <text>&#x8BB0;&#x4F4F;&#x8D26;&#x53F7;&#x548C;&#x5BC6;&#x7801;&#xFF0C;&#x4E0B;&#x6B21;&#x81EA;&#x52A8;&#x586B;&#x5199;</text>
      </view>
      <button class="primary-button login-button" :loading="loading" @tap="submit">&#x767B;&#x5F55;</button>
      <view v-if="networkDetail" class="network-detail">
        <text>{{ networkDetail }}</text>
      </view>
      <view class="login-help-row">
        <text>&#x5FD8;&#x8BB0;&#x5BC6;&#x7801;&#x8BF7;&#x8054;&#x7CFB;&#x7BA1;&#x7406;&#x5458;&#x91CD;&#x7F6E;</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.login-page {
  background:
    radial-gradient(circle at 84% 2%, rgba(19, 166, 179, 0.16), transparent 30%),
    radial-gradient(circle at 12% 78%, rgba(15, 143, 88, 0.12), transparent 34%),
    linear-gradient(180deg, #eaf8f2 0%, #f8fcfa 62%, #ffffff 100%);
  box-sizing: border-box;
  min-height: 100vh;
  overflow: hidden;
  padding: 132rpx 42rpx 48rpx;
  position: relative;
}

.login-glow {
  background: linear-gradient(135deg, rgba(15, 143, 88, 0.14), rgba(19, 166, 179, 0.08));
  border: 1rpx solid rgba(15, 143, 88, 0.12);
  border-radius: 80rpx;
  height: 320rpx;
  position: absolute;
  right: -96rpx;
  top: -88rpx;
  transform: rotate(12deg);
  width: 320rpx;
}

.login-orbit {
  border: 1rpx solid rgba(15, 143, 88, 0.13);
  border-radius: 50%;
  height: 520rpx;
  left: -240rpx;
  position: absolute;
  top: 120rpx;
  width: 520rpx;
}

.brand {
  display: grid;
  gap: 16rpx;
  margin-bottom: 58rpx;
  position: relative;
  z-index: 1;
}

.brand-sub {
  color: #0f8f58;
  font-size: 30rpx;
}

.brand-name {
  color: #083d32;
  font-size: 72rpx;
  font-weight: 900;
}

.login-card {
  background: rgba(255, 255, 255, 0.98);
  border: 1rpx solid rgba(218, 236, 228, 0.92);
  border-radius: 40rpx;
  box-shadow: 0 30rpx 72rpx rgba(12, 65, 43, 0.13);
  padding: 48rpx 36rpx 38rpx;
  position: relative;
  z-index: 1;
}

.login-card-title {
  display: grid;
  gap: 8rpx;
  margin-bottom: 28rpx;
}

.login-card-title text:first-child {
  color: #10281f;
  font-size: 40rpx;
  font-weight: 900;
}

.login-card-title text:last-child {
  color: #6a786f;
  font-size: 26rpx;
}

.login-button {
  margin-top: 28rpx;
}

.remember-row {
  align-items: center;
  color: #486259;
  display: flex;
  font-size: 25rpx;
  gap: 8rpx;
  margin-top: 24rpx;
}

.remember-row checkbox {
  transform: scale(0.78);
}

.login-help-row {
  color: #128243;
  font-size: 26rpx;
  margin-top: 28rpx;
  text-align: center;
}

.network-detail {
  background: #fff7ed;
  border: 1rpx solid #fed7aa;
  border-radius: 18rpx;
  color: #9a3412;
  font-size: 23rpx;
  line-height: 1.5;
  margin-top: 22rpx;
  padding: 18rpx;
  word-break: break-all;
}
</style>
