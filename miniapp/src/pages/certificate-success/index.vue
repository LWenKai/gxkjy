<script setup lang="ts">
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getCertificate, type CertificateDetail } from '@/api/client';
import { formatDateTime } from '@/utils/format';

const certificate = ref<CertificateDetail | null>(null);
const loading = ref(false);
const error = ref('');

async function loadCertificate(id: string) {
  loading.value = true;
  error.value = '';
  try {
    certificate.value = await getCertificate(id);
  } catch {
    error.value = '合格证信息加载失败，请到合格证记录中查看';
  } finally {
    loading.value = false;
  }
}

function copyQrUrl() {
  const url = certificate.value?.qr_url;
  if (!url) {
    uni.showToast({ title: '暂无二维码链接', icon: 'none' });
    return;
  }
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '二维码链接已复制', icon: 'success' }),
  });
}

function goPrint() {
  if (!certificate.value) return;
  uni.navigateTo({ url: `/pages/print-preview/index?id=${certificate.value.id}` });
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' });
}

function goRecords() {
  uni.navigateTo({ url: '/pages/certificates/index' });
}

function goDetail() {
  if (!certificate.value) return;
  uni.redirectTo({ url: `/pages/certificates/detail?id=${certificate.value.id}` });
}

onLoad((query) => {
  const id = String(query?.id || '');
  if (id) loadCertificate(id).catch(() => undefined);
});
</script>

<template>
  <view class="page">
    <view class="success-hero">
      <view class="success-icon">✓</view>
      <text class="success-title">合格证已生成</text>
      <text class="success-sub">可查看二维码、打印标签，或返回首页继续操作。</text>
    </view>

    <view v-if="loading" class="empty">正在加载合格证...</view>
    <view v-else-if="error" class="empty">{{ error }}</view>

    <view v-if="certificate" class="card success-card">
      <view class="row"><text class="label">合格证编号</text><text class="value code">{{ certificate.certificate_no }}</text></view>
      <view class="row"><text class="label">产品名称</text><text class="value">{{ certificate.product_name }}</text></view>
      <view class="row"><text class="label">开具时间</text><text class="value">{{ formatDateTime(certificate.issue_time) }}</text></view>
    </view>

    <view v-else-if="!loading && !error" class="card empty-card">
      <text>未找到合格证信息，请返回合格证记录查看。</text>
    </view>

    <view class="action-grid">
      <view class="primary-button" @tap="goPrint">打印合格证</view>
      <view class="plain-button" @tap="copyQrUrl">复制二维码链接</view>
      <view class="plain-button" @tap="goDetail">查看合格证详情</view>
      <view class="ghost-action" @tap="goRecords">查看合格证记录</view>
      <view class="ghost-action" @tap="goHome">返回首页</view>
    </view>
  </view>
</template>

<style scoped>
.success-hero {
  align-items: center;
  background: linear-gradient(135deg, #073f33, #0f8f58);
  border-radius: 34rpx;
  color: #fff;
  display: flex;
  flex-direction: column;
  margin-bottom: 24rpx;
  padding: 56rpx 28rpx;
  text-align: center;
}

.success-icon {
  align-items: center;
  background: rgba(255, 255, 255, 0.18);
  border: 2rpx solid rgba(255, 255, 255, 0.34);
  border-radius: 50%;
  display: flex;
  font-size: 58rpx;
  font-weight: 900;
  height: 96rpx;
  justify-content: center;
  width: 96rpx;
}

.success-title {
  display: block;
  font-size: 44rpx;
  font-weight: 900;
  margin-top: 22rpx;
}

.success-sub {
  color: rgba(255, 255, 255, 0.78);
  display: block;
  font-size: 27rpx;
  line-height: 1.5;
  margin-top: 12rpx;
}

.success-card {
  margin-bottom: 24rpx;
}

.code {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}

.action-grid {
  display: grid;
  gap: 18rpx;
}

.ghost-action {
  color: #0f704b;
  font-size: 28rpx;
  font-weight: 800;
  line-height: 78rpx;
  text-align: center;
}
</style>
