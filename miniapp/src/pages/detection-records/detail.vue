<script setup lang="ts">
import { ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getDetectionRecord, type DetectionRecordDetail } from '@/api/client';
import { ensureLogin } from '@/utils/auth';
import { canIssue, formatDateTime, recordIssueBlockReason, recordStatusText, resultClass, resultText } from '@/utils/format';

const id = ref('');
const record = ref<DetectionRecordDetail | null>(null);
const loading = ref(false);
const error = ref('');

async function load() {
  if (!id.value) return;
  loading.value = true;
  error.value = '';
  try {
    record.value = await getDetectionRecord(id.value);
  } catch {
    error.value = '检测详情加载失败，请稍后重试';
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
  uni.redirectTo({ url: '/pages/detection-records/index' });
}

function goIssue() {
  if (!record.value) return;
  uni.setStorageSync('guxin_selected_detection_record_id', record.value.id);
  uni.navigateTo({ url: '/pages/certifiable/index' });
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
  <view class="page">
    <view class="top-nav">
      <view class="back-btn" @tap="goBack">返回</view>
      <view>
        <text class="page-title">检测详情</text>
        <text class="page-subtitle">查看检测结论和项目明细</text>
      </view>
    </view>

    <view v-if="loading" class="empty">加载中...</view>
    <view v-else-if="error" class="empty">{{ error }}</view>
    <view v-else-if="!record" class="empty">未找到检测记录</view>

    <template v-else>
      <view class="card summary">
        <view class="summary-head">
          <text class="title">{{ record.sample_name || record.product_name }}</text>
          <text class="tag" :class="resultClass(record.overall_result)">{{ resultText(record.overall_result) }}</text>
        </view>
        <view class="row"><text class="label">产品名称</text><text class="value">{{ record.product_name }}</text></view>
        <view class="row"><text class="label">检测时间</text><text class="value">{{ formatDateTime(record.test_time) }}</text></view>
        <view class="row"><text class="label">记录状态</text><text class="value">{{ recordStatusText(record.status) }}</text></view>
      </view>

      <view class="card items-card">
        <text class="section-title">检测项目明细</text>
        <view v-for="item in record.items" :key="item.id" class="item-row">
          <view>
            <text class="item-name">{{ item.test_item }}</text>
            <text class="item-method">{{ item.test_method || '未填写方法' }}</text>
            <text class="item-limit">限量值：{{ item.standard_limit || '-' }}</text>
          </view>
          <view class="item-result">
            <text>{{ item.test_value }}{{ item.unit || '' }}</text>
            <text class="tag" :class="resultClass(item.result)">{{ resultText(item.result) }}</text>
          </view>
        </view>
      </view>

      <view v-if="canIssue(record)" class="primary-button" @tap="goIssue">开具合格证</view>
      <view v-else class="warning">{{ recordIssueBlockReason(record) }}</view>
    </template>
  </view>
</template>

<style scoped>
.summary,
.items-card {
  margin-bottom: 22rpx;
}

.summary {
  background: linear-gradient(180deg, #ffffff, #f5fcf8);
}

.summary-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.title {
  color: #10281f;
  font-size: 38rpx;
  font-weight: 900;
}

.item-row {
  align-items: center;
  background: #f8fcfa;
  border: 1rpx solid #edf4ef;
  border-radius: 20rpx;
  display: flex;
  justify-content: space-between;
  margin-top: 16rpx;
  padding: 20rpx;
}

.item-name,
.item-method,
.item-limit {
  display: block;
}

.item-name {
  color: #14231a;
  font-size: 30rpx;
  font-weight: 800;
}

.item-method,
.item-limit {
  color: #7a8580;
  font-size: 24rpx;
  margin-top: 8rpx;
}

.item-result {
  display: grid;
  gap: 10rpx;
  justify-items: end;
}
</style>
