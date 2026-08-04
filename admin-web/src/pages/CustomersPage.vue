<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>客户管理</h1>
      </div>
      <el-button type="primary" @click="openCreate">新增客户</el-button>
    </div>

    <div class="panel">
      <el-form class="filter-form" :inline="true" :model="query" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            clearable
            placeholder="企业、联系人、电话、微信"
            @keyup.enter="loadData"
          />
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="query.source" clearable placeholder="全部">
            <el-option
              v-for="item in customerSourceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="query.customer_type" clearable placeholder="全部">
            <el-option
              v-for="item in customerTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="阶段">
          <el-select v-model="query.status" clearable placeholder="全部">
            <el-option
              v-for="item in customerStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="价值">
          <el-select v-model="query.value_level" clearable placeholder="全部">
            <el-option
              v-for="item in customerValueOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table
        v-loading="loading"
        :data="items"
        border
        class="data-table customer-table"
        empty-text="暂无客户记录，可点击右上角新增客户"
      >
        <el-table-column label="企业名称" min-width="220">
          <template #default="{ row }: { row: Customer }">
            <el-button link type="primary" @click="openDetail(row.id)">
              {{ row.company_name }}
            </el-button>
            <div class="muted">编号：{{ row.customer_no }}</div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" min-width="140">
          <template #default="{ row }: { row: Customer }">
            <div>{{ row.contact_name || '-' }}</div>
            <div class="muted">{{ row.phone || row.wechat || '-' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="地区" min-width="130">
          <template #default="{ row }: { row: Customer }">
            {{ [row.province, row.city].filter(Boolean).join(' / ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="客户类型" min-width="130">
          <template #default="{ row }: { row: Customer }">
            {{ label(customerTypeOptions, row.customer_type) }}
          </template>
        </el-table-column>
        <el-table-column label="来源" min-width="120">
          <template #default="{ row }: { row: Customer }">
            {{ label(customerSourceOptions, row.source) }}
          </template>
        </el-table-column>
        <el-table-column label="阶段" min-width="120">
          <template #default="{ row }: { row: Customer }">
            <el-tag>{{ label(customerStatusOptions, row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="价值类型" min-width="130">
          <template #default="{ row }: { row: Customer }">
            {{ label(customerValueOptions, row.value_level) }}
          </template>
        </el-table-column>
        <el-table-column label="最近跟进" min-width="160">
          <template #default="{ row }: { row: Customer }">
            {{ row.latest_follow_time ? formatDateTime(row.latest_follow_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="复购提醒" min-width="180">
          <template #default="{ row }: { row: Customer }">
            <div>{{ row.last_purchase_product || '-' }}</div>
            <div class="muted">
              {{ row.next_repurchase_date ? `预计 ${formatDate(row.next_repurchase_date)}` : '' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="维护工作" width="230" fixed="right">
          <template #default="{ row }: { row: Customer }">
            <div class="customer-row-actions">
              <el-button size="small" type="primary" @click="openDetail(row.id)">详情</el-button>
              <el-dropdown trigger="click" @command="(command: string) => handleRowCommand(row, command)">
                <el-button size="small">维护</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="follow">新增跟进</el-dropdown-item>
                    <el-dropdown-item command="quote">新增报价</el-dropdown-item>
                    <el-dropdown-item command="need">记录需求</el-dropdown-item>
                    <el-dropdown-item command="device">设备档案</el-dropdown-item>
                    <el-dropdown-item command="purchase">成交/复购</el-dropdown-item>
                    <el-dropdown-item command="edit" divided>编辑客户</el-dropdown-item>
                    <el-dropdown-item command="delete">删除客户</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-row">
        <span>共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          layout="sizes, prev, pager, next, jumper"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑客户' : '新增客户'" width="720px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="企业名称" prop="company_name">
              <el-input v-model="form.company_name" placeholder="请输入企业名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="form.contact_name" placeholder="联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.phone" placeholder="手机号或座机" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="微信">
              <el-input v-model="form.wechat" placeholder="微信号或备注" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="省份">
              <el-input v-model="form.province" placeholder="如：山西" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="城市">
              <el-input v-model="form.city" placeholder="如：太原" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="地址">
              <el-input v-model="form.address" placeholder="客户地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户类型">
              <el-select v-model="form.customer_type">
                <el-option
                  v-for="item in customerTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户来源">
              <el-select v-model="form.source">
                <el-option
                  v-for="item in customerSourceOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="当前阶段">
              <el-select v-model="form.status">
                <el-option
                  v-for="item in customerStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价值类型">
              <el-select v-model="form.value_level">
                <el-option
                  v-for="item in customerValueOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="客户情况、跟进重点、售后注意事项" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { useRouter } from 'vue-router';
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
  type CustomerPayload,
} from '@/api/customers';
import type { Customer } from '@/types/api';
import {
  customerSourceOptions,
  customerStatusOptions,
  customerTypeOptions,
  customerValueOptions,
  optionLabel,
} from '@/utils/customerLabels';
import { formatDateTime } from '@/utils/time';

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const items = ref<Customer[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const editingId = ref('');
const formRef = ref<FormInstance>();

const query = reactive({
  page: 1,
  page_size: 10,
  keyword: '',
  source: '',
  customer_type: '',
  status: '',
  value_level: '',
});

const form = reactive<CustomerPayload>({
  company_name: '',
  contact_name: '',
  phone: '',
  wechat: '',
  province: '山西',
  city: '',
  address: '',
  customer_type: 'OTHER',
  source: 'OTHER',
  status: 'NEW',
  value_level: 'UNKNOWN',
  remark: '',
});

const rules: FormRules = {
  company_name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
};

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const result = await listCustomers(query);
    items.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.page = 1;
  query.keyword = '';
  query.source = '';
  query.customer_type = '';
  query.status = '';
  query.value_level = '';
  loadData();
}

function openCreate() {
  editingId.value = '';
  Object.assign(form, {
    company_name: '',
    contact_name: '',
    phone: '',
    wechat: '',
    province: '山西',
    city: '',
    address: '',
    customer_type: 'OTHER',
    source: 'OTHER',
    status: 'NEW',
    value_level: 'UNKNOWN',
    remark: '',
  });
  dialogVisible.value = true;
}

function openEdit(row: Customer) {
  editingId.value = row.id;
  Object.assign(form, {
    company_name: row.company_name,
    contact_name: row.contact_name || '',
    phone: row.phone || '',
    wechat: row.wechat || '',
    province: row.province || '',
    city: row.city || '',
    address: row.address || '',
    customer_type: row.customer_type,
    source: row.source,
    status: row.status,
    value_level: row.value_level,
    remark: row.remark || '',
  });
  dialogVisible.value = true;
}

async function submitForm() {
  await formRef.value?.validate();
  saving.value = true;
  try {
    if (editingId.value) {
      await updateCustomer(editingId.value, form);
      ElMessage.success('客户已更新');
    } else {
      await createCustomer(form);
      ElMessage.success('客户已新增');
    }
    dialogVisible.value = false;
    loadData();
  } finally {
    saving.value = false;
  }
}

function openDetail(id: string) {
  router.push(`/customers/${id}`);
}

function quickMaintain(id: string, record: string) {
  const tabMap: Record<string, string> = {
    need: 'needs',
    device: 'devices',
    follow: 'follow',
    quote: 'quotes',
    purchase: 'orders',
  };
  router.push({
    path: `/customers/${id}`,
    query: { tab: tabMap[record] || 'base', action: 'add', record },
  });
}

function handleRowCommand(row: Customer, command: string) {
  if (command === 'edit') {
    openEdit(row);
    return;
  }
  if (command === 'delete') {
    removeCustomer(row);
    return;
  }
  quickMaintain(row.id, command);
}

async function removeCustomer(row: Customer) {
  await ElMessageBox.confirm(
    `确认删除客户「${row.company_name}」？删除后不会出现在列表中，历史记录会保留。`,
    '删除客户',
    { type: 'warning' },
  );
  await deleteCustomer(row.id);
  ElMessage.success('客户已删除');
  loadData();
}

function label(options: Array<{ label: string; value: string }>, value?: string | null) {
  return optionLabel(options, value);
}

function formatDate(value: string) {
  return value.slice(0, 10);
}
</script>

<style scoped>
.muted {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.7;
}

.customer-row-actions {
  align-items: center;
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.filter-form {
  align-items: center;
  background: #ffffff;
  border: 0;
  border-bottom: 1px solid #edf3ef;
  border-radius: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
  margin: -2px -2px 16px;
  padding: 0 0 16px;
}

.filter-form :deep(.el-form-item) {
  align-items: center;
  margin: 0;
}

.filter-form :deep(.el-form-item__label) {
  color: #49665f;
  font-size: 13px;
  font-weight: 500;
  height: 34px;
  line-height: 34px;
  padding-right: 8px;
}

.filter-form :deep(.el-input),
.filter-form :deep(.el-select) {
  width: 150px;
}

.filter-form :deep(.el-form-item:first-child .el-input) {
  width: 250px;
}

.filter-form :deep(.el-input__wrapper),
.filter-form :deep(.el-select__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e2ebe6 inset;
  min-height: 36px;
}

.filter-form :deep(.el-button) {
  border-radius: 8px;
  min-height: 36px;
  padding: 0 18px;
}

.pagination-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

</style>
