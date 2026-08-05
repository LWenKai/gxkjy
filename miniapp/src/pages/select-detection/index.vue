<script setup lang="ts">
import { ref } from 'vue';
import { onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import { listCertifiableRecords, type DetectionRecord } from '@/api/client';
import { ensureLogin } from '@/utils/auth';
import { formatDateTime } from '@/utils/format';

const keyword = ref('');
const range = ref<'all' | 'today' | 'week'>('all');
const items = ref<DetectionRecord[]>([]);
const page = ref(1);
const total = ref(0);
const loading = ref(false);
const finished = ref(false);
const error = ref('');

const ranges = [
  { label: '全部', value: 'all' },
  { label: '今天', value: 'today' },
  { label: '近7天', value: 'week' },
] as const;

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.redirectTo({ url: '/pages/certifiable/index' });
}

function matchRange(record: DetectionRecord) {
  if (range.value === 'all') return true;
  const date = new Date(record.test_time);
  const now = new Date();
  if (Number.isNaN(date.getTime())) return false;
  if (range.value === 'today') return date.toDateString() === now.toDateString();
  const diff = now.getTime() - date.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

async function load(reset = false) {
  if (loading.value || (finished.value && !reset)) return;
  loading.value = true;
  error.value = '';
  try {
    const nextPage = reset ? 1 : page.value;
    const data = await listCertifiableRecords({
      page: nextPage,
      page_size: 20,
      sample_name: keyword.value.trim(),
    });
    total.value = data.total;
    const records = data.items.filter(matchRange);
    items.value = reset ? records : [...items.value, ...records];
    page.value = nextPage + 1;
    finished.value = items.value.length >= data.total || data.items.length < 20;
  } catch {
    error.value = '可开证记录加载失败，请稍后重试';
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function search() {
  finished.value = false;
  page.value = 1;
  load(true).catch(() => undefined);
}

function changeRange(value: 'all' | 'today' | 'week') {
  range.value = value;
  search();
}

function pick(record: DetectionRecord) {
  uni.setStorageSync('guxin_selected_detection_record_id', record.id);
  uni.navigateBack();
}

onShow(() => {
  if (!ensureLogin()) return;
  search();
});

onReachBottom(() => {
  load().catch(() => undefined);
});

onPullDownRefresh(() => {
  search();
});
</script>

<template>
  <view class="page">
    <view class="top-nav">
      <view class="back-btn" @tap="goBack">返回</view>
      <view>
        <text class="page-title">选择检测记录</text>
        <text class="page-subtitle">只显示合格且可用于开证的记录</text>
      </view>
    </view>

    <view class="page-hero select-hero">
      <text class="page-hero-title">选择开证依据</text>
      <text class="page-hero-sub">选中后自动带入产品名称、检测时间和项目明细</text>
      <text class="page-hero-pill">共 {{ total }} 条可选记录</text>
    </view>

    <view class="search-box">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索样品或产品名称"
        confirm-type="search"
        @confirm="search"
      />
      <text class="search-action" @tap="search">查询</text>
    </view>

    <view class="filter three">
      <view
        v-for="item in ranges"
        :key="item.value"
        class="filter-item"
        :class="{ active: range === item.value }"
        @tap="changeRange(item.value)"
      >
        {{ item.label }}
      </view>
    </view>

    <view v-if="error" class="empty">{{ error }}</view>

    <view class="list">
      <view v-for="record in items" :key="record.id" class="card record-card" @tap="pick(record)">
        <view class="record-main">
          <text class="record-title">{{ record.sample_name || record.product_name }}</text>
          <text class="record-sub">{{ formatDateTime(record.test_time) }}</text>
          <text class="record-sub">
            检测项目 {{ record.item_count || 0 }} 项 · 已开证 {{ record.certificate_count || 0 }} 次
          </text>
        </view>
        <view class="select-btn">选择</view>
      </view>

      <view v-if="!items.length && !loading && !error" class="empty">暂无可用于开证的合格检测记录</view>
      <view v-if="loading" class="empty">加载中...</view>
      <view v-if="finished && items.length" class="empty">已加载全部</view>
    </view>
  </view>
</template>

<style scoped>
.three {
  grid-template-columns: repeat(3, 1fr);
}

.record-card {
  align-items: center;
  background: linear-gradient(180deg, #ffffff, #f8fcfa);
  display: flex;
  gap: 20rpx;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
}

.record-card::before {
  background: #0f8f58;
  border-radius: 999rpx;
  content: "";
  height: 64rpx;
  left: 0;
  position: absolute;
  top: 30rpx;
  width: 8rpx;
}

.record-main {
  flex: 1;
  min-width: 0;
}

.record-title,
.record-sub {
  display: block;
}

.record-title {
  color: #14231a;
  font-size: 32rpx;
  font-weight: 900;
}

.record-sub {
  color: #6d7b72;
  font-size: 25rpx;
  margin-top: 8rpx;
}

.select-btn {
  background: #0f8f58;
  border-radius: 999rpx;
  color: #fff;
  flex: 0 0 auto;
  font-size: 26rpx;
  font-weight: 800;
  padding: 14rpx 24rpx;
}
</style>
