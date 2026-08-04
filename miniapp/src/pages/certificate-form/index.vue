<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';

onLoad((query) => {
  const recordId = String(query?.recordId || query?.record_id || '');
  if (recordId) {
    uni.setStorageSync('guxin_selected_detection_record_id', recordId);
  }
  uni.redirectTo({ url: '/pages/certifiable/index' });
});
</script>

<template>
  <view class="page">
    <view class="empty">正在进入开具合格证页面...</view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4fbf7;
  color: #49635a;
  font-size: 28rpx;
}
</style>
