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

function resultText(result?: PublicResult) {
  return result === 'qualified' ? '合格' : '不合格';
}

function resultClass(result?: PublicResult) {
  return result === 'qualified' ? 'success' : 'danger';
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
        <span class="brand-badge">谷</span>
        <span class="brand-name">谷芯快检云</span>
        <span class="brand-tag">官方验证</span>
      </div>
      <h1>食品安全追溯查询</h1>
      <p>{{ settings.certificate_public_notice }}</p>
    </section>

    <section v-if="loading" class="card center-card">
      <div class="loader"></div>
      <p>正在查询合格证信息...</p>
    </section>

    <section v-else-if="loadError" class="card invalid-card">
      <div class="status-icon invalid">!</div>
      <h2>查询暂时不可用</h2>
      <p>{{ loadError }}</p>
      <small>查询时间：{{ formatQueryTime(queryTime) }}</small>
    </section>

    <section v-else-if="isInvalid" class="card invalid-card">
      <div class="status-icon invalid">?</div>
      <h2>未查询到有效合格证</h2>
      <p>{{ data?.message || '请核对二维码来源，或联系开具主体确认。' }}</p>
      <small>查询时间：{{ formatQueryTime(queryTime) }}</small>
    </section>

    <template v-else-if="certificate && company">
      <section class="status-card" :class="{ voided: isVoided }">
        <div class="status-icon">{{ isVoided ? '!' : '✓' }}</div>
        <div>
          <p class="status-kicker">查询状态</p>
          <h2>{{ isVoided ? '该合格证已作废' : '查询有效' }}</h2>
        </div>
      </section>

      <section class="card cert-card">
        <div class="card-head">
          <div>
            <span class="section-label">合格证信息</span>
            <h2>{{ certificate.certificate_title }}</h2>
          </div>
          <span class="pill" :class="isNormal ? 'success' : 'danger'">
            {{ isNormal ? '有效' : '已作废' }}
          </span>
        </div>
        <div class="cert-no">
          <span>合格证编号</span>
          <strong>{{ certificate.certificate_no }}</strong>
        </div>
        <div class="info-grid">
          <div>
            <span>产品名称</span>
            <strong>{{ certificate.product_name }}</strong>
          </div>
          <div>
            <span>产品数量</span>
            <strong>{{ certificate.quantity }} {{ certificate.unit }}</strong>
          </div>
          <div>
            <span>产地</span>
            <strong>{{ certificate.origin || '-' }}</strong>
          </div>
          <div>
            <span>承诺主体</span>
            <strong>{{ certificate.issuer_name }}</strong>
          </div>
          <div>
            <span>联系方式</span>
            <strong>{{ certificate.contact_phone }}</strong>
          </div>
          <div>
            <span>开具时间</span>
            <strong>{{ formatDateTime(certificate.issue_time) }}</strong>
          </div>
          <div>
            <span>承诺依据</span>
            <strong>{{ commitmentBasisText(certificate.commitment_basis_type, certificate.commitment_basis) }}</strong>
          </div>
          <div>
            <span>查询时间</span>
            <strong>{{ formatQueryTime(queryTime) }}</strong>
          </div>
        </div>
      </section>

      <section v-if="isVoided" class="card voided-note">
        <strong>作废提示</strong>
        <p>
          该合格证已于 {{ formatDateTime(certificate.void_time) }} 作废，不得继续作为有效流通凭证使用。
        </p>
      </section>

      <section class="card">
        <div class="section-label">承诺事项</div>
        <p class="statement">
          {{
            certificate.commitment_statement ||
            '本主体承诺对合格证内容真实性负责，如对结果有疑问，请联系开具主体。'
          }}
        </p>
      </section>

      <section v-if="detection" class="card">
        <div class="card-head compact">
          <div>
            <span class="section-label">检测结果</span>
            <h2>{{ detection.sample_name || detection.product_name }}</h2>
          </div>
          <span class="pill" :class="resultClass(detection.overall_result)">
            {{ resultText(detection.overall_result) }}
          </span>
        </div>
        <div class="mini-summary">
          <span>检测时间：{{ formatDateTime(detection.test_time) }}</span>
          <span>项目数量：{{ detection.items.length }} 项</span>
        </div>
        <div class="result-list">
          <div
            v-for="item in detection.items"
            :key="item.test_item"
            class="result-item"
            :class="resultClass(item.result)"
          >
            <div class="result-title">
              <strong>{{ item.test_item }}</strong>
              <span :class="resultClass(item.result)">{{ resultText(item.result) }}</span>
            </div>
            <p>{{ item.test_method || '检测方法未填写' }}</p>
            <div class="metric-grid">
              <div>
                <span>检测值</span>
                <strong>{{ item.test_value }}{{ item.unit || '' }}</strong>
              </div>
              <div>
                <span>限量值</span>
                <strong>{{ item.standard_limit || '-' }}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="evidenceAssets.length" class="card">
        <div class="section-label">公开依据资料</div>
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
              <div class="doc-icon">PDF</div>
              <div>
                <strong>{{ asset.file_name }}</strong>
                <span>{{ formatFileSize(asset.file_size) || '点击查看' }}</span>
              </div>
            </a>
          </template>
        </div>
      </section>

      <section v-if="showCompanyProfile" class="card">
        <div class="section-label">企业公开资料</div>
        <h2>{{ company.name }}</h2>
        <p v-if="company.intro" class="profile-text">{{ company.intro }}</p>
        <div class="info-grid small">
          <div v-if="company.main_products">
            <span>主营产品</span>
            <strong>{{ company.main_products }}</strong>
          </div>
          <div v-if="company.display_address">
            <span>展示地址</span>
            <strong>{{ company.display_address }}</strong>
          </div>
          <div v-if="company.display_phone">
            <span>联系电话</span>
            <strong>{{ company.display_phone }}</strong>
          </div>
          <div v-if="company.qualification_description">
            <span>资质说明</span>
            <strong>{{ company.qualification_description }}</strong>
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
            <div class="doc-icon">资料</div>
            <div>
              <strong>{{ asset.file_name }}</strong>
              <span>点击查看</span>
            </div>
          </a>
        </div>
      </section>

      <section class="card trust-card">
        <div class="section-label">可信查询说明</div>
        <p>
          本查询结果由谷芯快检云实时生成，当前状态以本页面显示为准。如对检测结果或承诺内容有疑问，请联系开具主体确认。
        </p>
        <p>可截图保存或转发给采购方查看。</p>
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

    <footer v-if="false" class="footer">
      <strong>山西谷芯科技有限公司</strong>
      <span v-if="settings.show_support_info">{{ settings.support_text }}</span>
      <span>{{ settings.public_footer_notice }}</span>
    </footer>
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
  margin: 0 -16px 18px;
  padding: 32px 20px 56px;
  color: #fff;
  background:
    radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.18), transparent 38%),
    linear-gradient(135deg, #0f8f58 0%, #13a86a 46%, #0ea5a6 100%);
  border-bottom-left-radius: 28px;
  border-bottom-right-radius: 28px;
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
  font-size: 19px;
  font-weight: 900;
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

.hero h1 {
  position: relative;
  z-index: 1;
  margin: 18px 0 10px;
  font-size: 29px;
  line-height: 1.15;
  letter-spacing: 0;
}

.hero p {
  position: relative;
  z-index: 1;
  margin: 0;
  max-width: 620px;
  color: rgba(255, 255, 255, 0.86);
  line-height: 1.65;
}

.card,
.status-card {
  max-width: 760px;
  margin: 0 auto 14px;
  border: 1px solid #e0ece6;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(20, 70, 50, 0.07);
  transition:
    box-shadow 0.25s ease,
    transform 0.25s ease;
}

.card {
  padding: 20px;
}

.status-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  margin-top: -42px;
}

.status-card.voided {
  border-color: #f0d0ca;
  background: #fff8f7;
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
  font-size: 40px;
  font-weight: 900;
  box-shadow: 0 10px 24px rgba(15, 143, 88, 0.28);
}

.status-card > div:last-child {
  min-width: 0;
}

.voided .status-icon,
.status-icon.invalid {
  background: linear-gradient(135deg, #c05a4b, #d47862);
}

.status-kicker,
.section-label {
  display: block;
  margin: 0 0 6px;
  color: #0f8f58;
  font-size: 13px;
  font-weight: 800;
}

.status-card h2,
.card h2 {
  margin: 0 0 8px;
  font-size: 21px;
}

.status-card p,
.statement,
.trust-card p,
.profile-text {
  margin: 0;
  color: #526b5f;
  line-height: 1.7;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.card-head.compact {
  align-items: center;
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
  writing-mode: horizontal-tb;
}

.pill,
.result-title span {
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

.cert-no {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid #dceee6;
  background: linear-gradient(180deg, #f7fcfa, #eef8f3);
  margin-bottom: 14px;
}

.cert-no span,
.info-grid span,
.mini-summary,
.metric-grid span,
.document-item span {
  color: #708076;
  font-size: 13px;
}

.cert-no strong {
  display: block;
  margin-top: 4px;
  font-size: 18px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-grid div {
  min-width: 0;
  padding: 12px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #edf4f0;
  border-left: 3px solid #cdeadd;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.info-grid div:hover {
  box-shadow: 0 6px 18px rgba(15, 143, 88, 0.1);
  transform: translateY(-1px);
}

.info-grid strong {
  display: block;
  margin-top: 5px;
  word-break: break-word;
  line-height: 1.45;
}

.info-grid.small {
  margin-top: 14px;
}

.voided-note {
  border-color: #f0d0ca;
  background: #fff8f7;
}

.mini-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 14px;
}

.result-list {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.result-item {
  padding: 16px;
  border: 1px solid #dceee6;
  border-radius: 18px;
  background: #ffffff;
}

.result-item.success {
  border-color: #bce8d0;
  border-left: 3px solid #0f8f58;
}

.result-item.danger {
  border-color: #f2c7c0;
  border-left: 3px solid #c9352a;
}

.result-title {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.result-title p,
.result-item p {
  margin: 6px 0 12px;
  color: #708076;
  font-size: 13px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.metric-grid div {
  padding: 10px;
  border-radius: 12px;
  background: #f3faf6;
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
  font-size: 12px;
  font-weight: 900;
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

  .hero p,
  .status-card p,
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

  .card,
  .status-card {
    margin-bottom: 12px;
  }

  .status-card {
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
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

  .card-head {
    align-items: flex-start;
    gap: 10px;
  }

  .card-head > div {
    min-width: 0;
  }

  .cert-no strong,
  .info-grid strong {
    font-size: 17px;
    line-height: 1.45;
  }

  .info-grid div {
    padding: 11px;
  }

  .metric-grid,
  .result-list {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
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
