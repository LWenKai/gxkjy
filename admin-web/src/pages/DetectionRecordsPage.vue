<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>检测记录</h1>
        <p>查看客户检测数据，处理异常、隐藏、作废和恢复操作。</p>
      </div>
    </div>

    <el-alert
      title="不合格、异常、隐藏或作废的检测记录不能用于开具合格证。所有状态调整都会写入操作日志。"
      type="info"
      show-icon
      :closable="false"
      class="detail-alert"
    />

    <div class="panel search-panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="企业">
          <el-select v-model="query.company_id" clearable filterable placeholder="全部企业" style="width: 220px" @change="onCompanyChange">
            <el-option v-for="company in companyOptions" :key="company.id" :label="company.name" :value="company.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备">
          <el-select v-model="query.device_id" clearable filterable placeholder="全部设备" style="width: 220px">
            <el-option v-for="device in deviceOptions" :key="device.id" :label="deviceLabel(device)" :value="device.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="检测结果">
          <el-select v-model="query.overall_result" clearable placeholder="全部" style="width: 120px">
            <el-option label="合格" value="qualified" />
            <el-option label="不合格" value="unqualified" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 130px">
            <el-option label="正常" value="normal" />
            <el-option label="已隐藏" value="hidden" />
            <el-option label="已作废" value="voided" />
            <el-option label="异常" value="marked_abnormal" />
          </el-select>
        </el-form-item>
        <el-form-item label="检测日期">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button :loading="exporting" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="panel">
      <el-table v-loading="loading" :data="items" border class="data-table" empty-text="暂无检测记录">
        <el-table-column prop="record_no" label="记录编号" min-width="170" show-overflow-tooltip />
        <el-table-column prop="company_name" label="企业名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }: { row: DetectionRecord }">{{ row.company_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="product_name" label="产品名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="sample_name" label="样品名称" min-width="130" show-overflow-tooltip>
          <template #default="{ row }: { row: DetectionRecord }">{{ row.sample_name || '-' }}</template>
        </el-table-column>
        <el-table-column label="结果" width="90">
          <template #default="{ row }: { row: DetectionRecord }">
            <el-tag :type="row.overall_result === 'qualified' ? 'success' : 'danger'">{{ resultLabel(row.overall_result) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }: { row: DetectionRecord }">
            <el-tag :type="recordStatusType(row.status)">{{ recordStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开证状态" min-width="150">
          <template #default="{ row }: { row: DetectionRecord }">
            <el-tag :type="canIssueCertificate(row) ? 'success' : 'warning'">
              {{ certificateAvailabilityReason(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检测时间" min-width="155">
          <template #default="{ row }: { row: DetectionRecord }">{{ formatDateTime(row.test_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }: { row: DetectionRecord }">
            <el-space :size="6">
              <el-button size="small" text type="primary" @click="openDetail(row)">查看</el-button>
              <el-dropdown trigger="click">
                <el-button size="small" text>更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="row.status !== 'marked_abnormal'" @click="confirmAction(row, 'mark-abnormal')">标记异常</el-dropdown-item>
                    <el-dropdown-item v-else @click="confirmAction(row, 'cancel-abnormal')">取消异常</el-dropdown-item>
                    <el-dropdown-item v-if="row.status !== 'hidden'" @click="confirmAction(row, 'hide')">隐藏</el-dropdown-item>
                    <el-dropdown-item v-else @click="confirmAction(row, 'restore')">恢复显示</el-dropdown-item>
                    <el-dropdown-item v-if="row.status !== 'voided'" divided @click="confirmAction(row, 'void')">确认作废</el-dropdown-item>
                    <el-dropdown-item v-else divided @click="confirmAction(row, 'restore')">管理员恢复</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <span>共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          layout="sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50]"
          :total="total"
          @current-change="loadItems"
          @size-change="search"
        />
      </div>
    </div>

    <el-drawer v-model="detailVisible" title="检测记录详情" size="720px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-alert
            :title="certificateAvailabilityReason(detail)"
            :type="canIssueCertificate(detail) ? 'success' : 'warning'"
            show-icon
            :closable="false"
            class="detail-alert"
          />
          <div class="detail-actions">
            <el-button type="primary" @click="router.push(`/detection-records/${detail.id}/report`)">生成检测报告</el-button>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="记录编号">{{ detail.record_no }}</el-descriptions-item>
            <el-descriptions-item label="企业名称">{{ detail.company_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ detail.product_name }}</el-descriptions-item>
            <el-descriptions-item label="样品名称">{{ detail.sample_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="检测结果">
              <el-tag :type="detail.overall_result === 'qualified' ? 'success' : 'danger'">{{ resultLabel(detail.overall_result) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="recordStatusType(detail.status)">{{ recordStatusLabel(detail.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="检测时间">{{ formatDateTime(detail.test_time) }}</el-descriptions-item>
            <el-descriptions-item label="上传时间">{{ formatDateTime(detail.upload_time) }}</el-descriptions-item>
            <el-descriptions-item label="设备" :span="2">{{ detail.device_name || '未命名设备' }}</el-descriptions-item>
          </el-descriptions>

          <div class="detail-block">
            <h3>检测项目明细</h3>
            <el-table :data="detail.items || []" border class="data-table" empty-text="暂无项目明细">
              <el-table-column prop="test_item" label="检测项目" min-width="150" />
              <el-table-column prop="test_method" label="方法" min-width="150">
                <template #default="{ row }: { row: DetectionRecordItem }">{{ row.test_method || '-' }}</template>
              </el-table-column>
              <el-table-column prop="test_value" label="检测值" min-width="110" />
              <el-table-column prop="unit" label="单位" width="80">
                <template #default="{ row }: { row: DetectionRecordItem }">{{ row.unit || '-' }}</template>
              </el-table-column>
              <el-table-column prop="standard_limit" label="限量值" min-width="120">
                <template #default="{ row }: { row: DetectionRecordItem }">{{ row.standard_limit || '-' }}</template>
              </el-table-column>
              <el-table-column label="判定" width="90">
                <template #default="{ row }: { row: DetectionRecordItem }">
                  <el-tag :type="row.result === 'qualified' ? 'success' : 'danger'">{{ resultLabel(row.result) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </div>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listCompanies } from '@/api/companies';
import { listDevices } from '@/api/devices';
import {
  cancelDetectionRecordAbnormal,
  exportDetectionRecords,
  getDetectionRecord,
  hideDetectionRecord,
  listDetectionRecords,
  markDetectionRecordAbnormal,
  restoreDetectionRecord,
  voidDetectionRecord,
} from '@/api/detectionRecords';
import type {
  Company,
  DetectionRecord,
  DetectionRecordItem,
  DetectionRecordStatusValue,
  DetectionResultValue,
  Device,
} from '@/types/api';
import { formatDateTime, toIsoString } from '@/utils/time';

type RecordAction = 'mark-abnormal' | 'cancel-abnormal' | 'hide' | 'void' | 'restore';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const detailLoading = ref(false);
const exporting = ref(false);
const detailVisible = ref(false);
const total = ref(0);
const items = ref<DetectionRecord[]>([]);
const detail = ref<DetectionRecord | null>(null);
const companyOptions = ref<Company[]>([]);
const deviceOptions = ref<Device[]>([]);
const dateRange = ref<[Date, Date] | null>(null);
const attention = route.query.attention === 'abnormal' ? 'abnormal' : undefined;

const query = reactive({
  page: 1,
  page_size: 10,
  company_id: typeof route.query.company_id === 'string' ? route.query.company_id : '',
  device_id: '',
  overall_result: '' as DetectionResultValue | '',
  status: '' as DetectionRecordStatusValue | '',
});

onMounted(async () => {
  if (route.query.date === 'today') dateRange.value = getTodayRange();
  await Promise.all([loadOptions(), loadItems()]);
  if (typeof route.query.record_id === 'string') {
    await openDetail({ id: route.query.record_id } as DetectionRecord);
  }
});

async function loadOptions() {
  const [companies, devices] = await Promise.all([
    listCompanies({ page: 1, page_size: 100 }),
    listDevices({ page: 1, page_size: 100, company_id: query.company_id || undefined }),
  ]);
  companyOptions.value = companies.items;
  deviceOptions.value = devices.items;
}

async function loadItems() {
  loading.value = true;
  try {
    const data = await listDetectionRecords({
      page: query.page,
      page_size: query.page_size,
      company_id: query.company_id || undefined,
      device_id: query.device_id || undefined,
      overall_result: query.overall_result || undefined,
      status: query.status || undefined,
      attention,
      date_from: toIsoString(dateRange.value?.[0]),
      date_to: toIsoString(dateRange.value?.[1]),
    });
    items.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

async function onCompanyChange() {
  query.device_id = '';
  const devices = await listDevices({ page: 1, page_size: 100, company_id: query.company_id || undefined });
  deviceOptions.value = devices.items;
}

function search() {
  query.page = 1;
  loadItems();
}

function resetSearch() {
  query.company_id = '';
  query.device_id = '';
  query.overall_result = '';
  query.status = '';
  dateRange.value = null;
  onCompanyChange();
  search();
}

async function handleExport() {
  await ElMessageBox.confirm(
    `将按当前筛选条件导出 ${total.value} 条检测记录，文件格式为 CSV。是否继续？`,
    '导出确认',
    { confirmButtonText: '确认导出', cancelButtonText: '取消', type: 'info' },
  );
  exporting.value = true;
  try {
    await exportDetectionRecords({
      company_id: query.company_id || undefined,
      device_id: query.device_id || undefined,
      overall_result: query.overall_result || undefined,
      status: query.status || undefined,
      attention,
      date_from: toIsoString(dateRange.value?.[0]),
      date_to: toIsoString(dateRange.value?.[1]),
    });
    ElMessage.success('检测记录已导出');
  } finally {
    exporting.value = false;
  }
}

async function openDetail(row: DetectionRecord) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getDetectionRecord(row.id);
  } finally {
    detailLoading.value = false;
  }
}

async function confirmAction(row: DetectionRecord, action: RecordAction) {
  const actionText = actionLabel(action);
  const { value } = await ElMessageBox.prompt(
    `确认对检测记录“${row.record_no}”执行「${actionText}」吗？`,
    actionText,
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPlaceholder: '可填写原因，便于后续排查',
      inputType: 'textarea',
    },
  );

  const payload = { reason: value || undefined };
  if (action === 'mark-abnormal') await markDetectionRecordAbnormal(row.id, payload);
  if (action === 'cancel-abnormal') await cancelDetectionRecordAbnormal(row.id, payload);
  if (action === 'hide') await hideDetectionRecord(row.id, payload);
  if (action === 'void') await voidDetectionRecord(row.id, payload);
  if (action === 'restore') await restoreDetectionRecord(row.id, payload);

  ElMessage.success(`检测记录已${actionText}`);
  await loadItems();
  if (detail.value?.id === row.id) detail.value = await getDetectionRecord(row.id);
}

function actionLabel(action: RecordAction) {
  const map: Record<RecordAction, string> = {
    'mark-abnormal': '标记异常',
    'cancel-abnormal': '取消异常',
    hide: '隐藏',
    void: '作废',
    restore: '恢复正常',
  };
  return map[action];
}

function deviceLabel(device: Device) {
  return `${device.device_name || '未命名设备'}${device.model ? ` / ${device.model}` : ''}`;
}

function resultLabel(value: DetectionResultValue) {
  return value === 'qualified' ? '合格' : '不合格';
}

function recordStatusLabel(value: DetectionRecordStatusValue) {
  const map: Record<DetectionRecordStatusValue, string> = {
    normal: '正常',
    hidden: '已隐藏',
    voided: '已作废',
    marked_abnormal: '异常',
  };
  return map[value] || value;
}

function recordStatusType(value: DetectionRecordStatusValue) {
  if (value === 'normal') return 'success';
  if (value === 'voided') return 'danger';
  if (value === 'marked_abnormal') return 'warning';
  return 'info';
}

function canIssueCertificate(record: DetectionRecord) {
  return record.overall_result === 'qualified' && record.status === 'normal';
}

function certificateAvailabilityReason(record: DetectionRecord) {
  if (record.status === 'voided') return '已作废，不能开证';
  if (record.status === 'hidden') return '已隐藏，不能开证';
  if (record.status === 'marked_abnormal') return '异常记录，不能开证';
  if (record.overall_result === 'unqualified') return '不合格，不能开证';
  return '可开证';
}

function getTodayRange(): [Date, Date] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);
  return [start, end];
}
</script>
