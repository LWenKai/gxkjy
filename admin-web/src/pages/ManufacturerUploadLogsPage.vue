<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>厂家上传日志</h1>
        <p>用于检测仪联调时查看上传状态、设备归属和失败原因。</p>
      </div>
    </div>

    <div class="panel search-panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="厂家">
          <el-input v-model.trim="query.manufacturer_code" clearable placeholder="厂家编码" @keyup.enter="loadLogs" />
        </el-form-item>
        <el-form-item label="设备">
          <el-input v-model.trim="query.device_sn" clearable placeholder="设备编号" @keyup.enter="loadLogs" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.result" clearable placeholder="全部" style="width: 150px">
            <el-option label="成功" value="success" />
            <el-option label="重复上传" value="duplicate" />
            <el-option label="签名错误" value="invalid_signature" />
            <el-option label="设备未绑定" value="unbound_device" />
            <el-option label="格式错误" value="validation_error" />
            <el-option label="处理失败" value="failed" />
          </el-select>
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
      <el-table v-loading="loading" :data="logs" border class="data-table" empty-text="暂无上传记录">
        <el-table-column label="上传时间" min-width="160">
          <template #default="{ row }: { row: ManufacturerUploadLog }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column prop="manufacturer_code" label="厂家编码" min-width="130" />
        <el-table-column prop="device_sn" label="设备编号" min-width="150">
          <template #default="{ row }: { row: ManufacturerUploadLog }"><span class="code-text">{{ row.device_sn || '-' }}</span></template>
        </el-table-column>
        <el-table-column prop="manufacturer_record_id" label="厂家记录 ID" min-width="160">
          <template #default="{ row }: { row: ManufacturerUploadLog }">{{ row.manufacturer_record_id || '-' }}</template>
        </el-table-column>
        <el-table-column label="处理状态" min-width="120">
          <template #default="{ row }: { row: ManufacturerUploadLog }">
            <el-tag :type="resultTagType(row.result)">{{ resultText(row.result) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="company_name" label="归属企业" min-width="180">
          <template #default="{ row }: { row: ManufacturerUploadLog }">{{ row.company_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="error_reason" label="错误原因" min-width="220" show-overflow-tooltip>
          <template #default="{ row }: { row: ManufacturerUploadLog }">{{ row.error_reason || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" fixed="right">
          <template #default="{ row }: { row: ManufacturerUploadLog }">
            <el-button size="small" text type="primary" @click="viewLog(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span>共 {{ total }} 条</span>
        <el-pagination layout="prev, pager, next" :total="total" :page-size="query.page_size" v-model:current-page="query.page" @current-change="loadLogs" />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="上传日志详情" width="720px">
      <el-descriptions v-if="currentLog" :column="2" border>
        <el-descriptions-item label="上传时间">{{ formatDateTime(currentLog.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="处理状态">{{ resultText(currentLog.result) }}</el-descriptions-item>
        <el-descriptions-item label="厂家编码">{{ currentLog.manufacturer_code }}</el-descriptions-item>
        <el-descriptions-item label="设备编号">{{ currentLog.device_sn || '-' }}</el-descriptions-item>
        <el-descriptions-item label="厂家记录 ID">{{ currentLog.manufacturer_record_id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="归属企业">{{ currentLog.company_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="错误原因" :span="2">{{ currentLog.error_reason || '-' }}</el-descriptions-item>
      </el-descriptions>
      <h3 class="log-summary-title">请求摘要</h3>
      <pre class="raw-json">{{ currentLog?.request_summary || '暂无请求摘要' }}</pre>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { exportManufacturerUploadLogs, listManufacturerUploadLogs } from '@/api/manufacturerUploadLogs';
import type { ManufacturerUploadLog } from '@/types/api';
import { formatDateTime } from '@/utils/time';

const loading = ref(false);
const exporting = ref(false);
const logs = ref<ManufacturerUploadLog[]>([]);
const total = ref(0);
const dateRange = ref<[string, string] | ''>('');
const detailVisible = ref(false);
const currentLog = ref<ManufacturerUploadLog | null>(null);

const query = reactive({
  page: 1,
  page_size: 10,
  manufacturer_code: '',
  device_sn: '',
  result: '',
  date_from: '',
  date_to: '',
});

onMounted(loadLogs);

async function loadLogs() {
  query.date_from = Array.isArray(dateRange.value) ? dateRange.value[0] : '';
  query.date_to = Array.isArray(dateRange.value) ? dateRange.value[1] : '';
  loading.value = true;
  try {
    const data = await listManufacturerUploadLogs(query);
    logs.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.page = 1;
  query.manufacturer_code = '';
  query.device_sn = '';
  query.result = '';
  query.date_from = '';
  query.date_to = '';
  dateRange.value = '';
  loadLogs();
}

async function handleExport() {
  await ElMessageBox.confirm(
    `将按当前筛选条件导出 ${total.value} 条厂家上传日志，文件格式为 CSV。是否继续？`,
    '导出确认',
    { confirmButtonText: '确认导出', cancelButtonText: '取消', type: 'info' },
  );
  exporting.value = true;
  try {
    await exportManufacturerUploadLogs({
      manufacturer_code: query.manufacturer_code || undefined,
      device_sn: query.device_sn || undefined,
      result: query.result || undefined,
      date_from: Array.isArray(dateRange.value) ? dateRange.value[0] : undefined,
      date_to: Array.isArray(dateRange.value) ? dateRange.value[1] : undefined,
    });
    ElMessage.success('上传日志已导出');
  } finally {
    exporting.value = false;
  }
}

function viewLog(row: ManufacturerUploadLog) {
  currentLog.value = row;
  detailVisible.value = true;
}

function resultText(value: string) {
  const map: Record<string, string> = {
    success: '成功',
    duplicate: '重复上传',
    invalid_signature: '签名错误',
    unbound_device: '设备未绑定',
    validation_error: '格式错误',
    failed: '处理失败',
  };
  return map[value] || value;
}

function resultTagType(value: string) {
  if (value === 'success' || value === 'duplicate') return 'success';
  if (value === 'validation_error' || value === 'unbound_device') return 'warning';
  return 'danger';
}
</script>

<style scoped>
.log-summary-title {
  color: var(--guxin-green-deep);
  font-size: 16px;
  margin: 18px 0 10px;
}
</style>
