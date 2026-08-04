<script setup lang="ts">
import axios from 'axios';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getScreenSummary, loginScreen, type ScreenSummary } from './api';

const TOKEN_KEY = 'guxin_screen_token';
const USERNAME_KEY = 'guxin_screen_username';
const REFRESH_INTERVAL = 60 * 1000;

const token = ref(localStorage.getItem(TOKEN_KEY) || '');
const username = ref(localStorage.getItem(USERNAME_KEY) || '');
const password = ref('');
const loginLoading = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const now = ref(new Date());
const summary = ref<ScreenSummary | null>(null);

let refreshTimer: number | undefined;
let clockTimer: number | undefined;

const isLoggedIn = computed(() => Boolean(token.value));
const maxHourlyTotal = computed(() =>
  Math.max(...(summary.value?.hourly_detection || []).map((item) => item.total), 1),
);
const recentRecords = computed(() => (summary.value?.recent_records || []).slice(0, 8));
const recentCertificates = computed(() => (summary.value?.recent_certificates || []).slice(0, 5));
const latestRecord = computed(() => recentRecords.value[0] || null);
const busyHours = computed(() =>
  (summary.value?.hourly_detection || [])
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 3),
);
const qualifiedPercent = computed(() => {
  const distribution = summary.value?.result_distribution;
  const total = (distribution?.qualified || 0) + (distribution?.unqualified || 0);
  if (!total) return 0;
  return Math.round(((distribution?.qualified || 0) / total) * 100);
});
const unqualifiedPercent = computed(() => Math.max(0, 100 - qualifiedPercent.value));

function formatDateTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function formatTime(value?: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function resultText(value: string) {
  return value === 'qualified' ? '合格' : '不合格';
}

function certificateStatusText(value: string) {
  const map: Record<string, string> = {
    normal: '有效',
    voided: '已作废',
  };
  return map[value] || '记录';
}

function serviceExpireText() {
  const expireAt = summary.value?.company?.service_expire_at;
  if (!expireAt) return '未设置';
  return formatDateTime(expireAt).slice(0, 10);
}

function printerStatusText(value?: string | null) {
  const map: Record<string, string> = {
    inactive: '未连接',
    available: '可用',
    connected: '已连接',
    disabled: '已停用',
  };
  return map[value || ''] || '待接入';
}

function serviceWarningText() {
  const warning = summary.value?.service_warning;
  if (!warning) return '服务正常';
  if (warning.days_left < 0) return '服务已到期';
  if (warning.days_left <= 7) return `剩余 ${warning.days_left} 天`;
  return '服务正常';
}

function clearSession() {
  token.value = '';
  summary.value = null;
  localStorage.removeItem(TOKEN_KEY);
  stopAutoRefresh();
}

async function submitLogin() {
  if (!username.value.trim() || !password.value) {
    errorMessage.value = '请输入账号和密码';
    return;
  }
  loginLoading.value = true;
  errorMessage.value = '';
  try {
    const data = await loginScreen(username.value.trim(), password.value);
    token.value = data.access_token;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USERNAME_KEY, username.value.trim());
    password.value = '';
    await loadSummary();
    startAutoRefresh();
  } catch {
    errorMessage.value = '登录失败，请检查账号或网络';
  } finally {
    loginLoading.value = false;
  }
}

async function loadSummary() {
  if (!token.value) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    summary.value = await getScreenSummary(token.value);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearSession();
      errorMessage.value = '登录已失效，请重新登录';
      return;
    }
    errorMessage.value = '数据加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimer = window.setInterval(() => {
    void loadSummary();
  }, REFRESH_INTERVAL);
}

function stopAutoRefresh() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = undefined;
  }
}

function requestFullscreen() {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    void element.requestFullscreen();
  }
}

function logout() {
  clearSession();
  errorMessage.value = '';
}

onMounted(() => {
  document.body.classList.add('screen-body-lock');
  clockTimer = window.setInterval(() => {
    now.value = new Date();
  }, 1000);

  if (token.value) {
    void loadSummary();
    startAutoRefresh();
  }
});

onBeforeUnmount(() => {
  document.body.classList.remove('screen-body-lock');
  stopAutoRefresh();
  if (clockTimer) window.clearInterval(clockTimer);
});
</script>

<template>
  <main class="screen-page">
    <section v-if="!isLoggedIn" class="screen-login">
      <div class="login-panel">
        <div class="brand">GX · 谷芯快检云</div>
        <h1>快检室数据大屏</h1>
        <p>用于快检室电视或电脑大屏展示，登录后只显示本企业数据。</p>
        <form class="login-form" @submit.prevent="submitLogin">
          <label>
            <span>企业账号</span>
            <input v-model="username" autocomplete="username" placeholder="请输入企业账号" />
          </label>
          <label>
            <span>密码</span>
            <input
              v-model="password"
              autocomplete="current-password"
              placeholder="请输入密码"
              type="password"
            />
          </label>
          <button :disabled="loginLoading" type="submit">
            {{ loginLoading ? '正在登录...' : '进入大屏' }}
          </button>
          <div v-if="errorMessage" class="login-error">{{ errorMessage }}</div>
        </form>
      </div>
    </section>

    <section v-else class="screen-shell">
      <header class="screen-header">
        <div class="header-left">
          <div class="system-mark">谷芯快检云</div>
          <h1>{{ summary?.company?.name || '客户快检室' }}</h1>
          <p>食品安全快检室实时数据展示</p>
        </div>
        <div class="header-title">
          <span>Rapid Testing Data Center</span>
          <strong>快检数据看板</strong>
        </div>
        <div class="header-meta">
          <strong>{{ formatDateTime(now) }}</strong>
          <span>数据更新 {{ formatTime(summary?.updated_at) }}</span>
          <div class="header-actions">
            <button @click="requestFullscreen">全屏展示</button>
            <button @click="logout">退出</button>
          </div>
        </div>
      </header>

      <div v-if="errorMessage" class="screen-alert">{{ errorMessage }}</div>

      <section class="screen-kpis">
        <article class="kpi-card kpi-main">
          <span>今日检测</span>
          <div><strong>{{ summary?.stats.today_detection_count || 0 }}</strong><small>次</small></div>
          <p>最近检测：{{ latestRecord ? formatTime(latestRecord.test_time) : '暂无' }}</p>
        </article>
        <article class="kpi-card good">
          <span>今日合格</span>
          <div><strong>{{ summary?.stats.today_qualified_count || 0 }}</strong><small>条</small></div>
          <p>可开证 {{ summary?.stats.certifiable_count || 0 }} 条</p>
        </article>
        <article class="kpi-card bad">
          <span>今日不合格</span>
          <div><strong>{{ summary?.stats.today_unqualified_count || 0 }}</strong><small>条</small></div>
          <p>异常结果重点关注</p>
        </article>
        <article class="kpi-card rate">
          <span>今日合格率</span>
          <div><strong>{{ summary?.stats.today_qualified_rate || 0 }}</strong><small>%</small></div>
          <p>基于今日检测记录</p>
        </article>
        <article class="kpi-card cert">
          <span>今日开证</span>
          <div><strong>{{ summary?.stats.today_certificate_count || 0 }}</strong><small>张</small></div>
          <p>扫码查询同步展示</p>
        </article>
      </section>

      <section class="screen-dashboard">
        <aside class="left-stack">
          <section class="panel latest-panel">
            <div class="panel-title">
              <h2>最新检测</h2>
              <span>{{ recentRecords.length }} 条记录</span>
            </div>
            <div v-if="recentRecords.length" class="timeline-list">
              <div v-for="record in recentRecords" :key="record.id" class="timeline-item">
                <time>{{ formatTime(record.test_time) }}</time>
                <div>
                  <strong>{{ record.sample_name || record.product_name }}</strong>
                  <span>{{ record.item_count }} 项检测 · 已开证 {{ record.certificate_count }} 张</span>
                </div>
                <em :class="record.overall_result">{{ resultText(record.overall_result) }}</em>
              </div>
            </div>
            <div v-else class="empty">暂无检测记录</div>
          </section>
        </aside>

        <main class="center-stack">
          <section class="panel command-panel">
            <div class="command-head">
              <div>
                <span>今日检测态势</span>
                <h2>{{ qualifiedPercent }}%</h2>
                <p>合格占比</p>
              </div>
              <div class="status-orb" :style="{ '--rate': qualifiedPercent }">
                <strong>{{ summary?.stats.today_qualified_count || 0 }}</strong>
                <span>合格</span>
              </div>
              <div class="command-side">
                <strong>{{ summary?.stats.today_unqualified_count || 0 }}</strong>
                <span>不合格</span>
                <small>今日需要关注的检测结果</small>
              </div>
            </div>
            <div class="distribution">
              <div>
                <span>合格</span>
                <i><b :style="{ width: `${qualifiedPercent}%` }"></b></i>
                <strong>{{ summary?.result_distribution.qualified || 0 }}</strong>
              </div>
              <div class="danger">
                <span>不合格</span>
                <i><b :style="{ width: `${unqualifiedPercent}%` }"></b></i>
                <strong>{{ summary?.result_distribution.unqualified || 0 }}</strong>
              </div>
            </div>
          </section>

          <section class="panel trend-panel">
            <div class="panel-title">
              <h2>今日检测趋势</h2>
              <span>0-23 时按小时统计</span>
            </div>
            <div v-if="summary" class="hour-chart">
              <div
                v-for="item in summary.hourly_detection"
                :key="item.hour"
                class="hour-bar"
                :class="{ active: item.total > 0 }"
                :title="`${item.hour}:00 ${item.total} 次`"
              >
                <i
                  :style="{
                    height: `${Math.max((item.total / maxHourlyTotal) * 100, item.total ? 12 : 3)}%`,
                  }"
                ></i>
                <span v-if="item.hour % 3 === 0">{{ item.hour }}</span>
              </div>
            </div>
            <div class="busy-hours">
              <span>高峰时段</span>
              <strong v-if="busyHours.length">
                {{ busyHours.map((item) => `${item.hour}:00 ${item.total}次`).join(' / ') }}
              </strong>
              <strong v-else>今日暂无检测高峰</strong>
            </div>
          </section>
        </main>

        <aside class="right-stack">
          <section class="panel certificate-panel">
            <div class="panel-title">
              <h2>最近合格证</h2>
              <span>{{ recentCertificates.length }} 张</span>
            </div>
            <div v-if="recentCertificates.length" class="certificate-list">
              <div v-for="certificate in recentCertificates" :key="certificate.id">
                <div>
                  <strong>{{ certificate.product_name }}</strong>
                  <span>{{ certificate.quantity }}{{ certificate.unit }} · {{ formatTime(certificate.issue_time) }}</span>
                </div>
                <em :class="certificate.status">{{ certificateStatusText(certificate.status) }}</em>
                <small>{{ certificate.certificate_no }}</small>
              </div>
            </div>
            <div v-else class="empty">暂无合格证</div>
          </section>

          <section class="panel service-panel">
            <div class="panel-title">
              <h2>服务与设备</h2>
              <span>运行状态</span>
            </div>
            <dl>
              <div>
                <dt>服务状态</dt>
                <dd>{{ serviceWarningText() }}</dd>
              </div>
              <div>
                <dt>服务到期</dt>
                <dd>{{ serviceExpireText() }}</dd>
              </div>
              <div>
                <dt>打印设备</dt>
                <dd>{{ printerStatusText(summary?.printer.status) }}</dd>
              </div>
              <div>
                <dt>累计打印</dt>
                <dd>{{ summary?.printer.print_log_count || 0 }} 次</dd>
              </div>
            </dl>
          </section>

          <section class="panel company-panel">
            <div class="panel-title">
              <h2>企业资料</h2>
              <span>公开展示摘要</span>
            </div>
            <p>{{ summary?.profile?.intro || '本企业快检数据由谷芯快检云提供展示支持。' }}</p>
            <div class="company-lines">
              <span>{{ summary?.profile?.main_products || '食品安全快检与合格证管理' }}</span>
              <span>{{ summary?.profile?.display_address || summary?.company?.address || '企业地址未设置' }}</span>
              <span>{{ summary?.profile?.display_phone || summary?.company?.phone || '联系电话未设置' }}</span>
            </div>
          </section>
        </aside>
      </section>

      <footer class="screen-footer">
        <span>当前大屏仅展示本企业快检数据，不含其他企业信息</span>
        <span>技术支持：山西谷芯科技有限公司 · 谷芯快检云</span>
      </footer>
    </section>
  </main>
</template>

<style scoped>
:global(body.screen-body-lock) {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

:global(body.screen-body-lock #app) {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.screen-page {
  width: 100vw;
  height: 100vh;
  background:
    radial-gradient(circle at 10% 8%, rgba(58, 255, 186, 0.2), transparent 24%),
    radial-gradient(circle at 92% 18%, rgba(29, 182, 255, 0.18), transparent 28%),
    linear-gradient(135deg, #06161c 0%, #082b30 48%, #071423 100%);
  color: #ecfff9;
  overflow: hidden;
}

.screen-login {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 32px;
}

.login-panel {
  width: min(460px, 100%);
  padding: 38px;
  border: 1px solid rgba(128, 241, 205, 0.22);
  border-radius: 26px;
  background: rgba(7, 34, 39, 0.86);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.34);
}

.brand,
.eyebrow {
  color: #7cf0c1;
  font-weight: 800;
}

.login-panel h1 {
  margin: 12px 0 10px;
  font-size: 34px;
}

.login-panel p {
  color: rgba(236, 255, 249, 0.72);
  line-height: 1.7;
}

.login-form {
  display: grid;
  gap: 16px;
  margin-top: 26px;
}

.login-form label {
  display: grid;
  gap: 8px;
  color: rgba(236, 255, 249, 0.76);
}

.login-form input {
  height: 50px;
  border: 1px solid rgba(128, 241, 205, 0.24);
  border-radius: 14px;
  padding: 0 16px;
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
  outline: none;
}

.login-form button,
.header-actions button {
  border: 0;
  border-radius: 12px;
  color: #052922;
  background: linear-gradient(135deg, #81f0c1, #1cd3b6);
  font-weight: 800;
  cursor: pointer;
}

.login-form button {
  height: 52px;
  font-size: 17px;
}

.login-form button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.login-error,
.screen-alert {
  color: #ffd7cf;
}

.screen-shell {
  width: 100vw;
  height: 100vh;
  padding: clamp(14px, 1.3vw, 26px);
  display: grid;
  grid-template-rows: clamp(76px, 8vh, 96px) clamp(96px, 12vh, 132px) minmax(0, 1fr) 26px;
  gap: clamp(10px, 1vw, 16px);
  box-sizing: border-box;
  overflow: hidden;
}

.screen-header {
  min-height: 0;
  display: grid;
  grid-template-columns: 1.35fr 0.7fr 1fr;
  gap: 18px;
  align-items: center;
}

.title-block h1 {
  margin: 4px 0 4px;
  max-width: 100%;
  overflow: hidden;
  color: #fff;
  font-size: clamp(26px, 2.25vw, 44px);
  line-height: 1.08;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-block p,
.refresh-state,
.header-meta span {
  margin: 0;
  color: rgba(236, 255, 249, 0.64);
}

.header-center {
  justify-self: center;
  display: grid;
  gap: 8px;
  justify-items: center;
}

.brand-badge {
  padding: 8px 18px;
  border: 1px solid rgba(128, 241, 205, 0.24);
  border-radius: 999px;
  color: #dffff3;
  background: rgba(255, 255, 255, 0.06);
  font-size: clamp(16px, 1.25vw, 22px);
  font-weight: 900;
}

.header-meta {
  justify-self: end;
  display: grid;
  gap: 6px;
  justify-items: end;
}

.header-meta strong {
  color: #fff;
  font-size: clamp(18px, 1.25vw, 24px);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions button {
  min-height: 30px;
  padding: 0 12px;
}

.screen-alert {
  position: fixed;
  left: 50%;
  top: 88px;
  z-index: 10;
  transform: translateX(-50%);
  padding: 10px 16px;
  border: 1px solid rgba(255, 215, 207, 0.28);
  border-radius: 999px;
  background: rgba(150, 54, 48, 0.5);
}

.metric-row {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: clamp(8px, 0.75vw, 14px);
}

.metric-card,
.panel {
  border: 1px solid rgba(128, 241, 205, 0.16);
  background:
    linear-gradient(180deg, rgba(14, 55, 62, 0.92), rgba(6, 29, 38, 0.84)),
    radial-gradient(circle at top left, rgba(128, 241, 205, 0.12), transparent 48%);
  box-shadow: 0 18px 52px rgba(0, 0, 0, 0.2);
}

.metric-card {
  min-width: 0;
  border-radius: 20px;
  padding: clamp(12px, 1vw, 18px);
  overflow: hidden;
}

.metric-card span,
.panel-title span,
.screen-footer,
.record-item span,
.certificate-list span,
.certificate-list small,
.profile-panel small {
  color: rgba(236, 255, 249, 0.62);
}

.metric-card strong {
  display: inline-block;
  margin-top: 6px;
  color: #fff;
  font-size: clamp(34px, 3vw, 60px);
  line-height: 0.95;
}

.metric-card small {
  margin-left: 6px;
  color: #81f0c1;
}

.metric-card.primary,
.metric-card.rate {
  border-color: rgba(129, 240, 193, 0.34);
}

.metric-card.warning small,
.metric-card.warning strong {
  color: #ffbd8f;
}

.screen-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: 1.2fr 0.7fr 0.92fr;
  grid-template-rows: 49% 51%;
  gap: clamp(8px, 0.75vw, 14px);
  overflow: hidden;
}

.panel {
  min-width: 0;
  min-height: 0;
  border-radius: 22px;
  padding: clamp(12px, 1vw, 18px);
  overflow: hidden;
}

.trend-panel {
  grid-column: span 2;
}

.records-panel {
  grid-column: span 2;
}

.side-column {
  grid-row: span 2;
  min-height: 0;
  display: grid;
  grid-template-rows: 44% 27% 29%;
  gap: clamp(8px, 0.75vw, 14px);
  overflow: hidden;
}

.panel-title {
  height: 32px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.panel-title h2 {
  margin: 0;
  color: #fff;
  font-size: clamp(17px, 1.2vw, 24px);
  line-height: 1;
}

.hour-chart {
  height: calc(100% - 42px);
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  align-items: end;
  gap: 7px;
}

.hour-bar {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
}

.hour-bar i {
  width: 100%;
  min-height: 2px;
  border-radius: 999px 999px 4px 4px;
  background: linear-gradient(180deg, #85f2c5, #18c6aa);
  box-shadow: 0 0 18px rgba(24, 198, 170, 0.28);
}

.hour-bar span {
  min-height: 14px;
  color: rgba(236, 255, 249, 0.46);
  font-size: 11px;
}

.ratio-panel {
  display: grid;
  grid-template-rows: 32px minmax(0, 1fr);
}

.ratio-content {
  min-height: 0;
  display: grid;
  align-content: center;
  gap: 14px;
}

.ratio-circle {
  width: min(170px, 72%);
  aspect-ratio: 1;
  margin: 0 auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at center, #08242c 58%, transparent 60%),
    conic-gradient(
      #85f2c5 0deg,
      #85f2c5 calc(var(--rate, 0) * 3.6deg),
      rgba(255, 189, 143, 0.9) 0deg
    );
  border: 1px solid rgba(129, 240, 193, 0.26);
}

.ratio-circle strong {
  font-size: clamp(44px, 4vw, 76px);
}

.ratio-circle span {
  margin-top: 42px;
  margin-left: -20px;
  color: #81f0c1;
}

.ratio-bars {
  display: grid;
  gap: 9px;
}

.ratio-bars div {
  display: grid;
  gap: 5px;
}

.ratio-bars i {
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.ratio-bars b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #85f2c5;
}

.ratio-bars .danger b {
  background: #ffbd8f;
}

.record-list,
.certificate-list {
  min-height: 0;
  display: grid;
  gap: 8px;
}

.records-panel .record-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.record-item,
.certificate-list div {
  min-width: 0;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
}

.record-name {
  min-width: 0;
}

.record-item strong,
.certificate-list strong {
  display: block;
  overflow: hidden;
  color: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-item em {
  flex: 0 0 auto;
  min-width: 58px;
  border-radius: 999px;
  padding: 5px 9px;
  color: #063026;
  background: #85f2c5;
  font-style: normal;
  font-weight: 800;
  text-align: center;
}

.record-item em.unqualified {
  background: #ffbd8f;
}

.certificate-list div {
  display: grid;
  gap: 2px;
}

.status-panel dl {
  display: grid;
  gap: 9px;
  margin: 0;
}

.status-panel dl div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.status-panel dt {
  color: rgba(236, 255, 249, 0.62);
}

.status-panel dd {
  margin: 0;
  color: #fff;
  font-weight: 800;
  text-align: right;
}

.profile-panel p {
  display: -webkit-box;
  margin: 0 0 8px;
  overflow: hidden;
  color: rgba(236, 255, 249, 0.78);
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.empty {
  height: calc(100% - 42px);
  display: grid;
  place-items: center;
  color: rgba(236, 255, 249, 0.52);
  border: 1px dashed rgba(128, 241, 205, 0.2);
  border-radius: 16px;
}

.screen-footer {
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(236, 255, 249, 0.5);
}

@media (max-width: 1366px), (max-height: 780px) {
  .screen-shell {
    grid-template-rows: 70px 98px minmax(0, 1fr) 22px;
    gap: 8px;
    padding: 12px;
  }

  .metric-card {
    border-radius: 16px;
    padding: 10px;
  }

  .panel {
    border-radius: 18px;
    padding: 11px;
  }

  .record-list,
  .certificate-list {
    gap: 6px;
  }

  .record-item,
  .certificate-list div {
    padding: 8px 10px;
  }
}
/* Big-screen command center layout. These rules intentionally override the
   previous screen layout so the display remains one fixed 16:9 dashboard. */
.screen-page {
  background:
    linear-gradient(rgba(118, 255, 206, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(118, 255, 206, 0.045) 1px, transparent 1px),
    radial-gradient(circle at 15% 12%, rgba(43, 255, 188, 0.2), transparent 24%),
    radial-gradient(circle at 82% 16%, rgba(33, 157, 255, 0.17), transparent 28%),
    linear-gradient(135deg, #06151f 0%, #062b30 48%, #071522 100%);
  background-size: 52px 52px, 52px 52px, auto, auto, auto;
  font-family:
    Inter, "PingFang SC", "Microsoft YaHei", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.screen-page * {
  box-sizing: border-box;
}

.screen-shell {
  grid-template-rows: clamp(82px, 8.2vh, 104px) clamp(118px, 13vh, 150px) minmax(0, 1fr) 28px;
  gap: clamp(10px, 0.9vw, 16px);
  padding: clamp(14px, 1.25vw, 24px);
}

.screen-header {
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.74fr) minmax(0, 1fr);
  gap: 18px;
}

.header-left {
  min-width: 0;
}

.system-mark {
  width: fit-content;
  padding: 6px 12px;
  border: 1px solid rgba(130, 247, 199, 0.28);
  border-radius: 999px;
  color: #82f7c7;
  background: rgba(130, 247, 199, 0.08);
  font-size: 14px;
  font-weight: 900;
}

.header-left h1 {
  max-width: 100%;
  margin: 8px 0 4px;
  overflow: hidden;
  color: #fff;
  font-size: clamp(30px, 2.7vw, 54px);
  line-height: 1.02;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-left p,
.header-title span,
.header-meta span,
.screen-footer,
.panel-title span,
.timeline-item span,
.certificate-list span,
.certificate-list small,
.company-lines,
.service-panel dt {
  color: rgba(236, 255, 249, 0.64);
}

.header-left p {
  margin: 0;
  font-size: 15px;
}

.header-title {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 12px 22px;
  border: 1px solid rgba(130, 247, 199, 0.22);
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(130, 247, 199, 0.13), rgba(26, 129, 180, 0.08));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.header-title strong {
  color: #fff;
  font-size: clamp(22px, 1.7vw, 34px);
  letter-spacing: 0.12em;
}

.header-actions button {
  min-width: 86px;
}

.screen-kpis {
  min-height: 0;
  display: grid;
  grid-template-columns: 1.35fr repeat(4, minmax(0, 1fr));
  gap: clamp(8px, 0.75vw, 14px);
}

.kpi-card {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 6px;
  padding: clamp(14px, 1vw, 20px);
  border: 1px solid rgba(130, 247, 199, 0.16);
  border-radius: 22px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(14, 61, 66, 0.9), rgba(6, 27, 39, 0.9)),
    linear-gradient(135deg, rgba(130, 247, 199, 0.08), transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 20px 46px rgba(0, 0, 0, 0.22);
}

.kpi-card span {
  color: rgba(236, 255, 249, 0.68);
  font-weight: 800;
}

.kpi-card div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.kpi-card strong {
  color: #fff;
  font-size: clamp(38px, 3.8vw, 72px);
  line-height: 1;
}

.kpi-card small {
  color: #82f7c7;
  font-size: 17px;
  font-weight: 900;
}

.kpi-card p {
  margin: 0;
  overflow: hidden;
  color: rgba(236, 255, 249, 0.58);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-main {
  border-color: rgba(130, 247, 199, 0.34);
  background:
    radial-gradient(circle at 88% 20%, rgba(130, 247, 199, 0.18), transparent 34%),
    linear-gradient(135deg, rgba(13, 98, 90, 0.96), rgba(6, 28, 43, 0.92));
}

.kpi-card.good strong,
.kpi-card.rate strong {
  color: #8fffd0;
}

.kpi-card.bad strong {
  color: #ffbd8f;
}

.screen-dashboard {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(360px, 0.92fr) minmax(620px, 1.48fr) minmax(360px, 0.92fr);
  gap: clamp(10px, 0.9vw, 16px);
  overflow: hidden;
}

.left-stack,
.center-stack,
.right-stack {
  min-height: 0;
  display: grid;
  gap: clamp(10px, 0.9vw, 16px);
  overflow: hidden;
}

.center-stack {
  grid-template-rows: 40% minmax(0, 1fr);
}

.right-stack {
  grid-template-rows: 43% 28% minmax(0, 1fr);
}

.panel {
  border-radius: 24px;
  padding: clamp(14px, 1vw, 20px);
}

.timeline-list {
  height: calc(100% - 46px);
  display: grid;
  grid-template-rows: repeat(8, minmax(0, 1fr));
  gap: 9px;
}

.timeline-item {
  min-height: 0;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
}

.timeline-item time {
  color: #82f7c7;
  font-size: 16px;
  font-weight: 900;
}

.timeline-item div,
.certificate-list div {
  min-width: 0;
}

.timeline-item strong,
.certificate-list strong {
  display: block;
  overflow: hidden;
  color: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-item span {
  display: block;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timeline-item em,
.certificate-list em {
  padding: 5px 8px;
  border-radius: 999px;
  color: #063126;
  background: #82f7c7;
  font-style: normal;
  font-weight: 900;
  text-align: center;
}

.timeline-item em.unqualified,
.certificate-list em.voided {
  color: #3c150b;
  background: #ffbd8f;
}

.command-panel {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 12px;
  border-color: rgba(130, 247, 199, 0.28);
  background:
    radial-gradient(circle at 48% 54%, rgba(130, 247, 199, 0.18), transparent 36%),
    linear-gradient(135deg, rgba(6, 42, 52, 0.96), rgba(5, 23, 38, 0.94));
}

.command-head {
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr minmax(190px, 0.9fr) 1fr;
  align-items: center;
  gap: 18px;
}

.command-head span,
.command-head p,
.command-side small {
  color: rgba(236, 255, 249, 0.64);
}

.command-head h2 {
  margin: 4px 0 0;
  color: #8fffd0;
  font-size: clamp(64px, 6vw, 118px);
  line-height: 0.95;
}

.command-head p {
  margin: 8px 0 0;
}

.status-orb {
  width: min(230px, 100%);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  justify-self: center;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(5, 24, 35, 1) 53%, transparent 54%),
    conic-gradient(#82f7c7 calc(var(--rate) * 1%), rgba(255, 189, 143, 0.85) 0);
  box-shadow: 0 0 42px rgba(130, 247, 199, 0.18);
}

.status-orb strong {
  color: #fff;
  font-size: clamp(44px, 4vw, 72px);
  line-height: 1;
}

.status-orb span {
  margin-top: 56px;
  margin-left: -34px;
  color: #82f7c7;
  font-weight: 900;
}

.command-side {
  display: grid;
  justify-items: end;
  gap: 4px;
  text-align: right;
}

.command-side strong {
  color: #ffbd8f;
  font-size: clamp(44px, 4.2vw, 82px);
  line-height: 1;
}

.distribution {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.distribution div {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr) 42px;
  align-items: center;
  gap: 10px;
  color: rgba(236, 255, 249, 0.75);
}

.distribution i {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.distribution b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #82f7c7;
}

.distribution .danger b {
  background: #ffbd8f;
}

.trend-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 32px;
}

.hour-chart {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(24, minmax(0, 1fr));
  align-items: end;
  gap: 6px;
  padding: 14px 2px 20px;
}

.hour-bar {
  min-height: 0;
  border-radius: 999px 999px 8px 8px;
  background: rgba(255, 255, 255, 0.035);
}

.hour-bar i {
  width: 70%;
  background: linear-gradient(180deg, #82f7c7, rgba(24, 213, 188, 0.38));
}

.hour-bar:not(.active) i {
  background: rgba(255, 255, 255, 0.16);
  box-shadow: none;
}

.busy-hours {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: rgba(236, 255, 249, 0.65);
}

.busy-hours strong {
  overflow: hidden;
  color: #fff;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.certificate-list {
  height: calc(100% - 46px);
  display: grid;
  grid-template-rows: repeat(5, minmax(0, 1fr));
  gap: 9px;
}

.certificate-list > div {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 58px;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
}

.certificate-list small {
  grid-column: 1 / -1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-panel dl {
  height: calc(100% - 46px);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.service-panel dl div {
  min-height: 0;
  padding: 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
}

.service-panel dt {
  margin-bottom: 6px;
}

.service-panel dd {
  margin: 0;
  overflow: hidden;
  color: #fff;
  font-size: 18px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.company-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
}

.company-panel p {
  margin: 0 0 10px;
  overflow: hidden;
  color: rgba(236, 255, 249, 0.76);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.company-lines {
  display: grid;
  gap: 8px;
}

.company-lines span {
  overflow: hidden;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  border: 1px dashed rgba(130, 247, 199, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
}

@media (max-width: 1366px), (max-height: 780px) {
  .screen-shell {
    grid-template-rows: 76px 112px minmax(0, 1fr) 22px;
    gap: 8px;
    padding: 12px;
  }

  .screen-header {
    grid-template-columns: minmax(0, 1.15fr) 300px minmax(0, 0.9fr);
    gap: 10px;
  }

  .header-left h1 {
    font-size: 28px;
  }

  .header-title {
    padding: 8px 14px;
  }

  .header-title strong {
    font-size: 22px;
  }

  .kpi-card,
  .panel {
    border-radius: 16px;
    padding: 10px;
  }

  .kpi-card strong {
    font-size: 38px;
  }

  .screen-dashboard {
    grid-template-columns: 340px minmax(520px, 1fr) 340px;
    gap: 8px;
  }

  .timeline-list,
  .certificate-list {
    gap: 6px;
  }

  .timeline-item,
  .certificate-list > div {
    padding: 7px 9px;
  }

  .command-head h2 {
    font-size: 62px;
  }

  .status-orb {
    width: 160px;
  }

  .service-panel dd {
    font-size: 15px;
  }
}
</style>
