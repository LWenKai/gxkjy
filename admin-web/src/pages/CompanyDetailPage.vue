<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>企业详情</h1>
        <p>查看企业基础信息，维护客户账号、绑定设备和公开展示资料。</p>
      </div>
      <div class="heading-actions">
        <el-button @click="router.push('/companies')">返回列表</el-button>
        <el-button type="primary" @click="openRenewDialog" :disabled="!company">
          续期
        </el-button>
        <el-button type="primary" plain @click="router.push(`/companies/${companyId}/profile`)">
          公开资料
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="panel">
      <template v-if="company">
        <div class="detail-header">
          <div>
            <h2>{{ company.name }}</h2>
            <p>{{ company.address || '未填写企业地址' }}</p>
          </div>
          <el-tag :type="company.status === 'normal' ? 'success' : 'info'">
            {{ company.status === 'normal' ? '正常' : '停用' }}
          </el-tag>
        </div>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="联系人">
            {{ company.contact_name }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ company.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="服务状态">
            <span :class="expiryClass(company.service_expire_at)">
              {{ serviceStatusText(company.service_expire_at) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="服务到期时间">
            {{ formatDate(company.service_expire_at) }}
          </el-descriptions-item>
          <el-descriptions-item label="默认合格证类型">
            {{ certificateTypeLabel(company.default_certificate_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="产地/基地地址">
            {{ company.origin_address || company.address || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </div>

    <div v-if="company" class="panel delivery-panel">
      <div class="panel-heading">
        <div>
          <h2>交付检查</h2>
          <p>按客户开通流程检查关键配置，避免漏账号、漏设备、漏交付确认。</p>
        </div>
        <el-tag type="success">{{ completedGuideCount }}/{{ guideSteps.length }} 已完成</el-tag>
      </div>
      <div class="delivery-grid">
        <div
          v-for="step in guideSteps"
          :key="step.title"
          class="delivery-step"
          :class="{ done: step.done }"
        >
          <div class="step-status">{{ step.done ? '✓' : '•' }}</div>
          <div class="step-main">
            <strong>{{ step.title }}</strong>
            <span>{{ step.desc }}</span>
          </div>
          <el-button v-if="step.action" size="small" plain @click="step.action">
            {{ step.actionText }}
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="company" class="panel service-note-panel">
      <div class="panel-heading">
        <div>
          <h2>客户服务备注</h2>
          <p>仅后台管理员可见，用于记录客户类型、售后注意事项和下次跟进。</p>
        </div>
        <el-button type="primary" :loading="saving" @click="saveServiceNote">保存备注</el-button>
      </div>
      <el-form :model="serviceForm" label-width="100px" class="service-note-form">
        <el-form-item label="客户类型">
          <el-input v-model.trim="serviceForm.customer_type" placeholder="例如：试用客户、学校食堂、配送企业" />
        </el-form-item>
        <el-form-item label="服务备注">
          <el-input
            v-model.trim="serviceForm.service_note"
            type="textarea"
            :rows="4"
            placeholder="记录客户背景、售后注意事项、沟通情况等，仅后台可见"
          />
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-input
            v-model.trim="serviceForm.follow_up_note"
            placeholder="例如：下周确认设备联调、补企业资料照片"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="company-summary-grid">
      <button class="stat-card stat-card-button" @click="router.push(`/devices?company_id=${companyId}`)">
        <span>绑定设备数</span>
        <strong>{{ companySummary.device_count }}</strong>
        <small>当前企业已绑定设备</small>
      </button>
      <button class="stat-card stat-card-button" @click="router.push(`/detection-records?company_id=${companyId}`)">
        <span>检测记录数</span>
        <strong>{{ companySummary.detection_record_count }}</strong>
        <small>客户检测记录汇总</small>
      </button>
      <button class="stat-card stat-card-button" @click="router.push(`/certificates?company_id=${companyId}`)">
        <span>合格证总数</span>
        <strong>{{ companySummary.certificate_count }}</strong>
        <small>该企业已开具合格证</small>
      </button>
      <button class="stat-card stat-card-button" @click="router.push(`/certificates?company_id=${companyId}&status=normal`)">
        <span>正常合格证</span>
        <strong>{{ companySummary.normal_certificate_count }}</strong>
        <small>仍可扫码查看有效状态</small>
      </button>
      <button class="stat-card stat-card-button" @click="router.push(`/certificates?company_id=${companyId}&status=voided`)">
        <span>作废合格证</span>
        <strong>{{ companySummary.voided_certificate_count }}</strong>
        <small>仅用于历史核对</small>
      </button>
      <button class="stat-card stat-card-button" @click="router.push(`/certificates?company_id=${companyId}`)">
        <span>累计打印次数</span>
        <strong>{{ companySummary.print_log_count || 0 }}</strong>
        <small>合格证打印记录</small>
      </button>
      <button class="stat-card stat-card-button">
        <span>最近登录</span>
        <strong class="stat-date">{{ shortDate(companySummary.last_login_at) }}</strong>
        <small>客户最近一次进入系统</small>
      </button>
      <button class="stat-card stat-card-button">
        <span>最近检测</span>
        <strong class="stat-date">{{ shortDate(companySummary.last_detection_at) }}</strong>
        <small>最近一条检测记录时间</small>
      </button>
      <button class="stat-card stat-card-button">
        <span>最近开证</span>
        <strong class="stat-date">{{ shortDate(companySummary.last_certificate_at) }}</strong>
        <small>最近一张合格证时间</small>
      </button>
    </div>

    <div v-if="showGuide" class="panel guide-panel">
      <div>
        <h2>下一步建议</h2>
        <p>企业开户后，通常需要先创建客户账号、绑定设备，再录入测试检测数据用于演示开证流程。</p>
      </div>
      <div class="quick-entry-actions">
        <el-button type="primary" plain @click="openUserDialog">创建企业账号</el-button>
        <el-button type="primary" plain @click="openDeviceDialog">新增并绑定设备</el-button>
        <el-button type="primary" plain @click="router.push('/test-detection-records/create')">
          录入测试检测数据
        </el-button>
      </div>
    </div>

    <div class="panel">
      <div class="panel-heading">
        <div>
          <h2>绑定设备（{{ companyDevices.length }}）</h2>
          <p>从企业详情新增设备时，会默认绑定到当前企业。</p>
        </div>
        <div class="heading-actions">
          <el-button type="primary" @click="openDeviceDialog">新增并绑定设备</el-button>
          <el-button @click="router.push(`/devices?company_id=${companyId}`)">
            查看设备管理
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="devicesLoading"
        :data="companyDevices"
        border
        class="data-table"
        empty-text="当前企业暂无绑定设备，可新增并绑定测试设备。"
      >
        <el-table-column prop="device_name" label="设备名称" min-width="150">
          <template #default="{ row }: { row: Device }">
            {{ row.device_name || '未命名设备' }}
          </template>
        </el-table-column>
        <el-table-column prop="device_sn" label="设备编号" min-width="150">
          <template #default="{ row }: { row: Device }">
            <span class="code-text">{{ row.device_sn }}</span>
          </template>
        </el-table-column>
        <el-table-column label="厂家" min-width="170">
          <template #default="{ row }: { row: Device }">
            {{ row.manufacturer?.manufacturer_name || row.manufacturer_code }}
          </template>
        </el-table-column>
        <el-table-column prop="model" label="型号" min-width="120">
          <template #default="{ row }: { row: Device }">
            {{ row.model || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }: { row: Device }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'info'">
              {{ row.status === 'normal' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="绑定时间" min-width="160">
          <template #default="{ row }: { row: Device }">
            {{ formatDateTime(row.updated_at || row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }: { row: Device }">
            <div class="table-actions">
              <el-button text type="primary" @click="router.push(`/devices?company_id=${companyId}&device_id=${row.id}`)">
                设备管理
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="panel">
      <div class="panel-heading">
        <div>
          <h2>PC 端模块权限</h2>
          <p>分配给该企业客户的 PC 工作台可见模块，客户登录后仅能看到已勾选的模块。</p>
        </div>
        <el-button type="primary" :loading="savingModules" @click="saveClientModules">
          保存权限
        </el-button>
      </div>
      <el-checkbox-group v-model="clientModules" class="module-check-group">
        <el-checkbox label="unit">单位信息</el-checkbox>
        <el-checkbox label="detection">检测记录</el-checkbox>
        <el-checkbox label="certificate">合格证</el-checkbox>
        <el-checkbox label="products">企业产品库</el-checkbox>
        <el-checkbox label="screen">企业大屏</el-checkbox>
      </el-checkbox-group>
    </div>

    <div class="panel">
      <div class="panel-heading">
        <div>
          <h2>企业账号</h2>
          <p>用于客户微信小程序账号密码登录。</p>
        </div>
        <div class="heading-actions">
          <el-button type="primary" plain @click="copyCustomerInfo">
            复制客户使用信息
          </el-button>
          <el-button type="primary" @click="openUserDialog">创建账号</el-button>
        </div>
      </div>

      <el-table v-loading="usersLoading" :data="companyUsers" border class="data-table">
        <el-table-column prop="username" label="账号" min-width="160" />
        <el-table-column prop="real_name" label="姓名" min-width="130">
          <template #default="{ row }: { row: CompanyUser }">
            {{ row.real_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }: { row: CompanyUser }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'info'">
              {{ row.status === 'normal' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录时间" min-width="170">
          <template #default="{ row }: { row: CompanyUser }">
            {{ formatDateTime(row.last_login_at) }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="170">
          <template #default="{ row }: { row: CompanyUser }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="210" fixed="right">
          <template #default="{ row }: { row: CompanyUser }">
            <div class="table-actions">
              <el-button text type="primary" @click="resetPassword(row)">
                重置密码
              </el-button>
              <el-button
                v-if="row.status === 'disabled'"
                text
                type="success"
                @click="changeUserStatus(row, 'enable')"
              >
                启用
              </el-button>
              <el-button
                v-else
                text
                type="warning"
                @click="changeUserStatus(row, 'disable')"
              >
                停用
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="panel muted-panel">
      <h2>常用入口</h2>
      <p>查看该企业检测、合格证和公开资料。</p>
      <div class="quick-entry-actions">
        <el-button type="primary" plain @click="router.push(`/detection-records?company_id=${companyId}`)">
          查看该企业检测记录
        </el-button>
        <el-button type="primary" plain @click="router.push(`/certificates?company_id=${companyId}`)">
          查看该企业合格证记录
        </el-button>
        <el-button type="primary" plain @click="router.push(`/companies/${companyId}/profile`)">
          维护公开资料
        </el-button>
      </div>
    </div>

    <el-dialog v-model="deviceDialogVisible" title="新增并绑定设备" width="620px" destroy-on-close>
      <el-alert
        title="该设备将直接绑定到当前企业，用于检测数据归属和后续联调排查。"
        type="info"
        show-icon
        :closable="false"
        class="detail-alert"
      />
      <el-form
        ref="deviceFormRef"
        :model="deviceForm"
        :rules="deviceRules"
        label-width="120px"
      >
        <el-form-item label="当前企业">
          <el-input :model-value="company?.name || '-'" readonly />
        </el-form-item>
        <el-form-item label="厂家接口" prop="manufacturer_code">
          <el-select
            v-model="deviceForm.manufacturer_code"
            filterable
            placeholder="请选择厂家接口"
            :disabled="!manufacturerOptions.length"
          >
            <el-option
              v-for="item in manufacturerOptions"
              :key="item.id"
              :label="`${item.manufacturer_name}（${item.manufacturer_code}）`"
              :value="item.manufacturer_code"
              :disabled="item.status === 'disabled'"
            />
          </el-select>
          <p v-if="!manufacturerOptions.length" class="field-tip">
            请先新增厂家接口，再新增设备。
          </p>
        </el-form-item>
        <el-form-item label="设备名称" prop="device_name">
          <el-input v-model.trim="deviceForm.device_name" placeholder="例如：谷芯测试快检仪" />
        </el-form-item>
        <el-form-item label="设备编号" prop="device_sn">
          <el-input v-model.trim="deviceForm.device_sn" placeholder="请输入设备唯一编号" />
        </el-form-item>
        <el-form-item label="设备型号">
          <el-input v-model.trim="deviceForm.model" placeholder="可选，例如 GX-1000" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model.trim="deviceForm.remark"
            type="textarea"
            :rows="3"
            placeholder="可填写设备安装位置、用途等"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deviceDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!manufacturerOptions.length"
          @click="createBoundDevice"
        >
          创建并绑定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="userDialogVisible" title="创建企业账号" width="520px">
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="110px"
      >
        <el-form-item label="登录账号" prop="username">
          <el-input v-model.trim="userForm.username" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model.trim="userForm.real_name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="初始密码">
          <el-input
            v-model="userForm.password"
            type="password"
            show-password
            placeholder="可不填，由系统生成"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="createUser">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renewDialogVisible" title="企业续期" width="460px">
      <p class="renew-current">
        当前到期时间：{{ formatDate(company?.service_expire_at) }}
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
  createCompanyUser,
  disableCompanyUser,
  enableCompanyUser,
  getCompany,
  getCompanySummary,
  listCompanyUsers,
  renewCompany,
  resetCompanyUserPassword,
  updateCompany,
  updateCompanyClientModules,
} from '@/api/companies';
import { createDevice, listDevices } from '@/api/devices';
import { listManufacturerInterfaces } from '@/api/manufacturerInterfaces';
import type {
  Company,
  CompanySummary,
  CompanyUser,
  CompanyUserWithInitialPassword,
  Device,
  ManufacturerInterface,
} from '@/types/api';
import { formatDate, formatDateTime, isExpired, isExpiringSoon, toIsoString } from '@/utils/time';

const route = useRoute();
const router = useRouter();
const companyId = String(route.params.id);
const company = ref<Company | null>(null);
const companyUsers = ref<CompanyUser[]>([]);
const companyDevices = ref<Device[]>([]);
const companySummary = ref<CompanySummary>({
  device_count: 0,
  detection_record_count: 0,
  certificate_count: 0,
  normal_certificate_count: 0,
  voided_certificate_count: 0,
  account_count: 0,
  print_log_count: 0,
  last_login_at: null,
  last_detection_at: null,
  last_certificate_at: null,
  service_status: 'normal',
  expire_days: 0,
  has_bound_device: false,
});
const manufacturerOptions = ref<ManufacturerInterface[]>([]);
const loading = ref(false);
const usersLoading = ref(false);
const devicesLoading = ref(false);
const saving = ref(false);
const savingModules = ref(false);
const clientModules = ref<string[]>(['unit', 'detection', 'certificate']);
const userDialogVisible = ref(false);
const deviceDialogVisible = ref(false);
const renewDialogVisible = ref(false);
const userFormRef = ref<FormInstance>();
const deviceFormRef = ref<FormInstance>();
const renewFormRef = ref<FormInstance>();

const userForm = reactive({
  username: '',
  real_name: '',
  password: '',
});

const deviceForm = reactive({
  manufacturer_code: '',
  device_name: '',
  device_sn: '',
  model: '',
  remark: '',
});

const renewForm = reactive<{ service_expire_at: Date | null }>({
  service_expire_at: null,
});

const serviceForm = reactive({
  customer_type: '',
  service_note: '',
  follow_up_note: '',
});

const showGuide = computed(
  () =>
    company.value &&
    (companyUsers.value.length === 0 ||
      companyDevices.value.length === 0 ||
      companySummary.value.detection_record_count === 0),
);

const guideSteps = computed(() => [
  {
    title: '企业资料已创建',
    desc: company.value ? '企业基础资料已存在' : '请先创建企业资料',
    done: Boolean(company.value),
    actionText: '编辑企业',
    action: () => router.push('/companies'),
  },
  {
    title: '企业账号已创建',
    desc: companyUsers.value.length ? '已有客户登录账号' : '客户还不能登录小程序',
    done: companyUsers.value.length > 0,
    actionText: '创建账号',
    action: openUserDialog,
  },
  {
    title: '服务期限已设置',
    desc: companySummary.value.service_status === 'expired' ? '服务已过期，需要续期' : '服务期限可正常使用',
    done: companySummary.value.service_status !== 'expired',
    actionText: '续期',
    action: openRenewDialog,
  },
  {
    title: '设备已绑定',
    desc: companyDevices.value.length ? '已有绑定设备' : '建议绑定至少一台测试设备',
    done: companyDevices.value.length > 0,
    actionText: '新增并绑定',
    action: openDeviceDialog,
  },
  {
    title: '检测数据已准备',
    desc: companySummary.value.detection_record_count ? '已有检测记录' : '建议先准备一条检测数据用于交付核验',
    done: companySummary.value.detection_record_count > 0,
    actionText: '准备数据',
    action: () => router.push('/test-detection-records/create'),
  },
  {
    title: '合格证已开具',
    desc: companySummary.value.certificate_count ? '已有合格证记录' : '建议开具一张合格证完成核验',
    done: companySummary.value.certificate_count > 0,
    actionText: '查看合格证',
    action: () => router.push(`/certificates?company_id=${companyId}`),
  },
  {
    title: '打印流程已确认',
    desc: companySummary.value.print_log_count ? '已有打印记录' : '建议完成一次合格证打印',
    done: Boolean(companySummary.value.print_log_count),
    actionText: '查看合格证',
    action: () => router.push(`/certificates?company_id=${companyId}`),
  },
  {
    title: '客户使用信息已复制',
    desc: '复制账号信息后可发送给客户试用',
    done: companyUsers.value.length > 0,
    actionText: '复制信息',
    action: copyCustomerInfo,
  },
]);

const completedGuideCount = computed(
  () => guideSteps.value.filter((step) => step.done).length,
);

const userRules: FormRules = {
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
};

const deviceRules: FormRules = {
  manufacturer_code: [
    { required: true, message: '请选择厂家接口', trigger: 'change' },
  ],
  device_name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  device_sn: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
};

const renewRules: FormRules = {
  service_expire_at: [
    { required: true, message: '请选择新的服务到期时间', trigger: 'change' },
  ],
};

onMounted(async () => {
  await Promise.all([
    loadCompany(),
    loadCompanyUsers(),
    loadCompanyDevices(),
    loadCompanySummary(),
    loadManufacturerOptions(),
  ]);
});

async function loadCompany() {
  loading.value = true;
  try {
    company.value = await getCompany(companyId);
    serviceForm.customer_type = company.value.customer_type || '';
    serviceForm.service_note = company.value.service_note || '';
    serviceForm.follow_up_note = company.value.follow_up_note || '';
    clientModules.value = (company.value.client_modules || 'unit,detection,certificate')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  } finally {
    loading.value = false;
  }
}

async function loadCompanySummary() {
  companySummary.value = await getCompanySummary(companyId);
}

async function loadCompanyUsers() {
  usersLoading.value = true;
  try {
    const data = await listCompanyUsers(companyId, { page: 1, page_size: 50 });
    companyUsers.value = data.items;
  } finally {
    usersLoading.value = false;
  }
}

async function loadCompanyDevices() {
  devicesLoading.value = true;
  try {
    const data = await listDevices({ page: 1, page_size: 50, company_id: companyId });
    companyDevices.value = data.items;
  } finally {
    devicesLoading.value = false;
  }
}

async function loadManufacturerOptions() {
  const data = await listManufacturerInterfaces({ page: 1, page_size: 100 });
  manufacturerOptions.value = data.items;
}

function openDeviceDialog() {
  deviceForm.manufacturer_code =
    manufacturerOptions.value.find((item) => item.status === 'normal')?.manufacturer_code ||
    '';
  deviceForm.device_name = '';
  deviceForm.device_sn = '';
  deviceForm.model = '';
  deviceForm.remark = '';
  deviceDialogVisible.value = true;
  if (!manufacturerOptions.value.length) {
    ElMessage.warning('请先新增厂家接口');
  }
}

async function createBoundDevice() {
  await deviceFormRef.value?.validate();
  saving.value = true;
  try {
    await createDevice({
      manufacturer_code: deviceForm.manufacturer_code,
      device_name: deviceForm.device_name,
      device_sn: deviceForm.device_sn,
      model: deviceForm.model || undefined,
      remark: deviceForm.remark || undefined,
      company_id: companyId,
    });
    deviceDialogVisible.value = false;
    ElMessage.success('设备已新增并绑定到当前企业');
    await Promise.all([loadCompanyDevices(), loadCompanySummary()]);
  } finally {
    saving.value = false;
  }
}

function openUserDialog() {
  userForm.username = '';
  userForm.real_name = company.value?.name || '';
  userForm.password = 'Gx12345@67890!';
  userDialogVisible.value = true;
}

async function createUser() {
  await userFormRef.value?.validate();
  saving.value = true;
  try {
    const data = await createCompanyUser(companyId, {
      username: userForm.username,
      real_name: userForm.real_name || undefined,
      password: userForm.password || undefined,
    });
    userDialogVisible.value = false;
    ElMessage.success('企业账号已创建');
    await showInitialPassword(data);
    await Promise.all([loadCompanyUsers(), loadCompanySummary()]);
  } finally {
    saving.value = false;
  }
}

async function copyCustomerInfo() {
  if (!company.value) return;
  const account =
    companyUsers.value.find((item) => item.status === 'normal') ||
    companyUsers.value[0];
  if (!account) {
    ElMessage.warning('请先创建企业账号');
    return;
  }

  const text = [
    '客户使用信息',
    '',
    `企业名称：${company.value.name}`,
    `登录账号：${account.username}`,
    '初始密码：Gx12345@67890!',
    '使用入口：谷芯快检云微信小程序',
    '',
    '说明：请妥善保存账号信息，如需重置密码请联系谷芯科技。',
  ].join('\n');

  await copyText(text);
  ElMessage.success('客户使用信息已复制');
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

async function resetPassword(user: CompanyUser) {
  const result = await ElMessageBox.prompt(
    '可输入新密码；留空则由系统生成临时密码。',
    `重置账号「${user.username}」密码`,
    {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      inputPlaceholder: '留空由系统生成',
      inputType: 'password',
    },
  );

  const password = result.value?.trim() || undefined;
  const data = await resetCompanyUserPassword(user.id, password);
  ElMessage.success('密码已重置');
  await showInitialPassword(data);
}

async function showInitialPassword(data: CompanyUserWithInitialPassword) {
  if (!data.initial_password) return;
  await ElMessageBox.alert(
    `临时密码：${data.initial_password}`,
    '该密码只展示一次，请及时复制给客户',
    {
      confirmButtonText: '我已复制',
    },
  );
}

async function changeUserStatus(user: CompanyUser, action: 'enable' | 'disable') {
  const actionText = action === 'enable' ? '启用' : '停用';
  await ElMessageBox.confirm(`确认${actionText}账号「${user.username}」吗？`, '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: action === 'enable' ? 'success' : 'warning',
  });

  if (action === 'enable') {
    await enableCompanyUser(user.id);
  } else {
    await disableCompanyUser(user.id);
  }
  ElMessage.success(`账号已${actionText}`);
  await loadCompanyUsers();
}

function openRenewDialog() {
  if (!company.value) return;
  renewForm.service_expire_at = company.value.service_expire_at
    ? new Date(company.value.service_expire_at)
    : null;
  renewDialogVisible.value = true;
}

async function submitRenew() {
  await renewFormRef.value?.validate();
  const expireAt = toIsoString(renewForm.service_expire_at);
  if (!expireAt) return;

  saving.value = true;
  try {
    company.value = await renewCompany(companyId, expireAt);
    ElMessage.success('企业续期成功');
    renewDialogVisible.value = false;
  } finally {
    saving.value = false;
  }
}

async function saveClientModules() {
  if (!company.value) return;
  savingModules.value = true;
  try {
    company.value = await updateCompanyClientModules(companyId, clientModules.value);
    ElMessage.success('PC 端模块权限已保存');
  } finally {
    savingModules.value = false;
  }
}

async function saveServiceNote() {
  if (!company.value) return;
  saving.value = true;
  try {
    company.value = await updateCompany(companyId, {
      name: company.value.name,
      contact_name: company.value.contact_name,
      phone: company.value.phone,
      address: company.value.address || undefined,
      origin_address: company.value.origin_address || undefined,
      default_certificate_type: company.value.default_certificate_type,
      service_start_at: company.value.service_start_at || undefined,
      service_expire_at: company.value.service_expire_at,
      customer_type: serviceForm.customer_type || undefined,
      service_note: serviceForm.service_note || undefined,
      follow_up_note: serviceForm.follow_up_note || undefined,
    });
    ElMessage.success('客户服务备注已保存');
  } finally {
    saving.value = false;
  }
}

function shortDate(value?: string | null) {
  if (!value) return '-';
  return formatDateTime(value).slice(0, 10);
}

function certificateTypeLabel(value: Company['default_certificate_type']) {
  return value === 'agri_commitment_certificate'
    ? '承诺达标合格证'
    : '企业快检合格标签';
}

function serviceStatusText(value?: string | null) {
  if (isExpired(value)) return '已到期';
  if (isExpiringSoon(value)) return '即将到期';
  return '服务正常';
}

function expiryClass(value?: string | null) {
  return {
    'expiry-text': true,
    'is-expired': isExpired(value),
    'is-warning': isExpiringSoon(value),
  };
}
</script>
