<script setup lang="ts">
const servicePhone = '13363412262';

const sections = [
  {
    title: '如何查看检测记录',
    steps: ['在首页快捷功能中进入“检测记录”', '查看样品名称、检测时间和结论', '点进详情可看检测项目明细'],
  },
  {
    title: '如何开具合格证',
    steps: ['点击首页“开合格证”', '选择一条合格检测记录', '填写数量、产地和联系电话', '确认后生成合格证'],
  },
  {
    title: '如何打印合格证',
    steps: ['进入合格证详情', '点击“打印合格证”', '如未连接打印机，系统会优先连接上次设备', '连接后再打印标签'],
  },
  {
    title: '不合格记录怎么办',
    steps: ['不合格记录可以查看，但不能开具合格证', '请按企业内部流程处理该批产品', '如记录有误，请联系谷芯管理员协助排查'],
  },
  {
    title: '服务到期怎么办',
    steps: ['服务到期后部分功能可能受限', '请联系谷芯科技续期', `客服电话：${servicePhone}`],
  },
];

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.switchTab({ url: '/pages/profile/index' });
}

function callService() {
  uni.makePhoneCall({ phoneNumber: servicePhone });
}
</script>

<template>
  <view class="page help-page">
    <view class="top-nav">
      <view class="back-btn" @tap="goBack">返回</view>
      <view>
        <text class="page-title">使用帮助</text>
        <text class="page-subtitle">按日常操作整理，遇到问题可联系谷芯科技</text>
      </view>
    </view>

    <view class="help-hero">
      <text class="help-title">第一次使用，按这几步来</text>
      <text class="help-sub">先看检测记录，再选择合格记录开证，最后查看二维码或打印。</text>
    </view>

    <view v-for="section in sections" :key="section.title" class="card help-card">
      <text class="section-title">{{ section.title }}</text>
      <view class="step-list">
        <view v-for="(step, index) in section.steps" :key="step" class="step-row">
          <text class="step-no">{{ index + 1 }}</text>
          <text class="step-text">{{ step }}</text>
        </view>
      </view>
    </view>

    <view class="card contact-card" @tap="callService">
      <text class="section-title">联系谷芯科技</text>
      <text class="contact-phone">{{ servicePhone }}</text>
      <text class="muted">点击拨打客服电话</text>
    </view>
  </view>
</template>

<style scoped>
.help-hero {
  background: linear-gradient(135deg, #e9fff4 0%, #ffffff 64%, #e8f6ff 100%);
  border: 1rpx solid #d8eee2;
  border-radius: 30rpx;
  margin-bottom: 22rpx;
  padding: 30rpx;
}

.help-title,
.help-sub,
.contact-phone {
  display: block;
}

.help-title {
  color: #10281f;
  font-size: 38rpx;
  font-weight: 900;
}

.help-sub {
  color: #64766e;
  font-size: 26rpx;
  line-height: 1.6;
  margin-top: 10rpx;
}

.help-card {
  margin-bottom: 20rpx;
}

.step-list {
  display: grid;
  gap: 16rpx;
}

.step-row {
  align-items: flex-start;
  display: flex;
  gap: 18rpx;
}

.step-no {
  align-items: center;
  background: #e8f8f0;
  border-radius: 50%;
  color: #0f8f58;
  display: flex;
  flex: 0 0 auto;
  font-size: 24rpx;
  font-weight: 900;
  height: 42rpx;
  justify-content: center;
  width: 42rpx;
}

.step-text {
  color: #26332b;
  flex: 1;
  font-size: 28rpx;
  line-height: 1.55;
}

.contact-card {
  margin-bottom: 28rpx;
}

.contact-phone {
  color: #0f8f58;
  font-size: 42rpx;
  font-weight: 900;
  margin-bottom: 8rpx;
}
</style>
