<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>成交订单索引</h1>
        <p>这里只用于查询成交订单。付款、发货、开票和复购提醒维护，请进入对应客户详情完成。</p>
      </div>
    </div>

    <div class="panel">
      <el-alert
        class="page-tip"
        type="info"
        show-icon
        :closable="false"
        title="正式操作入口：客户管理 → 客户详情 → 成交订单。这样订单、复购提醒和客户跟进记录能放在一起看。"
      />
      <div class="toolbar">
        <el-select v-model="query.payment_status" placeholder="付款状态" clearable>
          <el-option v-for="item in paymentStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="query.delivery_status" placeholder="发货状态" clearable>
          <el-option v-for="item in deliveryStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <el-table :data="items" border v-loading="loading" empty-text="暂无成交订单">
        <el-table-column type="expand">
          <template #default="{ row }: { row: CustomerPurchaseOrder }">
            <el-table :data="row.items" border size="small">
              <el-table-column prop="product_name" label="产品" min-width="180" />
              <el-table-column prop="specification" label="规格" min-width="160" />
              <el-table-column label="数量" width="110">
                <template #default="{ row: item }: { row: CustomerPurchaseItem }">{{ item.quantity }} {{ item.unit || '' }}</template>
              </el-table-column>
              <el-table-column prop="unit_price" label="成交单价" width="110" />
              <el-table-column prop="subtotal" label="小计" width="110" />
              <el-table-column label="复购提醒" width="110">
                <template #default="{ row: item }: { row: CustomerPurchaseItem }">
                  <el-tag :type="item.repeat_reminder_enabled ? 'success' : 'info'">{{ item.repeat_reminder_enabled ? '提醒' : '不提醒' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="预计补货" width="130">
                <template #default="{ row: item }: { row: CustomerPurchaseItem }">{{ item.next_repurchase_date ? formatDate(item.next_repurchase_date) : '-' }}</template>
              </el-table-column>
            </el-table>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="订单编号" min-width="160" />
        <el-table-column prop="company_name" label="客户" min-width="180" />
        <el-table-column prop="quote_no_snapshot" label="来源报价" min-width="170" />
        <el-table-column label="成交日期" width="120">
          <template #default="{ row }: { row: CustomerPurchaseOrder }">{{ formatDate(row.deal_date || row.purchase_date) }}</template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="120" />
        <el-table-column label="付款" width="110">
          <template #default="{ row }: { row: CustomerPurchaseOrder }">{{ label(paymentStatusOptions, row.payment_status) }}</template>
        </el-table-column>
        <el-table-column label="发货" width="110">
          <template #default="{ row }: { row: CustomerPurchaseOrder }">{{ label(deliveryStatusOptions, row.delivery_status) }}</template>
        </el-table-column>
        <el-table-column prop="tracking_no" label="快递单号" min-width="140" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }: { row: CustomerPurchaseOrder }">
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
import { listPurchaseOrders } from '@/api/purchaseOrders';
import type { CustomerPurchaseItem, CustomerPurchaseOrder } from '@/types/api';
import { deliveryStatusOptions, paymentStatusOptions, salesOptionLabel } from '@/utils/salesLabels';

const router = useRouter();
const loading = ref(false);
const items = ref<CustomerPurchaseOrder[]>([]);
const total = ref(0);
const query = reactive<Record<string, any>>({ page: 1, page_size: 10 });

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const result = await listPurchaseOrders(query);
    items.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, { page: 1, page_size: 10, payment_status: undefined, delivery_status: undefined });
  loadData();
}

function goCustomer(row: CustomerPurchaseOrder) {
  router.push({ path: `/customers/${row.customer_id}`, query: { tab: 'orders' } });
}

function label(options: Array<{ label: string; value: string }>, value?: string | null) {
  return salesOptionLabel(options, value);
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

.toolbar .el-select {
  width: 220px;
}

.pagination {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding-top: 14px;
}
</style>
