<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getCertificate, voidCertificate, type CertificateDetail } from '@/api/client';
import { ensureLogin } from '@/utils/auth';
import {
  certificateStatusText,
  commitmentBasisText,
  formatDateTime,
  resultClass,
  resultText,
} from '@/utils/format';

const id = ref('');
const certificate = ref<CertificateDetail | null>(null);
const loading = ref(false);
const error = ref('');

const publicQrUrl = computed(() => {
  const url = certificate.value?.qr_url || '';
  return url.replace(/^http:\/\/\d+\.\d+\.\d+\.\d+/, 'https://cert.gxkjy.com');
});

async function load() {
  if (!id.value) return;
  loading.value = true;
  error.value = '';
  try {
    certificate.value = await getCertificate(id.value);
  } catch {
    error.value = '合格证详情加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.redirectTo({ url: '/pages/certificates/index' });
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' });
}

function openPrint() {
  if (!certificate.value) return;
  if (certificate.value.status !== 'normal') {
    uni.showToast({ title: '已作废合格证不能打印', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/print-preview/index?id=${certificate.value.id}` });
}

function copyQrUrl() {
  if (!publicQrUrl.value) {
    uni.showToast({ title: '暂无二维码链接', icon: 'none' });
    return;
  }
  uni.setClipboardData({
    data: publicQrUrl.value,
    success: () => uni.showToast({ title: '二维码链接已复制', icon: 'success' }),
  });
}

async function voidCurrent() {
  if (!certificate.value) return;
  const result = await new Promise<UniApp.ShowModalRes>((resolve) => {
    uni.showModal({
      title: '确认作废',
      content: '作废后不能继续打印，扫码页会显示已作废。确认继续？',
      cancelText: '取消',
      confirmText: '确认作废',
      confirmColor: '#c9352a',
      success: resolve,
    });
  });
  if (!result.confirm) return;

  try {
    certificate.value = await voidCertificate(certificate.value.id);
    uni.showToast({ title: '已作废', icon: 'success' });
  } catch {
    uni.showToast({ title: '作废失败，请稍后重试', icon: 'none' });
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
  <view class="page detail-page">
    <view class="top-nav">
      <view class="back-btn" @tap="goBack">返回</view>
      <view>
        <text class="page-title">合格证详情</text>
        <text class="page-subtitle">查看合格证信息和打印状态</text>
      </view>
    </view>

    <view v-if="loading" class="empty">正在加载合格证...</view>
    <view v-else-if="error" class="empty">{{ error }}</view>
    <view v-else-if="!certificate" class="empty">未找到合格证</view>

    <template v-else>
      <view class="certificate-hero" :class="{ voided: certificate.status !== 'normal' }">
        <view>
          <text class="product-name">{{ certificate.product_name }}</text>
          <text class="certificate-no">{{ certificate.certificate_no }}</text>
        </view>
        <text class="status-pill">{{ certificateStatusText(certificate.status) }}</text>
      </view>

      <view class="primary-actions">
        <view class="action-card highlight" @tap="openPrint">
          <image class="action-icon" src="/static/home-icons/printer.png" mode="aspectFit" />
          <text>打印合格证</text>
        </view>
        <view class="action-card" @tap="goHome">
          <image class="action-icon" src="/static/tabbar/home-active.png" mode="aspectFit" />
          <text>返回首页</text>
        </view>
      </view>

      <view v-if="certificate.status !== 'normal'" class="warning">
        该合格证已作废，不得继续作为有效凭证使用。
      </view>

      <view class="card info-card">
        <text class="section-title">合格证信息</text>
        <view class="row"><text class="label">开具时间</text><text class="value">{{ formatDateTime(certificate.issue_time) }}</text></view>
        <view v-if="certificate.void_time" class="row"><text class="label">作废时间</text><text class="value">{{ formatDateTime(certificate.void_time) }}</text></view>
        <view class="row"><text class="label">产品数量</text><text class="value">{{ certificate.quantity }} {{ certificate.unit }}</text></view>
        <view class="row"><text class="label">产地</text><text class="value">{{ certificate.origin || '-' }}</text></view>
        <view class="row"><text class="label">承诺主体</text><text class="value">{{ certificate.issuer_name || certificate.company_name || '-' }}</text></view>
        <view class="row"><text class="label">联系电话</text><text class="value">{{ certificate.contact_phone }}</text></view>
      </view>

      <view class="card info-card">
        <text class="section-title">承诺依据</text>
        <view class="basis-line">
          <text>{{ commitmentBasisText(certificate.commitment_basis_type) }}</text>
        </view>
        <view class="statement">
          {{ certificate.commitment_statement || '本主体承诺对开具内容真实性负责。' }}
        </view>
      </view>

      <view class="card info-card">
        <text class="section-title">检测或依据资料</text>
        <template v-if="certificate.detection_record">
          <view class="record-head">
            <text>{{ certificate.detection_record.product_name }}</text>
            <text class="tag" :class="resultClass(certificate.detection_record.overall_result)">
              {{ resultText(certificate.detection_record.overall_result) }}
            </text>
          </view>
          <view v-for="item in certificate.detection_record.items" :key="item.id" class="test-item">
            <view>
              <text class="item-name">{{ item.test_item }}</text>
              <text class="muted">{{ item.test_method || '检测方法未填写' }}</text>
            </view>
            <view class="item-result">
              <text>{{ item.test_value }}{{ item.unit || '' }}</text>
              <text class="tag" :class="resultClass(item.result)">{{ resultText(item.result) }}</text>
            </view>
          </view>
        </template>
        <template v-else-if="certificate.evidence_assets?.length">
          <view v-for="asset in certificate.evidence_assets" :key="asset.id" class="test-item">
            <view>
              <text class="item-name">{{ asset.file_name }}</text>
              <text class="muted">{{ asset.is_public ? '扫码页可展示' : '仅留存查看' }}</text>
            </view>
            <text class="tag gray">{{ asset.mime_type?.includes('pdf') ? 'PDF' : '图片' }}</text>
          </view>
        </template>
        <view v-else class="empty small">暂无依据资料</view>
      </view>

      <view class="card info-card">
        <text class="section-title">扫码链接</text>
        <view class="qr-card" @tap="copyQrUrl">
          <text class="qr-line">{{ publicQrUrl || '暂无二维码链接' }}</text>
          <text class="qr-tip">点击复制，可发给采购方查看</text>
        </view>
      </view>

      <view class="card info-card">
        <text class="section-title">打印记录</text>
        <view v-if="certificate.print_logs?.length" class="print-list">
          <view v-for="log in certificate.print_logs" :key="log.id" class="print-row">
            <text>{{ log.print_status === 'success' ? '打印成功' : '打印失败' }}</text>
            <text class="muted">{{ formatDateTime(log.printed_at) }}</text>
          </view>
        </view>
        <view v-else class="empty small">暂无打印记录</view>
      </view>

      <view v-if="certificate.status === 'normal'" class="danger-button" @tap="voidCurrent">作废合格证</view>
    </template>
  </view>
</template>

<style scoped>
.detail-page {
  padding-bottom: 48rpx;
}

.certificate-hero {
  align-items: flex-start;
  background: linear-gradient(135deg, #073f33 0%, #0f8f58 58%, #13a6b3 100%);
  border-radius: 34rpx;
  box-shadow: 0 22rpx 50rpx rgba(12, 65, 43, 0.18);
  display: flex;
  gap: 18rpx;
  justify-content: space-between;
  margin-bottom: 18rpx;
  padding: 34rpx 30rpx;
}

.certificate-hero.voided {
  background: linear-gradient(135deg, #4d4d4d, #7a7a7a);
}

.product-name,
.certificate-no {
  color: #fff;
  display: block;
}

.product-name {
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.25;
}

.certificate-no {
  font-size: 28rpx;
  font-weight: 800;
  margin-top: 12rpx;
  opacity: 0.86;
}

.status-pill {
  background: rgba(255, 255, 255, 0.16);
  border: 1rpx solid rgba(255, 255, 255, 0.28);
  border-radius: 999rpx;
  color: #fff;
  flex: 0 0 auto;
  font-size: 24rpx;
  font-weight: 900;
  padding: 10rpx 18rpx;
}

.primary-actions {
  display: grid;
  gap: 14rpx;
  grid-template-columns: repeat(2, 1fr);
  margin-bottom: 18rpx;
}

.action-card {
  align-items: center;
  background: #fff;
  border: 1rpx solid #deece5;
  border-radius: 24rpx;
  box-shadow: 0 12rpx 26rpx rgba(17, 93, 65, 0.07);
  color: #203129;
  display: flex;
  flex-direction: column;
  font-size: 24rpx;
  font-weight: 800;
  gap: 10rpx;
  justify-content: center;
  min-height: 132rpx;
}

.action-card.highlight {
  background: #edf8f2;
  color: #0f8f58;
}

.action-icon {
  align-items: center;
  background: #e8f8f0;
  border-radius: 18rpx;
  display: flex;
  height: 54rpx;
  justify-content: center;
  padding: 10rpx;
  width: 54rpx;
}

.info-card {
  margin-bottom: 20rpx;
}

.basis-line,
.statement,
.qr-card,
.record-head,
.test-item,
.print-row {
  background: #f8fcfa;
  border: 1rpx solid #edf4ef;
  border-radius: 20rpx;
  margin-top: 14rpx;
  padding: 18rpx 20rpx;
}

.basis-line {
  color: #0f8f58;
  font-size: 30rpx;
  font-weight: 900;
}

.statement {
  color: #34443a;
  font-size: 28rpx;
  line-height: 1.7;
}

.record-head,
.test-item,
.print-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.item-name {
  color: #14231a;
  display: block;
  font-size: 30rpx;
  font-weight: 800;
}

.item-result {
  display: grid;
  gap: 8rpx;
  justify-items: end;
}

.qr-line,
.qr-tip {
  display: block;
}

.qr-line {
  color: #0f8f58;
  font-size: 25rpx;
  line-height: 1.5;
  word-break: break-all;
}

.qr-tip {
  color: #7b8b82;
  font-size: 24rpx;
  margin-top: 10rpx;
}

.small {
  padding: 24rpx 16rpx;
}
</style>
