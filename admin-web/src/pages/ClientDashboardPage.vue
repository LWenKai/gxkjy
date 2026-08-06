<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>工作台首页</h1>
        <p v-if="summary?.company">欢迎，{{ summary.company.name }}</p>
      </div>
    </div>

    <div class="company-summary-grid">
      <div class="stat-card">
        <span>今日检测数</span>
        <strong>{{ summary?.stats.today_detection_count ?? 0 }}</strong>
        <small>今日上传的检测记录</small>
      </div>
      <div class="stat-card">
        <span>可开证数量</span>
        <strong>{{ summary?.stats.certifiable_count ?? 0 }}</strong>
        <small>合格且未开证的记录</small>
      </div>
      <div class="stat-card">
        <span>今日开证数</span>
        <strong>{{ summary?.stats.today_certificate_count ?? 0 }}</strong>
        <small>今日开具的合格证</small>
      </div>
    </div>

    <div v-if="authStore.hasModule('unit')" class="panel">
      <div class="panel-heading">
        <div>
          <h2>单位信息</h2>
        </div>
        <el-button
          type="primary"
          plain
          @click="router.push('/client/unit')"
        >
          查看详情
        </el-button>
      </div>
      <el-descriptions v-if="summary?.company" :column="2" border>
        <el-descriptions-item label="企业名称">{{ summary.company.name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ summary.company.contact_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ summary.company.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址">{{ summary.company.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产地/基地">{{ summary.company.origin_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="服务到期">{{ formatDate(summary.company.service_expire_at) }}</el-descriptions-item>
      </el-descriptions>
    </div>

    <div v-if="authStore.hasModule('detection')" class="panel">
      <div class="panel-heading">
        <div>
          <h2>近期检测记录</h2>
        </div>
        <el-button type="primary" plain @click="router.push('/client/detection-records')">
          全部记录
        </el-button>
      </div>
      <el-table :data="summary?.recent_detection_records || []" border class="data-table" empty-text="暂无检测记录">
        <el-table-column prop="record_no" label="记录编号" min-width="170" show-overflow-tooltip />
        <el-table-column prop="product_name" label="产品名称" min-width="130" />
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.overall_result === 'qualified' ? 'success' : 'danger'">
              {{ row.overall_result === 'qualified' ? '合格' : '不合格' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检测时间" min-width="155">
          <template #default="{ row }">{{ formatDateTime(row.test_time) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="authStore.hasModule('certificate')" class="panel">
      <div class="panel-heading">
        <div>
          <h2>近期合格证</h2>
        </div>
        <el-button type="primary" plain @click="router.push('/client/certificates')">
          全部合格证
        </el-button>
      </div>
      <el-table :data="summary?.recent_certificates || []" border class="data-table" empty-text="暂无合格证">
        <el-table-column prop="certificate_no" label="合格证编号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="product_name" label="产品名称" min-width="130" />
        <el-table-column prop="issuer_name" label="开具人" min-width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'">
              {{ row.status === 'normal' ? '正常' : '已作废' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开具时间" min-width="155">
          <template #default="{ row }">{{ formatDateTime(row.issue_time) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <div v-if="summary?.company" class="service-card service-card--bottom" :class="serviceClass">
      <div class="service-item">
        <span class="service-label">服务状态</span>
        <strong class="service-value">{{ serviceStatusText }}</strong>
      </div>
      <div class="service-item">
        <span class="service-label">服务到期时间</span>
        <strong class="service-value">{{ formatDate(summary.company.service_expire_at) }}</strong>
      </div>
      <div class="service-item">
        <span class="service-label">剩余天数</span>
        <strong class="service-value">{{ daysLeftText }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getClientDashboardSummary } from '@/api/client';
import { useClientAuthStore } from '@/stores/clientAuth';
import type { ClientDashboardSummary } from '@/types/api';
import { formatDate, formatDateTime, isExpired, isExpiringSoon } from '@/utils/time';

const router = useRouter();
const authStore = useClientAuthStore();
const summary = ref<ClientDashboardSummary | null>(null);
const loading = ref(false);

const serviceStatusText = computed(() => {
  const exp = summary.value?.company?.service_expire_at;
  if (!exp) return '—';
  if (isExpired(exp)) return '已到期';
  if (isExpiringSoon(exp)) return '即将到期';
  return '服务正常';
});

const serviceClass = computed(() => {
  const exp = summary.value?.company?.service_expire_at;
  if (!exp) return 'is-normal';
  if (isExpired(exp)) return 'is-expired';
  if (isExpiringSoon(exp)) return 'is-warning';
  return 'is-normal';
});

const daysLeftText = computed(() => {
  const exp = summary.value?.company?.service_expire_at;
  if (!exp) return '—';
  const ms = new Date(exp).getTime() - Date.now();
  if (ms <= 0) return '已到期';
  return `剩 ${Math.ceil(ms / (24 * 60 * 60 * 1000))} 天`;
});

onMounted(loadSummary);

async function loadSummary() {
  loading.value = true;
  try {
    summary.value = await getClientDashboardSummary();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.service-card {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  border: 1px solid #e2ece7;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
}
.service-item {
  flex: 1;
  min-width: 200px;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-right: 1px solid #eef3f0;
}
.service-item:last-child {
  border-right: none;
}
.service-label {
  font-size: 13px;
  color: #8a9a93;
}
.service-value {
  font-size: 17px;
  color: #14241f;
}
.service-card.is-warning {
  border-color: #f2c94c;
  background: #fffdf5;
}
.service-card.is-warning .service-value {
  color: #b7791f;
}
.service-card.is-expired {
  border-color: #e07c7c;
  background: #fff7f7;
}
.service-card.is-expired .service-value {
  color: #c0392b;
}
.service-card--bottom {
  margin-top: 20px;
}
</style>
