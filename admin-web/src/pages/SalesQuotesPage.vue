<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>报价单索引</h1>
        <p>这里只用于查询历史报价。新增、调价、生成文件和转成交订单，请进入对应客户详情完成。</p>
      </div>
    </div>

    <div class="panel">
      <el-alert
        class="page-tip"
        type="info"
        show-icon
        :closable="false"
        title="正式销售流程：客户管理 → 客户详情 → 报价单。这样客户资料、沟通记录、成交订单和复购提醒都在同一个页面。"
      />
      <div class="toolbar">
        <el-input v-model="query.keyword" placeholder="搜索报价编号或客户" clearable />
        <el-select v-model="query.status" placeholder="报价状态" clearable>
          <el-option v-for="item in salesQuoteStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <el-table :data="items" border v-loading="loading" empty-text="暂无报价单">
        <el-table-column type="expand">
          <template #default="{ row }: { row: SalesQuote }">
            <el-table :data="row.items" border size="small">
              <el-table-column prop="product_name" label="产品名称" min-width="180" />
              <el-table-column label="型号" min-width="120">
                <template #default="{ row: item }: { row: SalesQuoteItem }">
                  {{ item.model || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="specification" label="规格或配置" min-width="180" />
              <el-table-column label="数量" width="110">
                <template #default="{ row: item }: { row: SalesQuoteItem }">{{ item.quantity }} {{ item.unit || '' }}</template>
              </el-table-column>
              <el-table-column prop="unit_price" label="单价" width="110" />
              <el-table-column prop="subtotal" label="小计" width="110" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="quote_no" label="报价编号" min-width="180" />
        <el-table-column prop="company_name" label="客户" min-width="180" />
        <el-table-column prop="version_no" label="版本" width="80" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }: { row: SalesQuote }">{{ label(row.status) }}</template>
        </el-table-column>
        <el-table-column prop="item_count" label="项数" width="80" />
        <el-table-column prop="total_amount" label="总金额" width="120" />
        <el-table-column label="报价日期" width="120">
          <template #default="{ row }: { row: SalesQuote }">{{ formatDate(row.quote_date) }}</template>
        </el-table-column>
        <el-table-column label="文件" width="130">
          <template #default="{ row }: { row: SalesQuote }">
            <el-tag size="small" :type="row.has_pdf ? 'success' : 'info'">PDF</el-tag>
            <el-tag size="small" :type="row.has_excel ? 'success' : 'info'" class="ml-6">Excel</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }: { row: SalesQuote }">
            <el-button link type="primary" @click="goCustomer(row)">进入客户详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <span>共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          layout="sizes, prev, pager, next, jumper"
          :total="total"
          @current-change="loadData"
          @size-change="loadData"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { listSalesQuotes } from '@/api/salesQuotes';
import type { SalesQuote, SalesQuoteItem } from '@/types/api';
import { salesOptionLabel, salesQuoteStatusOptions } from '@/utils/salesLabels';

const router = useRouter();
const loading = ref(false);
const items = ref<SalesQuote[]>([]);
const total = ref(0);
const query = reactive<Record<string, any>>({ page: 1, page_size: 10 });

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const result = await listSalesQuotes(query);
    items.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, { page: 1, page_size: 10, keyword: undefined, status: undefined });
  loadData();
}

function goCustomer(row: SalesQuote) {
  router.push({ path: `/customers/${row.customer_id}`, query: { tab: 'quotes' } });
}

function label(value?: string | null) {
  return salesOptionLabel(salesQuoteStatusOptions, value);
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : '-';
}
</script>

<style scoped>
.page-tip {
  margin-bottom: 14px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.toolbar .el-input,
.toolbar .el-select {
  width: 240px;
}

.pagination {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding-top: 14px;
}

.ml-6 {
  margin-left: 6px;
}
</style>
