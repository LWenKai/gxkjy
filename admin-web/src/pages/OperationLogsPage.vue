<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>操作日志</h1>
        <p>查看后台和客户侧关键操作记录，仅支持查询，不支持编辑或删除。</p>
      </div>
    </div>

    <div class="panel search-panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="操作人">
          <el-input v-model.trim="query.operator" clearable placeholder="类型或 ID" @keyup.enter="loadLogs" />
        </el-form-item>
        <el-form-item label="模块">
          <el-input v-model.trim="query.target_type" clearable placeholder="例如 company" @keyup.enter="loadLogs" />
        </el-form-item>
        <el-form-item label="动作">
          <el-input v-model.trim="query.action" clearable placeholder="例如 update" @keyup.enter="loadLogs" />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker v-model="dateRange" type="daterange" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLogs">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button :loading="exporting" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="panel">
      <el-table v-loading="loading" :data="logs" border class="data-table" empty-text="暂无操作记录">
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }: { row: OperationLog }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作人" min-width="130">
          <template #default="{ row }: { row: OperationLog }">{{ row.operator_type }}{{ row.operator_id ? ` #${row.operator_id}` : '' }}</template>
        </el-table-column>
        <el-table-column prop="target_type" label="模块" min-width="130" />
        <el-table-column prop="action" label="动作" min-width="180" />
        <el-table-column prop="ip" label="IP" min-width="130">
          <template #default="{ row }: { row: OperationLog }">{{ row.ip || '-' }}</template>
        </el-table-column>
        <el-table-column label="结果/摘要" min-width="220" show-overflow-tooltip>
          <template #default="{ row }: { row: OperationLog }">{{ row.content || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }: { row: OperationLog }">
            <el-button size="small" text type="primary" @click="viewLog(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span>共 {{ total }} 条</span>
        <el-pagination layout="prev, pager, next" :total="total" :page-size="query.page_size" v-model:current-page="query.page" @current-change="loadLogs" />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="日志详情" width="640px">
      <el-descriptions v-if="currentLog" :column="2" border>
        <el-descriptions-item label="时间">{{ formatDateTime(currentLog.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operator_type }}{{ currentLog.operator_id ? ` #${currentLog.operator_id}` : '' }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.target_type }}</el-descriptions-item>
        <el-descriptions-item label="对象 ID">{{ currentLog.target_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="动作" :span="2">{{ currentLog.action }}</el-descriptions-item>
        <el-descriptions-item label="IP" :span="2">{{ currentLog.ip || '-' }}</el-descriptions-item>
      </el-descriptions>
      <pre class="raw-json">{{ currentLog?.content || '暂无内容' }}</pre>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { exportOperationLogs, listOperationLogs } from '@/api/operationLogs';
import type { OperationLog } from '@/types/api';
import { formatDateTime } from '@/utils/time';

const loading = ref(false);
const exporting = ref(false);
const logs = ref<OperationLog[]>([]);
const total = ref(0);
const dateRange = ref<[string, string] | ''>('');
const detailVisible = ref(false);
const currentLog = ref<OperationLog | null>(null);

const query = reactive({
  page: 1,
  page_size: 10,
  operator: '',
  target_type: '',
  action: '',
  date_from: '',
  date_to: '',
});

onMounted(loadLogs);

async function loadLogs() {
  query.date_from = Array.isArray(dateRange.value) ? dateRange.value[0] : '';
  query.date_to = Array.isArray(dateRange.value) ? dateRange.value[1] : '';
  loading.value = true;
  try {
    const data = await listOperationLogs(query);
    logs.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.page = 1;
  query.operator = '';
  query.target_type = '';
  query.action = '';
  query.date_from = '';
  query.date_to = '';
  dateRange.value = '';
  loadLogs();
}

async function handleExport() {
  await ElMessageBox.confirm(
    `将按当前筛选条件导出 ${total.value} 条操作日志，文件格式为 CSV。是否继续？`,
    '导出确认',
    { confirmButtonText: '确认导出', cancelButtonText: '取消', type: 'info' },
  );
  query.date_from = Array.isArray(dateRange.value) ? dateRange.value[0] : '';
  query.date_to = Array.isArray(dateRange.value) ? dateRange.value[1] : '';
  exporting.value = true;
  try {
    await exportOperationLogs({
      operator: query.operator || undefined,
      target_type: query.target_type || undefined,
      action: query.action || undefined,
      date_from: query.date_from || undefined,
      date_to: query.date_to || undefined,
    });
    ElMessage.success('操作日志已导出');
  } finally {
    exporting.value = false;
  }
}

function viewLog(log: OperationLog) {
  currentLog.value = log;
  detailVisible.value = true;
}
</script>
