<template>
  <div class="big-screen" v-loading="loading && !data">
    <header class="bs-header">
      <div class="bs-brand">
        <span class="bs-company">{{ companyName }}</span>
        <span class="bs-brand-sub">数据更新于 {{ lastUpdated }}</span>
      </div>
      <h1 class="bs-title">企业快检数据实时大屏</h1>
      <div class="bs-clock">
        <span class="bs-date">{{ clockDate }}</span>
        <span class="bs-time">{{ clockTime }}</span>
      </div>
      <button class="bs-exit" type="button" @click="exit">
        <Icon name="minimize-2" :size="16" />
        <span>退出全屏</span>
      </button>
    </header>

    <section class="bs-kpis" v-if="data">
      <div class="bs-kpi">
        <Icon class="bs-kpi-icon" name="flask-conical" :size="26" />
        <div class="bs-kpi-value">{{ data.total_count }}</div>
        <div class="bs-kpi-label">累计检测数</div>
      </div>
      <div class="bs-kpi">
        <Icon class="bs-kpi-icon" name="trending-up" :size="26" />
        <div class="bs-kpi-value" :class="rateClass(data.pass_rate)">{{ formatRate(data.pass_rate) }}</div>
        <div class="bs-kpi-label">累计合格率</div>
      </div>
      <div class="bs-kpi">
        <Icon class="bs-kpi-icon" name="calendar-clock" :size="26" />
        <div class="bs-kpi-value">{{ data.today_count }}</div>
        <div class="bs-kpi-label">今日检测数</div>
      </div>
      <div class="bs-kpi">
        <Icon class="bs-kpi-icon" name="activity" :size="26" />
        <div class="bs-kpi-value" :class="rateClass(data.today_pass_rate)">{{ formatRate(data.today_pass_rate) }}</div>
        <div class="bs-kpi-label">今日合格率</div>
      </div>
      <div class="bs-kpi">
        <Icon class="bs-kpi-icon" name="award" :size="26" />
        <div class="bs-kpi-value">{{ data.certificate_count }}</div>
        <div class="bs-kpi-label">累计合格证</div>
      </div>
      <div class="bs-kpi">
        <Icon class="bs-kpi-icon" name="cpu" :size="26" />
        <div class="bs-kpi-value">{{ data.device_count }}</div>
        <div class="bs-kpi-label">绑定设备数</div>
      </div>
    </section>

    <section class="bs-body" v-if="data">
      <div class="bs-col-main">
        <div class="bs-card bs-trend">
          <div class="bs-card-head">
            <Icon name="bar-chart-3" :size="18" color="#38bdf8" />
            <span class="bs-card-title">近 30 天检测趋势</span>
          </div>
          <div ref="trendChartRef" class="bs-chart-canvas"></div>
        </div>

        <div class="bs-card bs-records">
          <div class="bs-card-head">
            <Icon name="list-checks" :size="18" color="#38bdf8" />
            <span class="bs-card-title">最近检测记录</span>
          </div>
          <div class="bs-record-list" ref="recordListRef">
            <div
              v-for="item in data.recent_records"
              :key="item.id"
              class="bs-record-row"
              :class="item.overall_result === 'qualified' ? 'ok' : 'no'"
            >
              <Icon class="bs-record-icon" :name="item.overall_result === 'qualified' ? 'check-circle-2' : 'x-circle'" :size="18" />
              <span class="bs-record-name">{{ item.product_name || item.sample_name || '—' }}</span>
              <span class="bs-record-device">{{ item.device_name || '—' }}</span>
              <span class="bs-record-time">{{ formatTime(item.test_time) }}</span>
              <span class="bs-record-result">
                {{ item.overall_result === 'qualified' ? '合格' : '不合格' }}
              </span>
            </div>
            <div v-if="!data.recent_records.length" class="bs-empty">暂无检测记录</div>
          </div>
        </div>
      </div>

      <div class="bs-col-side">
        <div class="bs-card bs-category">
          <div class="bs-card-head">
            <Icon name="pie-chart" :size="18" color="#38bdf8" />
            <span class="bs-card-title">品类检测分布</span>
          </div>
          <div ref="categoryChartRef" class="bs-chart-canvas"></div>
        </div>

        <div class="bs-card bs-cert">
          <div class="bs-card-head">
            <Icon name="award" :size="18" color="#38bdf8" />
            <span class="bs-card-title">最新合格证</span>
          </div>
          <div class="bs-cert-list" ref="certListRef">
            <div v-for="cert in data.recent_certificates" :key="cert.id" class="bs-cert-row">
              <Icon name="badge-check" :size="16" color="#38bdf8" />
              <span class="bs-cert-name">{{ cert.product_name }}</span>
              <span class="bs-cert-time">{{ formatTime(cert.issue_time) }}</span>
            </div>
            <div v-if="!data.recent_certificates.length" class="bs-empty">暂无合格证</div>
          </div>
        </div>

        <div class="bs-card bs-devices">
          <div class="bs-card-head">
            <Icon name="cpu" :size="18" color="#38bdf8" />
            <span class="bs-card-title">设备运行状态</span>
            <span class="bs-device-online">在线 {{ data.online_device_count }}/{{ data.device_count }}</span>
          </div>
          <div class="bs-device-list">
            <div v-for="dev in data.devices" :key="dev.name" class="bs-device-row">
              <span class="bs-dot" :class="dev.online ? 'on' : 'off'"></span>
              <span class="bs-device-name">{{ dev.name }}</span>
              <span class="bs-device-status" :class="dev.online ? 'on' : 'off'">
                {{ dev.online ? '在线' : '离线' }}
              </span>
            </div>
            <div v-if="!data.devices.length" class="bs-empty">暂无设备</div>
          </div>
        </div>

        <div class="bs-card bs-warn" :class="{ active: data.abnormal_records.length }">
          <div class="bs-card-head">
            <Icon name="triangle-alert" :size="18" :color="data.abnormal_records.length ? '#f87171' : '#38bdf8'" />
            <span class="bs-card-title">不合格预警</span>
            <span class="bs-warn-count" v-if="data.abnormal_records.length">
              {{ data.abnormal_records.length }}
            </span>
          </div>
          <div class="bs-warn-list">
            <div v-for="item in data.abnormal_records" :key="item.id" class="bs-warn-row">
              <Icon name="alert-circle" :size="16" color="#f87171" />
              <span class="bs-warn-name">{{ item.product_name || item.sample_name || '—' }}</span>
              <span class="bs-warn-time">{{ formatTime(item.test_time) }}</span>
            </div>
            <div v-if="!data.abnormal_records.length" class="bs-empty ok">暂无不合格记录</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import { getClientBigScreen } from '@/api/client';
import { useClientAuthStore } from '@/stores/clientAuth';
import type { BigScreenData } from '@/types/api';

const router = useRouter();
const authStore = useClientAuthStore();

const data = ref<BigScreenData | null>(null);
const loading = ref(false);
const lastUpdated = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

const trendChartRef = ref<HTMLElement | null>(null);
const categoryChartRef = ref<HTMLElement | null>(null);
const recordListRef = ref<HTMLElement | null>(null);
const certListRef = ref<HTMLElement | null>(null);
let trendChart: echarts.ECharts | null = null;
let categoryChart: echarts.ECharts | null = null;
let chartObserver: ResizeObserver | null = null;
let catObserver: ResizeObserver | null = null;
let scrollTimer: ReturnType<typeof setInterval> | null = null;

const companyName = computed(() => authStore.company?.name || '—');

function rateClass(rate: number | null) {
  if (rate === null || rate === undefined) return '';
  if (rate >= 90) return 'good';
  if (rate >= 70) return 'mid';
  return 'bad';
}

function formatRate(rate: number | null) {
  return rate === null || rate === undefined ? '—' : `${rate}%`;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

const clockTime = ref('');
const clockDate = ref('');
let clockTimer: ReturnType<typeof setInterval> | null = null;

function tickClock() {
  const d = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  clockDate.value = `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 星期${week}`;
  clockTime.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatTime(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatUpdated(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function load() {
  loading.value = true;
  try {
    data.value = await getClientBigScreen();
    lastUpdated.value = formatUpdated(new Date().toISOString());
    await nextTick();
    renderCharts();
  } finally {
    loading.value = false;
  }
}

function initCharts() {
  if (trendChartRef.value && !trendChart) {
    trendChart = echarts.init(trendChartRef.value);
  }
  if (categoryChartRef.value && !categoryChart) {
    categoryChart = echarts.init(categoryChartRef.value);
  }
}

function renderCharts() {
  if (!data.value) return;
  initCharts();

  const trend = data.value.trend || [];
  const passRateSeries = trend.map((p) =>
    p.total > 0 ? Math.round((p.pass / p.total) * 1000) / 10 : 0,
  );
  trendChart?.setOption({
    backgroundColor: 'transparent',
    grid: { top: 44, right: 24, bottom: 32, left: 48 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(15,23,42,0.92)', borderColor: 'rgba(56,189,248,0.4)', textStyle: { color: '#e8f3fb' } },
    legend: { data: ['检测量', '合格量', '合格率'], textStyle: { color: '#9fb6c9' }, right: 12, top: 6 },
    xAxis: {
      type: 'category',
      data: trend.map((p) => p.date.slice(5)),
      axisLine: { lineStyle: { color: 'rgba(56,189,248,0.35)' } },
      axisLabel: { color: '#9fb6c9', fontSize: 13 },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        axisLabel: { color: '#9fb6c9', fontSize: 13 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      },
      {
        type: 'value',
        max: 100,
        axisLabel: { color: '#9fb6c9', fontSize: 13, formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '检测量',
        type: 'bar',
        barWidth: '38%',
        data: trend.map((p) => p.total),
        itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#38bdf8' }, { offset: 1, color: 'rgba(56,189,248,0.25)' }]) },
      },
      {
        name: '合格量',
        type: 'bar',
        barWidth: '38%',
        data: trend.map((p) => p.pass),
        itemStyle: { borderRadius: [4, 4, 0, 0], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#34d399' }, { offset: 1, color: 'rgba(52,211,153,0.25)' }]) },
      },
      {
        name: '合格率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        data: passRateSeries,
        lineStyle: { color: '#fbbf24', width: 2.5 },
        itemStyle: { color: '#fbbf24' },
      },
    ],
  });

  const categories = data.value.categories || [];
  categoryChart?.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: 'rgba(15,23,42,0.92)', borderColor: 'rgba(56,189,248,0.4)', textStyle: { color: '#e8f3fb' }, formatter: '{b}: {c} ({d}%)' },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 4,
      left: 'center',
      textStyle: { color: '#9fb6c9', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        name: '检测品类',
        type: 'pie',
        radius: ['42%', '66%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: 'rgba(8,18,32,0.9)', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold', color: '#e8f3fb', formatter: '{b}\n{c}' },
        },
        labelLine: { show: false },
        data: categories.map((c, i) => ({
          name: c.name,
          value: c.count,
          itemStyle: { color: ['#38bdf8', '#34d399', '#22d3ee', '#fbbf24', '#a78bfa', '#f472b6'][i % 6] },
        })),
      },
    ],
  });

  trendChart?.resize();
  categoryChart?.resize();
}

function startAutoScroll() {
  if (scrollTimer) clearInterval(scrollTimer);
  scrollTimer = setInterval(() => {
    for (const el of [recordListRef.value, certListRef.value]) {
      if (!el) continue;
      if (el.scrollHeight - el.clientHeight <= 4) continue;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
        el.scrollTop = 0;
      } else {
        el.scrollTop += 1;
      }
    }
  }, 50);
}

function exit() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined);
  }
  router.push('/client/dashboard');
}

function enterFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) {
    el.requestFullscreen().catch(() => undefined);
  }
}

function onFullscreenChange() {
  // 用户按 ESC 主动退出全屏时，返回工作台
  if (!document.fullscreenElement) {
    router.push('/client/dashboard');
  }
}

onMounted(() => {
  tickClock();
  clockTimer = setInterval(tickClock, 1000);
  load();
  timer = setInterval(load, 30000);
  enterFullscreen();
  document.addEventListener('fullscreenchange', onFullscreenChange);
  window.addEventListener('resize', onResize);
  if (trendChartRef.value) {
    chartObserver = new ResizeObserver(() => trendChart?.resize());
    chartObserver.observe(trendChartRef.value);
  }
  if (categoryChartRef.value) {
    catObserver = new ResizeObserver(() => categoryChart?.resize());
    catObserver.observe(categoryChartRef.value);
  }
  startAutoScroll();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (clockTimer) clearInterval(clockTimer);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  window.removeEventListener('resize', onResize);
  chartObserver?.disconnect();
  catObserver?.disconnect();
  if (scrollTimer) clearInterval(scrollTimer);
  trendChart?.dispose();
  categoryChart?.dispose();
  trendChart = null;
  categoryChart = null;
});

function onResize() {
  trendChart?.resize();
  categoryChart?.resize();
}
</script>

<style scoped>
.big-screen {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 50% 0%, #0f2747 0%, #0a1830 55%, #060f22 100%);
  color: #e8f3fb;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
  padding: 20px 30px 16px;
  overflow: hidden;
}
.bs-header {
  display: flex;
  align-items: center;
  gap: 24px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.22);
  padding-bottom: 14px;
}
.bs-brand {
  display: flex;
  flex-direction: column;
}
.bs-company {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.bs-brand-sub {
  font-size: 12px;
  color: #7fb6d6;
}
.bs-title {
  flex: 1;
  text-align: center;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 0 18px rgba(56, 189, 248, 0.5);
  margin: 0;
}
.bs-clock {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.bs-date {
  font-size: 16px;
  font-weight: 600;
  color: #cfe8f7;
}
.bs-time {
  font-size: 14px;
  color: #7fb6d6;
  font-variant-numeric: tabular-nums;
}
.bs-exit {
  margin-left: 18px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e8f3fb;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.bs-exit:hover {
  background: rgba(255, 255, 255, 0.16);
}
.bs-kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin: 16px 0;
}
.bs-kpi {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(56, 189, 248, 0.16);
  border-radius: 12px;
  padding: 14px 10px 12px;
  text-align: center;
}
.bs-kpi-icon {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 1;
  padding: 7px;
  border-radius: 10px;
  background: rgba(56, 189, 248, 0.16);
  color: #7dd3fc;
}
.bs-kpi:nth-child(1) .bs-kpi-icon { background: rgba(56, 189, 248, 0.16); color: #7dd3fc; }
.bs-kpi:nth-child(2) .bs-kpi-icon { background: rgba(52, 211, 153, 0.16); color: #6ee7b7; }
.bs-kpi:nth-child(3) .bs-kpi-icon { background: rgba(34, 211, 238, 0.16); color: #67e8f9; }
.bs-kpi:nth-child(4) .bs-kpi-icon { background: rgba(251, 191, 36, 0.16); color: #fcd34d; }
.bs-kpi:nth-child(5) .bs-kpi-icon { background: rgba(167, 139, 250, 0.16); color: #c4b5fd; }
.bs-kpi:nth-child(6) .bs-kpi-icon { background: rgba(244, 114, 182, 0.16); color: #f9a8d4; }
.bs-kpi-value {
  font-size: 36px;
  font-weight: 800;
  color: #38bdf8;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.bs-kpi-value.good {
  color: #34d399;
}
.bs-kpi-value.mid {
  color: #fbbf24;
}
.bs-kpi-value.bad {
  color: #f87171;
}
.bs-kpi-label {
  margin-top: 4px;
  font-size: 13px;
  color: #a9c6dc;
}
.bs-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 18px;
  min-height: 0;
}
.bs-col-main,
.bs-col-side {
  display: grid;
  gap: 18px;
  min-height: 0;
}
.bs-col-main {
  grid-template-rows: 1.1fr 1fr;
}
.bs-col-side {
  grid-template-rows: 1.15fr 1fr 0.9fr 1fr;
}
.bs-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(56, 189, 248, 0.14);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.bs-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.bs-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}
.bs-chart-canvas {
  position: absolute;
  top: 48px;
  left: 8px;
  right: 8px;
  bottom: 8px;
}
.bs-record-list,
.bs-cert-list,
.bs-warn-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.bs-record-list,
.bs-cert-list {
  overflow-y: auto;
  scrollbar-width: none;
}
.bs-record-list::-webkit-scrollbar,
.bs-cert-list::-webkit-scrollbar {
  display: none;
}
.bs-record-row {
  display: grid;
  grid-template-columns: 22px 1fr 120px 150px 56px;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 14px;
}
.bs-record-row.ok {
  border-left: 3px solid #34d399;
}
.bs-record-row.no {
  border-left: 3px solid #f87171;
  background: rgba(248, 113, 113, 0.08);
}
.bs-record-icon {
  justify-self: center;
}
.bs-record-row.ok .bs-record-icon {
  color: #34d399;
}
.bs-record-row.no .bs-record-icon {
  color: #f87171;
}
.bs-record-name {
  color: #e8f3fb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bs-record-device {
  color: #9fb6c9;
  text-align: center;
}
.bs-record-time {
  color: #9fb6c9;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.bs-record-result {
  text-align: center;
  font-weight: 700;
}
.bs-record-row.ok .bs-record-result {
  color: #34d399;
}
.bs-record-row.no .bs-record-result {
  color: #f87171;
}
.bs-cert-row {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 13px;
  align-items: center;
}
.bs-cert-name {
  color: #e8f3fb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bs-device-online {
  margin-left: auto;
  font-size: 12px;
  color: #7fb6d6;
}
.bs-device-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.bs-device-row {
  display: grid;
  grid-template-columns: 14px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 13px;
}
.bs-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.bs-dot.on {
  background: #34d399;
  box-shadow: 0 0 8px rgba(52, 211, 153, 0.7);
}
.bs-dot.off {
  background: #64748b;
}
.bs-device-name {
  color: #e8f3fb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bs-device-status {
  font-size: 12px;
  font-weight: 600;
}
.bs-device-status.on {
  color: #34d399;
}
.bs-device-status.off {
  color: #94a3b8;
}
.bs-cert-time {
  color: #9fb6c9;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.bs-warn {
  border-color: rgba(248, 113, 113, 0.2);
}
.bs-warn.active {
  border-color: rgba(248, 113, 113, 0.5);
  box-shadow: 0 0 16px rgba(248, 113, 113, 0.15);
}
.bs-warn-count {
  background: #f87171;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  border-radius: 10px;
  padding: 1px 9px;
}
.bs-warn-row {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 8px;
  background: rgba(248, 113, 113, 0.08);
  font-size: 13px;
  align-items: center;
}
.bs-warn-name {
  color: #ffc9c9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bs-warn-time {
  color: #f0a3a3;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.bs-empty {
  text-align: center;
  color: #7fa3bd;
  padding: 20px 0;
  font-size: 14px;
}
.bs-empty.ok {
  color: #34d399;
}
</style>
