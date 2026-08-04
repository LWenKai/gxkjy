<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onPullDownRefresh, onReachBottom, onShow } from '@dcloudio/uni-app';
import { listDetectionRecords, type ApiResult, type DetectionRecord } from '@/api/client';
import { ensureLogin } from '@/utils/auth';
import { canIssue, formatDateTime, recordIssueBlockReason, recordStatusText, resultClass, resultText } from '@/utils/format';

const tabs: Array<{ label: string; value: ApiResult | '' }> = [
  { label: '全部', value: '' },
  { label: '合格', value: 'qualified' },
  { label: '不合格', value: 'unqualified' },
];

const activeResult = ref<ApiResult | ''>('');
const keyword = ref('');
const dateRange = ref<'all' | 'today'>('all');
const items = ref<DetectionRecord[]>([]);
const page = ref(1);
const loading = ref(false);
const finished = ref(false);
const error = ref('');

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages/detection-records/detail?id=${id}` });
}

function matchDate(record: DetectionRecord) {
  if (dateRange.value !== 'today') return true;
  const date = new Date(record.test_time);
  if (Number.isNaN(date.getTime())) return false;
  return date.toDateString() === new Date().toDateString();
}

async function load(reset = false) {
  if (loading.value || (finished.value && !reset)) return;
  loading.value = true;
  error.value = '';
  try {
    const nextPage = reset ? 1 : page.value;
    const data = await listDetectionRecords({
      page: nextPage,
      page_size: 20,
      overall_result: activeResult.value,
      sample_name: keyword.value.trim(),
    });
    const records = data.items.filter(matchDate);
    items.value = reset ? records : [...items.value, ...records];
    page.value = nextPage + 1;
    finished.value = items.value.length >= data.total || records.length < 20;
  } catch {
    error.value = '检测记录加载失败，请稍后重试';
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function changeTab(value: ApiResult | '') {
  activeResult.value = value;
  search();
}

function search() {
  finished.value = false;
  load(true).catch(() => undefined);
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
    <view class="page-banner">
      <view>
        <text class="banner-title">检测记录</text>
        <text class="banner-sub">合格记录可用于开具合格证</text>
      </view>
      <text class="banner-pill">{{ dateRange === 'today' ? '今日' : '全部' }}</text>
    </view>

    <view class="search-box">
      <input v-model="keyword" class="search-input" placeholder="搜索样品或产品名称" confirm-type="search" @confirm="search" />
      <text class="search-action" @tap="search">查询</text>
    </view>

    <view class="filter three">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-item"
        :class="{ active: activeResult === tab.value }"
        @tap="changeTab(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <view v-if="error" class="empty">{{ error }}</view>

    <view class="list">
      <view v-for="record in items" :key="record.id" class="card record-card" @tap="openDetail(record.id)">
        <view class="record-head">
          <text class="record-title">{{ record.sample_name || record.product_name }}</text>
          <text class="tag" :class="resultClass(record.overall_result)">{{ resultText(record.overall_result) }}</text>
        </view>
        <view class="record-line">检测时间：{{ formatDateTime(record.test_time) }}</view>
        <view class="record-line">检测项目：{{ record.item_count || 0 }} 项</view>
        <view class="record-foot">
          <text class="muted">状态：{{ recordStatusText(record.status) }}</text>
          <text v-if="canIssue(record)" class="issue-flag">可开证</text>
          <text v-else class="muted">{{ recordIssueBlockReason(record) }}</text>
        </view>
      </view>

      <view v-if="!items.length && !loading && !error" class="empty">暂无检测记录</view>
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
  display: grid;
  gap: 14rpx;
  overflow: hidden;
  position: relative;
}

.record-card::before {
  background: linear-gradient(180deg, #0f8f58, #13a6b3);
  border-radius: 999rpx;
  content: "";
  height: 74rpx;
  left: -6rpx;
  position: absolute;
  top: 28rpx;
  width: 8rpx;
}

.record-head,
.record-foot {
  align-items: center;
  display: flex;
  gap: 18rpx;
  justify-content: space-between;
}

.record-title {
  color: #10281f;
  font-size: 34rpx;
  font-weight: 900;
}

.record-line {
  color: #596b62;
  font-size: 28rpx;
}

.issue-flag {
  background: #e8f8f0;
  border-radius: 999rpx;
  color: #0f8f58;
  font-size: 28rpx;
  font-weight: 800;
  padding: 6rpx 14rpx;
}

.page-banner {
  align-items: center;
  background: #ffffff;
  border: 1rpx solid #deece5;
  border-radius: 28rpx;
  box-shadow: 0 16rpx 38rpx rgba(17, 93, 65, 0.07);
  color: #1f2937;
  display: flex;
  justify-content: space-between;
  margin-bottom: 22rpx;
  padding: 28rpx;
}

.banner-title,
.banner-sub {
  display: block;
}

.banner-title {
  color: #10281f;
  font-size: 36rpx;
  font-weight: 900;
}

.banner-sub {
  color: #64766e;
  font-size: 25rpx;
  margin-top: 8rpx;
}

.banner-pill {
  background: #ecfdf5;
  border: 1rpx solid #d6f2df;
  border-radius: 999rpx;
  color: #15803d;
  font-size: 24rpx;
  font-weight: 800;
  padding: 8rpx 16rpx;
}
</style>
