<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRouter } from 'vue-router';
import { listCompanies } from '@/api/companies';
import { listDevices } from '@/api/devices';
import { createTestDetectionRecord } from '@/api/testDetectionRecords';
import type { Company, Device, DetectionResultValue } from '@/types/api';

const router = useRouter();
const loading = ref(false);
const companies = ref<Company[]>([]);
const devices = ref<Device[]>([]);

const form = reactive({
  company_id: '',
  device_id: '',
});

const selectedCompany = computed(() =>
  companies.value.find((item) => item.id === form.company_id),
);
const selectedDevice = computed(() =>
  devices.value.find((item) => item.id === form.device_id),
);
const availableDevices = computed(() => {
  if (!form.company_id) return devices.value;
  return devices.value.filter(
    (item) => !item.company_id || item.company_id === form.company_id,
  );
});

function nowText() {
  const date = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

async function loadOptions() {
  const [companyResult, deviceResult] = await Promise.all([
    listCompanies({ page: 1, page_size: 100 }),
    listDevices({ page: 1, page_size: 100 }),
  ]);
  companies.value = companyResult.items || [];
  devices.value = deviceResult.items || [];

  if (!form.company_id && companies.value.length) {
    form.company_id = companies.value[0].id;
  }
  if (!form.device_id && availableDevices.value.length) {
    form.device_id = availableDevices.value[0].id;
  }
}

function onCompanyChange() {
  const match = availableDevices.value.find((item) => item.id === form.device_id);
  if (!match) form.device_id = availableDevices.value[0]?.id || '';
}

function buildPayload(type: 'qualified' | 'unqualified' | 'demo') {
  const isQualified = type !== 'unqualified';
  const result: DetectionResultValue = isQualified ? 'qualified' : 'unqualified';
  const productName =
    type === 'demo' ? '演示西红柿' : isQualified ? '测试黄瓜' : '测试韭菜';
  const value = isQualified ? '12.5' : '68.4';

  return {
    company_id: form.company_id,
    device_id: form.device_id,
    product_name: productName,
    sample_name: productName,
    sample_category: '农产品',
    overall_result: result,
    test_time: nowText(),
    items: [
      {
        test_item: '有机磷和氨基甲酸酯类农药残留',
        test_method: '酶抑制率法',
        test_value: value,
        unit: '%',
        standard_limit: '≤50%',
        result,
      },
      {
        test_item: '检测结论复核',
        test_method: '系统演示数据',
        test_value: isQualified ? '合格' : '不合格',
        unit: '',
        standard_limit: '符合要求',
        result,
      },
    ],
  };
}

async function generate(type: 'qualified' | 'unqualified' | 'demo') {
  if (!form.company_id) {
    ElMessage.warning('请先选择企业');
    return;
  }
  if (!form.device_id) {
    ElMessage.warning('请先选择设备');
    return;
  }

  loading.value = true;
  try {
    if (type === 'demo') {
      await createTestDetectionRecord(buildPayload('qualified'));
      await createTestDetectionRecord(buildPayload('unqualified'));
      ElMessage.success('演示检测数据已生成');
    } else {
      await createTestDetectionRecord(buildPayload(type));
      ElMessage.success(type === 'qualified' ? '测试合格数据已生成' : '测试异常数据已生成');
    }
    router.push({ path: '/detection-records', query: { company_id: form.company_id } });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadOptions().catch(() => {
    ElMessage.error('测试中心初始化失败，请稍后重试');
  });
});
</script>

<template>
  <div class="page-shell">
    <section class="gx-page-hero">
      <div>
        <p class="eyebrow">内部工具</p>
        <h1>测试中心</h1>
        <p>用于内部测试、客户演示和厂家联调。这里生成的是测试检测记录，不会接入真实检测仪。</p>
      </div>
    </section>

    <el-card class="setup-card" shadow="never">
      <template #header>
        <div class="card-title">测试对象</div>
      </template>
      <el-form label-width="92px" class="setup-form">
        <el-form-item label="企业">
          <el-select
            v-model="form.company_id"
            filterable
            placeholder="请选择企业"
            @change="onCompanyChange"
          >
            <el-option
              v-for="company in companies"
              :key="company.id"
              :label="company.name"
              :value="company.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备">
          <el-select v-model="form.device_id" filterable placeholder="请选择设备">
            <el-option
              v-for="device in availableDevices"
              :key="device.id"
              :label="`${device.device_name || '测试设备'} / ${device.device_sn}`"
              :value="device.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="target-summary" v-if="selectedCompany || selectedDevice">
        <span>企业：{{ selectedCompany?.name || '-' }}</span>
        <span>设备：{{ selectedDevice?.device_name || selectedDevice?.device_sn || '-' }}</span>
      </div>
    </el-card>

    <section class="action-grid">
      <el-card class="action-card success" shadow="never">
        <div class="action-icon">合</div>
        <h2>生成测试合格数据</h2>
        <p>创建一条可用于开证的合格检测记录，适合演示开证流程。</p>
        <el-button type="success" :loading="loading" @click="generate('qualified')">
          生成合格数据
        </el-button>
      </el-card>

      <el-card class="action-card danger" shadow="never">
        <div class="action-icon">异</div>
        <h2>生成测试异常数据</h2>
        <p>创建一条不合格检测记录，用于验证不可开证和异常提示。</p>
        <el-button type="danger" plain :loading="loading" @click="generate('unqualified')">
          生成异常数据
        </el-button>
      </el-card>

      <el-card class="action-card primary" shadow="never">
        <div class="action-icon">演</div>
        <h2>生成演示数据</h2>
        <p>同时创建合格和不合格样例，方便客户演示和联调检查。</p>
        <el-button type="primary" plain :loading="loading" @click="generate('demo')">
          生成演示数据
        </el-button>
      </el-card>
    </section>

    <el-alert
      class="notice"
      title="说明"
      type="info"
      :closable="false"
      description="测试中心只用于内部演示和联调。真实检测仪数据对接完成后，厂家上传记录会进入检测记录和厂家上传日志。"
    />
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.gx-page-hero {
  padding: 26px 30px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(15, 143, 88, 0.95), rgba(20, 105, 122, 0.88)),
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.26), transparent 34%);
  color: #fff;
}

.gx-page-hero h1 {
  margin: 4px 0 8px;
  font-size: 28px;
}

.gx-page-hero p {
  margin: 0;
  max-width: 720px;
  color: rgba(255, 255, 255, 0.86);
}

.eyebrow {
  font-size: 13px;
  letter-spacing: 0;
}

.setup-card,
.action-card {
  border: 1px solid #e5eee9;
  border-radius: 14px;
}

.card-title {
  font-size: 16px;
  font-weight: 700;
}

.setup-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(240px, 1fr));
  gap: 12px 18px;
}

.setup-form :deep(.el-select) {
  width: 100%;
}

.target-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
  color: #5f7469;
  font-size: 13px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.action-card {
  min-height: 230px;
}

.action-card h2 {
  margin: 14px 0 8px;
  font-size: 18px;
}

.action-card p {
  min-height: 48px;
  color: #667a70;
  line-height: 1.65;
}

.action-icon {
  width: 46px;
  height: 46px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.action-card.success .action-icon {
  color: #0f8f58;
  background: #e9f8ef;
}

.action-card.danger .action-icon {
  color: #c53d35;
  background: #fff0ee;
}

.action-card.primary .action-icon {
  color: #176b87;
  background: #eaf6fb;
}

.notice {
  border-radius: 12px;
}

@media (max-width: 960px) {
  .setup-form,
  .action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
