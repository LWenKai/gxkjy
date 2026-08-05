<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>合格证管理</h1>
        <p>查看已开具的合格证，复制公开链接、核对对应检测记录，并可对错误证书执行作废。</p>
      </div>
    </div>

    <el-alert
      title="重新打印以客户微信小程序端为主；本页面只提供查看、复制公开链接和打印日志占位。"
      type="info"
      show-icon
      :closable="false"
    />

    <div class="panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="企业">
          <el-select
            v-model="query.company_id"
            clearable
            filterable
            placeholder="全部企业"
            style="width: 220px"
          >
            <el-option
              v-for="company in companyOptions"
              :key="company.id"
              :label="company.name"
              :value="company.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input
            v-model.trim="query.product_name"
            clearable
            placeholder="请输入产品名称"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 130px">
            <el-option label="正常" value="normal" />
            <el-option label="已作废" value="voided" />
          </el-select>
        </el-form-item>
        <el-form-item label="开具日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button :loading="exporting" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="items" border class="data-table">
        <el-table-column prop="certificate_no" label="合格证编号" min-width="170" />
        <el-table-column prop="company_name" label="企业名称" min-width="190">
          <template #default="{ row }: { row: Certificate }">
            {{ row.company_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="product_name" label="产品名称" min-width="130" />
        <el-table-column label="数量" width="120">
          <template #default="{ row }: { row: Certificate }">
            {{ row.quantity }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="合格证类型" min-width="190">
          <template #default="{ row }: { row: Certificate }">
            {{ certificateTypeLabel(row.certificate_type) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }: { row: Certificate }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'">
              {{ certificateStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开具时间" min-width="160">
          <template #default="{ row }: { row: Certificate }">
            {{ formatDateTime(row.issue_time) }}
          </template>
        </el-table-column>
        <el-table-column label="公开链接" min-width="220">
          <template #default="{ row }: { row: Certificate }">
            <span class="link-text">{{ row.qr_url }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }: { row: Certificate }">
            <div class="table-actions">
              <el-button text type="primary" @click="openDetail(row)">详情</el-button>
              <el-button text type="primary" @click="copyLink(row.qr_url)">复制链接</el-button>
              <el-button text type="primary" @click="openPublicLink(row.qr_url)">预览</el-button>
              <el-button
                v-if="row.status === 'normal'"
                text
                type="danger"
                @click="handleVoid(row)"
              >作废</el-button>
            </div>
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

    <el-drawer v-model="detailVisible" title="合格证详情" size="760px">
      <div v-loading="detailLoading">
        <template v-if="detail">
          <el-alert
            v-if="detail.status === 'voided'"
            title="该合格证已作废，仅用于历史记录核对。"
            type="warning"
            show-icon
            :closable="false"
            class="detail-alert"
          />

          <el-descriptions :column="2" border>
            <el-descriptions-item label="合格证编号">{{ detail.certificate_no }}</el-descriptions-item>
            <el-descriptions-item label="合格证类型">
              {{ certificateTypeLabel(detail.certificate_type) }}
            </el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ detail.product_name }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ detail.quantity }} {{ detail.unit }}</el-descriptions-item>
            <el-descriptions-item label="产地">{{ detail.origin || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开具主体">{{ detail.issuer_name }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ detail.contact_phone }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="detail.status === 'normal' ? 'success' : 'danger'">
                {{ certificateStatusLabel(detail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="开具时间">{{ formatDateTime(detail.issue_time) }}</el-descriptions-item>
            <el-descriptions-item label="打印份数">{{ detail.print_copies || '-' }}</el-descriptions-item>
            <el-descriptions-item label="作废时间">{{ formatDateTime(detail.void_time) }}</el-descriptions-item>
            <el-descriptions-item label="承诺依据" :span="2">{{ detail.commitment_basis }}</el-descriptions-item>
            <el-descriptions-item label="公开链接" :span="2">
              <div class="link-action-row">
                <span class="link-text">{{ detail.qr_url }}</span>
                <el-button text type="primary" @click="copyLink(detail.qr_url)">复制扫码链接</el-button>
                <el-button text type="primary" @click="openPublicLink(detail.qr_url)">打开扫码页</el-button>
                <el-button
                  v-if="detail.status === 'normal'"
                  text
                  type="danger"
                  @click="handleVoid(detail)"
                >作废合格证</el-button>
              </div>
            </el-descriptions-item>
          </el-descriptions>

          <div class="detail-block">
            <h3>对应检测记录</h3>
            <el-descriptions v-if="detail.detection_record" :column="2" border>
              <el-descriptions-item label="记录编号">{{ detail.detection_record.record_no }}</el-descriptions-item>
              <el-descriptions-item label="检测结果">
                <el-tag :type="detail.detection_record.overall_result === 'qualified' ? 'success' : 'danger'">
                  {{ resultLabel(detail.detection_record.overall_result) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="产品名称">{{ detail.detection_record.product_name }}</el-descriptions-item>
              <el-descriptions-item label="样品名称">{{ detail.detection_record.sample_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="检测时间">{{ formatDateTime(detail.detection_record.test_time) }}</el-descriptions-item>
              <el-descriptions-item label="检测记录状态">
                {{ recordStatusLabel(detail.detection_record.status) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="detail-block">
            <h3>检测项目明细</h3>
            <el-table :data="detail.detection_record?.items || []" border class="data-table">
              <el-table-column prop="test_item" label="检测项目" min-width="150" />
              <el-table-column prop="test_method" label="检测方法" min-width="170">
                <template #default="{ row }: { row: DetectionRecordItem }">
                  {{ row.test_method || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="test_value" label="检测数值" min-width="130" />
              <el-table-column prop="unit" label="单位" width="90">
                <template #default="{ row }: { row: DetectionRecordItem }">
                  {{ row.unit || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="standard_limit" label="标准/限值" min-width="140">
                <template #default="{ row }: { row: DetectionRecordItem }">
                  {{ row.standard_limit || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="判定" width="100">
                <template #default="{ row }: { row: DetectionRecordItem }">
                  <el-tag :type="row.result === 'qualified' ? 'success' : 'danger'">
                    {{ resultLabel(row.result) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="detail-block">
            <h3>打印记录</h3>
            <el-table v-if="detail.print_logs?.length" :data="detail.print_logs" border class="data-table">
              <el-table-column label="打印端" prop="print_client" min-width="120" />
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.print_status === 'success' ? 'success' : 'danger'">
                    {{ row.print_status === 'success' ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="份数" prop="copies" width="80" />
              <el-table-column label="时间" min-width="160">
                <template #default="{ row }">{{ formatDateTime(row.printed_at) }}</template>
              </el-table-column>
              <el-table-column label="失败原因" min-width="180">
                <template #default="{ row }">{{ row.error_message || '-' }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="暂无打印日志。" />
          </div>

          <div class="detail-block">
            <h3>依据资料</h3>
            <div v-if="detail.evidence_assets?.length" class="evidence-list">
              <div
                v-for="asset in detail.evidence_assets"
                :key="asset.id"
                class="evidence-item"
              >
                <span class="evidence-name">{{ asset.file_name }}</span>
                <div class="evidence-actions">
                  <el-tag :type="asset.is_public ? 'success' : 'info'" size="small">
                    {{ asset.is_public ? '对外公开' : '不公开' }}
                  </el-tag>
                  <el-button text type="primary" @click="openPublicLink(asset.file_url)">查看</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无依据资料。" />
          </div>
        </template>
      </div>
    </el-drawer>
  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { exportCertificates, getCertificate, listCertificates, voidAdminCertificate } from '@/api/certificates';
import { listCompanies } from '@/api/companies';
import type {
  Certificate,
  CertificateStatusValue,
  CertificateTypeValue,
  Company,
  DetectionRecordItem,
  DetectionRecordStatusValue,
  DetectionResultValue,
} from '@/types/api';
import { formatDateTime, toIsoString } from '@/utils/time';

const route = useRoute();
const loading = ref(false);
const detailLoading = ref(false);
const exporting = ref(false);
const detailVisible = ref(false);
const total = ref(0);
const items = ref<Certificate[]>([]);
const detail = ref<Certificate | null>(null);
const companyOptions = ref<Company[]>([]);
const dateRange = ref<[Date, Date] | null>(null);

const query = reactive({
  page: 1,
  page_size: 10,
  company_id: typeof route.query.company_id === 'string' ? route.query.company_id : '',
  product_name: '',
  status: '' as CertificateStatusValue | '',
});

onMounted(async () => {
  if (route.query.date === 'today') {
    dateRange.value = getTodayRange();
  }
  await Promise.all([loadCompanies(), loadItems()]);
  if (typeof route.query.certificate_id === 'string') {
    await openDetail({ id: route.query.certificate_id } as Certificate);
  }
});

async function loadCompanies() {
  const data = await listCompanies({ page: 1, page_size: 100 });
  companyOptions.value = data.items;
}

async function loadItems() {
  loading.value = true;
  try {
    const data = await listCertificates({
      page: query.page,
      page_size: query.page_size,
      company_id: query.company_id || undefined,
      product_name: query.product_name || undefined,
      status: query.status || undefined,
      date_from: toIsoString(dateRange.value?.[0]),
      date_to: toIsoString(dateRange.value?.[1]),
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
  query.company_id = '';
  query.product_name = '';
  query.status = '';
  dateRange.value = null;
  search();
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportCertificates({
      company_id: query.company_id || undefined,
      product_name: query.product_name || undefined,
      status: query.status || undefined,
      date_from: toIsoString(dateRange.value?.[0]),
      date_to: toIsoString(dateRange.value?.[1]),
    });
    ElMessage.success('导出任务已开始');
  } finally {
    exporting.value = false;
  }
}

async function openDetail(row: Certificate) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getCertificate(row.id);
  } finally {
    detailLoading.value = false;
  }
}

async function copyLink(link: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(link);
  } else {
    const textarea = document.createElement('textarea');
    textarea.value = link;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
  ElMessage.success('公开链接已复制');
}

function openPublicLink(link: string) {
  window.open(link, '_blank', 'noopener,noreferrer');
}

async function handleVoid(row: Certificate) {
  if (row.status === 'voided') return;
  try {
    await ElMessageBox.confirm(
      `确定要作废合格证「${row.certificate_no}」吗？作废后该证书将不可作为有效流通凭证，且不可恢复。`,
      '作废合格证',
      {
        type: 'warning',
        confirmButtonText: '确定作废',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
      },
    );
  } catch {
    return;
  }
  try {
    await voidAdminCertificate(row.id);
    ElMessage.success('合格证已作废');
    if (detailVisible.value && detail.value?.id === row.id) {
      detail.value = await getCertificate(row.id);
    }
    await loadItems();
  } catch (error) {
    const message = (error as { message?: string })?.message || '作废失败，请稍后重试';
    ElMessage.error(message);
  }
}

function certificateTypeLabel(value: CertificateTypeValue) {
  return value === 'agri_commitment_certificate'
    ? '承诺达标合格证'
    : '企业快检合格标签';
}

function certificateStatusLabel(value: CertificateStatusValue) {
  return value === 'normal' ? '正常' : '已作废';
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

function getTodayRange(): [Date, Date] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);
  return [start, end];
}
</script>
