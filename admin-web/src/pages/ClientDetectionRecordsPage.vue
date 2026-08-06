<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>检测记录</h1>
      </div>
    </div>

    <div class="panel search-panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="检测结果">
          <el-select v-model="query.overall_result" clearable placeholder="全部" style="width: 130px">
            <el-option label="合格" value="qualified" />
            <el-option label="不合格" value="unqualified" />
          </el-select>
        </el-form-item>
        <el-form-item label="样品/产品">
          <el-input v-model.trim="query.sample_name" placeholder="名称关键字" style="width: 200px" />
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model.trim="query.product_name" placeholder="按产品名筛选" style="width: 160px" />
        </el-form-item>
        <el-form-item label="检测时间">
          <el-date-picker
            v-model="query.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :clearable="true"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" plain :loading="exporting" @click="openExport">导出</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="warning" plain :loading="exportingExcel" @click="exportExcel">导出 Excel 报表</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="panel">
      <el-table v-loading="loading" :data="items" border class="data-table" empty-text="暂无检测记录">
        <el-table-column prop="record_no" label="记录编号" min-width="170" show-overflow-tooltip />
        <el-table-column prop="product_name" label="产品名称" min-width="130" show-overflow-tooltip />
        <el-table-column prop="sample_name" label="样品名称" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">{{ row.sample_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag :type="row.overall_result === 'qualified' ? 'success' : 'danger'">
              {{ row.overall_result === 'qualified' ? '合格' : '不合格' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="检测时间" min-width="155">
          <template #default="{ row }">{{ formatDateTime(row.test_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" text type="primary" @click="openDetail(row)">查看</el-button>
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

    <el-drawer v-model="detailVisible" title="检测记录详情" size="860px">
      <div v-loading="detailLoading" class="detail-body">
        <template v-if="detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="记录编号">{{ detail.record_no }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ detail.product_name }}</el-descriptions-item>
            <el-descriptions-item label="样品名称">{{ detail.sample_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="设备">{{ detail.device_name || '—' }}</el-descriptions-item>
            <el-descriptions-item label="检测结果">
              <el-tag :type="detail.overall_result === 'qualified' ? 'success' : 'danger'">
                {{ detail.overall_result === 'qualified' ? '合格' : '不合格' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="检测时间">{{ formatDateTime(detail.test_time) }}</el-descriptions-item>
          </el-descriptions>

          <div class="detail-block">
            <h3>检测项目明细</h3>
            <el-table :data="detail.items || []" border class="data-table" empty-text="暂无项目明细">
              <el-table-column prop="test_item" label="检测项目" min-width="150" />
              <el-table-column prop="test_method" label="方法" min-width="150">
                <template #default="{ row }">{{ row.test_method || '—' }}</template>
              </el-table-column>
              <el-table-column prop="test_value" label="检测值" min-width="100" />
              <el-table-column prop="unit" label="单位" width="70">
                <template #default="{ row }">{{ row.unit || '—' }}</template>
              </el-table-column>
              <el-table-column prop="standard_limit" label="限量值" min-width="110">
                <template #default="{ row }">{{ row.standard_limit || '—' }}</template>
              </el-table-column>
              <el-table-column label="判定" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.result === 'qualified' ? 'success' : 'danger'">
                    {{ row.result === 'qualified' ? '合格' : '不合格' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 不合格处理闭环 -->
          <div v-if="detail.overall_result === 'unqualified'" class="detail-block">
            <h3>不合格处理记录</h3>
            <el-table v-if="disposals.length" :data="disposals" border class="data-table" style="margin-bottom: 12px">
              <el-table-column prop="disposition" label="处理方式" width="110">
                <template #default="{ row }">
                  <el-tag :type="disposalTagType(row.disposition)" size="small">{{ row.disposition }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="处理说明" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">{{ row.description || '—' }}</template>
              </el-table-column>
              <el-table-column prop="handledBy" label="处理人" width="100">
                <template #default="{ row }">{{ row.handledBy || '—' }}</template>
              </el-table-column>
              <el-table-column label="处理时间" width="155">
                <template #default="{ row }">{{ formatDateTime(row.handledAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ row }">
                  <el-button link type="danger" size="small" @click="handleDeleteDisposal(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="disposal-add">
              <el-select
                v-model="disposalForm.disposition"
                placeholder="选择处理方式"
                style="width: 130px"
              >
                <el-option label="退货" value="退货" />
                <el-option label="销毁" value="销毁" />
                <el-option label="复检" value="复检" />
                <el-option label="降级使用" value="降级使用" />
                <el-option label="整改返工" value="整改返工" />
                <el-option label="其他" value="其他" />
              </el-select>
              <el-input
                v-model.trim="disposalForm.description"
                placeholder="整改/处理说明"
                style="flex: 1; min-width: 200px"
                @keyup.enter="handleAddDisposal"
              />
              <el-button type="primary" size="small" :loading="disposalSaving" @click="handleAddDisposal">
                添加处理
              </el-button>
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="primary" @click="router.push(`/client/detection-records/${detail!.id}/report`)">
            生成 A4 检测报告
          </el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="exportVisible" title="选择导出内容" width="460px">
      <div class="export-tip">勾选需要导出的字段，将导出当前筛选条件下的全部数据。</div>
      <el-form label-width="84px" class="export-form">
        <el-form-item label="导出字段">
          <el-checkbox-group v-model="exportFields">
            <el-checkbox
              v-for="field in exportFieldOptions"
              :key="field.value"
              :value="field.value"
              class="export-field"
            >
              {{ field.label }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportVisible = false">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="confirmExport">导出 CSV</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import {
  listClientDetectionRecords,
  getClientDetectionRecord,
  exportClientDetectionRecords,
  exportClientDetectionRecordsExcel,
  createDetectionRecordDisposal,
  deleteDetectionRecordDisposal,
  type DetectionRecordDisposal,
} from '@/api/client';
import type {
  DetectionRecord,
  DetectionRecordItem,
  DetectionResultValue,
} from '@/types/api';
import { formatDateTime } from '@/utils/time';

const router = useRouter();
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const total = ref(0);
const items = ref<DetectionRecord[]>([]);
const detail = ref<DetectionRecord | null>(null);

const query = reactive({
  page: 1,
  page_size: 10,
  overall_result: '' as DetectionResultValue | '',
  sample_name: '',
  product_name: '',
  date_range: null as [string, string] | null,
});

onMounted(loadItems);

async function loadItems() {
  loading.value = true;
  try {
    const data = await listClientDetectionRecords({
      page: query.page,
      page_size: query.page_size,
      overall_result: query.overall_result || undefined,
      sample_name: query.sample_name || undefined,
      product_name: query.product_name || undefined,
      date_from: query.date_range?.[0] || undefined,
      date_to: query.date_range?.[1] || undefined,
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
  query.overall_result = '';
  query.sample_name = '';
  query.product_name = '';
  query.date_range = null;
  search();
}

async function openDetail(row: DetectionRecord) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    detail.value = await getClientDetectionRecord(row.id);
    // detail 返回结果里已包含 disposals（后端 serializer 已 join），直接取用
    disposals.value = ((detail.value as any).disposals || []) as DetectionRecordDisposal[];
  } finally {
    detailLoading.value = false;
  }
}

// -- 不合格处理闭环 --
const disposals = ref<DetectionRecordDisposal[]>([]);
const disposalSaving = ref(false);
const disposalForm = reactive({
  disposition: '',
  description: '',
});

function disposalTagType(disposition: string) {
  const map: Record<string, string> = {
    '退货': 'danger',
    '销毁': 'danger',
    '复检': 'warning',
    '降级使用': 'info',
    '整改返工': 'warning',
  };
  return map[disposition] || 'info';
}

async function handleAddDisposal() {
  if (!disposalForm.disposition) {
    ElMessage.warning('请选择处理方式');
    return;
  }
  if (!detail.value) return;
  disposalSaving.value = true;
  try {
    await createDetectionRecordDisposal(detail.value.id, {
      disposition: disposalForm.disposition,
      description: disposalForm.description || undefined,
    });
    ElMessage.success('已添加处理记录');
    disposalForm.disposition = '';
    disposalForm.description = '';
    // 重新加载
    detail.value = await getClientDetectionRecord(detail.value.id);
    disposals.value = ((detail.value as any).disposals || []) as DetectionRecordDisposal[];
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '添加失败');
  } finally {
    disposalSaving.value = false;
  }
}

async function handleDeleteDisposal(disposal: DetectionRecordDisposal) {
  if (!detail.value) return;
  try {
    await deleteDetectionRecordDisposal(detail.value.id, disposal.id);
    ElMessage.success('已删除');
    detail.value = await getClientDetectionRecord(detail.value.id);
    disposals.value = ((detail.value as any).disposals || []) as DetectionRecordDisposal[];
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败');
  }
}

const exportVisible = ref(false);
const exporting = ref(false);
const exportingExcel = ref(false);
const exportFields = ref<string[]>([]);
const exportFieldOptions = [
  { label: '检测记录编号', value: 'record_no' },
  { label: '产品名称', value: 'product_name' },
  { label: '样品名称', value: 'sample_name' },
  { label: '检测结果', value: 'overall_result' },
  { label: '检测时间', value: 'test_time' },
  { label: '检测设备', value: 'device_name' },
  { label: '检测项目数', value: 'item_count' },
  { label: '关联合格证数', value: 'certificate_count' },
];

function openExport() {
  exportFields.value = exportFieldOptions.map((item) => item.value);
  exportVisible.value = true;
}

async function confirmExport() {
  if (!exportFields.value.length) {
    ElMessage.warning('请至少选择一个导出字段');
    return;
  }
  exporting.value = true;
  try {
    await exportClientDetectionRecords({
      fields: exportFields.value,
      overall_result: query.overall_result || '',
      sample_name: query.sample_name || '',
      product_name: query.product_name || '',
      date_from: query.date_range?.[0] || '',
      date_to: query.date_range?.[1] || '',
    });
    exportVisible.value = false;
    ElMessage.success('导出成功');
  } catch (error) {
    if (error instanceof Error && error.name === 'NO_DATA') {
      ElMessage.warning(error.message);
    } else {
      ElMessage.error('导出失败，请稍后重试');
    }
  }
}

async function exportExcel() {
  exportingExcel.value = true;
  try {
    await exportClientDetectionRecordsExcel({
      overall_result: query.overall_result || '',
      sample_name: query.sample_name || '',
      product_name: query.product_name || '',
      date_from: query.date_range?.[0] || '',
      date_to: query.date_range?.[1] || '',
    });
    ElMessage.success('Excel 报表已导出');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '导出失败');
  } finally {
    exportingExcel.value = false;
  }
}
</script>

<style scoped>
.detail-body {
  padding-bottom: 8px;
}
.detail-block {
  margin-top: 18px;
}
.detail-block h3 {
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #14241f;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.disposal-add {
  display: flex;
  gap: 8px;
  align-items: center;
}
.export-tip {
  color: #8a94a6;
  font-size: 13px;
  margin-bottom: 14px;
}
.export-field {
  display: block;
  margin-right: 0;
  line-height: 28px;
}
</style>
