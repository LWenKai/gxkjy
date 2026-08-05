<script setup lang="ts">
import { reactive, ref } from 'vue';
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app';
import {
  deleteClientProduct,
  listClientProducts,
  saveClientProduct,
  updateClientProduct,
  type ClientProduct,
} from '@/api/client';
import { ensureLogin, getCompany } from '@/utils/auth';

const T = {
  back: '\u8fd4\u56de',
  title: '\u5e38\u7528\u4ea7\u54c1',
  subtitle: '\u7ba1\u7406\u5f00\u8bc1\u65f6\u5e38\u7528\u7684\u4ea7\u54c1\u3001\u5355\u4f4d\u548c\u4ea7\u5730',
  searchPlaceholder: '\u8f93\u5165\u4ea7\u54c1\u540d\u6216\u4ea7\u5730',
  search: '\u67e5\u8be2',
  reset: '\u91cd\u7f6e',
  addTitle: '\u65b0\u589e\u5e38\u7528\u4ea7\u54c1',
  editTitle: '\u7f16\u8f91\u5e38\u7528\u4ea7\u54c1',
  productName: '\u4ea7\u54c1\u540d\u79f0',
  productPlaceholder: '\u4f8b\u5982 \u897f\u7ea2\u67ff\u3001\u9ec4\u74dc\u3001\u732a\u8089',
  unit: '\u9ed8\u8ba4\u5355\u4f4d',
  chooseUnit: '\u9009\u62e9\u5355\u4f4d',
  origin: '\u4ea7\u5730',
  originPlaceholder: '\u9ed8\u8ba4\u4f01\u4e1a\u5730\u5740\uff0c\u53ef\u4fee\u6539',
  remark: '\u5907\u6ce8',
  remarkPlaceholder: '\u9009\u586b',
  useCompanyOrigin: '\u4f7f\u7528\u4f01\u4e1a\u5730\u5740',
  save: '\u4fdd\u5b58\u4ea7\u54c1',
  update: '\u4fdd\u5b58\u4fee\u6539',
  cancelEdit: '\u53d6\u6d88\u7f16\u8f91',
  listTitle: '\u4ea7\u54c1\u5217\u8868',
  loading: '\u6b63\u5728\u52a0\u8f7d\u4ea7\u54c1...',
  empty: '\u6682\u65e0\u5e38\u7528\u4ea7\u54c1\uff0c\u65b0\u589e\u540e\u5f00\u8bc1\u65f6\u53ef\u5feb\u901f\u9009\u62e9\u3002',
  loadFailed: '\u5e38\u7528\u4ea7\u54c1\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  nameRequired: '\u8bf7\u8f93\u5165\u4ea7\u54c1\u540d\u79f0',
  saved: '\u4ea7\u54c1\u5df2\u4fdd\u5b58',
  updated: '\u4ea7\u54c1\u5df2\u66f4\u65b0',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  edit: '\u7f16\u8f91',
  remove: '\u5220\u9664',
  available: '\u53ef\u7528',
  notSet: '\u672a\u8bbe\u7f6e\u4ea7\u5730',
  confirmDeleteTitle: '\u5220\u9664\u5e38\u7528\u4ea7\u54c1',
  confirmDeleteContent: '\u5220\u9664\u540e\u5f00\u8bc1\u65f6\u4e0d\u518d\u663e\u793a\uff0c\u5386\u53f2\u5408\u683c\u8bc1\u4e0d\u53d7\u5f71\u54cd\u3002',
  deleted: '\u4ea7\u54c1\u5df2\u5220\u9664',
  deleteFailed: '\u5220\u9664\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  confirm: '\u786e\u5b9a',
  cancel: '\u53d6\u6d88',
};

const unitOptions = ['kg', '\u65a4', '\u7bb1', '\u888b', '\u76d2', '\u4e2a', '\u4ef6', '\u6279'];

const products = ref<ClientProduct[]>([]);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref('');
const error = ref('');
const keyword = ref('');
const editingId = ref('');

const form = reactive({
  product_name: '',
  default_unit: 'kg',
  origin: '',
  remark: '',
});

function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.switchTab({ url: '/pages/profile/index' });
}

function resetForm() {
  editingId.value = '';
  form.product_name = '';
  form.default_unit = 'kg';
  form.remark = '';
  if (!form.origin) useCompanyOrigin();
}

function useCompanyOrigin() {
  const company = getCompany();
  form.origin = company?.origin_address || company?.address || '';
}

function chooseUnit() {
  uni.showActionSheet({
    itemList: unitOptions,
    success: (res) => {
      form.default_unit = unitOptions[res.tapIndex] || form.default_unit;
    },
  });
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const items = await listClientProducts({
      keyword: keyword.value.trim(),
    });
    const search = keyword.value.trim().toLowerCase();
    products.value = search
      ? items.filter((item) =>
          [item.product_name, item.origin, item.default_unit, item.remark]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(search)),
        )
      : items;
  } catch {
    error.value = T.loadFailed;
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
}

function search() {
  load().catch(() => undefined);
}

function clearSearch() {
  keyword.value = '';
  load().catch(() => undefined);
}

function startEdit(item: ClientProduct) {
  editingId.value = item.id;
  form.product_name = item.product_name || '';
  form.default_unit = item.default_unit || 'kg';
  form.origin = item.origin || '';
  form.remark = item.remark || '';
  uni.pageScrollTo({ scrollTop: 0, duration: 180 });
}

async function submit() {
  const productName = form.product_name.trim();
  if (!productName) {
    uni.showToast({ title: T.nameRequired, icon: 'none' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      product_name: productName,
      default_unit: form.default_unit || 'kg',
      origin: form.origin.trim(),
      remark: form.remark.trim(),
    };
    if (editingId.value) {
      await updateClientProduct(editingId.value, payload);
      uni.showToast({ title: T.updated, icon: 'success' });
    } else {
      await saveClientProduct(payload);
      uni.showToast({ title: T.saved, icon: 'success' });
    }
    resetForm();
    await load();
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: string }).message || '')
        : '';
    uni.showToast({ title: message || T.saveFailed, icon: 'none' });
  } finally {
    saving.value = false;
  }
}

function removeProduct(item: ClientProduct) {
  uni.showModal({
    title: T.confirmDeleteTitle,
    content: `${item.product_name}\n${T.confirmDeleteContent}`,
    confirmText: T.remove,
    cancelText: T.cancel,
    success: async (res) => {
      if (!res.confirm) return;
      deletingId.value = item.id;
      try {
        await deleteClientProduct(item.id);
        if (editingId.value === item.id) resetForm();
        uni.showToast({ title: T.deleted, icon: 'success' });
        await load();
      } catch {
        uni.showToast({ title: T.deleteFailed, icon: 'none' });
      } finally {
        deletingId.value = '';
      }
    },
  });
}

onShow(() => {
  if (!ensureLogin()) return;
  if (!form.origin) useCompanyOrigin();
  load().catch(() => undefined);
});

onPullDownRefresh(() => {
  load().catch(() => undefined);
});
</script>

<template>
  <view class="page products-page">
    <view class="top-nav">
      <view class="back-btn" @tap="goBack">{{ T.back }}</view>
      <view>
        <text class="page-title">{{ T.title }}</text>
        <text class="page-subtitle">{{ T.subtitle }}</text>
      </view>
    </view>

    <view class="search-card">
      <input v-model="keyword" :placeholder="T.searchPlaceholder" confirm-type="search" @confirm="search" />
      <button class="search-button" @tap="search">{{ T.search }}</button>
      <button class="ghost-button" @tap="clearSearch">{{ T.reset }}</button>
    </view>

    <view class="section">
      <view class="section-head">
        <text class="section-title">{{ editingId ? T.editTitle : T.addTitle }}</text>
        <button v-if="editingId" class="text-button" @tap="resetForm">{{ T.cancelEdit }}</button>
      </view>
      <view class="form-card">
        <view class="field">
          <text>{{ T.productName }}</text>
          <input v-model="form.product_name" :placeholder="T.productPlaceholder" />
        </view>
        <view class="field two">
          <view>
            <text>{{ T.unit }}</text>
            <input v-model="form.default_unit" />
          </view>
          <view>
            <text>{{ T.origin }}</text>
            <input v-model="form.origin" :placeholder="T.originPlaceholder" />
          </view>
        </view>
        <view class="quick-actions">
          <button class="origin-button" @tap="chooseUnit">{{ T.chooseUnit }}</button>
          <button class="origin-button" @tap="useCompanyOrigin">{{ T.useCompanyOrigin }}</button>
        </view>
        <view class="field">
          <text>{{ T.remark }}</text>
          <input v-model="form.remark" :placeholder="T.remarkPlaceholder" />
        </view>
        <button class="save-button" :loading="saving" @tap="submit">
          {{ editingId ? T.update : T.save }}
        </button>
      </view>
    </view>

    <view class="section">
      <text class="section-title">{{ T.listTitle }}</text>
      <view v-if="error" class="empty">{{ error }}</view>
      <view v-else-if="loading && !products.length" class="empty">{{ T.loading }}</view>
      <view v-else-if="!products.length" class="empty">{{ T.empty }}</view>
      <view v-else class="product-list">
        <view v-for="item in products" :key="item.id" class="product-card">
          <view class="product-main">
            <view class="product-title-row">
              <text class="product-name">{{ item.product_name }}</text>
              <text class="status">{{ T.available }}</text>
            </view>
            <text class="product-meta">{{ item.default_unit || 'kg' }} · {{ item.origin || T.notSet }}</text>
          </view>
          <view class="product-actions">
            <button class="small-button" @tap="startEdit(item)">{{ T.edit }}</button>
            <button
              class="small-button danger"
              :loading="deletingId === item.id"
              @tap="removeProduct(item)"
            >
              {{ T.remove }}
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.products-page {
  padding-bottom: 40rpx;
}

.section,
.search-card,
.form-card {
  background: #fff;
  border: 1rpx solid #deece5;
  border-radius: 28rpx;
  box-shadow: 0 16rpx 38rpx rgba(17, 93, 65, 0.07);
  box-sizing: border-box;
}

.search-card {
  align-items: center;
  display: grid;
  gap: 14rpx;
  grid-template-columns: 1fr 132rpx 132rpx;
  margin-bottom: 22rpx;
  padding: 18rpx;
}

.search-card input {
  background: #f7fbf8;
  border-radius: 18rpx;
  color: #153d2d;
  font-size: 28rpx;
  min-height: 72rpx;
  padding: 14rpx 18rpx;
}

.search-button,
.ghost-button,
.text-button,
.origin-button,
.small-button {
  border-radius: 999rpx;
  font-size: 26rpx;
  font-weight: 800;
  margin: 0;
}

.search-button {
  background: #0f8f58;
  color: #fff;
  height: 72rpx;
  line-height: 72rpx;
}

.ghost-button,
.origin-button,
.small-button {
  background: #eef8f2;
  color: #0f8f58;
}

.section {
  margin-bottom: 22rpx;
  padding: 28rpx;
}

.section-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.text-button {
  background: transparent;
  color: #60766b;
  line-height: 56rpx;
}

.form-card {
  border: 2rpx solid #edf3ef;
  box-shadow: none;
  margin-top: 18rpx;
  padding: 22rpx;
}

.field {
  margin-bottom: 20rpx;
}

.field text {
  color: #60766b;
  display: block;
  font-size: 24rpx;
  font-weight: 800;
  margin-bottom: 10rpx;
}

.field input {
  background: #f7fbf8;
  border-radius: 18rpx;
  box-sizing: border-box;
  color: #153d2d;
  font-size: 28rpx;
  min-height: 78rpx;
  padding: 18rpx 20rpx;
  width: 100%;
}

.field.two {
  display: grid;
  gap: 18rpx;
  grid-template-columns: 180rpx 1fr;
}

.quick-actions {
  display: grid;
  gap: 14rpx;
  grid-template-columns: 1fr 1fr;
  margin-bottom: 20rpx;
}

.origin-button {
  height: 68rpx;
  line-height: 68rpx;
  width: 100%;
}

.save-button {
  background: #0f8f58;
  border-radius: 999rpx;
  color: #fff;
  font-size: 30rpx;
  font-weight: 900;
  height: 84rpx;
  line-height: 84rpx;
}

.product-list {
  display: grid;
  gap: 16rpx;
  margin-top: 18rpx;
}

.product-card {
  background: #f9fcfa;
  border: 1rpx solid #e2eee7;
  border-radius: 22rpx;
  padding: 22rpx;
}

.product-title-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
}

.product-name,
.product-meta {
  display: block;
}

.product-name {
  color: #16251c;
  flex: 1;
  font-size: 30rpx;
  font-weight: 900;
}

.product-meta {
  color: #738078;
  font-size: 24rpx;
  margin-top: 8rpx;
}

.status {
  background: #e8f8f0;
  border-radius: 999rpx;
  color: #0f8f58;
  flex-shrink: 0;
  font-size: 22rpx;
  font-weight: 800;
  padding: 8rpx 16rpx;
}

.product-actions {
  display: grid;
  gap: 14rpx;
  grid-template-columns: 1fr 1fr;
  margin-top: 18rpx;
}

.small-button {
  height: 68rpx;
  line-height: 68rpx;
}

.small-button.danger {
  background: #fff1f1;
  color: #c24141;
}
</style>
