<template>
  <section class="page-section dashboard-page">
    <div class="page-heading dashboard-heading">
      <div>
        <h1>经营数据看板</h1>
      </div>
      <el-button type="primary" :loading="loading" @click="loadData">刷新数据</el-button>
    </div>

    <div class="stat-grid dashboard-key-grid" v-loading="loading">
      <button
        v-for="item in dashboardCards"
        :key="item.label"
        class="stat-card stat-card-button"
        type="button"
        @click="router.push(item.to)"
      >
        <Icon :name="item.icon" :size="22" class="stat-card-icon" />
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.note }}</small>
      </button>
    </div>

    <div class="dashboard-grid">
      <div class="panel">
        <div class="panel-heading">
          <div>
            <h2>最近检测记录</h2>
          </div>
          <el-button text type="primary" @click="router.push('/detection-records')">
            查看全部
          </el-button>
        </div>
        <el-table
          :data="summary?.recent_detection_records || []"
          border
          class="data-table"
          empty-text="暂无检测记录"
          @row-click="openDetectionRecord"
        >
          <el-table-column prop="record_no" label="记录编号" min-width="170" />
          <el-table-column prop="company_name" label="企业" min-width="160" />
          <el-table-column prop="product_name" label="产品" min-width="120" />
          <el-table-column label="结果" width="90">
            <template #default="{ row }: { row: DetectionRecord }">
              <el-tag :type="row.overall_result === 'qualified' ? 'success' : 'danger'">
                {{ row.overall_result === 'qualified' ? '合格' : '不合格' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="检测时间" min-width="160">
            <template #default="{ row }: { row: DetectionRecord }">
              {{ formatDateTime(row.test_time) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="panel">
        <div class="panel-heading">
          <div>
            <h2>最近合格证</h2>
          </div>
          <el-button text type="primary" @click="router.push('/certificates')">
            查看全部
          </el-button>
        </div>
        <el-table
          :data="summary?.recent_certificates || []"
          border
          class="data-table"
          empty-text="暂无合格证"
          @row-click="openCertificate"
        >
          <el-table-column prop="certificate_no" label="合格证编号" min-width="170" />
          <el-table-column prop="company_name" label="企业" min-width="160" />
          <el-table-column prop="product_name" label="产品" min-width="120" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }: { row: Certificate }">
              <el-tag :type="row.status === 'normal' ? 'success' : 'danger'">
                {{ row.status === 'normal' ? '正常' : '已作废' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="开具时间" min-width="160">
            <template #default="{ row }: { row: Certificate }">
              {{ formatDateTime(row.issue_time) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getDashboardSummary } from '@/api/dashboard';
import type { Certificate, DashboardSummary, DetectionRecord } from '@/types/api';
import { formatDateTime } from '@/utils/time';

const router = useRouter();
const loading = ref(false);
const summary = ref<DashboardSummary | null>(null);

function moneyText(value?: string | number) {
  return `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const dashboardCards = computed(() => {
  const stats = summary.value?.stats;
  return [
    { label: '今年成交金额', value: moneyText(stats?.sales_amount_this_year), note: '成交订单汇总', icon: 'trending-up', to: { path: '/customers' } },
    { label: '预计毛利', value: moneyText(stats?.sales_profit_estimate_this_year), note: '按产品成本估算', icon: 'pie-chart', to: { path: '/sales-products' } },
    { label: '待复购', value: stats?.repurchase_due_soon ?? 0, note: '需要跟进客户', icon: 'refresh-cw', to: { path: '/customers' } },
    { label: '销售客户', value: stats?.customer_total ?? 0, note: '内部客户库', icon: 'users', to: { path: '/customers' } },
    { label: '企业账号', value: stats?.company_total ?? 0, note: '已开通企业', icon: 'building-2', to: { path: '/companies' } },
    { label: '30天内到期', value: stats?.company_expiring_soon ?? 0, note: '续费跟进', icon: 'calendar-clock', to: { path: '/companies', query: { expire: 'soon' } } },
    { label: '今日检测', value: stats?.detection_record_today ?? 0, note: '检测记录', icon: 'clipboard-list', to: { path: '/detection-records', query: { date: 'today' } } },
    { label: '今日开证', value: stats?.certificate_today ?? 0, note: '合格证', icon: 'badge-check', to: { path: '/certificates', query: { date: 'today' } } },
  ];
});

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    summary.value = await getDashboardSummary();
  } finally {
    loading.value = false;
  }
}

function openDetectionRecord(row: DetectionRecord) {
  router.push({ path: '/detection-records', query: { record_id: row.id } });
}

function openCertificate(row: Certificate) {
  router.push({ path: '/certificates', query: { certificate_id: row.id } });
}
</script>

<style scoped>
.dashboard-page {
  gap: 20px;
}

.dashboard-heading {
  margin-bottom: 2px;
}

.dashboard-key-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.dashboard-key-grid .stat-card {
  min-height: 118px;
}

.stat-card-icon {
  color: var(--el-color-primary, #409eff);
  margin-bottom: 6px;
}

.dashboard-key-grid .stat-card strong {
  font-size: 28px;
}

@media (max-width: 1280px) {
  .dashboard-key-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
