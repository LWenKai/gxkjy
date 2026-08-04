<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>厂家接口</h1>
        <p>配置检测仪厂家上传数据所需的厂家编码、密钥和白名单。</p>
      </div>
      <el-button type="primary" @click="openCreateDialog">新增厂家接口</el-button>
    </div>

    <el-alert
      title="厂家编码由系统自动生成。接入密钥只用于检测仪上传接口验签，不会在列表中明文展示。"
      type="info"
      show-icon
      :closable="false"
      class="detail-alert"
    />

    <div class="panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="厂家">
          <el-input v-model.trim="query.manufacturer_name" clearable placeholder="请输入厂家名称" @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="厂家编码">
          <el-input v-model.trim="query.manufacturer_code" clearable placeholder="例如 MFR000001" @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="接入方式">
          <el-select v-model="query.integration_type" clearable placeholder="全部" style="width: 140px">
            <el-option label="HTTP API" value="http_api" />
            <el-option label="MQTT" value="mqtt" />
            <el-option label="TCP Socket" value="tcp_socket" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="正常" value="normal" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="items" border class="data-table" empty-text="暂无厂家接口">
        <el-table-column prop="manufacturer_name" label="厂家名称" min-width="170" />
        <el-table-column label="厂家编码" min-width="140">
          <template #default="{ row }: { row: ManufacturerInterface }">
            <strong class="code-text">{{ row.manufacturer_code }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="接入密钥" min-width="110">
          <template #default>已生成</template>
        </el-table-column>
        <el-table-column label="接入方式" width="120">
          <template #default="{ row }: { row: ManufacturerInterface }">
            {{ integrationLabel(row.integration_type) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }: { row: ManufacturerInterface }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'info'">
              {{ row.status === 'normal' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="IP 白名单" min-width="160" show-overflow-tooltip>
          <template #default="{ row }: { row: ManufacturerInterface }">
            {{ row.allowed_ips || '未限制' }}
          </template>
        </el-table-column>
        <el-table-column label="最近同步" min-width="160">
          <template #default="{ row }: { row: ManufacturerInterface }">
            {{ formatDateTime(row.last_sync_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }: { row: ManufacturerInterface }">
            <el-space :size="6">
              <el-button size="small" text type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-dropdown trigger="click">
                <el-button size="small" text>更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openDetail(row)">查看详情</el-dropdown-item>
                    <el-dropdown-item @click="copyVendorIntegrationInfo(row)">{{ copyInfoLabel }}</el-dropdown-item>
                    <el-dropdown-item @click="regenerateSecret(row)">重新生成密钥</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === 'disabled'" divided @click="changeStatus(row, 'enable')">
                      启用
                    </el-dropdown-item>
                    <el-dropdown-item v-else divided @click="changeStatus(row, 'disable')">
                      停用
                    </el-dropdown-item>
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

    <el-dialog
      v-model="formVisible"
      :title="formMode === 'create' ? '新增厂家接口' : '编辑厂家接口'"
      width="620px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="厂家名称" prop="manufacturer_name">
          <el-input v-model.trim="form.manufacturer_name" placeholder="请输入厂家名称" />
        </el-form-item>
        <el-form-item label="厂家编码">
          <el-input :model-value="formMode === 'create' ? '保存后系统自动生成' : form.manufacturer_code" disabled />
          <div class="form-tip">用于识别检测仪厂家，格式类似 MFR000001，创建后不可手填修改。</div>
        </el-form-item>
        <el-form-item label="接入密钥">
          <el-input model-value="已生成，默认不显示" disabled />
          <div class="form-tip">用于厂家上传检测数据接口身份验证。需要更换时请在列表中点击“重新生成密钥”。</div>
        </el-form-item>
        <el-form-item label="接入方式" prop="integration_type">
          <el-select v-model="form.integration_type" style="width: 100%">
            <el-option label="HTTP API（推荐）" value="http_api" />
            <el-option label="MQTT（预留）" value="mqtt" />
            <el-option label="TCP Socket（预留）" value="tcp_socket" />
          </el-select>
        </el-form-item>
        <el-form-item label="签名规则">
          <el-input v-model.trim="form.sign_rule" placeholder="HMAC-SHA256" />
        </el-form-item>
        <el-form-item label="IP 白名单">
          <el-input
            v-model.trim="form.allowed_ips"
            placeholder="多个 IP 用英文逗号分隔；厂家没有固定 IP 时可以留空"
          />
          <div class="form-tip">用于限制哪些厂家服务器可以调用上传接口。厂家没有固定 IP 时可以留空。</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveItem">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="厂家接口详情" width="620px">
      <el-descriptions v-if="detail" :column="1" border>
        <el-descriptions-item label="厂家名称">{{ detail.manufacturer_name }}</el-descriptions-item>
        <el-descriptions-item label="厂家编码">
          <strong class="code-text">{{ detail.manufacturer_code }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="接入密钥">已生成，默认隐藏</el-descriptions-item>
        <el-descriptions-item label="接入方式">{{ integrationLabel(detail.integration_type) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status === 'normal' ? '正常' : '停用' }}</el-descriptions-item>
        <el-descriptions-item label="签名规则">{{ detail.sign_rule || 'HMAC-SHA256' }}</el-descriptions-item>
        <el-descriptions-item label="IP 白名单">{{ detail.allowed_ips || '未限制' }}</el-descriptions-item>
        <el-descriptions-item label="最近同步">{{ formatDateTime(detail.last_sync_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import {
  createManufacturerInterface,
  disableManufacturerInterface,
  enableManufacturerInterface,
  getManufacturerInterface,
  listManufacturerInterfaces,
  regenerateManufacturerSecret,
  updateManufacturerInterface,
  type ManufacturerInterfacePayload,
} from '@/api/manufacturerInterfaces';
import type { IntegrationType, ManufacturerInterface } from '@/types/api';
import { formatDateTime } from '@/utils/time';

interface ManufacturerForm {
  manufacturer_name: string;
  manufacturer_code: string;
  integration_type: IntegrationType;
  sign_rule: string;
  allowed_ips: string;
}

const loading = ref(false);
const saving = ref(false);
const total = ref(0);
const items = ref<ManufacturerInterface[]>([]);
const formVisible = ref(false);
const detailVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const editingId = ref('');
const detail = ref<ManufacturerInterface | null>(null);
const formRef = ref<FormInstance>();

const query = reactive({
  page: 1,
  page_size: 10,
  manufacturer_name: '',
  manufacturer_code: '',
  integration_type: '' as IntegrationType | '',
  status: '' as 'normal' | 'disabled' | '',
});

const form = reactive<ManufacturerForm>(emptyForm());

const rules: FormRules = {
  manufacturer_name: [{ required: true, message: '请输入厂家名称', trigger: 'blur' }],
  integration_type: [{ required: true, message: '请选择接入方式', trigger: 'change' }],
};

onMounted(loadItems);

function emptyForm(): ManufacturerForm {
  return {
    manufacturer_name: '',
    manufacturer_code: '',
    integration_type: 'http_api',
    sign_rule: 'HMAC-SHA256',
    allowed_ips: '',
  };
}

async function loadItems() {
  loading.value = true;
  try {
    const data = await listManufacturerInterfaces({
      page: query.page,
      page_size: query.page_size,
      manufacturer_name: query.manufacturer_name || undefined,
      manufacturer_code: query.manufacturer_code || undefined,
      integration_type: query.integration_type || undefined,
      status: query.status || undefined,
    });
    items.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.page = 1;
  loadItems();
}

function resetSearch() {
  query.manufacturer_name = '';
  query.manufacturer_code = '';
  query.integration_type = '';
  query.status = '';
  search();
}

function openCreateDialog() {
  Object.assign(form, emptyForm());
  editingId.value = '';
  formMode.value = 'create';
  formVisible.value = true;
}

function openEditDialog(row: ManufacturerInterface) {
  Object.assign(form, {
    manufacturer_name: row.manufacturer_name,
    manufacturer_code: row.manufacturer_code,
    integration_type: row.integration_type,
    sign_rule: row.sign_rule || 'HMAC-SHA256',
    allowed_ips: row.allowed_ips || '',
  });
  editingId.value = row.id;
  formMode.value = 'edit';
  formVisible.value = true;
}

async function saveItem() {
  await formRef.value?.validate();
  const payload = toPayload();
  saving.value = true;
  try {
    const data =
      formMode.value === 'create'
        ? await createManufacturerInterface(payload)
        : await updateManufacturerInterface(editingId.value, payload);
    formVisible.value = false;
    ElMessage.success(formMode.value === 'create' ? '厂家接口已创建' : '厂家接口已保存');
    if (formMode.value === 'create' && data.access_secret_once) {
      await showSecretOnce(data.access_secret_once);
    }
    await loadItems();
  } finally {
    saving.value = false;
  }
}

function toPayload(): ManufacturerInterfacePayload {
  return {
    manufacturer_name: form.manufacturer_name,
    integration_type: form.integration_type,
    sign_rule: form.sign_rule || 'HMAC-SHA256',
    allowed_ips: form.allowed_ips || undefined,
  };
}

async function openDetail(row: ManufacturerInterface) {
  detail.value = await getManufacturerInterface(row.id);
  detailVisible.value = true;
}


const copyInfoLabel = '\u590d\u5236\u5bf9\u63a5\u4fe1\u606f';

function buildVendorIntegrationText(row: ManufacturerInterface) {
  return [
    '\u8c37\u82af\u5feb\u68c0\u4e91\u68c0\u6d4b\u4eea\u6570\u636e\u4e0a\u4f20\u5bf9\u63a5\u4fe1\u606f',
    '',
    `\u5382\u5bb6\u540d\u79f0\uff1a${row.manufacturer_name}`,
    `\u5382\u5bb6\u7f16\u7801 manufacturer_code\uff1a${row.manufacturer_code}`,
    '\u4e0a\u4f20\u5730\u5740\uff1ahttps://api.gxkjy.com/api/open/detection/upload',
    '\u8bf7\u6c42\u65b9\u5f0f\uff1aPOST',
    'Content-Type\uff1aapplication/json',
    `\u7b7e\u540d\u7b97\u6cd5\uff1a${row.sign_rule || 'HMAC-SHA256'}`,
    '',
    '\u7b7e\u540d\u6838\u5fc3\u5b57\u6bb5\uff1a',
    'manufacturer_code\u3001device_sn\u3001manufacturer_record_id\u3001timestamp\u3001nonce',
    '',
    '\u5f85\u7b7e\u540d\u5b57\u7b26\u4e32\u793a\u4f8b\uff1a',
    `manufacturer_code=${row.manufacturer_code}&device_sn=\u8bbe\u5907\u7f16\u53f7&manufacturer_record_id=\u5382\u5bb6\u8bb0\u5f55ID&nonce=\u968f\u673a\u5b57\u7b26\u4e32&timestamp=\u65f6\u95f4\u6233`,
    '',
    '\u8bf4\u660e\uff1a',
    '1. access_secret \u8bf7\u4f7f\u7528\u8c37\u82af\u79d1\u6280\u5355\u72ec\u63d0\u4f9b\u7684\u63a5\u5165\u5bc6\u94a5\uff0c\u5bc6\u94a5\u4e0d\u5728\u5217\u8868\u4e2d\u660e\u6587\u5c55\u793a\u3002',
    '2. device_sn \u5fc5\u987b\u4e0e\u8c37\u82af\u540e\u53f0\u8bbe\u5907\u7ba1\u7406\u4e2d\u7ed1\u5b9a\u7684\u8bbe\u5907\u7f16\u53f7\u5b8c\u5168\u4e00\u81f4\u3002',
    '3. \u5408\u683c\u7ed3\u679c\u4f20 qualified\uff0c\u4e0d\u5408\u683c\u7ed3\u679c\u4f20 unqualified\u3002',
    '4. timestamp \u5efa\u8bae\u4f7f\u7528\u79d2\u7ea7\u65f6\u95f4\u6233\uff0c\u8d85\u8fc7 5 \u5206\u949f\u53ef\u80fd\u88ab\u62d2\u7edd\u3002',
    '5. \u6bcf\u6761\u68c0\u6d4b\u8bb0\u5f55\u8bf7\u63d0\u4f9b\u552f\u4e00 manufacturer_record_id\uff0c\u907f\u514d\u91cd\u590d\u5165\u5e93\u3002',
    '',
    '\u8054\u8c03\u540e\u8bf7\u5148\u4e0a\u4f20\u4e00\u6761\u5408\u683c\u6570\u636e\u548c\u4e00\u6761\u4e0d\u5408\u683c\u6570\u636e\uff0c\u8c37\u82af\u540e\u53f0\u4f1a\u5728\u201c\u5382\u5bb6\u4e0a\u4f20\u65e5\u5fd7\u201d\u548c\u201c\u68c0\u6d4b\u8bb0\u5f55\u201d\u4e2d\u6838\u5bf9\u3002',
    '',
    '\u8c37\u82af\u79d1\u6280\u8054\u7cfb\u7535\u8bdd\uff1a13363412262',
  ].join('\n');
}

async function copyVendorIntegrationInfo(row: ManufacturerInterface) {
  const text = buildVendorIntegrationText(row);
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('\u5382\u5bb6\u5bf9\u63a5\u4fe1\u606f\u5df2\u590d\u5236');
  } catch {
    await ElMessageBox.alert(`<pre class="copy-text">${text}</pre>`, '\u590d\u5236\u5382\u5bb6\u5bf9\u63a5\u4fe1\u606f', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '\u6211\u5df2\u590d\u5236',
      customClass: 'copy-dialog',
    });
  }
}

async function regenerateSecret(row: ManufacturerInterface) {
  await ElMessageBox.confirm(
    `确认重新生成“${row.manufacturer_name}”的接入密钥吗？旧密钥会立即失效，厂家需要同步更新。`,
    '重新生成密钥',
    { confirmButtonText: '重新生成', cancelButtonText: '取消', type: 'warning' },
  );
  const data = await regenerateManufacturerSecret(row.id);
  ElMessage.success('新密钥已生成');
  if (data.access_secret_once) {
    await showSecretOnce(data.access_secret_once);
  }
  await loadItems();
}

async function showSecretOnce(secret: string) {
  await ElMessageBox.alert(
    `接入密钥：${secret}`,
    '该密钥只显示一次，请及时交给厂家技术人员保存',
    { confirmButtonText: '我已保存' },
  );
}

async function changeStatus(row: ManufacturerInterface, action: 'enable' | 'disable') {
  const actionText = action === 'enable' ? '启用' : '停用';
  await ElMessageBox.confirm(`确认${actionText}厂家接口“${row.manufacturer_name}”吗？`, '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: action === 'enable' ? 'success' : 'warning',
  });

  if (action === 'enable') await enableManufacturerInterface(row.id);
  else await disableManufacturerInterface(row.id);
  ElMessage.success(`厂家接口已${actionText}`);
  await loadItems();
}

function integrationLabel(value: IntegrationType) {
  const map: Record<IntegrationType, string> = {
    http_api: 'HTTP API',
    mqtt: 'MQTT',
    tcp_socket: 'TCP Socket',
  };
  return map[value] || value;
}
</script>
