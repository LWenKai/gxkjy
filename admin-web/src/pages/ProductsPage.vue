<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>产品库</h1>
        <p>维护客户常用产品资料，减少检测录入和开具合格证时的重复填写。</p>
      </div>
      <el-button type="primary" @click="openDialog()">新增产品</el-button>
    </div>

    <div class="panel search-panel">
      <el-form :inline="true" :model="query" class="filter-form">
        <el-form-item label="企业">
          <el-select v-model="query.company_id" filterable clearable placeholder="全部企业" style="width: 220px">
            <el-option
              v-for="company in companies"
              :key="company.id"
              :label="company.name"
              :value="company.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="产品名称">
          <el-input v-model.trim="query.product_name" clearable placeholder="请输入产品名称" @keyup.enter="loadProducts" />
        </el-form-item>
        <el-form-item label="产品分类">
          <el-input v-model.trim="query.product_category" clearable placeholder="例如：蔬菜" @keyup.enter="loadProducts" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable placeholder="全部" style="width: 120px">
            <el-option label="正常" value="normal" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadProducts">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
          <el-button :loading="exporting" @click="handleExport">导出</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="panel">
      <el-table v-loading="loading" :data="products" border class="data-table" empty-text="暂无产品，请先新增常用产品">
        <el-table-column prop="company_name" label="所属企业" min-width="180" />
        <el-table-column prop="product_name" label="产品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="product_category" label="分类" min-width="110">
          <template #default="{ row }: { row: Product }">{{ row.product_category || '-' }}</template>
        </el-table-column>
        <el-table-column prop="spec_model" label="规格" min-width="120" show-overflow-tooltip>
          <template #default="{ row }: { row: Product }">{{ row.spec_model || '-' }}</template>
        </el-table-column>
        <el-table-column prop="origin" label="默认产地" min-width="150" show-overflow-tooltip>
          <template #default="{ row }: { row: Product }">{{ row.origin || '-' }}</template>
        </el-table-column>
        <el-table-column prop="default_unit" label="单位" width="90" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }: { row: Product }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'info'">
              {{ row.status === 'normal' ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }: { row: Product }">
            <el-space :size="6">
              <el-button size="small" text type="primary" @click="openDialog(row)">编辑</el-button>
              <el-dropdown trigger="click">
                <el-button size="small" text>更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="row.status === 'disabled'" @click="changeStatus(row, 'enable')">
                      启用
                    </el-dropdown-item>
                    <el-dropdown-item v-else @click="changeStatus(row, 'disable')">
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
          layout="prev, pager, next"
          :total="total"
          :page-size="query.page_size"
          v-model:current-page="query.page"
          @current-change="loadProducts"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingProduct ? '编辑产品' : '新增产品'" width="620px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属企业" prop="company_id">
          <el-select v-model="form.company_id" filterable placeholder="请选择企业" style="width: 100%">
            <el-option
              v-for="company in companies"
              :key="company.id"
              :label="company.name"
              :value="company.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="产品名称" prop="product_name">
          <el-input v-model.trim="form.product_name" placeholder="例如：西红柿、黄瓜、猪肉" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model.trim="form.product_category" placeholder="例如：蔬菜、水果、肉类" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model.trim="form.spec_model" placeholder="可选，例如：500g/袋" />
        </el-form-item>
        <el-form-item label="默认产地">
          <el-input v-model.trim="form.origin" placeholder="可选，开证时可继续修改" />
        </el-form-item>
        <el-form-item label="默认单位">
          <el-input v-model.trim="form.default_unit" placeholder="kg" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model.trim="form.remark" type="textarea" :rows="3" placeholder="内部备注，可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { listCompanies } from '@/api/companies';
import {
  createProduct,
  disableProduct,
  enableProduct,
  exportProducts,
  listProducts,
  updateProduct,
} from '@/api/products';
import type { Company, Product } from '@/types/api';

const loading = ref(false);
const saving = ref(false);
const exporting = ref(false);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const products = ref<Product[]>([]);
const companies = ref<Company[]>([]);
const total = ref(0);
const editingProduct = ref<Product | null>(null);

const query = reactive({
  page: 1,
  page_size: 10,
  company_id: '',
  product_name: '',
  product_category: '',
  status: '' as '' | 'normal' | 'disabled',
});

const form = reactive({
  company_id: '',
  product_name: '',
  product_category: '',
  spec_model: '',
  origin: '',
  default_unit: 'kg',
  remark: '',
});

const rules: FormRules = {
  company_id: [{ required: true, message: '请选择企业', trigger: 'change' }],
  product_name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
};

onMounted(async () => {
  const companyData = await listCompanies({ page: 1, page_size: 100 });
  companies.value = companyData.items;
  await loadProducts();
});

async function loadProducts() {
  loading.value = true;
  try {
    const data = await listProducts(query);
    products.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.page = 1;
  query.company_id = '';
  query.product_name = '';
  query.product_category = '';
  query.status = '';
  loadProducts();
}

async function handleExport() {
  await ElMessageBox.confirm(
    `将按当前筛选条件导出 ${total.value} 条产品数据，文件格式为 CSV。是否继续？`,
    '导出确认',
    { confirmButtonText: '确认导出', cancelButtonText: '取消', type: 'info' },
  );
  exporting.value = true;
  try {
    await exportProducts({
      company_id: query.company_id || undefined,
      product_name: query.product_name || undefined,
      product_category: query.product_category || undefined,
      status: query.status || undefined,
    });
    ElMessage.success('产品数据已导出');
  } finally {
    exporting.value = false;
  }
}

function openDialog(product?: Product) {
  editingProduct.value = product || null;
  form.company_id = product?.company_id || query.company_id || '';
  form.product_name = product?.product_name || '';
  form.product_category = product?.product_category || '';
  form.spec_model = product?.spec_model || '';
  form.origin = product?.origin || '';
  form.default_unit = product?.default_unit || 'kg';
  form.remark = product?.remark || '';
  dialogVisible.value = true;
}

async function saveProduct() {
  await formRef.value?.validate();
  saving.value = true;
  try {
    if (editingProduct.value) {
      await updateProduct(editingProduct.value.id, form);
      ElMessage.success('产品已更新');
    } else {
      await createProduct(form);
      ElMessage.success('产品已创建');
    }
    dialogVisible.value = false;
    await loadProducts();
  } finally {
    saving.value = false;
  }
}

async function changeStatus(product: Product, action: 'enable' | 'disable') {
  const text = action === 'enable' ? '启用' : '停用';
  await ElMessageBox.confirm(`确认${text}产品“${product.product_name}”吗？`, '确认操作', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: action === 'enable' ? 'success' : 'warning',
  });
  if (action === 'enable') await enableProduct(product.id);
  else await disableProduct(product.id);
  ElMessage.success(`产品已${text}`);
  await loadProducts();
}
</script>
