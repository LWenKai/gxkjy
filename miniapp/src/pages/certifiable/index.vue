<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import {
  createCertificate,
  getDetectionRecord,
  listClientProducts,
  saveClientProduct,
  uploadEvidenceFile,
  type ClientProduct,
  type CommitmentBasisType,
  type DetectionRecordDetail,
  type EvidenceAsset,
} from '@/api/client';
import { ensureLogin, getCompany } from '@/utils/auth';
import { commitmentBasisText, formatDateTime, resultText, todayText } from '@/utils/format';

const basisOptions: Array<{ value: CommitmentBasisType; title: string; desc: string }> = [
  { value: 'self_test_qualified', title: '自行检测合格', desc: '选择一条合格检测记录作为依据' },
  { value: 'quality_control', title: '质量安全控制符合要求', desc: '上传质量控制相关资料' },
  { value: 'entrusted_test_qualified', title: '委托检测合格', desc: '上传委托检测报告或证明' },
];

const unitOptions = ['kg', '斤', '箱', '袋', '盒', '个', '件', '批'];
const defaultStatement =
  '本主体承诺所销售农产品未使用禁用农药、兽药及其他化合物，使用的常规农药、兽药残留不超标，并对承诺内容真实性负责。';

const loading = ref(false);
const pageLoading = ref(false);
const pageError = ref('');
const products = ref<ClientProduct[]>([]);
const selectedRecord = ref<DetectionRecordDetail | null>(null);
const evidenceAssets = ref<EvidenceAsset[]>([]);

const form = reactive({
  commitment_basis_type: 'self_test_qualified' as CommitmentBasisType,
  product_name: '',
  quantity: '1',
  unit: 'kg',
  origin: '',
  issuer_name: '',
  contact_phone: '',
  print_copies: '1',
  remark: '',
  commitment_statement: defaultStatement,
});

const company = computed(() => getCompany() || null);
const needsDetection = computed(() => form.commitment_basis_type === 'self_test_qualified');
const needsEvidence = computed(() => form.commitment_basis_type !== 'self_test_qualified');
const selectedBasis = computed(
  () => basisOptions.find((item) => item.value === form.commitment_basis_type) || basisOptions[0],
);

function fillCompanyDefaults() {
  const currentCompany = company.value;
  if (!form.origin) form.origin = currentCompany?.origin_address || currentCompany?.address || '';
  if (!form.issuer_name) form.issuer_name = currentCompany?.name || '';
  if (!form.contact_phone) form.contact_phone = currentCompany?.phone || '';
}

function selectBasis(value: CommitmentBasisType) {
  form.commitment_basis_type = value;
  if (value !== 'self_test_qualified') {
    selectedRecord.value = null;
    uni.removeStorageSync('guxin_selected_detection_record_id');
  }
}

function chooseRecord() {
  uni.navigateTo({ url: '/pages/select-detection/index' });
}

function applyRecord(record: DetectionRecordDetail) {
  selectedRecord.value = record;
  form.commitment_basis_type = 'self_test_qualified';
  form.product_name = record.sample_name || record.product_name;
  fillCompanyDefaults();
}

function removeRecord() {
  selectedRecord.value = null;
  uni.removeStorageSync('guxin_selected_detection_record_id');
}

function chooseUnit() {
  uni.showActionSheet({
    itemList: unitOptions,
    success: (res) => {
      form.unit = unitOptions[res.tapIndex] || form.unit;
    },
  });
}

function chooseProduct(product: ClientProduct) {
  form.product_name = product.product_name;
  form.unit = product.default_unit || form.unit;
  if (product.origin) form.origin = product.origin;
}

function validateFile(file: { name?: string; size?: number }) {
  const name = file.name || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext)) {
    uni.showToast({ title: '仅支持图片或 PDF', icon: 'none' });
    return false;
  }
  if ((file.size || 0) > 10 * 1024 * 1024) {
    uni.showToast({ title: '单个文件不能超过 10MB', icon: 'none' });
    return false;
  }
  return true;
}

async function chooseEvidence() {
  const result = await new Promise<UniApp.ChooseFileSuccessCallbackResult>((resolve, reject) => {
    uni.chooseMessageFile({
      count: 6,
      type: 'all',
      extension: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      success: resolve,
      fail: reject,
    });
  }).catch(() => null);

  if (!result) return;
  for (const file of result.tempFiles) {
    if (!validateFile(file)) continue;
    try {
      const asset = await uploadEvidenceFile(file.path, {
        file_name: file.name,
        file_type:
          form.commitment_basis_type === 'entrusted_test_qualified'
            ? 'entrusted_test_report'
            : 'quality_control_material',
        is_public: form.commitment_basis_type === 'entrusted_test_qualified',
      });
      evidenceAssets.value.push(asset);
      uni.showToast({ title: '资料已上传', icon: 'success' });
    } catch {
      uni.showToast({ title: '上传失败，请重试', icon: 'none' });
    }
  }
}

function removeEvidence(index: number) {
  evidenceAssets.value.splice(index, 1);
}

async function saveAsProduct() {
  if (!form.product_name.trim()) {
    uni.showToast({ title: '请先填写产品名称', icon: 'none' });
    return;
  }
  try {
    await saveClientProduct({
      product_name: form.product_name.trim(),
      default_unit: form.unit,
      origin: form.origin,
    });
    products.value = await listClientProducts();
    uni.showToast({ title: '已保存为常用产品', icon: 'success' });
  } catch {
    uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
  }
}

function validate() {
  if (needsDetection.value && !selectedRecord.value) return '请选择一条合格检测记录';
  if (needsEvidence.value && evidenceAssets.value.length === 0) return '请上传至少一份依据资料';
  if (!form.product_name.trim()) return '请输入产品名称';
  if (!form.quantity.trim()) return '请输入产品数量';
  if (!Number(form.quantity) || Number(form.quantity) <= 0) return '产品数量必须大于 0';
  if (!form.unit.trim()) return '请选择单位';
  if (!form.origin.trim()) return '请输入产地';
  if (!form.issuer_name.trim()) return '请输入承诺主体';
  if (!form.contact_phone.trim()) return '请输入联系电话';
  const copies = Number(form.print_copies);
  if (!Number.isInteger(copies) || copies < 1) return '打印份数至少为 1';
  if (copies > 99) return '打印份数不能超过 99';
  return '';
}

async function submit() {
  const message = validate();
  if (message) {
    uni.showToast({ title: message, icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    const certificate = await createCertificate({
      commitment_basis_type: form.commitment_basis_type,
      detection_record_id: selectedRecord.value?.id,
      evidence_asset_ids: evidenceAssets.value.map((asset) => asset.id),
      certificate_type: 'agri_commitment_certificate',
      product_name: form.product_name.trim(),
      quantity: form.quantity.trim(),
      unit: form.unit,
      origin: form.origin.trim(),
      issuer_name: form.issuer_name.trim(),
      contact_phone: form.contact_phone.trim(),
      commitment_basis: commitmentBasisText(form.commitment_basis_type),
      commitment_statement: form.commitment_statement,
      print_copies: Number(form.print_copies),
      remark: form.remark.trim(),
    });
    uni.removeStorageSync('guxin_selected_detection_record_id');
    uni.navigateTo({ url: `/pages/certificate-success/index?id=${certificate.id}` });
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message || '')
        : '';
    uni.showToast({ title: message || '生成失败，请检查填写信息', icon: 'none' });
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
  uni.switchTab({ url: '/pages/index/index' });
}

async function hydrateSelectedRecord() {
  const recordId = uni.getStorageSync('guxin_selected_detection_record_id') as string;
  if (!recordId || selectedRecord.value?.id === recordId) return;
  pageLoading.value = true;
  pageError.value = '';
  try {
    const record = await getDetectionRecord(recordId);
    applyRecord(record);
  } catch {
    uni.removeStorageSync('guxin_selected_detection_record_id');
    pageError.value = '检测记录加载失败，请重新选择';
  } finally {
    pageLoading.value = false;
  }
}

onLoad((query) => {
  if (query?.record_id) {
    uni.setStorageSync('guxin_selected_detection_record_id', String(query.record_id));
  }
});

onShow(() => {
  if (!ensureLogin()) return;
  fillCompanyDefaults();
  hydrateSelectedRecord().catch(() => undefined);
  listClientProducts()
    .then((items) => {
      products.value = items || [];
    })
    .catch(() => {
      products.value = [];
    });
});
</script>

<template>
  <view class="page cert-page">
    <view class="top-nav">
      <view class="back-btn" @tap="goBack">返回</view>
      <view>
        <text class="page-title">开具合格证</text>
        <text class="page-subtitle">选择依据，填写必要信息后生成</text>
      </view>
    </view>

    <view v-if="pageLoading" class="empty">正在加载检测记录...</view>
    <view v-if="pageError" class="empty">{{ pageError }}</view>

    <view class="section">
      <text class="section-title">选择承诺依据</text>
      <view class="basis-list">
        <view
          v-for="item in basisOptions"
          :key="item.value"
          class="basis-card"
          :class="{ active: form.commitment_basis_type === item.value }"
          @tap="selectBasis(item.value)"
        >
          <view class="basis-dot"></view>
          <view>
            <text class="basis-title">{{ item.title }}</text>
            <text class="basis-desc">{{ item.desc }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">{{ needsDetection ? '检测依据' : '依据资料' }}</text>
      <view v-if="needsDetection" class="select-card">
        <template v-if="selectedRecord">
          <view class="record-summary">
            <text class="select-title">{{ selectedRecord.sample_name || selectedRecord.product_name }}</text>
            <text class="select-desc">{{ formatDateTime(selectedRecord.test_time) }} · {{ selectedRecord.items.length }} 项检测</text>
            <view class="record-items">
              <text v-for="item in selectedRecord.items.slice(0, 3)" :key="item.id" class="record-item">
                {{ item.test_item }}：{{ resultText(item.result) }}
              </text>
            </view>
          </view>
          <view class="inline-actions">
            <text @tap.stop="chooseRecord">更换</text>
            <text @tap.stop="removeRecord">移除</text>
          </view>
        </template>
        <template v-else>
          <view>
            <text class="select-title">选择合格检测记录</text>
            <text class="select-desc">系统只会列出可用于开证的合格记录</text>
          </view>
          <view class="mini-button" @tap="chooseRecord">去选择</view>
        </template>
      </view>

      <view v-else class="upload-area">
        <view class="select-card" @tap="chooseEvidence">
          <view>
            <text class="select-title">{{ selectedBasis.title }}</text>
            <text class="select-desc">上传图片或 PDF，单个文件不超过 10MB</text>
          </view>
          <view class="mini-button">上传资料</view>
        </view>
        <view v-if="evidenceAssets.length" class="evidence-list">
          <view v-for="(asset, index) in evidenceAssets" :key="asset.id" class="evidence-row">
            <view>
              <text class="file-name">{{ asset.file_name }}</text>
              <text class="file-desc">{{ asset.is_public ? '扫码页可展示' : '仅留存查看' }}</text>
            </view>
            <text class="remove" @tap="removeEvidence(index)">删除</text>
          </view>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title-row">
        <text class="section-title">产品信息</text>
        <text class="text-link" @tap="saveAsProduct">保存常用</text>
      </view>
      <view v-if="products.length" class="product-chips">
        <text v-for="product in products.slice(0, 8)" :key="product.id" class="product-chip" @tap="chooseProduct(product)">
          {{ product.product_name }}
        </text>
      </view>
      <view v-else class="hint">暂无常用产品，保存后下次可直接选择。</view>

      <view class="form-card">
        <view class="field">
          <text>产品名称</text>
          <input v-model="form.product_name" placeholder="从检测记录自动带入，也可修改" />
        </view>
        <view class="field two">
          <view>
            <text>产品数量</text>
            <input v-model="form.quantity" type="digit" placeholder="例如 1" />
          </view>
          <view @tap="chooseUnit">
            <text>单位</text>
            <input :value="form.unit" disabled />
          </view>
        </view>
        <view class="field">
          <text>产地</text>
          <input v-model="form.origin" placeholder="默认企业地址，可修改" />
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">承诺信息</text>
      <view class="form-card">
        <view class="field">
          <text>承诺主体</text>
          <input v-model="form.issuer_name" placeholder="默认企业名称" />
        </view>
        <view class="field">
          <text>联系电话</text>
          <input v-model="form.contact_phone" placeholder="默认企业电话" />
        </view>
        <view class="summary-line">
          <text>承诺依据</text>
          <text>{{ commitmentBasisText(form.commitment_basis_type) }}</text>
        </view>
        <view class="statement">
          <text>承诺事项</text>
          <textarea v-model="form.commitment_statement" auto-height />
        </view>
      </view>
    </view>

    <view class="section">
      <text class="section-title">开证信息</text>
      <view class="form-card">
        <view class="field two">
          <view>
            <text>开具时间</text>
            <input :value="todayText()" disabled />
          </view>
          <view>
            <text>打印份数</text>
            <input v-model="form.print_copies" type="number" placeholder="1" />
          </view>
        </view>
        <view class="field">
          <text>备注</text>
          <input v-model="form.remark" placeholder="选填" />
        </view>
      </view>
    </view>

    <view class="bottom-spacer"></view>
    <view class="bottom-bar">
      <button class="submit-button" :loading="loading" @tap="submit">生成合格证</button>
      <text class="bottom-tip">生成后可查看二维码并打印。</text>
    </view>
  </view>
</template>

<style scoped>
.cert-page {
  padding-bottom: 230rpx;
}

.section,
.form-card,
.select-card {
  background: #fff;
  border: 1rpx solid #deece5;
  border-radius: 28rpx;
  box-shadow: 0 16rpx 38rpx rgba(17, 93, 65, 0.07);
  box-sizing: border-box;
}

.section {
  margin-bottom: 22rpx;
  padding: 28rpx;
}

.section-title-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.section-title-row .section-title {
  margin-bottom: 0;
}

.text-link,
.inline-actions text,
.remove {
  color: #0f8f58;
  font-size: 25rpx;
  font-weight: 800;
}

.basis-list {
  display: grid;
  gap: 16rpx;
}

.basis-card {
  align-items: flex-start;
  background: #fbfefd;
  border: 2rpx solid #e3eee8;
  border-radius: 22rpx;
  display: flex;
  gap: 18rpx;
  padding: 22rpx;
}

.basis-card.active {
  background: #f0fbf5;
  border-color: #0f8f58;
}

.basis-dot {
  border: 4rpx solid #badbca;
  border-radius: 50%;
  height: 28rpx;
  margin-top: 6rpx;
  width: 28rpx;
}

.basis-card.active .basis-dot {
  background: #0f8f58;
  border-color: #0f8f58;
  box-shadow: inset 0 0 0 6rpx #fff;
}

.basis-title,
.select-title {
  color: #15271d;
  display: block;
  font-size: 29rpx;
  font-weight: 900;
}

.basis-desc,
.select-desc,
.hint,
.file-desc,
.bottom-tip {
  color: #6f8177;
  display: block;
  font-size: 24rpx;
  line-height: 1.55;
  margin-top: 6rpx;
}

.select-card {
  align-items: center;
  box-shadow: none;
  display: flex;
  gap: 20rpx;
  justify-content: space-between;
  padding: 24rpx;
}

.record-summary {
  flex: 1;
  min-width: 0;
}

.record-items {
  display: grid;
  gap: 6rpx;
  margin-top: 12rpx;
}

.record-item {
  color: #66736b;
  font-size: 24rpx;
}

.inline-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 24rpx;
}

.mini-button {
  background: #0f8f58;
  border-radius: 999rpx;
  color: #fff;
  flex: 0 0 auto;
  font-size: 26rpx;
  font-weight: 800;
  padding: 16rpx 24rpx;
}

.evidence-list {
  display: grid;
  gap: 14rpx;
  margin-top: 18rpx;
}

.evidence-row {
  background: #f6faf7;
  border-radius: 18rpx;
  display: flex;
  gap: 20rpx;
  justify-content: space-between;
  padding: 18rpx 20rpx;
}

.file-name {
  color: #1d2a22;
  display: block;
  font-size: 26rpx;
  font-weight: 800;
  max-width: 460rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-chips {
  display: flex;
  gap: 14rpx;
  margin-bottom: 18rpx;
  overflow-x: auto;
  padding-bottom: 8rpx;
}

.product-chip {
  background: #edf7f1;
  border-radius: 999rpx;
  color: #18744d;
  flex: 0 0 auto;
  font-size: 25rpx;
  padding: 14rpx 20rpx;
}

.form-card {
  border: 2rpx solid #edf3ef;
  box-shadow: none;
  padding: 22rpx;
}

.field {
  margin-bottom: 20rpx;
}

.field:last-child {
  margin-bottom: 0;
}

.field text,
.statement text,
.summary-line text:first-child {
  color: #60766b;
  display: block;
  font-size: 24rpx;
  font-weight: 800;
  margin-bottom: 10rpx;
}

.field input,
.statement textarea {
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
  grid-template-columns: 1fr 180rpx;
}

.summary-line {
  align-items: center;
  background: #f0faf5;
  border-radius: 18rpx;
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding: 18rpx 20rpx;
}

.summary-line text {
  margin: 0;
}

.summary-line text:last-child {
  color: #0f8f58;
  font-weight: 900;
}

.statement textarea {
  line-height: 1.6;
  min-height: 150rpx;
}

.bottom-spacer {
  height: 136rpx;
}

.bottom-bar {
  background: rgba(255, 255, 255, 0.99);
  border-top: 1rpx solid #e3eee8;
  bottom: 0;
  box-shadow: 0 -18rpx 50rpx rgba(20, 77, 49, 0.16);
  box-sizing: border-box;
  left: 0;
  padding: 22rpx 28rpx calc(34rpx + env(safe-area-inset-bottom));
  position: fixed;
  right: 0;
  z-index: 999;
}

.submit-button {
  background: linear-gradient(135deg, #0d8b54 0%, #16b4a5 100%);
  border-radius: 999rpx;
  box-shadow: 0 12rpx 28rpx rgba(15, 143, 88, 0.22);
  color: #fff;
  font-size: 31rpx;
  font-weight: 900;
  height: 88rpx;
  line-height: 88rpx;
  overflow: hidden;
}

.bottom-tip {
  color: #6b7d73;
  display: block;
  font-size: 24rpx;
  margin-top: 10rpx;
  text-align: center;
}
</style>
