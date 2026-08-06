<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>企业管理</h1>
        <p>用于企业开户、基础资料维护、启停和服务续期。</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">新增企业</el-button>
    </div>

    <el-alert
      v-if="isCustomerCreate"
      class="handoff-alert"
      type="success"
      show-icon
      :closable="false"
      title="已从客户管理带入基础信息。保存企业后，进入企业详情继续创建账号、绑定设备和维护公开资料。"
    />

    <div class="panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="企业名称">
          <el-input
            v-model.trim="query.name"
            clearable
            placeholder="请输入企业名称"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option label="正常" value="normal" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="服务到期">
          <el-select v-model="query.expire" clearable placeholder="全部" style="width: 150px">
            <el-option label="30天内到期" value="soon" />
            <el-option label="已过期" value="expired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button :loading="exporting" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="companies"
        border
        class="data-table"
      >
        <el-table-column prop="name" label="企业名称" min-width="190" />
        <el-table-column prop="contact_name" label="联系人" width="110" />
        <el-table-column prop="phone" label="电话" width="150" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }: { row: Company }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'info'">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="服务到期时间" min-width="170">
          <template #default="{ row }: { row: Company }">
            <span :class="expiryClass(row.service_expire_at)">
              {{ formatDate(row.service_expire_at) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="160">
          <template #default="{ row }: { row: Company }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }: { row: Company }">
            <el-button text type="primary" @click="goDetail(row)">查看</el-button>
            <el-button text type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              v-if="row.status === 'disabled'"
              text
              type="success"
              @click="changeCompanyStatus(row, 'enable')"
            >
              启用
            </el-button>
            <el-button
              v-else
              text
              type="warning"
              @click="changeCompanyStatus(row, 'disable')"
            >
              停用
            </el-button>
            <el-button text type="primary" @click="openRenewDialog(row)">续期</el-button>
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
          @current-change="loadCompanies"
          @size-change="search"
        />
      </div>
    </div>

    <el-dialog
      v-model="companyDialogVisible"
      :title="dialogMode === 'create' ? '新增企业' : '编辑企业'"
      width="680px"
      destroy-on-close
    >
      <el-form
        ref="companyFormRef"
        :model="companyForm"
        :rules="companyRules"
        label-width="130px"
      >
        <el-form-item label="企业名称" prop="name">
          <el-input v-model.trim="companyForm.name" placeholder="请输入企业名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact_name">
          <el-input v-model.trim="companyForm.contact_name" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model.trim="companyForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="省/市/区县" prop="district">
          <div class="address-grid">
            <el-select v-model="companyForm.province" placeholder="省" @change="onProvinceChange">
              <el-option
                v-for="province in provinceOptions"
                :key="province.value"
                :label="province.label"
                :value="province.value"
              />
            </el-select>
            <el-select v-model="companyForm.city" placeholder="市" @change="onCityChange">
              <el-option
                v-for="city in cityOptions"
                :key="city.value"
                :label="city.label"
                :value="city.value"
              />
            </el-select>
            <el-select v-model="companyForm.district" placeholder="区/县">
              <el-option
                v-for="district in districtOptions"
                :key="district.value"
                :label="district.label"
                :value="district.value"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model.trim="companyForm.detail_address" placeholder="街道、门牌号等，可手动填写" />
        </el-form-item>
        <el-form-item label="产地/基地地址">
          <el-input v-model.trim="companyForm.origin_address" placeholder="请输入产地或基地地址" />
        </el-form-item>
        <el-form-item label="默认合格证类型" prop="default_certificate_type">
          <el-select v-model="companyForm.default_certificate_type">
            <el-option
              label="承诺达标合格证"
              value="agri_commitment_certificate"
            />
            <el-option
              label="企业快检合格标签"
              value="enterprise_quick_test_label"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="服务开始时间">
          <el-date-picker
            v-model="companyForm.service_start_at"
            type="date"
            placeholder="选择服务开始时间"
          />
        </el-form-item>
        <el-form-item label="服务到期时间" prop="service_expire_at">
          <el-date-picker
            v-model="companyForm.service_expire_at"
            type="date"
            placeholder="选择服务到期时间"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="companyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveCompany">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renewDialogVisible" title="企业续期" width="460px">
      <p class="renew-current">
        当前到期时间：{{ formatDate(currentCompany?.service_expire_at) }}
      </p>
      <el-form ref="renewFormRef" :model="renewForm" :rules="renewRules" label-width="120px">
        <el-form-item label="新到期时间" prop="service_expire_at">
          <el-date-picker
            v-model="renewForm.service_expire_at"
            type="date"
            placeholder="选择新的服务到期时间"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitRenew">确认续期</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  createCompany,
  disableCompany,
  enableCompany,
  exportCompanies,
  listCompanies,
  renewCompany,
  updateCompany,
  type CompanyPayload,
} from '@/api/companies';
import type { Company } from '@/types/api';
import {
  buildFullAddress,
  provinceOptions,
  splitKnownAddress,
} from '@/utils/chinaRegions';
import {
  addYears,
  formatDate,
  formatDateTime,
  getChinaTodayDate,
  isExpired,
  isExpiringSoon,
  toIsoString,
} from '@/utils/time';

type CertificateType =
  | 'agri_commitment_certificate'
  | 'enterprise_quick_test_label';

interface CompanyForm {
  name: string;
  contact_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail_address: string;
  origin_address: string;
  default_certificate_type: CertificateType;
  service_start_at: Date | null;
  service_expire_at: Date | null;
}

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const exporting = ref(false);
const total = ref(0);
const companies = ref<Company[]>([]);
const companyDialogVisible = ref(false);
const renewDialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const editingCompanyId = ref('');
const currentCompany = ref<Company | null>(null);
const companyFormRef = ref<FormInstance>();
const renewFormRef = ref<FormInstance>();

const query = reactive({
  page: 1,
  page_size: 10,
  name: '',
  status:
    route.query.status === 'enabled'
      ? 'normal'
      : typeof route.query.status === 'string'
        ? route.query.status
        : '',
  expire:
    route.query.expire === 'soon' || route.query.expire === 'expired'
      ? route.query.expire
      : '',
});

const companyForm = reactive<CompanyForm>(emptyCompanyForm());
const renewForm = reactive<{ service_expire_at: Date | null }>({
  service_expire_at: null,
});

const companyRules: FormRules = {
  name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  contact_name: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' },
  ],
  district: [{ required: true, message: '请选择省市区县', trigger: 'change' }],
  default_certificate_type: [
    { required: true, message: '请选择默认合格证类型', trigger: 'change' },
  ],
  service_expire_at: [
    { required: true, message: '请选择服务到期时间', trigger: 'change' },
  ],
};

const renewRules: FormRules = {
  service_expire_at: [
    { required: true, message: '请选择新的服务到期时间', trigger: 'change' },
  ],
};

onMounted(async () => {
  await loadCompanies();
  applyCustomerCreateIntent();
});

const cityOptions = computed(
  () =>
    provinceOptions.find((province) => province.value === companyForm.province)
      ?.cities || [],
);

const districtOptions = computed(
  () =>
    cityOptions.value.find((city) => city.value === companyForm.city)
      ?.districts || [],
);

const isCustomerCreate = computed(
  () => route.query.action === 'create' && route.query.from === 'customer',
);

function emptyCompanyForm(): CompanyForm {
  const start = getChinaTodayDate();
  return {
    name: '',
    contact_name: '',
    phone: '',
    province: '山西省',
    city: '太原市',
    district: '小店区',
    detail_address: '',
    origin_address: '',
    default_certificate_type: 'agri_commitment_certificate',
    service_start_at: start,
    service_expire_at: addYears(start, 1),
  };
}

async function loadCompanies() {
  loading.value = true;
  try {
    const data = await listCompanies({
      page: query.page,
      page_size: query.page_size,
      name: query.name || undefined,
      status: query.status || undefined,
      expire: normalizeExpireFilter(query.expire),
    });
    companies.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.page = 1;
  loadCompanies();
}

function resetSearch() {
  query.name = '';
  query.status = '';
  query.expire = '';
  search();
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportCompanies({
      name: query.name || undefined,
      status: query.status || undefined,
      expire: normalizeExpireFilter(query.expire),
    });
    ElMessage.success('导出任务已开始');
  } finally {
    exporting.value = false;
  }
}

function openCreateDialog() {
  Object.assign(companyForm, emptyCompanyForm());
  editingCompanyId.value = '';
  dialogMode.value = 'create';
  companyDialogVisible.value = true;
}

function applyCustomerCreateIntent() {
  if (!isCustomerCreate.value) return;
  openCreateDialog();
  const addressText = queryText(route.query.address);
  const address = splitKnownAddress(addressText);
  Object.assign(companyForm, {
    name: queryText(route.query.name),
    contact_name: queryText(route.query.contact_name),
    phone: queryText(route.query.phone),
    province: address.province || '山西省',
    city: address.city || '太原市',
    district: address.district || '小店区',
    detail_address: address.detail || addressText,
    origin_address: addressText,
  });
}

function queryText(value: unknown) {
  if (Array.isArray(value)) return String(value[0] || '');
  return typeof value === 'string' ? value : '';
}

function openEditDialog(company: Company) {
  const address = splitKnownAddress(company.address);
  Object.assign(companyForm, {
    name: company.name,
    contact_name: company.contact_name,
    phone: company.phone,
    province: address.province || '山西省',
    city: address.city || '太原市',
    district: address.district || '小店区',
    detail_address: address.detail || '',
    origin_address: company.origin_address || '',
    default_certificate_type: company.default_certificate_type,
    service_start_at: company.service_start_at
      ? new Date(company.service_start_at)
      : null,
    service_expire_at: company.service_expire_at
      ? new Date(company.service_expire_at)
      : null,
  });
  editingCompanyId.value = company.id;
  dialogMode.value = 'edit';
  companyDialogVisible.value = true;
}

async function saveCompany() {
  await companyFormRef.value?.validate();
  const payload = toCompanyPayload();
  if (!payload) return;

  saving.value = true;
  try {
    if (dialogMode.value === 'create') {
      const created = await createCompany(payload);
      ElMessage.success('企业已新增');
      await showCreateNextStep(created);
    } else {
      await updateCompany(editingCompanyId.value, payload);
      ElMessage.success('企业已保存');
    }
    companyDialogVisible.value = false;
    await loadCompanies();
  } finally {
    saving.value = false;
  }
}

async function showCreateNextStep(company: Company) {
  try {
    await ElMessageBox.confirm(
      '企业已创建。建议下一步创建企业账号、绑定设备，再录入测试检测数据。',
      '下一步建议',
      {
        confirmButtonText: '进入企业详情',
        cancelButtonText: '留在列表',
        type: 'success',
      },
    );
    router.push(`/companies/${company.id}`);
  } catch {
    // 用户选择留在列表即可。
  }
}

function toCompanyPayload(): CompanyPayload | null {
  const expireAt = toIsoString(companyForm.service_expire_at);
  if (!expireAt) return null;
  const startAt = toIsoString(companyForm.service_start_at);
  const fullAddress = buildFullAddress(companyForm);

  return {
    name: companyForm.name,
    contact_name: companyForm.contact_name,
    phone: normalizePhone(companyForm.phone),
    address: fullAddress || undefined,
    origin_address: companyForm.origin_address || undefined,
    default_certificate_type: companyForm.default_certificate_type,
    service_start_at: startAt,
    service_expire_at: expireAt,
  };
}

function normalizePhone(value: string) {
  return value.trim().replace(/\s+/g, '');
}

function normalizeExpireFilter(value: string) {
  return value === 'soon' || value === 'expired' ? value : undefined;
}

function validatePhone(_rule: unknown, value: string, callback: (error?: Error) => void) {
  const valid =
    /^(1[3-9]\d{9}|0\d{2,3}-?\d{7,8}|400-?\d{3}-?\d{4})$/.test(
      normalizePhone(value || ''),
    );
  callback(valid ? undefined : new Error('请输入正确的联系电话'));
}

function onProvinceChange() {
  const firstCity = cityOptions.value[0];
  companyForm.city = firstCity?.value || '';
  companyForm.district = firstCity?.districts[0]?.value || '';
}

function onCityChange() {
  companyForm.district = districtOptions.value[0]?.value || '';
}

async function changeCompanyStatus(company: Company, action: 'enable' | 'disable') {
  const actionText = action === 'enable' ? '启用' : '停用';
  await ElMessageBox.confirm(`确认${actionText}企业「${company.name}」吗？`, '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: action === 'enable' ? 'success' : 'warning',
  });

  if (action === 'enable') {
    await enableCompany(company.id);
  } else {
    await disableCompany(company.id);
  }
  ElMessage.success(`企业已${actionText}`);
  await loadCompanies();
}

function openRenewDialog(company: Company) {
  currentCompany.value = company;
  renewForm.service_expire_at = company.service_expire_at
    ? new Date(company.service_expire_at)
    : null;
  renewDialogVisible.value = true;
}

async function submitRenew() {
  await renewFormRef.value?.validate();
  if (!currentCompany.value) return;
  const expireAt = toIsoString(renewForm.service_expire_at);
  if (!expireAt) return;

  saving.value = true;
  try {
    await renewCompany(currentCompany.value.id, expireAt);
    ElMessage.success('企业续期成功');
    renewDialogVisible.value = false;
    await loadCompanies();
  } finally {
    saving.value = false;
  }
}

function goDetail(company: Company) {
  router.push(`/companies/${company.id}`);
}

function statusLabel(status: Company['status']) {
  return status === 'normal' ? '正常' : '停用';
}

function expiryClass(value?: string | null) {
  return {
    'expiry-text': true,
    'is-expired': isExpired(value),
    'is-warning': isExpiringSoon(value),
  };
}
</script>
