<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>复购提醒</h1>
        <p>按成交订单明细提醒，不同产品可设置不同补货周期。</p>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <el-select v-model="query.range" placeholder="提醒范围" clearable>
          <el-option label="已逾期" value="overdue" />
          <el-option label="7天内" value="7d" />
          <el-option label="30天内" value="30d" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-select v-model="query.status" placeholder="复购状态" clearable>
          <el-option v-for="item in repurchaseStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <el-table :data="items" border v-loading="loading" empty-text="暂无复购提醒">
        <el-table-column prop="company_name" label="客户" min-width="180" />
        <el-table-column prop="contact_name" label="联系人" width="110" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="product_name" label="产品" min-width="180" />
        <el-table-column label="上次购买" width="120">
          <template #default="{ row }: { row: CustomerRepurchaseReminder }">{{ formatDate(row.purchase_date) }}</template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="unit_price" label="单价" width="100" />
        <el-table-column label="预计补货" width="120">
          <template #default="{ row }: { row: CustomerRepurchaseReminder }">{{ formatDate(row.next_repurchase_date) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }: { row: CustomerRepurchaseReminder }">{{ label(row.repurchase_status) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }: { row: CustomerRepurchaseReminder }">
            <el-button link type="primary" @click="makeQuote(row)">生成复购报价</el-button>
            <el-dropdown trigger="click" @command="(status: string) => updateStatus(row, status)">
              <el-button link>标记</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="CONTACTED">已联系</el-dropdown-item>
                  <el-dropdown-item command="NO_NEED">暂不需要</el-dropdown-item>
                  <el-dropdown-item command="REPURCHASED">已补货</el-dropdown-item>
                  <el-dropdown-item command="CANCELLED">取消提醒</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { listRepurchaseReminders, updateRepurchaseStatus } from '@/api/purchaseOrders';
import { createRepurchaseQuote } from '@/api/salesQuotes';
import type { CustomerRepurchaseReminder, RepurchaseStatus } from '@/types/api';
import { repurchaseStatusOptions, salesOptionLabel } from '@/utils/salesLabels';

const loading = ref(false);
const items = ref<CustomerRepurchaseReminder[]>([]);
const query = reactive<Record<string, any>>({ range: '7d', status: 'PENDING' });

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    items.value = await listRepurchaseReminders(query);
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  Object.assign(query, { range: '7d', status: 'PENDING' });
  loadData();
}

async function updateStatus(row: CustomerRepurchaseReminder, status: string) {
  await updateRepurchaseStatus(row.id, status as RepurchaseStatus);
  ElMessage.success('复购状态已更新');
  loadData();
}

async function makeQuote(row: CustomerRepurchaseReminder) {
  await createRepurchaseQuote(row.id);
  ElMessage.success('已生成复购报价，请到报价管理中查看并调整');
  loadData();
}

function label(value?: string | null) {
  return salesOptionLabel(repurchaseStatusOptions, value);
}

function formatDate(value?: string | null) {
  return value ? value.slice(0, 10) : '-';
}
</script>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.toolbar .el-select {
  width: 220px;
}
</style>
