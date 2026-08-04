<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  createPrinter,
  exportPrinters,
  getPrinterTestPayload,
  listPrinters,
  type PrinterPayload,
  type PrinterQuery,
  type PrinterTestPayload,
} from '@/api/printers';
import type { Printer } from '@/types/api';

const loading = ref(false);
const exporting = ref(false);
const creating = ref(false);
const dialogVisible = ref(false);
const printers = ref<Printer[]>([]);
const total = ref(0);
const testPayload = ref<PrinterTestPayload | null>(null);

const query = reactive<PrinterQuery>({
  page: 1,
  page_size: 10,
  keyword: '',
  connection_type: '',
  status: '',
});

const form = reactive<PrinterPayload>({
  printer_name: '\u4f18\u535a\u8baf K329',
  printer_model: 'K329',
  manufacturer: '\u4f18\u535a\u8baf',
  connection_type: 'bluetooth',
  status: 'inactive',
  remark: '\u771f\u5b9e\u6253\u5370\u63a5\u5165\u524d\u767b\u8bb0\u8bbe\u5907\u4fe1\u606f',
});

const T = {
  connection: {
    mock: '\u6a21\u62df',
    bluetooth: '\u84dd\u7259',
    usb: 'USB',
    wifi: 'WiFi',
  },
  status: {
    inactive: '\u672a\u8fde\u63a5',
    available: '\u53ef\u7528',
    connected: '\u5df2\u8fde\u63a5',
    disabled: '\u505c\u7528',
  },
  unbound: '\u672a\u7ed1\u5b9a',
  loadError: '\u6253\u5370\u8bbe\u5907\u52a0\u8f7d\u5931\u8d25',
  nameMissing: '\u8bf7\u8f93\u5165\u6253\u5370\u673a\u540d\u79f0',
  modelMissing: '\u8bf7\u8f93\u5165\u6253\u5370\u673a\u578b\u53f7',
  createSuccess: '\u6253\u5370\u8bbe\u5907\u5df2\u521b\u5efa',
  createError: '\u6253\u5370\u8bbe\u5907\u521b\u5efa\u5931\u8d25',
  exportConfirm: '\u5c06\u6309\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u5bfc\u51fa\u6253\u5370\u8bbe\u5907 CSV \u6587\u4ef6\uff0c\u662f\u5426\u7ee7\u7eed\uff1f',
  exportTitle: '\u786e\u8ba4\u5bfc\u51fa',
  confirm: '\u786e\u8ba4',
  cancel: '\u53d6\u6d88',
  pageTitle: '\u6253\u5370\u8bbe\u5907',
  pageDesc: '\u7ba1\u7406 K329 \u7b49\u6807\u7b7e\u6253\u5370\u673a\uff0c\u4fbf\u4e8e\u540e\u7eed\u771f\u5b9e\u6253\u5370\u63a5\u5165\u3002',
  addPrinter: '\u65b0\u589e\u6253\u5370\u673a',
  alert: '\u5f53\u524d\u4e3a\u6253\u5370\u8bbe\u5907\u767b\u8bb0\u4e0e\u6d4b\u8bd5\u51c6\u5907\uff0c\u771f\u5b9e\u6253\u5370\u9700\u5728\u5c0f\u7a0b\u5e8f\u8fde\u63a5\u8bbe\u5907\u540e\u6267\u884c\u3002',
  keywordPlaceholder: '\u641c\u7d22\u6253\u5370\u673a\u540d\u79f0\u6216\u578b\u53f7',
  connectionPlaceholder: '\u8fde\u63a5\u65b9\u5f0f',
  statusPlaceholder: '\u72b6\u6001',
  search: '\u67e5\u8be2',
  export: '\u5bfc\u51fa',
  columns: {
    name: '\u6253\u5370\u673a\u540d\u79f0',
    model: '\u578b\u53f7',
    connection: '\u8fde\u63a5\u65b9\u5f0f',
    company: '\u7ed1\u5b9a\u4f01\u4e1a',
    status: '\u72b6\u6001',
    printCount: '\u6253\u5370\u6b21\u6570',
    lastConnected: '\u6700\u540e\u8fde\u63a5',
    remark: '\u5907\u6ce8',
  },
  testTitle: '\u6253\u5370\u6d4b\u8bd5',
  testDesc: '\u7528\u4e8e\u771f\u5b9e\u6253\u5370\u673a\u63a5\u5165\u524d\u7684\u6d4b\u8bd5\u51c6\u5907\u3002',
  ready: '\u5df2\u51c6\u5907',
  waiting: '\u5f85\u8054\u8c03',
  dialogTitle: '\u65b0\u589e\u6253\u5370\u673a',
  fields: {
    name: '\u6253\u5370\u673a\u540d\u79f0',
    model: '\u578b\u53f7',
    manufacturer: '\u5382\u5bb6',
    connection: '\u8fde\u63a5\u65b9\u5f0f',
    serial: '\u5e8f\u5217\u53f7',
    mac: 'MAC \u5730\u5740',
    remark: '\u5907\u6ce8',
  },
  optional: '\u53ef\u9009',
  macPlaceholder: '\u771f\u5b9e\u8054\u8c03\u65f6\u586b\u5199',
  submit: '\u4fdd\u5b58',
};

const requestQuery = computed(() => ({
  page: query.page,
  page_size: query.page_size,
  keyword: query.keyword || undefined,
  connection_type: query.connection_type || undefined,
  status: query.status || undefined,
}));

const exportQuery = computed(() => ({
  keyword: query.keyword || undefined,
  connection_type: query.connection_type || undefined,
  status: query.status || undefined,
}));

function connectionText(value?: string | null) {
  const map: Record<string, string> = {
    mock: T.connection.mock,
    bluetooth: T.connection.bluetooth,
    usb: 'USB',
    wifi: 'WiFi',
  };
  return value ? map[value] || value : '-';
}

function statusText(value?: string | null) {
  const map: Record<string, string> = {
    inactive: T.status.inactive,
    available: T.status.available,
    connected: T.status.connected,
    disabled: T.status.disabled,
  };
  return value ? map[value] || value : '-';
}

function statusType(value?: string | null) {
  if (value === 'connected') return 'success';
  if (value === 'available') return 'primary';
  if (value === 'disabled') return 'danger';
  return 'warning';
}

async function load() {
  loading.value = true;
  try {
    const result = await listPrinters(requestQuery.value);
    printers.value = result.items || [];
    total.value = result.total || 0;
  } catch (error: unknown) {
    ElMessage.error((error as { message?: string })?.message || T.loadError);
  } finally {
    loading.value = false;
  }
}

async function loadTestPayload() {
  testPayload.value = await getPrinterTestPayload();
}

async function submitCreate() {
  if (!form.printer_name.trim()) {
    ElMessage.warning(T.nameMissing);
    return;
  }
  if (!form.printer_model.trim()) {
    ElMessage.warning(T.modelMissing);
    return;
  }
  creating.value = true;
  try {
    await createPrinter({ ...form });
    ElMessage.success(T.createSuccess);
    dialogVisible.value = false;
    await load();
  } catch (error: unknown) {
    ElMessage.error((error as { message?: string })?.message || T.createError);
  } finally {
    creating.value = false;
  }
}

async function handleExport() {
  await ElMessageBox.confirm(T.exportConfirm, T.exportTitle, {
    confirmButtonText: T.confirm,
    cancelButtonText: T.cancel,
    type: 'info',
  });
  exporting.value = true;
  try {
    await exportPrinters(exportQuery.value);
  } finally {
    exporting.value = false;
  }
}

function search() {
  query.page = 1;
  load().catch(() => undefined);
}

onMounted(() => {
  load().catch(() => undefined);
  loadTestPayload().catch(() => undefined);
});
</script>

<template>
  <section class="page-section">
    <div class="page-header">
      <div>
        <h1>{{ T.pageTitle }}</h1>
        <p>{{ T.pageDesc }}</p>
      </div>
      <el-button type="primary" @click="dialogVisible = true">{{ T.addPrinter }}</el-button>
    </div>

    <el-alert
      class="page-alert"
      type="warning"
      :closable="false"
      :title="T.alert"
    />

    <div class="filter-card">
      <el-input v-model="query.keyword" clearable :placeholder="T.keywordPlaceholder" @keyup.enter="search" />
      <el-select v-model="query.connection_type" clearable :placeholder="T.connectionPlaceholder">
        <el-option :label="T.connection.bluetooth" value="bluetooth" />
        <el-option label="USB" value="usb" />
        <el-option label="WiFi" value="wifi" />
        <el-option :label="T.connection.mock" value="mock" />
      </el-select>
      <el-select v-model="query.status" clearable :placeholder="T.statusPlaceholder">
        <el-option :label="T.status.inactive" value="inactive" />
        <el-option :label="T.status.available" value="available" />
        <el-option :label="T.status.connected" value="connected" />
        <el-option :label="T.status.disabled" value="disabled" />
      </el-select>
      <el-button type="primary" @click="search">{{ T.search }}</el-button>
      <el-button :loading="exporting" @click="handleExport">{{ T.export }}</el-button>
    </div>

    <el-table v-loading="loading" :data="printers" border class="data-table">
      <el-table-column :label="T.columns.name" prop="printer_name" min-width="150" />
      <el-table-column :label="T.columns.model" prop="printer_model" width="110" />
      <el-table-column :label="T.columns.connection" width="100">
        <template #default="{ row }">{{ connectionText(row.connection_type) }}</template>
      </el-table-column>
      <el-table-column :label="T.columns.company" min-width="160">
        <template #default="{ row }">{{ row.company_name || T.unbound }}</template>
      </el-table-column>
      <el-table-column :label="T.columns.status" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="T.columns.printCount" prop="print_log_count" width="100" />
      <el-table-column :label="T.columns.lastConnected" min-width="160">
        <template #default="{ row }">{{ row.last_connected_at || '-' }}</template>
      </el-table-column>
      <el-table-column :label="T.columns.remark" prop="remark" min-width="180" show-overflow-tooltip />
    </el-table>

    <div class="pager-row">
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.page_size"
        background
        layout="total, sizes, prev, pager, next"
        :page-sizes="[10, 20, 50]"
        :total="total"
        @current-change="load"
        @size-change="search"
      />
    </div>

    <div class="page-header sub-header">
      <div>
        <h2>{{ T.testTitle }}</h2>
        <p>{{ T.testDesc }}</p>
      </div>
    </div>

    <div v-if="testPayload" class="test-grid">
      <div v-for="item in testPayload.tests" :key="item.name" class="test-card">
        <strong>{{ item.name }}</strong>
        <el-tag :type="item.status === 'ready' ? 'success' : 'warning'">
          {{ item.status === 'ready' ? T.ready : T.waiting }}
        </el-tag>
        <p>{{ item.remark }}</p>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="T.dialogTitle" width="560px">
      <el-form label-width="110px">
        <el-form-item :label="T.fields.name">
          <el-input v-model.trim="form.printer_name" />
        </el-form-item>
        <el-form-item :label="T.fields.model">
          <el-input v-model.trim="form.printer_model" />
        </el-form-item>
        <el-form-item :label="T.fields.manufacturer">
          <el-input v-model.trim="form.manufacturer" />
        </el-form-item>
        <el-form-item :label="T.fields.connection">
          <el-select v-model="form.connection_type">
            <el-option :label="T.connection.bluetooth" value="bluetooth" />
            <el-option label="USB" value="usb" />
            <el-option label="WiFi" value="wifi" />
            <el-option :label="T.connection.mock" value="mock" />
          </el-select>
        </el-form-item>
        <el-form-item :label="T.fields.serial">
          <el-input v-model.trim="form.serial_no" :placeholder="T.optional" />
        </el-form-item>
        <el-form-item :label="T.fields.mac">
          <el-input v-model.trim="form.mac_address" :placeholder="T.macPlaceholder" />
        </el-form-item>
        <el-form-item :label="T.fields.remark">
          <el-input v-model.trim="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ T.cancel }}</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">{{ T.submit }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.page-alert { margin-bottom: 16px; }
.sub-header { margin-top: 24px; }
.test-grid { display: grid; gap: 16px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.test-card { background: #fff; border: 1px solid #e1ece6; border-radius: 12px; box-shadow: 0 10px 24px rgba(17, 93, 65, 0.06); padding: 18px; }
.test-card strong { display: block; font-size: 16px; margin-bottom: 10px; }
.test-card p { color: #5f6f66; line-height: 1.6; margin: 12px 0 0; }
@media (max-width: 900px) { .test-grid { grid-template-columns: 1fr; } }
</style>
