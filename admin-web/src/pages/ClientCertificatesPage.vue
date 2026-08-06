<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>合格证</h1>
      </div>
    </div>

    <div class="panel search-panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 130px">
            <el-option label="正常" value="normal" />
            <el-option label="已作废" value="voided" />
          </el-select>
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model.trim="query.product_name" placeholder="名称关键字" style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="panel">
      <el-table v-loading="loading" :data="items" border class="data-table" empty-text="暂无合格证">
        <el-table-column prop="certificate_no" label="合格证编号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="product_name" label="产品名称" min-width="130" />
        <el-table-column prop="quantity" label="数量" min-width="90">
          <template #default="{ row }">{{ row.quantity }} {{ row.unit }}</template>
        </el-table-column>
        <el-table-column prop="issuer_name" label="开具人" min-width="120" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'">
              {{ row.status === 'normal' ? '正常' : '已作废' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开具时间" min-width="155">
          <template #default="{ row }">{{ formatDateTime(row.issue_time) }}</template>
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
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { listClientCertificates } from '@/api/client';
import type { Certificate } from '@/types/api';
import { formatDateTime } from '@/utils/time';

const loading = ref(false);
const total = ref(0);
const items = ref<Certificate[]>([]);

const query = reactive({
  page: 1,
  page_size: 10,
  status: '' as 'normal' | 'voided' | '',
  product_name: '',
});

onMounted(loadItems);

async function loadItems() {
  loading.value = true;
  try {
    const data = await listClientCertificates({
      page: query.page,
      page_size: query.page_size,
      status: query.status || undefined,
      product_name: query.product_name || undefined,
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
  query.status = '';
  query.product_name = '';
  search();
}
</script>
