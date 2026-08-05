<template>
  <section class="page-section dashboard-page">
    <!-- 欢迎条 -->
    <div class="welcome-bar">
      <div>
        <h1>{{ greeting }}，管理员</h1>
        <p class="welcome-date">{{ todayText }}</p>
      </div>
      <div class="welcome-status">
        <span class="status-dot" :class="abnormalCount > 0 ? 'warn' : 'ok'"></span>
        {{ abnormalCount > 0 ? `有 ${abnormalCount} 条不合格记录待跟进` : '当前无异常检测记录' }}
      </div>
    </div>

    <!-- 核心 KPI -->
    <div class="kpi-grid">
      <button
        v-for="item in coreKpis"
        :key="item.label"
        class="kpi-card"
        type="button"
        @click="router.push(item.to)"
      >
        <span class="kpi-icon" :style="{ background: item.bg }">
          <Icon :name="item.icon" :size="22" />
        </span>
        <div class="kpi-body">
          <span class="kpi-label">{{ item.label }}</span>
          <strong class="kpi-value">{{ item.value }}</strong>
          <small class="kpi-note">{{ item.note }}</small>
        </div>
      </button>
    </div>

    <!-- 今日动态 + 占比环图 -->
    <div class="mid-grid">
      <div class="panel today-panel">
        <div class="panel-heading">
          <h2>今日动态</h2>
        </div>
        <div class="today-cards">
          <div class="today-card">
            <span class="today-label">今日检测</span>
            <strong>{{ stats.detection_record_today ?? 0 }}</strong>
            <small>检测记录</small>
          </div>
          <div class="today-card">
            <span class="today-label">今日开证</span>
            <strong>{{ stats.certificate_today ?? 0 }}</strong>
            <small>合格证</small>
          </div>
        </div>
      </div>

      <div class="panel ratio-panel">
        <div class="panel-heading">
          <h2>企业 &amp; 设备启用概览</h2>
        </div>
        <div class="ratio-row">
          <div class="ratio-card">
            <div class="ratio-gauge">
              <div class="gauge-track"></div>
              <div class="gauge-fill" :style="gaugeStyle(companyRate)"></div>
              <div class="gauge-center">
                <Icon name="building-2" :size="22" />
              </div>
            </div>
            <div class="ratio-info">
              <strong>{{ companyRate }}%</strong>
              <span>企业启用率</span>
              <small>{{ stats.company_enabled ?? 0 }} / {{ stats.company_total ?? 0 }}</small>
            </div>
          </div>

          <div class="ratio-card">
            <div class="ratio-gauge">
              <div class="gauge-track"></div>
              <div class="gauge-fill" :style="gaugeStyle(deviceRate)"></div>
              <div class="gauge-center">
                <Icon name="printer" :size="22" />
              </div>
            </div>
            <div class="ratio-info">
              <strong>{{ deviceRate }}%</strong>
              <span>设备绑定率</span>
              <small>{{ stats.device_bound ?? 0 }} / {{ stats.device_total ?? 0 }}</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 风险提醒 + 快捷操作 -->
    <div class="mid-grid">
      <div class="panel risk-panel">
        <div class="panel-heading">
          <h2>风险与待办</h2>
        </div>
        <div class="risk-list">
          <div class="risk-item" :class="{ active: stats.detection_record_abnormal > 0 }" @click="router.push('/detection-records?result=unqualified')">
            <Icon name="alert-triangle" :size="18" />
            <span>不合格检测记录</span>
            <strong>{{ stats.detection_record_abnormal ?? 0 }}</strong>
          </div>
          <div class="risk-item" :class="{ active: stats.company_expiring_soon > 0 }" @click="router.push('/companies?expire=soon')">
            <Icon name="calendar-clock" :size="18" />
            <span>即将到期企业</span>
            <strong>{{ stats.company_expiring_soon ?? 0 }}</strong>
          </div>
          <div class="risk-item" :class="{ active: stats.company_expired > 0 }" @click="router.push('/companies?expire=expired')">
            <Icon name="calendar-x" :size="18" />
            <span>已过期企业</span>
            <strong>{{ stats.company_expired ?? 0 }}</strong>
          </div>
          <div class="risk-item" :class="{ active: disabledCompanyCount > 0 }" @click="router.push('/companies')">
            <Icon name="user-x" :size="18" />
            <span>未启用企业</span>
            <strong>{{ disabledCompanyCount }}</strong>
          </div>
        </div>
      </div>

      <div class="panel quick-panel">
        <div class="panel-heading">
          <h2>快捷操作</h2>
        </div>
        <div class="quick-grid">
          <button class="quick-btn" type="button" @click="router.push('/certificates?action=create')">
            <Icon name="badge-check" :size="20" />
            开具合格证
          </button>
          <button class="quick-btn" type="button" @click="router.push('/detection-records?action=create')">
            <Icon name="clipboard-list" :size="20" />
            新增检测
          </button>
          <button class="quick-btn" type="button" @click="router.push('/companies?action=create')">
            <Icon name="building-2" :size="20" />
            新增企业
          </button>
          <button class="quick-btn" type="button" @click="router.push('/devices?action=create')">
            <Icon name="printer" :size="20" />
            绑定设备
          </button>
        </div>
      </div>
    </div>

    <!-- 经营概览（次要：贸易字段） -->
    <div class="panel biz-panel">
      <div class="panel-heading">
        <h2>经营概览</h2>
        <small class="biz-hint">销售相关数据</small>
      </div>
      <div class="biz-grid">
        <div class="biz-item">
          <span>今年成交金额</span>
          <strong>{{ moneyText(stats.sales_amount_this_year) }}</strong>
        </div>
        <div class="biz-item">
          <span>预计毛利</span>
          <strong>{{ moneyText(stats.sales_profit_estimate_this_year) }}</strong>
        </div>
        <div class="biz-item">
          <span>待复购</span>
          <strong>{{ stats.repurchase_due_soon ?? 0 }}</strong>
        </div>
        <div class="biz-item">
          <span>销售客户</span>
          <strong>{{ stats.customer_total ?? 0 }}</strong>
        </div>
        <div class="biz-item">
          <span>今年新增客户</span>
          <strong>{{ stats.customer_this_year ?? 0 }}</strong>
        </div>
        <div class="biz-item">
          <span>今年订单</span>
          <strong>{{ stats.sales_order_this_year ?? 0 }}</strong>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getDashboardSummary } from '@/api/dashboard';
import type { DashboardSummary } from '@/types/api';
import { formatDateTime } from '@/utils/time';

const router = useRouter();
const loading = ref(false);
const summary = ref<DashboardSummary | null>(null);

const stats = computed(() => summary.value?.stats ?? ({} as DashboardSummary['stats']));

function moneyText(value?: string | number) {
  return `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const abnormalCount = computed(() => stats.value.detection_record_abnormal ?? 0);
const disabledCompanyCount = computed(() =>
  (stats.value.company_total ?? 0) - (stats.value.company_enabled ?? 0),
);

const companyRate = computed(() => {
  const total = stats.value.company_total ?? 0;
  if (!total) return 0;
  return Math.round(((stats.value.company_enabled ?? 0) / total) * 100);
});

const deviceRate = computed(() => {
  const total = stats.value.device_total ?? 0;
  if (!total) return 0;
  return Math.round(((stats.value.device_bound ?? 0) / total) * 100);
});

function gaugeStyle(rate: number) {
  const deg = rate * 3.6;
  return {
    background: `conic-gradient(var(--guxin-green) 0deg, var(--guxin-green-light) ${deg}deg, rgba(220, 233, 227, 0.45) ${deg}deg)`,
  };
}

const coreKpis = computed(() => [
  {
    label: '累计检测记录',
    value: stats.value.detection_record_total ?? 0,
    note: '历史检测总量',
    icon: 'clipboard-list',
    bg: 'rgba(15,143,88,0.12)',
    to: { path: '/detection-records' },
  },
  {
    label: '累计合格证',
    value: stats.value.certificate_total ?? 0,
    note: '已开具证书',
    icon: 'badge-check',
    bg: 'rgba(19,166,179,0.12)',
    to: { path: '/certificates' },
  },
  {
    label: '入驻企业',
    value: stats.value.company_total ?? 0,
    note: '已开通企业',
    icon: 'building-2',
    bg: 'rgba(245,158,11,0.12)',
    to: { path: '/companies' },
  },
  {
    label: '绑定设备',
    value: stats.value.device_bound ?? 0,
    note: '快检设备',
    icon: 'printer',
    bg: 'rgba(99,102,241,0.12)',
    to: { path: '/devices' },
  },
]);

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '凌晨好';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
});

const todayText = computed(() =>
  new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }),
);

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    summary.value = await getDashboardSummary();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.dashboard-page {
  gap: 18px;
}

/* 欢迎条 */
.welcome-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 8px 4px 4px;
}

.welcome-bar h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.3px;
  background: linear-gradient(120deg, var(--guxin-green-deep), var(--guxin-green));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.welcome-date {
  margin: 6px 0 0;
  color: var(--guxin-muted);
  font-size: 14px;
}

.welcome-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(15, 143, 88, 0.16);
  box-shadow: 0 6px 18px rgba(15, 143, 88, 0.08);
  backdrop-filter: blur(8px);
  color: var(--guxin-green-deep);
  font-size: 13px;
  font-weight: 600;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #25b376;
  box-shadow: 0 0 0 4px rgba(37, 179, 118, 0.18);
}

.status-dot.warn {
  background: #e0892a;
  box-shadow: 0 0 0 4px rgba(224, 137, 42, 0.18);
}

/* 核心 KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.kpi-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 253, 251, 0.92));
  border: 1px solid rgba(225, 235, 230, 0.9);
  box-shadow: 0 16px 40px rgba(39, 78, 58, 0.07);
  cursor: pointer;
  text-align: left;
  font: inherit;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.kpi-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(15, 143, 88, 0.5), transparent 45%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.kpi-card:hover {
  border-color: rgba(15, 122, 50, 0.4);
  box-shadow: 0 22px 48px rgba(25, 62, 37, 0.14);
  transform: translateY(-3px);
}

.kpi-card:hover::after {
  opacity: 1;
}

.kpi-icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 15px;
  color: var(--guxin-green);
  flex: 0 0 auto;
  box-shadow: inset 0 0 0 1px rgba(15, 143, 88, 0.08);
}

.kpi-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kpi-label {
  color: var(--guxin-muted);
  font-size: 13px;
  font-weight: 500;
}

.kpi-value {
  color: #0a3f32;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.5px;
}

.kpi-note {
  color: var(--guxin-muted);
  font-size: 12px;
  margin-top: 2px;
}

/* 中部网格 */
.mid-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* 今日动态 */
.today-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 16px;
}

.today-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(243, 250, 246, 0.9), rgba(255, 255, 255, 0.7));
  border: 1px solid rgba(159, 216, 193, 0.5);
  position: relative;
  overflow: hidden;
}

.today-card::before {
  content: "";
  position: absolute;
  top: -30px;
  right: -30px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(15, 143, 88, 0.12), transparent 70%);
}

.today-label {
  color: var(--guxin-muted);
  font-size: 13px;
}

.today-card strong {
  font-size: 32px;
  font-weight: 800;
  color: var(--guxin-green-deep);
  line-height: 1.1;
}

.today-card small {
  color: var(--guxin-muted);
  font-size: 12px;
}

/* 仪表盘 */
.ratio-row {
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
}

.ratio-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  transition: background 0.2s ease;
}

.ratio-gauge {
  position: relative;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.gauge-track,
.gauge-fill {
  position: absolute;
  inset: 0;
  border-radius: 50%;
}

.gauge-track {
  background: conic-gradient(rgba(220, 233, 227, 0.45) 0deg 360deg);
  mask: radial-gradient(transparent 58%, #000 59%);
  -webkit-mask: radial-gradient(transparent 58%, #000 59%);
}

.gauge-fill {
  mask: radial-gradient(transparent 58%, #000 59%);
  -webkit-mask: radial-gradient(transparent 58%, #000 59%);
  transition: background 0.8s ease;
}

.gauge-center {
  position: relative;
  z-index: 1;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: linear-gradient(145deg, #ffffff, #f4faf7);
  box-shadow: 0 4px 14px rgba(15, 143, 88, 0.12);
  display: grid;
  place-items: center;
  color: var(--guxin-green);
}

.ratio-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.ratio-info strong {
  font-size: 24px;
  font-weight: 800;
  color: #0a3f32;
  line-height: 1;
}

.ratio-info span {
  font-size: 13px;
  color: var(--guxin-muted);
  font-weight: 500;
}

.ratio-info small {
  font-size: 12px;
  color: var(--guxin-muted);
  background: rgba(15, 143, 88, 0.08);
  padding: 2px 10px;
  border-radius: 999px;
}

/* 风险列表 */
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(248, 251, 250, 0.8);
  border: 1px solid rgba(225, 235, 230, 0.8);
  color: var(--guxin-muted);
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.risk-item:hover {
  background: #eef6f2;
  transform: translateX(2px);
}

.risk-item :deep(.gx-icon) {
  color: #9bb5a8;
  flex: 0 0 auto;
}

.risk-item span {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.risk-item strong {
  font-size: 18px;
  font-weight: 800;
  color: #0a3f32;
}

.risk-item.active {
  background: linear-gradient(135deg, #fff6ed, #fdeede);
  border-color: rgba(224, 137, 42, 0.3);
  color: #9a5a12;
}

.risk-item.active :deep(.gx-icon) {
  color: #e0892a;
}

.risk-item.active strong {
  color: #c2640f;
}

/* 快捷操作 */
.quick-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;
}

.quick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px;
  border: 1px solid rgba(159, 216, 193, 0.6);
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff, #f3faf6);
  color: var(--guxin-green-deep);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.quick-btn:hover {
  background: linear-gradient(135deg, #eef8f2, #e3f3ea);
  border-color: var(--guxin-green);
  transform: translateY(-2px);
  box-shadow: 0 12px 26px rgba(15, 143, 88, 0.16);
}

.quick-btn :deep(.gx-icon) {
  color: var(--guxin-green);
}

/* 经营概览 */
.biz-panel .biz-hint {
  color: var(--guxin-muted);
  font-weight: 400;
}

.biz-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.biz-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(248, 251, 250, 0.7);
  border: 1px solid rgba(225, 235, 230, 0.7);
}

.biz-item span {
  color: var(--guxin-muted);
  font-size: 12px;
}

.biz-item strong {
  font-size: 19px;
  font-weight: 800;
  color: #0a3f32;
}

/* 入场动效 */
.dashboard-page > * {
  animation: rise 0.5s ease both;
}

.dashboard-page > *:nth-child(1) { animation-delay: 0.02s; }
.dashboard-page > *:nth-child(2) { animation-delay: 0.08s; }
.dashboard-page > *:nth-child(3) { animation-delay: 0.14s; }
.dashboard-page > *:nth-child(4) { animation-delay: 0.2s; }
.dashboard-page > *:nth-child(5) { animation-delay: 0.26s; }
.dashboard-page > *:nth-child(6) { animation-delay: 0.32s; }

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .biz-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .kpi-grid,
  .mid-grid,
  .biz-grid,
  .today-cards,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
