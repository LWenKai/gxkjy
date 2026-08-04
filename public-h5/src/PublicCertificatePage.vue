<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  API_BASE_URL,
  getPublicCertificate,
  getPublicSettings,
  type PublicCertificateResponse,
  type PublicEvidenceAsset,
  type PublicResult,
  type PublicSettings,
} from './api';

const loading = ref(true);
const loadError = ref('');
const data = ref<PublicCertificateResponse | null>(null);
const queryTime = ref(new Date());
const failedImageUrls = ref(new Set<string>());
const previewImage = ref<{ url: string; name: string } | null>(null);
const settings = ref<PublicSettings>({
  platform_name: '谷芯快检云',
  service_phone: '13363412262',
  support_text: '本页面由谷芯快检云提供技术支持',
  public_footer_notice:
    '页面信息来源于企业快检记录和合格证开具数据，如对结果有疑问，请联系开具主体确认。',
  certificate_public_notice: '扫码查看合格证、检测依据和企业公开资料。',
  show_support_info: true,
  show_company_public_profile: true,
});

const certificate = computed(() => data.value?.certificate);
const company = computed(() => data.value?.company);
const detection = computed(() => data.value?.detection || null);
const evidenceAssets = computed(() => data.value?.evidence_assets || []);
const isInvalid = computed(() => !loading.value && data.value?.valid === false);
const isVoided = computed(() => certificate.value?.status === 'voided');
const isNormal = computed(() => certificate.value?.status === 'normal');
const showCompanyProfile = computed(() => {
  const item = company.value;
  if (!item || !settings.value.show_company_public_profile) return false;
  return Boolean(
    item.intro ||
      item.main_products ||
      item.display_address ||
      item.display_phone ||
      item.qualification_description ||
      item.images?.length ||
      item.qualification_images?.length ||
      item.documents?.length,
  );
});

function getPublicToken() {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const cIndex = segments.indexOf('c');
  if (cIndex >= 0 && segments[cIndex + 1]) return segments[cIndex + 1];
  const oldIndex = segments.indexOf('certificates');
  if (oldIndex >= 0 && segments[oldIndex + 1]) return segments[oldIndex + 1];
  return new URLSearchParams(window.location.search).get('token') || '';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function formatQueryTime(value: Date) {
  return value.toLocaleString('zh-CN', { hour12: false });
}

function commitmentBasisText(type?: string, fallback?: string) {
  const map: Record<string, string> = {
    quality_control: '质量安全控制符合要求',
    self_test_qualified: '自行检测合格',
    entrusted_test_qualified: '委托检测合格',
  };
  return map[type || ''] || fallback || '自行检测合格';
}

function formatFileSize(value?: string | null) {
  const size = Number(value || 0);
  if (!size) return '';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function isImage(asset: PublicEvidenceAsset) {
  if (asset.mime_type?.startsWith('image/')) return true;
  const name = `${asset.file_name || ''} ${asset.file_url || ''}`.toLowerCase();
  return /\.(jpe?g|png|webp)(\?|#|$)/i.test(name);
}

function assetUrl(url?: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiOrigin = new URL(API_BASE_URL).origin;
  return `${apiOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function onImageLoadError(url?: string) {
  if (!url) return;
  const next = new Set(failedImageUrls.value);
  next.add(url);
  failedImageUrls.value = next;
}

function isImageUnavailable(asset: PublicEvidenceAsset) {
  return failedImageUrls.value.has(assetUrl(asset.file_url));
}

function openAsset(url?: string, name = '企业公开图片') {
  if (!url) return;
  previewImage.value = {
    url: assetUrl(url),
    name,
  };
}

function closePreview() {
  previewImage.value = null;
}

onMounted(async () => {
  queryTime.value = new Date();
  const publicToken = getPublicToken();

  getPublicSettings()
    .then((value) => {
      settings.value = { ...settings.value, ...value };
    })
    .catch(() => undefined);

  if (!publicToken) {
    data.value = {
      valid: false,
      status: 'invalid',
      message: '未查询到有效合格证',
    };
    loading.value = false;
    return;
  }

  try {
    data.value = await getPublicCertificate(publicToken);
  } catch {
    loadError.value = '页面加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <main class="page">
    <section class="hero" :class="{ voided: isVoided, invalid: isInvalid || loadError }">
      <span class="hero-glow" aria-hidden="true"></span>
      <div class="brand-line">
        <span class="brand-badge">
          <Icon name="shield-check" :size="20" />
        </span>
        <span class="brand-name">谷芯快检云</span>
        <span class="brand-tag">官方验证</span>
      </div>
      <div class="hero-title">
        <h1>承诺达标合格证</h1>
        <p>农产品质量安全</p>
      </div>
    </section>

    <section v-if="loading" class="card center-card">
      <div class="loader"></div>
      <p>正在查询合格证信息...</p>
    </section>

    <section v-else-if="loadError" class="card invalid-card">
      <div class="status-icon invalid">
        <Icon name="alert-triangle" :size="34" />
      </div>
      <h2>查询暂时不可用</h2>
      <p>{{ loadError }}</p>
      <small>查询时间：{{ formatQueryTime(queryTime) }}</small>
    </section>

    <section v-else-if="isInvalid" class="card invalid-card">
      <div class="status-icon invalid">
        <Icon name="file-question" :size="34" />
      </div>
      <h2>未查询到有效合格证</h2>
      <p>{{ data?.message || '请核对二维码来源，或联系开具主体确认。' }}</p>
      <small>查询时间：{{ formatQueryTime(queryTime) }}</small>
    </section>

    <template v-else-if="certificate && company">
      <section class="cert-no-banner" :class="{ voided: isVoided }">
        <div class="cert-no-label">合格证编号</div>
        <div class="cert-no-value">{{ certificate.certificate_no }}</div>
      </section>

      <section class="status-banner" :class="isVoided ? 'voided' : 'valid'">
        <Icon :name="isVoided ? 'x-octagon' : 'badge-check'" :size="40" />
        <div class="status-text">
          <strong>{{ isVoided ? '该合格证已作废' : '检验合格' }}</strong>
          <span>{{ isVoided ? '不得作为有效流通凭证' : '本产品经检测符合要求' }}</span>
        </div>
      </section>

      <section class="card">
        <div class="kv">
          <div class="kv-row">
            <span class="kv-key">产品名称</span>
            <span class="kv-val">{{ certificate.product_name }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">产品数量</span>
            <span class="kv-val">{{ certificate.quantity }} {{ certificate.unit }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">产地</span>
            <span class="kv-val">{{ certificate.origin || '-' }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">承诺主体</span>
            <span class="kv-val">{{ certificate.issuer_name }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">联系方式</span>
            <span class="kv-val">{{ certificate.contact_phone }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">开具时间</span>
            <span class="kv-val">{{ formatDateTime(certificate.issue_time) }}</span>
          </div>
          <div class="kv-row">
            <span class="kv-key">承诺依据</span>
            <span class="kv-val">{{ commitmentBasisText(certificate.commitment_basis_type, certificate.commitment_basis) }}</span>
          </div>
        </div>
      </section>

      <section v-if="isVoided" class="card voided-note">
        <strong>作废提示</strong>
        <p>
          该合格证已于 {{ formatDateTime(certificate.void_time) }} 作废，不得继续作为有效流通凭证使用。
        </p>
      </section>

      <section v-if="detection" class="card">
        <div class="section-label"><Icon name="flask-conical" :size="15" /> 检测结果</div>
        <div class="detection-summary">
          <span class="detection-name">{{ detection.sample_name || detection.product_name }}</span>
          <span class="pill success">合格</span>
        </div>
        <p class="detection-time">检测时间：{{ formatDateTime(detection.test_time) }} · 共 {{ detection.items.length }} 项，均合格</p>
        <div class="result-list">
          <div
            v-for="item in detection.items"
            :key="item.test_item"
            class="result-item success"
          >
            <Icon name="check-circle" :size="18" />
            <div class="result-item-body">
              <strong class="result-name">{{ item.test_item }}</strong>
              <p v-if="item.test_value">{{ item.test_value }}{{ item.unit || '' }} / 限 {{ item.standard_limit || '-' }}</p>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="evidenceAssets.length" class="card">
        <div class="section-label"><Icon name="folder-open" :size="15" /> 公开依据资料</div>
        <div class="document-list">
          <template v-for="asset in evidenceAssets" :key="asset.file_url">
            <button
              v-if="isImage(asset)"
              type="button"
              class="document-item image-document-button"
              @click="openAsset(asset.file_url, asset.file_name)"
            >
              <img :src="assetUrl(asset.file_url)" :alt="asset.file_name" />
              <div>
                <strong>{{ asset.file_name }}</strong>
                <span>{{ formatFileSize(asset.file_size) || '点击预览' }}</span>
              </div>
            </button>
            <a
              v-else
              class="document-item"
              :href="assetUrl(asset.file_url)"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="doc-icon">
                <Icon name="file-text" :size="26" />
              </div>
              <div>
                <strong>{{ asset.file_name }}</strong>
                <span>{{ formatFileSize(asset.file_size) || '点击查看' }}</span>
              </div>
            </a>
          </template>
        </div>
      </section>

      <section v-if="showCompanyProfile" class="card">
        <div class="section-label"><Icon name="building-2" :size="15" /> 企业公开资料</div>
        <h2>{{ company.name }}</h2>
        <p v-if="company.intro" class="profile-text">{{ company.intro }}</p>
        <div class="company-kv">
          <div v-if="company.main_products" class="kv-row">
            <span class="kv-key">主营产品</span>
            <span class="kv-val">{{ company.main_products }}</span>
          </div>
          <div v-if="company.display_address" class="kv-row">
            <span class="kv-key">展示地址</span>
            <span class="kv-val">{{ company.display_address }}</span>
          </div>
          <div v-if="company.display_phone" class="kv-row">
            <span class="kv-key">联系电话</span>
            <span class="kv-val">{{ company.display_phone }}</span>
          </div>
          <div v-if="company.qualification_description" class="kv-row">
            <span class="kv-key">资质说明</span>
            <span class="kv-val">{{ company.qualification_description }}</span>
          </div>
        </div>
        <div v-if="company.images?.length || company.qualification_images?.length" class="image-grid">
          <div
            v-for="asset in [...(company.images || []), ...(company.qualification_images || [])]"
            :key="asset.file_url"
            class="profile-image-card"
            role="button"
            tabindex="0"
            @click="openAsset(asset.file_url, asset.file_name)"
            @keydown.enter="openAsset(asset.file_url, asset.file_name)"
          >
            <img
              v-if="!isImageUnavailable(asset)"
              :src="assetUrl(asset.file_url)"
              :alt="asset.file_name"
              loading="lazy"
              @error="onImageLoadError(assetUrl(asset.file_url))"
            />
            <div v-else class="image-fallback">
              <strong>{{ asset.file_name }}</strong>
              <span>图片暂不可预览</span>
            </div>
            <div class="image-caption">
              <strong>{{ asset.file_name }}</strong>
              <span>点击查看大图</span>
            </div>
          </div>
        </div>
        <div v-if="company.documents?.length" class="document-list">
          <a
            v-for="asset in company.documents"
            :key="asset.file_url"
            class="document-item"
            :href="assetUrl(asset.file_url)"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="doc-icon">
              <Icon name="folder-open" :size="26" />
            </div>
            <div>
              <strong>{{ asset.file_name }}</strong>
              <span>点击查看</span>
            </div>
          </a>
        </div>
      </section>

      <section class="card trust-card">
        <div class="trust-head">
          <div class="section-label"><Icon name="shield-check" :size="15" /> 主体承诺</div>
          <span class="seal" aria-hidden="true">
            <Icon name="badge-check" :size="16" />
            已承诺
          </span>
        </div>
        <p class="statement">
          {{
            certificate.commitment_statement ||
            '本主体承诺对合格证内容真实性负责，如对结果有疑问，请联系开具主体。'
          }}
        </p>
        <div class="trust-sign">
          <span>承诺主体：{{ certificate.issuer_name }}</span>
        </div>
      </section>
    </template>

    <div v-if="previewImage" class="image-preview-mask" @click="closePreview">
      <div class="image-preview-dialog" @click.stop>
        <div class="image-preview-head">
          <strong>{{ previewImage.name }}</strong>
          <button type="button" @click="closePreview">关闭</button>
        </div>
        <img :src="previewImage.url" :alt="previewImage.name" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 0 16px 34px;
  background:
    radial-gradient(circle at 18% 6%, rgba(31, 187, 126, 0.12), transparent 30%),
    linear-gradient(180deg, #eef8f3 0%, #f8fbf9 42%, #ffffff 100%);
  color: #15382c;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
  -webkit-font-smoothing: antialiased;
  overflow-wrap: break-word;
  text-rendering: optimizeLegibility;
}

button,
a {
  -webkit-tap-highlight-color: transparent;
}

.hero {
  position: relative;
  margin: 0 -16px 16px;
  padding: 26px 20px 30px;
  color: #fff;
  background:
    radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.18), transparent 38%),
    linear-gradient(135deg, #0f8f58 0%, #13a86a 46%, #0ea5a6 100%);
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  top: -60px;
  right: -40px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 70%);
  pointer-events: none;
}

.hero.voided {
  background: linear-gradient(135deg, #795044, #9b574f);
}

.hero.invalid {
  background: linear-gradient(135deg, #52636a, #364a56);
}

.brand-line {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
}

.brand-badge {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f8f58;
  box-shadow: 0 6px 16px rgba(8, 60, 38, 0.28);
}

.brand-name {
  letter-spacing: 0.5px;
}

.brand-tag {
  margin-left: 2px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.4;
}

.hero-title {
  position: relative;
  z-index: 1;
  margin: 16px 0 0;
}

.hero h1 {
  margin: 0;
  font-size: 27px;
  line-height: 1.25;
  letter-spacing: 0.5px;
  font-weight: 900;
}

.hero-title p {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 600;
  opacity: 0.88;
  letter-spacing: 1px;
}

.card {
  max-width: 760px;
  margin: 0 auto 14px;
  border: 1px solid #e0ece6;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(20, 70, 50, 0.07);
  padding: 20px;
}

.status-icon {
  flex: 0 0 auto;
  width: 70px;
  height: 70px;
  border-radius: 24px;
  display: grid;
  place-items: center;
  color: #fff;
  background: linear-gradient(135deg, #0f8f58, #13b77c);
  box-shadow: 0 10px 24px rgba(15, 143, 88, 0.28);
}

.voided .status-icon,
.status-icon.invalid {
  background: linear-gradient(135deg, #c05a4b, #d47862);
}

.status-kicker,
.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 6px;
  color: #0f8f58;
  font-size: 13px;
  font-weight: 800;
}

.section-label :deep(.gx-icon) {
  flex: 0 0 auto;
}

.card h2 {
  margin: 0 0 8px;
  font-size: 21px;
}

.statement,
.trust-card p,
.profile-text {
  margin: 0;
  color: #526b5f;
  line-height: 1.7;
}

.trust-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.trust-head .section-label {
  margin-bottom: 0;
}

.seal {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1.5px solid #0f8f58;
  border-radius: 999px;
  color: #0f8f58;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: #f3faf6;
  white-space: nowrap;
}

.trust-sign {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #dceee6;
  color: #708076;
  font-size: 13px;
}

.pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  min-width: 54px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  word-break: keep-all;
}

.success {
  color: #0f8f58;
  background: #e6f8ee;
}

.danger {
  color: #bc3b33;
  background: #fff0ee;
}

.cert-no-banner {
  max-width: 760px;
  margin: -34px auto 14px;
  position: relative;
  z-index: 2;
  padding: 14px 20px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid #e0ece6;
  box-shadow: 0 12px 30px rgba(20, 70, 50, 0.1);
  text-align: center;
}

.cert-no-banner.voided {
  border-color: #f0d0ca;
}

.cert-no-label {
  color: #708076;
  font-size: 13px;
  margin-bottom: 4px;
}

.cert-no-value {
  color: #14382c;
  font-size: 22px;
  font-weight: 900;
  letter-spacing: 0.5px;
  word-break: break-all;
}

.status-banner {
  max-width: 760px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-radius: 18px;
  color: #fff;
}

.status-banner.valid {
  background: linear-gradient(135deg, #0f8f58, #13b77c);
  box-shadow: 0 12px 28px rgba(15, 143, 88, 0.28);
}

.status-banner.voided {
  background: linear-gradient(135deg, #c05a4b, #d47862);
  box-shadow: 0 12px 28px rgba(192, 90, 75, 0.24);
}

.status-banner :deep(.gx-icon) {
  flex: 0 0 auto;
}

.status-text {
  min-width: 0;
}

.status-text strong {
  display: block;
  font-size: 20px;
  font-weight: 900;
  line-height: 1.2;
}

.status-text span {
  display: block;
  margin-top: 3px;
  font-size: 13px;
  opacity: 0.92;
}

.kv {
  display: flex;
  flex-direction: column;
}

.kv-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid #eef4f0;
}

.kv-row:last-child {
  border-bottom: 0;
}

.kv-key {
  flex: 0 0 76px;
  color: #708076;
  font-size: 13px;
}

.kv-val {
  flex: 1;
  min-width: 0;
  color: #14382c;
  font-size: 15px;
  font-weight: 700;
  word-break: break-word;
  line-height: 1.45;
}

.company-kv {
  margin-top: 14px;
}

.voided-note {
  border-color: #f0d0ca;
  background: #fff8f7;
}

.detection-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 10px 0 6px;
}

.detection-name {
  font-size: 17px;
  font-weight: 800;
  color: #14382c;
}

.detection-time {
  margin: 0 0 14px;
  color: #708076;
  font-size: 13px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #dceee6;
  border-radius: 14px;
  background: #ffffff;
}

.result-item.success {
  border-left: 3px solid #0f8f58;
}

.result-item.danger {
  border-left: 3px solid #c9352a;
}

.result-item :deep(.gx-icon) {
  flex: 0 0 auto;
  margin-top: 2px;
}

.result-item.success :deep(.gx-icon) {
  color: #0f8f58;
}

.result-item.danger :deep(.gx-icon) {
  color: #c9352a;
}

.result-item-body {
  flex: 1;
  min-width: 0;
}

.result-name {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #14382c;
}

.result-item p {
  margin: 4px 0 0;
  color: #708076;
  font-size: 13px;
}

.document-list {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e1eee7;
  border-radius: 16px;
  color: inherit;
  text-decoration: none;
  background: #ffffff;
  min-width: 0;
}

.image-document-button {
  width: 100%;
  border: 1px solid #e1eee7;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.document-item img,
.doc-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: cover;
  background: #e8f4ee;
}

.doc-icon {
  display: grid;
  place-items: center;
  color: #0f8f58;
}

.document-item strong,
.document-item span {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-item strong {
  color: #14382c;
  font-size: 14px;
  white-space: nowrap;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.profile-image-card {
  background: #f8fcfa;
  border: 1px solid #e1eee7;
  border-radius: 16px;
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.profile-image-card:hover,
.profile-image-card:focus {
  border-color: #9fd8c1;
  box-shadow: 0 12px 28px rgba(15, 143, 88, 0.12);
  outline: none;
  transform: translateY(-1px);
}

.image-grid img,
.image-fallback {
  width: 100%;
  aspect-ratio: 4 / 3;
}

.image-grid img {
  display: block;
  object-fit: cover;
  border-radius: 16px 16px 0 0;
}

.image-fallback {
  align-items: center;
  background: #f1faf6;
  border: 1px dashed #b7d8ca;
  color: #29473a;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  text-align: center;
  border-radius: 16px 16px 0 0;
}

.image-fallback strong,
.image-fallback span {
  display: block;
}

.image-fallback strong {
  font-size: 14px;
  margin-bottom: 6px;
}

.image-fallback span {
  color: #6b7c73;
  font-size: 12px;
}

.image-caption {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  padding: 10px 12px 12px;
}

.image-caption strong {
  color: #13382a;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-caption span {
  color: #0f8f58;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
}

.image-preview-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(5, 24, 19, 0.72);
  overscroll-behavior: contain;
}

.image-preview-dialog {
  width: min(680px, calc(100vw - 28px));
  max-height: min(86vh, 780px);
  overflow: hidden;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24);
}

.image-preview-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e5eee9;
}

.image-preview-head strong {
  min-width: 0;
  overflow: hidden;
  color: #14382c;
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-preview-head button {
  flex-shrink: 0;
  border: 0;
  border-radius: 999px;
  padding: 7px 12px;
  color: #fff;
  background: #0f8f58;
  font-size: 14px;
}

.image-preview-dialog img {
  display: block;
  width: 100%;
  max-height: calc(min(86vh, 780px) - 48px);
  object-fit: contain;
  background: #f5faf7;
}

.center-card,
.invalid-card {
  text-align: center;
}

.loader {
  width: 32px;
  height: 32px;
  margin: 4px auto 12px;
  border: 4px solid #dcece4;
  border-top-color: #0f8f58;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.footer {
  max-width: 760px;
  margin: 20px auto 0;
  display: grid;
  gap: 6px;
  color: #697b71;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 560px) {
  .page {
    padding: 0 12px 28px;
  }

  .hero {
    margin: 0 -12px 16px;
    padding: 26px 18px 48px;
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
  }

  .hero h1 {
    font-size: 25px;
    line-height: 1.22;
  }

  .hero-title p {
    font-size: 13px;
  }

  .hero p,
  .statement,
  .trust-card p,
  .profile-text {
    font-size: 15px;
    line-height: 1.62;
  }

  .card {
    padding: 15px;
    border-radius: 16px;
  }

  .status-icon {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    font-size: 32px;
  }

  .status-card h2,
  .card h2 {
    font-size: 19px;
    line-height: 1.35;
  }

  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .image-grid img,
  .image-fallback {
    aspect-ratio: 1 / 0.78;
  }

  .image-preview-mask {
    align-items: center;
    padding: 14px;
  }

  .image-preview-dialog {
    width: calc(100vw - 28px);
    max-height: 76vh;
    border-radius: 16px;
  }

  .image-preview-dialog img {
    max-height: calc(76vh - 48px);
  }

  .image-caption {
    padding: 8px 9px 10px;
  }

  .image-caption strong {
    font-size: 12px;
  }

  .image-caption span {
    display: none;
  }
}
</style>
