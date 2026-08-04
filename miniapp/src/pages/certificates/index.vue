<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import { listCertificates, type Certificate, type CertificateStatus } from '@/api/client';
import { ensureLogin } from '@/utils/auth';
import { certificateStatusText, commitmentBasisText, formatDateTime } from '@/utils/format';

const statusTabs: Array<{ label: string; value: CertificateStatus | '' }> = [
  { label: '全部', value: '' },
  { label: '正常', value: 'normal' },
  { label: '已作废', value: 'voided' },
];
const dateTabs = [
  { label: '全部', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '近7天', value: 'week' },
] as const;

const activeStatus = ref<CertificateStatus | ''>('');
const dateRange = ref<'all' | 'today' | 'week'>('all');
const keyword = ref('');
const items = ref<Certificate[]>([]);
const page = ref(1);
const loading = ref(false);
const finished = ref(false);
const error = ref('');

function matchDate(item: Certificate) {
  if (dateRange.value === 'all') return true;
  const date = new Date(item.issue_time);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return false;
  if (dateRange.value === 'today') return date.toDateString() === now.toDateString();
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

async function load(reset = false) {
  if (loading.value || (finished.value && !reset)) return;
  loading.value = true;
  error.value = '';
  try {
    const nextPage = reset ? 1 : page.value;
    const data = await listCertificates({
      page: nextPage,
      page_size: 20,
      status: activeStatus.value,
      product_name: keyword.value.trim(),
    });
    const filtered = data.items.filter(matchDate);
    items.value = reset ? filtered : [...items.value, ...filtered];
    page.value = nextPage + 1;
    finished.value = items.value.length >= data.total || filtered.length < 20;
  } catch {
    error.value = '开证记录加载失败，请稍后重试';
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function changeStatus(value: CertificateStatus | '') {
  activeStatus.value = value;
  search();
}

function changeDate(value: 'all' | 'today' | 'week') {
  dateRange.value = value;
  search();
}

function search() {
  finished.value = false;
  load(true).catch(() => undefined);
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages/certificates/detail?id=${id}` });
}

function backHome() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.switchTab({ url: '/pages/index/index' });
}

onLoad((query) => {
  if (query?.date === 'today') dateRange.value = 'today';
});

onShow(() => {
  if (!ensureLogin()) return;
  load(true).catch(() => undefined);
});

onReachBottom(() => {
  load().catch(() => undefined);
});

onPullDownRefresh(() => {
  finished.value = false;
  load(true).catch(() => undefined);
});
</script>

<template>
  <view class="page">
    <view class="top-nav">
      <view class="back-btn" @tap="backHome">返回</view>
      <view>
        <text class="page-title">开证记录</text>
        <text class="page-subtitle">查看已开合格证、打印和作废状态</text>
      </view>
    </view>

    <view class="page-hero cert-hero">
      <text class="page-hero-title">合格证档案</text>
      <text class="page-hero-sub">查看扫码、打印和作废状态</text>
      <text class="page-hero-pill">{{ activeStatus ? certificateStatusText(activeStatus) : '全部证书' }}</text>
    </view>

    <view class="search-box">
      <input v-model="keyword" class="search-input" placeholder="搜索产品名称或合格证编号" confirm-type="search" @confirm="search" />
      <text class="search-action" @tap="search">查询</text>
    </view>

    <view class="filter three">
      <view v-for="tab in statusTabs" :key="tab.value" class="filter-item" :class="{ active: activeStatus === tab.value }" @tap="changeStatus(tab.value)">
        {{ tab.label }}
      </view>
    </view>

    <view class="filter three">
      <view v-for="tab in dateTabs" :key="tab.value" class="filter-item" :class="{ active: dateRange === tab.value }" @tap="changeDate(tab.value)">
        {{ tab.label }}
      </view>
    </view>

    <view v-if="error" class="empty">{{ error }}</view>

    <view class="list">
      <view v-for="item in items" :key="item.id" class="card cert-card" @tap="openDetail(item.id)">
        <view class="cert-head">
          <text class="cert-no">{{ item.certificate_no }}</text>
          <text class="tag" :class="item.status === 'normal' ? 'success' : 'gray'">{{ certificateStatusText(item.status) }}</text>
        </view>
        <text class="cert-title">{{ item.product_name }}</text>
        <view class="cert-meta">{{ commitmentBasisText(item.commitment_basis_type) }}</view>
        <view class="cert-line">
          <text>数量：{{ item.quantity }} {{ item.unit }}</text>
          <text>{{ formatDateTime(item.issue_time) }}</text>
        </view>
        <view class="cert-line">
          <text>承诺主体：{{ item.issuer_name }}</text>
        </view>
      </view>

      <view v-if="!items.length && !loading && !error" class="empty">暂无合格证记录</view>
      <view v-if="loading" class="empty">加载中...</view>
      <view v-if="finished && items.length" class="empty">已加载全部</view>
    </view>
  </view>
</template>

<style scoped>
.three {
  grid-template-columns: repeat(3, 1fr);
}

.cert-card {
  background: linear-gradient(180deg, #ffffff, #f8fcfa);
  display: grid;
  gap: 14rpx;
  overflow: hidden;
  position: relative;
}

.cert-card::before {
  background: linear-gradient(180deg, #0f8f58, #13a6b3);
  border-radius: 999rpx;
  content: "";
  height: 72rpx;
  left: 0;
  position: absolute;
  top: 28rpx;
  width: 8rpx;
}

.cert-head,
.cert-line {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.cert-no {
  color: #0f8f58;
  font-size: 28rpx;
  font-weight: 900;
}

.cert-title {
  color: #14231a;
  font-size: 34rpx;
  font-weight: 900;
}

.cert-line {
  color: #59665f;
  font-size: 26rpx;
  gap: 18rpx;
  line-height: 1.5;
}

.cert-meta {
  align-self: flex-start;
  background: #eef9f4;
  border: 1rpx solid #d8efe2;
  border-radius: 999rpx;
  color: #0f8f58;
  display: inline-flex;
  font-size: 25rpx;
  font-weight: 800;
  padding: 8rpx 16rpx;
}
</style>
