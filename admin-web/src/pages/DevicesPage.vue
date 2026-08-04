<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import {
  bindDevice,
  createDevice,
  disableDevice,
  enableDevice,
  exportDevices,
  listDevices,
  unbindDevice,
  updateDevice,
  type DevicePayload,
  type DeviceQuery,
} from '@/api/devices';
import { listCompanies } from '@/api/companies';
import { listManufacturerInterfaces } from '@/api/manufacturerInterfaces';
import type { Company, Device, ManufacturerInterface } from '@/types/api';
import { formatDateTime } from '@/utils/time';

const T = {
  pageTitle: '\u8bbe\u5907\u7ba1\u7406',
  pageDesc: '',
  addDevice: '\u65b0\u589e\u8bbe\u5907',
  info: '\u8bbe\u5907\u7f16\u53f7\u7528\u4e8e\u5224\u65ad\u68c0\u6d4b\u6570\u636e\u5f52\u5c5e\u3002\u672a\u7ed1\u5b9a\u4f01\u4e1a\u7684\u8bbe\u5907\u4e0d\u4f1a\u8fdb\u5165\u5ba2\u6237\u68c0\u6d4b\u8bb0\u5f55\u3002',
  manufacturerCode: '\u5382\u5bb6\u7f16\u7801',
  manufacturerCodePlaceholder: '\u8f93\u5165\u5382\u5bb6\u7f16\u7801',
  bindCompany: '\u7ed1\u5b9a\u4f01\u4e1a',
  allCompanies: '\u5168\u90e8\u4f01\u4e1a',
  status: '\u72b6\u6001',
  allStatus: '\u5168\u90e8\u72b6\u6001',
  normal: '\u6b63\u5e38',
  disabled: '\u505c\u7528',
  bindStatus: '\u7ed1\u5b9a\u72b6\u6001',
  all: '\u5168\u90e8',
  bound: '\u5df2\u7ed1\u5b9a',
  unbound: '\u672a\u7ed1\u5b9a',
  search: '\u67e5\u8be2',
  reset: '\u91cd\u7f6e',
  export: '\u5bfc\u51fa',
  device: '\u8bbe\u5907',
  unnamedDevice: '\u672a\u547d\u540d\u8bbe\u5907',
  manufacturer: '\u5382\u5bb6',
  model: '\u578b\u53f7',
  lastUpload: '\u6700\u8fd1\u4e0a\u4f20',
  remark: '\u5907\u6ce8',
  operation: '\u64cd\u4f5c',
  more: '\u66f4\u591a',
  viewDetail: '\u67e5\u770b\u8be6\u60c5',
  editDevice: '\u7f16\u8f91\u8bbe\u5907',
  rebindCompany: '\u6362\u7ed1\u4f01\u4e1a',
  bindCompanyAction: '\u7ed1\u5b9a\u4f01\u4e1a',
  unbindDevice: '\u89e3\u7ed1\u8bbe\u5907',
  disableDevice: '\u505c\u7528\u8bbe\u5907',
  enableDevice: '\u542f\u7528\u8bbe\u5907',
  totalPrefix: '\u5171',
  totalSuffix: '\u6761',
  createTitle: '\u65b0\u589e\u8bbe\u5907',
  editTitle: '\u7f16\u8f91\u8bbe\u5907',
  manufacturerInterface: '\u5382\u5bb6\u63a5\u53e3',
  chooseManufacturer: '\u8bf7\u9009\u62e9\u5382\u5bb6\u63a5\u53e3',
  manufacturerTip: '',
  deviceName: '\u8bbe\u5907\u540d\u79f0',
  deviceNamePlaceholder: '\u4f8b\u5982\uff1a\u4e00\u53f7\u5feb\u68c0\u4eea',
  deviceSn: '\u8bbe\u5907\u7f16\u53f7',
  deviceSnPlaceholder: '\u8bf7\u8f93\u5165\u8bbe\u5907\u552f\u4e00\u7f16\u53f7',
  deviceModel: '\u8bbe\u5907\u578b\u53f7',
  optional: '\u9009\u586b',
  cancel: '\u53d6\u6d88',
  save: '\u4fdd\u5b58',
  bindTitle: '\u8bbe\u5907\u6362\u7ed1',
  currentCompany: '\u5f53\u524d\u4f01\u4e1a',
  targetCompany: '\u76ee\u6807\u4f01\u4e1a',
  chooseNewCompany: '\u8bf7\u9009\u62e9\u65b0\u4f01\u4e1a',
  bindWarning: '\u786e\u8ba4\u540e\uff0c\u8bbe\u5907\u540e\u7eed\u4e0a\u4f20\u7684\u68c0\u6d4b\u6570\u636e\u5c06\u5f52\u5c5e\u5230\u65b0\u4f01\u4e1a\u3002',
  confirmRebind: '\u786e\u8ba4\u6362\u7ed1',
  detailTitle: '\u8bbe\u5907\u8be6\u60c5',
  notSelected: '\u672a\u9009\u62e9',
  dash: '-',
  loadFailed: '\u8bbe\u5907\u5217\u8868\u52a0\u8f7d\u5931\u8d25',
  needManufacturerTitle: '\u9700\u8981\u5382\u5bb6\u63a5\u53e3',
  needManufacturer: '\u65b0\u589e\u8bbe\u5907\u524d\u9700\u8981\u5148\u914d\u7f6e\u4e00\u4e2a\u5df2\u542f\u7528\u7684\u5382\u5bb6\u63a5\u53e3\u3002\u73b0\u5728\u53bb\u5382\u5bb6\u63a5\u53e3\u9875\u9762\u65b0\u589e\u6216\u542f\u7528\u5417\uff1f',
  goManufacturer: '\u53bb\u5382\u5bb6\u63a5\u53e3',
  created: '\u8bbe\u5907\u5df2\u65b0\u589e',
  saved: '\u8bbe\u5907\u5df2\u4fdd\u5b58',
  duplicateSn: '\u8bbe\u5907\u7f16\u53f7\u5df2\u5b58\u5728',
  saveFailed: '\u4fdd\u5b58\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u5fc5\u586b\u9879',
  rebindFailed: '\u6362\u7ed1\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5',
  bindUpdated: '\u8bbe\u5907\u7ed1\u5b9a\u5df2\u66f4\u65b0',
  unbindTitle: '\u786e\u8ba4\u89e3\u7ed1',
  unbindConfirm: '\u786e\u8ba4\u89e3\u7ed1',
  unboundDone: '\u8bbe\u5907\u5df2\u89e3\u7ed1',
  stopTitle: '\u505c\u7528\u8bbe\u5907',
  stopConfirm: '\u505c\u7528',
  stopped: '\u8bbe\u5907\u5df2\u505c\u7528',
  enabled: '\u8bbe\u5907\u5df2\u542f\u7528',
  exportConfirm: '\u5c06\u6309\u5f53\u524d\u7b5b\u9009\u6761\u4ef6\u5bfc\u51fa\u8bbe\u5907\u6570\u636e\uff0c\u6587\u4ef6\u683c\u5f0f\u4e3a CSV\u3002\u786e\u8ba4\u5bfc\u51fa\uff1f',
  confirmExport: '\u786e\u8ba4\u5bfc\u51fa',
};

const MAX_OPTION_PAGE_SIZE = 100;
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const exporting = ref(false);
const items = ref<Device[]>([]);
const total = ref(0);
const companies = ref<Company[]>([]);
const manufacturers = ref<ManufacturerInterface[]>([]);

const query = reactive<DeviceQuery>({ page: 1, page_size: 10, manufacturer_code: '', company_id: '', status: '', bind_status: '' });
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const currentDevice = ref<Device | null>(null);
const form = reactive<DevicePayload>({ manufacturer_code: '', device_sn: '', device_name: '', model: '', remark: '', status: 'normal' });
const bindVisible = ref(false);
const bindFormRef = ref<FormInstance>();
const bindForm = reactive({ company_id: '' });
const detailVisible = ref(false);

const rules: FormRules = {
  manufacturer_code: [{ required: true, message: T.chooseManufacturer, trigger: 'change' }],
  device_sn: [{ required: true, message: T.deviceSnPlaceholder, trigger: 'blur' }],
  device_name: [{ required: true, message: T.deviceNamePlaceholder, trigger: 'blur' }],
};
const bindRules: FormRules = { company_id: [{ required: true, message: T.chooseNewCompany, trigger: 'change' }] };
const currentCompanyName = computed(() => currentDevice.value?.company?.name || T.unbound);
const targetCompanyName = computed(() => companies.value.find((item) => item.id === bindForm.company_id)?.name || T.notSelected);

async function loadOptions() {
  const [companyResult, manufacturerResult] = await Promise.all([
    listCompanies({ page: 1, page_size: MAX_OPTION_PAGE_SIZE }),
    listManufacturerInterfaces({ page: 1, page_size: MAX_OPTION_PAGE_SIZE, status: 'normal' }),
  ]);
  companies.value = companyResult.items || [];
  manufacturers.value = manufacturerResult.items || [];
}

async function loadItems() {
  loading.value = true;
  try {
    const result = await listDevices({ ...query });
    items.value = result.items || [];
    total.value = result.total || 0;
  } catch (error: unknown) {
    ElMessage.error((error as { message?: string })?.message || T.loadFailed);
  } finally {
    loading.value = false;
  }
}
function search() { query.page = 1; loadItems(); }
function resetSearch() { query.page = 1; query.manufacturer_code = ''; query.company_id = ''; query.status = ''; query.bind_status = ''; loadItems(); }
function resetForm() { currentDevice.value = null; form.manufacturer_code = manufacturers.value[0]?.manufacturer_code || ''; form.device_sn = ''; form.device_name = ''; form.model = ''; form.remark = ''; form.status = 'normal'; }

async function openCreateDialog() {
  if (!manufacturers.value.length) {
    try {
      await ElMessageBox.confirm(T.needManufacturer, T.needManufacturerTitle, { confirmButtonText: T.goManufacturer, cancelButtonText: T.cancel, type: 'warning' });
      router.push('/manufacturer-interfaces');
    } catch {}
    return;
  }
  formMode.value = 'create'; resetForm(); formVisible.value = true;
}
function openEditDialog(row: Device) { formMode.value = 'edit'; currentDevice.value = row; form.manufacturer_code = row.manufacturer_code; form.device_sn = row.device_sn; form.device_name = row.device_name || ''; form.model = row.model || ''; form.remark = row.remark || ''; form.status = row.status; formVisible.value = true; }
async function saveItem() {
  await formRef.value?.validate(); saving.value = true;
  try {
    if (formMode.value === 'create') { await createDevice({ ...form }); ElMessage.success(T.created); }
    else if (currentDevice.value) { await updateDevice(currentDevice.value.id, { ...form }); ElMessage.success(T.saved); }
    formVisible.value = false; await loadItems();
  } catch (error: unknown) {
    const message = (error as { message?: string })?.message || '';
    if (message.includes('exist') || message.includes('unique') || message.includes('\u5df2\u5b58\u5728')) { ElMessage.error(T.duplicateSn); return; }
    ElMessage.error(message || T.saveFailed);
  } finally { saving.value = false; }
}
function openBindDialog(row: Device) { currentDevice.value = row; bindForm.company_id = row.company_id || ''; bindVisible.value = true; }
async function submitBind() {
  await bindFormRef.value?.validate(); if (!currentDevice.value) return;
  await ElMessageBox.confirm(`\u786e\u8ba4\u5c06\u8bbe\u5907 ${currentDevice.value.device_sn} \u4ece\u300c${currentCompanyName.value}\u300d\u6362\u7ed1\u5230\u300c${targetCompanyName.value}\u300d\uff1f\u786e\u8ba4\u540e\uff0c\u8bbe\u5907\u540e\u7eed\u4e0a\u4f20\u7684\u68c0\u6d4b\u6570\u636e\u5c06\u5f52\u5c5e\u65b0\u4f01\u4e1a\u3002`, T.confirmRebind, { confirmButtonText: T.confirmRebind, cancelButtonText: T.cancel, type: 'warning' });
  saving.value = true;
  try { await bindDevice(currentDevice.value.id, bindForm.company_id); ElMessage.success(T.bindUpdated); bindVisible.value = false; await loadItems(); }
  catch (error: unknown) { ElMessage.error((error as { message?: string })?.message || T.rebindFailed); }
  finally { saving.value = false; }
}
async function confirmUnbind(row: Device) {
  await ElMessageBox.confirm(`\u786e\u8ba4\u89e3\u7ed1\u8bbe\u5907 ${row.device_sn}\uff1f\u89e3\u7ed1\u540e\uff0c\u8be5\u8bbe\u5907\u540e\u7eed\u4e0a\u4f20\u6570\u636e\u4e0d\u4f1a\u5f52\u5c5e\u5230\u5f53\u524d\u4f01\u4e1a\u3002`, T.unbindTitle, { confirmButtonText: T.unbindConfirm, cancelButtonText: T.cancel, type: 'warning' });
  await unbindDevice(row.id); ElMessage.success(T.unboundDone); await loadItems();
}
async function changeStatus(row: Device) {
  if (row.status === 'normal') {
    await ElMessageBox.confirm(`\u786e\u8ba4\u505c\u7528\u8bbe\u5907 ${row.device_sn}\uff1f`, T.stopTitle, { confirmButtonText: T.stopConfirm, cancelButtonText: T.cancel, type: 'warning' });
    await disableDevice(row.id); ElMessage.success(T.stopped);
  } else { await enableDevice(row.id); ElMessage.success(T.enabled); }
  await loadItems();
}
function openDetail(row: Device) { currentDevice.value = row; detailVisible.value = true; }
async function handleExport() {
  await ElMessageBox.confirm(T.exportConfirm, T.confirmExport, { confirmButtonText: T.export, cancelButtonText: T.cancel, type: 'info' });
  exporting.value = true;
  try { await exportDevices({ manufacturer_code: query.manufacturer_code, company_id: query.company_id, status: query.status, bind_status: query.bind_status }); }
  finally { exporting.value = false; }
}
onMounted(async () => { await loadOptions(); await loadItems(); });
</script>

<template>
  <section class="page-shell">
    <div class="page-heading"><div><h1>{{ T.pageTitle }}</h1></div><el-button type="primary" @click="openCreateDialog">{{ T.addDevice }}</el-button></div>
    <el-card shadow="never" class="panel-card">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item :label="T.manufacturerCode"><el-input v-model.trim="query.manufacturer_code" clearable :placeholder="T.manufacturerCodePlaceholder" @keyup.enter="search" /></el-form-item>
        <el-form-item :label="T.bindCompany"><el-select v-model="query.company_id" clearable filterable :placeholder="T.allCompanies"><el-option v-for="company in companies" :key="company.id" :label="company.name" :value="company.id" /></el-select></el-form-item>
        <el-form-item :label="T.status"><el-select v-model="query.status" clearable :placeholder="T.allStatus"><el-option :label="T.normal" value="normal" /><el-option :label="T.disabled" value="disabled" /></el-select></el-form-item>
        <el-form-item :label="T.bindStatus"><el-select v-model="query.bind_status" clearable :placeholder="T.all"><el-option :label="T.bound" value="bound" /><el-option :label="T.unbound" value="unbound" /></el-select></el-form-item>
        <el-form-item class="filter-actions"><el-button type="primary" @click="search">{{ T.search }}</el-button><el-button @click="resetSearch">{{ T.reset }}</el-button><el-button :loading="exporting" @click="handleExport">{{ T.export }}</el-button></el-form-item>
      </el-form>
      <el-table v-loading="loading" :data="items" class="data-table" row-key="id">
        <el-table-column :label="T.device" min-width="220"><template #default="{ row }: { row: Device }"><div class="main-cell"><strong>{{ row.device_name || T.unnamedDevice }}</strong><span>{{ row.device_sn }}</span></div></template></el-table-column>
        <el-table-column :label="T.manufacturer" min-width="190"><template #default="{ row }: { row: Device }"><div class="main-cell"><strong>{{ row.manufacturer?.manufacturer_name || T.dash }}</strong><span>{{ row.manufacturer_code }}</span></div></template></el-table-column>
        <el-table-column :label="T.model" min-width="120"><template #default="{ row }: { row: Device }">{{ row.model || T.dash }}</template></el-table-column>
        <el-table-column :label="T.bindCompany" min-width="180"><template #default="{ row }: { row: Device }"><el-tag v-if="!row.company" type="warning">{{ T.unbound }}</el-tag><span v-else>{{ row.company.name }}</span></template></el-table-column>
        <el-table-column :label="T.status" width="96"><template #default="{ row }: { row: Device }"><el-tag :type="row.status === 'normal' ? 'success' : 'info'">{{ row.status === 'normal' ? T.normal : T.disabled }}</el-tag></template></el-table-column>
        <el-table-column :label="T.lastUpload" min-width="150"><template #default="{ row }: { row: Device }">{{ formatDateTime(row.last_upload_at) }}</template></el-table-column>
        <el-table-column :label="T.remark" min-width="160" show-overflow-tooltip><template #default="{ row }: { row: Device }">{{ row.remark || T.dash }}</template></el-table-column>
        <el-table-column :label="T.operation" width="122" fixed="right"><template #default="{ row }: { row: Device }"><el-dropdown trigger="click"><el-button type="primary" text>{{ T.more }}</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item @click="openDetail(row)">{{ T.viewDetail }}</el-dropdown-item><el-dropdown-item @click="openEditDialog(row)">{{ T.editDevice }}</el-dropdown-item><el-dropdown-item @click="openBindDialog(row)">{{ row.company ? T.rebindCompany : T.bindCompanyAction }}</el-dropdown-item><el-dropdown-item v-if="row.company" @click="confirmUnbind(row)">{{ T.unbindDevice }}</el-dropdown-item><el-dropdown-item @click="changeStatus(row)">{{ row.status === 'normal' ? T.disableDevice : T.enableDevice }}</el-dropdown-item></el-dropdown-menu></template></el-dropdown></template></el-table-column>
      </el-table>
      <div class="table-footer"><span>{{ T.totalPrefix }} {{ total }} {{ T.totalSuffix }}</span><el-pagination v-model:current-page="query.page" v-model:page-size="query.page_size" layout="sizes, prev, pager, next, jumper" :page-sizes="[10, 20, 50]" :total="total" @current-change="loadItems" @size-change="search" /></div>
    </el-card>
    <el-dialog v-model="formVisible" :title="formMode === 'create' ? T.createTitle : T.editTitle" width="620px" destroy-on-close><el-form ref="formRef" :model="form" :rules="rules" label-width="110px"><el-form-item :label="T.manufacturerInterface" prop="manufacturer_code"><el-select v-model="form.manufacturer_code" filterable :placeholder="T.chooseManufacturer" style="width: 100%"><el-option v-for="item in manufacturers" :key="item.manufacturer_code" :label="item.manufacturer_name" :value="item.manufacturer_code" /></el-select></el-form-item><el-form-item :label="T.deviceName" prop="device_name"><el-input v-model.trim="form.device_name" :placeholder="T.deviceNamePlaceholder" /></el-form-item><el-form-item :label="T.deviceSn" prop="device_sn"><el-input v-model.trim="form.device_sn" :placeholder="T.deviceSnPlaceholder" /></el-form-item><el-form-item :label="T.deviceModel"><el-input v-model.trim="form.model" :placeholder="T.optional" /></el-form-item><el-form-item :label="T.remark"><el-input v-model.trim="form.remark" type="textarea" :rows="3" :placeholder="T.optional" /></el-form-item></el-form><template #footer><el-button @click="formVisible = false">{{ T.cancel }}</el-button><el-button type="primary" :loading="saving" @click="saveItem">{{ T.save }}</el-button></template></el-dialog>
    <el-dialog v-model="bindVisible" :title="T.bindTitle" width="620px"><div v-if="currentDevice" class="bind-summary"><div><span>{{ T.deviceSn }}</span><strong>{{ currentDevice.device_sn }}</strong></div><div><span>{{ T.manufacturer }}</span><strong>{{ currentDevice.manufacturer?.manufacturer_name || currentDevice.manufacturer_code }}</strong></div><div><span>{{ T.currentCompany }}</span><strong>{{ currentCompanyName }}</strong></div></div><el-form ref="bindFormRef" :model="bindForm" :rules="bindRules" label-width="110px"><el-form-item :label="T.targetCompany" prop="company_id"><el-select v-model="bindForm.company_id" filterable :placeholder="T.chooseNewCompany" style="width: 100%"><el-option v-for="company in companies" :key="company.id" :label="company.name" :value="company.id" /></el-select></el-form-item></el-form><el-alert :title="T.bindWarning" type="warning" :closable="false" show-icon /><template #footer><el-button @click="bindVisible = false">{{ T.cancel }}</el-button><el-button type="primary" :loading="saving" @click="submitBind">{{ T.confirmRebind }}</el-button></template></el-dialog>
    <el-dialog v-model="detailVisible" :title="T.detailTitle" width="620px"><el-descriptions v-if="currentDevice" :column="1" border><el-descriptions-item :label="T.deviceName">{{ currentDevice.device_name || T.dash }}</el-descriptions-item><el-descriptions-item :label="T.deviceSn">{{ currentDevice.device_sn }}</el-descriptions-item><el-descriptions-item :label="T.manufacturer">{{ currentDevice.manufacturer?.manufacturer_name || T.dash }}</el-descriptions-item><el-descriptions-item :label="T.manufacturerCode">{{ currentDevice.manufacturer_code }}</el-descriptions-item><el-descriptions-item :label="T.model">{{ currentDevice.model || T.dash }}</el-descriptions-item><el-descriptions-item :label="T.bindCompany">{{ currentDevice.company?.name || T.unbound }}</el-descriptions-item><el-descriptions-item :label="T.status">{{ currentDevice.status === 'normal' ? T.normal : T.disabled }}</el-descriptions-item><el-descriptions-item :label="T.lastUpload">{{ formatDateTime(currentDevice.last_upload_at) }}</el-descriptions-item><el-descriptions-item :label="T.remark">{{ currentDevice.remark || T.dash }}</el-descriptions-item></el-descriptions></el-dialog>
  </section>
</template>

<style scoped>
.page-shell { display: grid; gap: 16px; }
.page-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; }
.page-heading h1 { margin: 0 0 8px; font-size: 26px; }
.panel-card { border-radius: 14px; border: 1px solid #e5eee9; }
.filter-form { align-items: center; display: flex; flex-wrap: wrap; gap: 10px 12px; }
.filter-form :deep(.el-input), .filter-form :deep(.el-select) { width: 210px; }
.filter-actions { margin-left: auto; }
.data-table { margin-top: 10px; }
.main-cell { display: grid; gap: 4px; }
.main-cell strong { color: #1c3f31; }
.main-cell span { color: #708076; font-size: 12px; }
.table-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 16px; }
.field-tip { margin-top: 6px; color: #7a8b82; font-size: 12px; }
.bind-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
.bind-summary div { padding: 12px; border-radius: 12px; background: #f5faf7; }
.bind-summary span { display: block; margin-bottom: 6px; color: #708076; font-size: 12px; }
.bind-summary strong { word-break: break-word; }
@media (max-width: 900px) { .page-heading, .table-footer { flex-direction: column; align-items: stretch; } .filter-actions { margin-left: 0; } .bind-summary { grid-template-columns: 1fr; } }
</style>
