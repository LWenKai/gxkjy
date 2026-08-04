<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>销售产品库</h1>
      </div>
      <div class="heading-actions">
        <el-button v-if="activeTab === 'products'" type="primary" @click="openProductDialog()">新增产品</el-button>
        <el-button v-else type="primary" @click="openPackageDialog()">新增套餐</el-button>
      </div>
    </div>

    <div class="panel">
      <el-tabs v-model="activeTab" class="sales-tabs" @tab-change="onTabChange">
        <el-tab-pane label="单品库" name="products">
          <div class="toolbar">
            <el-input v-model="query.keyword" placeholder="搜索编号、名称、厂家、型号" clearable />
            <el-select v-model="query.category" placeholder="产品分类" clearable>
              <el-option v-for="item in salesProductCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select v-model="query.is_active" placeholder="启用状态" clearable>
              <el-option label="启用" :value="true" />
              <el-option label="停用" :value="false" />
            </el-select>
            <el-button type="primary" @click="loadProducts">查询</el-button>
            <el-button @click="resetProductQuery">重置</el-button>
          </div>

          <el-table :data="items" border v-loading="loading" empty-text="暂无销售产品">
            <el-table-column prop="product_no" label="产品编号" width="120" />
            <el-table-column prop="name" label="产品名称" min-width="180" />
            <el-table-column prop="model" label="型号" width="140" />
            <el-table-column label="分类" min-width="140">
              <template #default="{ row }: { row: SalesProduct }">{{ categoryLabel(row.category) }}</template>
            </el-table-column>
            <el-table-column prop="brand" label="厂家" width="110" />
            <el-table-column prop="unit" label="单位" width="70" />
            <el-table-column prop="default_sale_price" label="默认售价" width="110" />
            <el-table-column prop="reference_cost_price" label="参考成本" width="110" />
            <el-table-column label="复购提醒" width="110">
              <template #default="{ row }: { row: SalesProduct }">
                <el-tag :type="row.repeat_reminder_enabled ? 'success' : 'info'">
                  {{ row.repeat_reminder_enabled ? '需要提醒' : '不提醒' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="参考周期" width="110">
              <template #default="{ row }: { row: SalesProduct }">{{ row.reference_cycle_days ? `${row.reference_cycle_days}天` : '-' }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80">
              <template #default="{ row }: { row: SalesProduct }">
                <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }: { row: SalesProduct }">
                <el-button link type="primary" @click="openProductDialog(row)">编辑</el-button>
                <el-button link :type="row.is_active ? 'warning' : 'success'" @click="toggleProductActive(row)">
                  {{ row.is_active ? '停用' : '启用' }}
                </el-button>
                <el-button link type="danger" @click="removeProduct(row)">删除</el-button>
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
              @current-change="loadProducts"
              @size-change="loadProducts"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="销售套餐" name="packages">
          <div class="toolbar">
            <el-input v-model="packageQuery.keyword" placeholder="搜索套餐编号、名称" clearable />
            <el-select v-model="packageQuery.type" placeholder="套餐类型" clearable>
              <el-option v-for="item in packageTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select v-model="packageQuery.is_active" placeholder="启用状态" clearable>
              <el-option label="启用" :value="true" />
              <el-option label="停用" :value="false" />
            </el-select>
            <el-button type="primary" @click="loadPackages">查询</el-button>
            <el-button @click="resetPackageQuery">重置</el-button>
          </div>

          <el-table :data="packageItems" border v-loading="packageLoading" empty-text="暂无销售套餐">
            <el-table-column prop="package_no" label="套餐编号" width="130" />
            <el-table-column prop="name" label="套餐名称" min-width="180" />
            <el-table-column label="类型" width="110">
              <template #default="{ row }: { row: SalesProductPackage }">{{ packageTypeLabel(row.type) }}</template>
            </el-table-column>
            <el-table-column prop="item_count" label="产品数量" width="90" />
            <el-table-column label="套餐总价" width="130">
              <template #default="{ row }: { row: SalesProductPackage }">¥ {{ row.total_amount }}</template>
            </el-table-column>
            <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
            <el-table-column label="状态" width="80">
              <template #default="{ row }: { row: SalesProductPackage }">
                <el-tag :type="row.is_active ? 'success' : 'info'">{{ row.is_active ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }: { row: SalesProductPackage }">
                <el-button link type="primary" @click="openPackageDialog(row)">编辑</el-button>
                <el-button link :type="row.is_active ? 'warning' : 'success'" @click="togglePackageActive(row)">
                  {{ row.is_active ? '停用' : '启用' }}
                </el-button>
                <el-button link type="danger" @click="removePackage(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <span>共 {{ packageTotal }} 条</span>
            <el-pagination
              v-model:current-page="packageQuery.page"
              v-model:page-size="packageQuery.page_size"
              layout="sizes, prev, pager, next, jumper"
              :total="packageTotal"
              @current-change="loadPackages"
              @size-change="loadPackages"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑销售产品' : '新增销售产品'" width="820px">
      <el-form :model="form" label-width="128px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item label="产品名称" required><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="产品分类" required>
              <el-select v-model="form.category">
                <el-option v-for="item in salesProductCategoryOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="厂家"><el-input v-model="form.brand" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="型号"><el-input v-model="form.model" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="规格"><el-input v-model="form.specification" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="单位"><el-input v-model="form.unit" placeholder="台、盒、条、卷、年、次" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="默认销售价"><el-input v-model="form.default_sale_price" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="参考成本"><el-input v-model="form.reference_cost_price" /></el-form-item></el-col>
          <el-col :span="24">
            <div class="suggested-price-card" :class="{ muted: !suggestedPriceRange }">
              <template v-if="suggestedPriceRange">
                <div class="suggested-price-summary">
                  <div>
                    <span>建议销售价区间</span>
                    <strong>{{ formatCurrency(suggestedPriceRange.middlePrice) }}</strong>
                    <small>中位建议价，可一键填入默认销售价</small>
                  </div>
                  <el-button type="primary" plain @click="fillSuggestedPrice">填入默认销售价</el-button>
                </div>
                <div class="suggested-price-band">
                  <div><span>最低建议价</span><strong>{{ formatCurrency(suggestedPriceRange.minPrice) }}</strong></div>
                  <div class="highlight"><span>建议中位价</span><strong>{{ formatCurrency(suggestedPriceRange.middlePrice) }}</strong></div>
                  <div><span>最高参考价</span><strong>{{ formatCurrency(suggestedPriceRange.maxPrice) }}</strong></div>
                </div>
                <div class="suggested-price-meta">
                  参考成本 {{ formatCurrency(suggestedPriceRange.cost) }} · 毛利率 35% - 80% · 预计毛利
                  {{ formatCurrency(suggestedPriceRange.minGrossProfit) }} - {{ formatCurrency(suggestedPriceRange.maxGrossProfit) }}
                </div>
              </template>
              <template v-else>
                <span>填写参考成本后自动计算 35%-80% 毛利率建议销售价区间</span>
              </template>
            </div>
          </el-col>
          <el-col :span="12"><el-form-item label="复购提醒"><el-switch v-model="form.repeat_reminder_enabled" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="参考复购周期"><el-input-number v-model="form.reference_cycle_days" :min="1" /> 天</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="提前提醒"><el-input-number v-model="form.default_reminder_days_before" :min="1" /> 天</el-form-item></el-col>
          <el-col :span="12"><el-form-item label="排序"><el-input-number v-model="form.sort_order" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="启用"><el-switch v-model="form.is_active" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="产品说明"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item></el-col>
          <el-col v-if="editingId" :span="24">
            <el-form-item label="产品图片">
              <div class="image-upload-row">
                <el-button @click="productImageInput?.click()">选择图片</el-button>
                <span>支持 JPG、PNG，建议使用清晰产品图。</span>
                <input ref="productImageInput" class="hidden-file-input" type="file" accept=".jpg,.jpeg,.png" @change="uploadImage" />
              </div>
              <img v-if="form.image_url" class="product-image" :src="String(form.image_url)" alt="产品图片" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveProduct">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="packageDialogVisible" :title="editingPackageId ? '编辑销售套餐' : '新增销售套餐'" width="1080px" class="package-dialog">
      <el-form :model="packageForm" label-width="104px">
        <el-row :gutter="16">
          <el-col :span="10"><el-form-item label="套餐名称" required><el-input v-model="packageForm.name" /></el-form-item></el-col>
          <el-col :span="6">
            <el-form-item label="套餐类型">
              <el-select v-model="packageForm.type">
                <el-option v-for="item in packageTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4"><el-form-item label="排序"><el-input-number v-model="packageForm.sort_order" /></el-form-item></el-col>
          <el-col :span="4"><el-form-item label="启用"><el-switch v-model="packageForm.is_active" /></el-form-item></el-col>
          <el-col :span="24"><el-form-item label="套餐说明"><el-input v-model="packageForm.description" /></el-form-item></el-col>
        </el-row>

        <div class="package-tools">
          <strong>套餐产品明细</strong>
          <el-button type="primary" @click="addPackageItem">添加产品</el-button>
        </div>
        <el-table :data="packageForm.items" border>
          <el-table-column label="销售产品" min-width="220">
            <template #default="{ row }: { row: Record<string, any> }">
              <el-select v-model="row.sales_product_id" filterable remote reserve-keyword placeholder="搜索产品" :remote-method="searchProducts" @change="onPackageProductSelected(row)">
                <el-option v-for="product in productOptions" :key="product.id" :label="productOptionLabel(product)" :value="product.id" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="产品名称" min-width="150"><template #default="{ row }"><el-input v-model="row.product_name" /></template></el-table-column>
          <el-table-column label="规格配置" min-width="150"><template #default="{ row }"><el-input v-model="row.specification" /></template></el-table-column>
          <el-table-column label="数量" width="105"><template #default="{ row }"><el-input v-model="row.quantity" @input="recalcPackageItem(row)" /></template></el-table-column>
          <el-table-column label="单位" width="80"><template #default="{ row }"><el-input v-model="row.unit" /></template></el-table-column>
          <el-table-column label="套餐单价" width="120"><template #default="{ row }"><el-input v-model="row.unit_price" @input="recalcPackageItem(row)" /></template></el-table-column>
          <el-table-column label="小计" width="110"><template #default="{ row }">{{ row.subtotal || '0.00' }}</template></el-table-column>
          <el-table-column label="备注" min-width="130"><template #default="{ row }"><el-input v-model="row.item_remark" /></template></el-table-column>
          <el-table-column label="操作" width="80"><template #default="{ $index }"><el-button link type="danger" @click="packageForm.items.splice($index, 1)">删除</el-button></template></el-table-column>
        </el-table>
        <div class="total-line">套餐总价：<strong>{{ packageFormTotal }}</strong> 元</div>
        <el-form-item label="内部备注"><el-input v-model="packageForm.remark" type="textarea" :rows="2" resize="none" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="packageDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="packageSaving" @click="savePackage">保存套餐</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  createSalesProduct,
  deleteSalesProduct,
  listSalesProducts,
  setSalesProductActive,
  updateSalesProduct,
  uploadSalesProductImage,
} from '@/api/salesProducts';
import {
  createSalesProductPackage,
  deleteSalesProductPackage,
  listSalesProductPackages,
  setSalesProductPackageActive,
  updateSalesProductPackage,
} from '@/api/salesProductPackages';
import type { SalesProduct, SalesProductPackage } from '@/types/api';
import { salesOptionLabel, salesProductCategoryOptions } from '@/utils/salesLabels';

const activeTab = ref<'products' | 'packages'>('products');
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const editingId = ref('');
const productImageInput = ref<HTMLInputElement>();
const items = ref<SalesProduct[]>([]);
const total = ref(0);
const query = reactive<Record<string, any>>({ page: 1, page_size: 10 });
const form = reactive<Record<string, any>>({});

const packageLoading = ref(false);
const packageSaving = ref(false);
const packageDialogVisible = ref(false);
const editingPackageId = ref('');
const packageItems = ref<SalesProductPackage[]>([]);
const packageTotal = ref(0);
const packageQuery = reactive<Record<string, any>>({ page: 1, page_size: 10 });
const packageForm = reactive<Record<string, any>>({});
const productOptions = ref<SalesProduct[]>([]);

const packageTypeOptions = [
  { label: '基础版', value: 'BASIC' },
  { label: '升级版', value: 'UPGRADE' },
  { label: '高级版', value: 'PREMIUM' },
  { label: '定制套餐', value: 'CUSTOM' },
];

const MIN_MARGIN_RATE = 0.35;
const MAX_MARGIN_RATE = 0.8;
const MIDDLE_MARGIN_RATE = (MIN_MARGIN_RATE + MAX_MARGIN_RATE) / 2;

const suggestedPriceRange = computed(() => {
  const cost = parseAmount(form.reference_cost_price);
  if (!cost || cost <= 0) return null;
  return getPriceRange(cost);
});

const packageFormTotal = computed(() =>
  (packageForm.items || []).reduce((sum: number, item: Record<string, any>) => sum + Number(item.subtotal || 0), 0).toFixed(2),
);

onMounted(loadProducts);

function onTabChange() {
  if (activeTab.value === 'packages' && !packageItems.value.length) loadPackages();
}

async function loadProducts() {
  loading.value = true;
  try {
    const result = await listSalesProducts(query);
    items.value = result.items;
    total.value = result.total;
  } finally {
    loading.value = false;
  }
}

async function loadPackages() {
  packageLoading.value = true;
  try {
    const result = await listSalesProductPackages(packageQuery);
    packageItems.value = result.items;
    packageTotal.value = result.total;
  } finally {
    packageLoading.value = false;
  }
}

function resetProductQuery() {
  Object.assign(query, { page: 1, page_size: 10, keyword: undefined, category: undefined, is_active: undefined });
  loadProducts();
}

function resetPackageQuery() {
  Object.assign(packageQuery, { page: 1, page_size: 10, keyword: undefined, type: undefined, is_active: undefined });
  loadPackages();
}

function openProductDialog(row?: SalesProduct) {
  Object.keys(form).forEach((key) => delete form[key]);
  editingId.value = row?.id || '';
  Object.assign(
    form,
    row || {
      category: 'OTHER',
      unit: '件',
      is_active: true,
      repeat_reminder_enabled: false,
      default_reminder_days_before: 7,
      sort_order: 0,
    },
  );
  if (!form.reference_cycle_days && form.default_cycle_days) {
    form.reference_cycle_days = form.default_cycle_days;
  }
  dialogVisible.value = true;
}

async function saveProduct() {
  if (!form.name) {
    ElMessage.warning('请输入产品名称');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) await updateSalesProduct(editingId.value, form);
    else await createSalesProduct(form);
    ElMessage.success('销售产品已保存');
    dialogVisible.value = false;
    loadProducts();
  } finally {
    saving.value = false;
  }
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !editingId.value) return;
  const product = await uploadSalesProductImage(editingId.value, file);
  input.value = '';
  Object.assign(form, product);
  ElMessage.success('产品图片已上传');
  loadProducts();
}

async function toggleProductActive(row: SalesProduct) {
  await setSalesProductActive(row.id, !row.is_active);
  ElMessage.success(row.is_active ? '已停用' : '已启用');
  loadProducts();
}

async function removeProduct(row: SalesProduct) {
  await ElMessageBox.confirm(`确认删除销售产品「${row.name}」？历史订单仍会保留产品快照。`, '删除销售产品', { type: 'warning' });
  await deleteSalesProduct(row.id);
  ElMessage.success('已删除');
  loadProducts();
}

function openPackageDialog(row?: SalesProductPackage) {
  Object.keys(packageForm).forEach((key) => delete packageForm[key]);
  editingPackageId.value = row?.id || '';
  Object.assign(
    packageForm,
    row
      ? {
          ...row,
          items: row.items.map((item) => ({ ...item })),
        }
      : {
          type: 'BASIC',
          is_active: true,
          sort_order: 0,
          items: [createBlankPackageItem()],
        },
  );
  searchProducts('');
  packageDialogVisible.value = true;
}

function addPackageItem() {
  packageForm.items.push(createBlankPackageItem());
}

function createBlankPackageItem() {
  return {
    sales_product_id: '',
    product_name: '',
    brand: '',
    model: '',
    specification: '',
    unit: '件',
    quantity: '1',
    unit_price: '0.00',
    subtotal: '0.00',
    item_remark: '',
  };
}

async function searchProducts(keyword: string) {
  const result = await listSalesProducts({ page: 1, page_size: 30, keyword, is_active: true });
  productOptions.value = result.items;
}

function onPackageProductSelected(row: Record<string, any>) {
  const product = productOptions.value.find((item) => item.id === row.sales_product_id);
  if (!product) return;
  fillProductSnapshot(row, product);
  row.unit_price = product.default_sale_price || '0.00';
  recalcPackageItem(row);
}

function fillProductSnapshot(row: Record<string, any>, product: SalesProduct) {
  row.product_name = product.name;
  row.brand = product.brand || '';
  row.model = product.model || '';
  row.specification = product.specification || '';
  row.unit = product.unit || '件';
}

function recalcPackageItem(row: Record<string, any>) {
  row.subtotal = (Number(row.quantity || 0) * Number(row.unit_price || 0)).toFixed(2);
}

async function savePackage() {
  if (!packageForm.name) {
    ElMessage.warning('请输入套餐名称');
    return;
  }
  if (!packageForm.items?.length || packageForm.items.some((item: Record<string, any>) => !item.product_name || Number(item.quantity) <= 0)) {
    ElMessage.warning('请完善套餐产品和数量');
    return;
  }
  packageSaving.value = true;
  try {
    const payload = {
      name: packageForm.name,
      type: packageForm.type,
      description: packageForm.description,
      is_active: packageForm.is_active,
      sort_order: packageForm.sort_order,
      remark: packageForm.remark,
      items: packageForm.items.map((item: Record<string, any>, index: number) => ({
        sales_product_id: item.sales_product_id || undefined,
        product_name: item.product_name,
        brand: item.brand || undefined,
        model: item.model || undefined,
        specification: item.specification || undefined,
        unit: item.unit || undefined,
        quantity: String(item.quantity || '0'),
        unit_price: String(item.unit_price || '0'),
        item_remark: item.item_remark || undefined,
        sort_order: index + 1,
      })),
    };
    if (editingPackageId.value) await updateSalesProductPackage(editingPackageId.value, payload);
    else await createSalesProductPackage(payload);
    ElMessage.success('销售套餐已保存');
    packageDialogVisible.value = false;
    loadPackages();
  } finally {
    packageSaving.value = false;
  }
}

async function togglePackageActive(row: SalesProductPackage) {
  await setSalesProductPackageActive(row.id, !row.is_active);
  ElMessage.success(row.is_active ? '已停用' : '已启用');
  loadPackages();
}

async function removePackage(row: SalesProductPackage) {
  await ElMessageBox.confirm(`确认删除销售套餐「${row.name}」？历史报价不会受影响。`, '删除销售套餐', { type: 'warning' });
  await deleteSalesProductPackage(row.id);
  ElMessage.success('已删除');
  loadPackages();
}

function categoryLabel(value: string) {
  return salesOptionLabel(salesProductCategoryOptions, value);
}

function packageTypeLabel(value: string) {
  return salesOptionLabel(packageTypeOptions, value);
}

function productOptionLabel(product: SalesProduct) {
  const model = product.model;
  return `${product.name}${model ? ' / ' + model : ''}`;
}

function fillSuggestedPrice() {
  if (!suggestedPriceRange.value) return;
  form.default_sale_price = formatAmountInput(suggestedPriceRange.value.middlePrice);
}

function parseAmount(value: unknown) {
  if (value === null || value === undefined || value === '') return 0;
  const amount = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(amount) ? amount : 0;
}

function getPriceRange(cost: number) {
  const minPrice = roundSuggestedPrice(cost / (1 - MIN_MARGIN_RATE));
  const middlePrice = getMiddleSuggestedPrice(cost);
  const maxPrice = roundSuggestedPrice(cost / (1 - MAX_MARGIN_RATE));
  return {
    cost,
    minPrice,
    middlePrice,
    maxPrice,
    minGrossProfit: Math.max(0, minPrice - cost),
    maxGrossProfit: Math.max(0, maxPrice - cost),
  };
}

function getMiddleSuggestedPrice(cost: number) {
  return roundSuggestedPrice(cost / (1 - MIDDLE_MARGIN_RATE));
}

function roundSuggestedPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (price < 100) return Math.round(price);
  if (price < 1000) return Math.round(price / 10) * 10;
  return Math.round(price / 100) * 100;
}

function formatAmountInput(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function formatCurrency(value: number) {
  return `¥ ${Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
</script>

<style scoped>
.heading-actions,
.toolbar,
.package-tools {
  display: flex;
  gap: 10px;
}

.heading-actions,
.package-tools {
  align-items: center;
}

.package-tools {
  justify-content: space-between;
  margin: 8px 0 12px;
}

.toolbar {
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.toolbar .el-input,
.toolbar .el-select {
  width: 220px;
}

.pagination {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding-top: 14px;
}

.sales-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.product-image {
  border: 1px solid #dbe6e1;
  border-radius: 8px;
  display: block;
  height: 92px;
  margin-top: 10px;
  object-fit: cover;
  width: 128px;
}

.image-upload-row {
  align-items: center;
  display: flex;
  gap: 12px;
}

.image-upload-row span {
  color: #6b7280;
  font-size: 13px;
}

.hidden-file-input {
  display: none;
}

.suggested-price-card {
  background: #f6fbf8;
  border: 1px solid #d8eee3;
  border-radius: 14px;
  padding: 14px;
}

.suggested-price-card.muted {
  color: #6b7280;
  text-align: center;
}

.suggested-price-summary {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.suggested-price-summary span,
.suggested-price-band span {
  color: #60766d;
  display: block;
  font-size: 12px;
  margin-bottom: 4px;
}

.suggested-price-summary strong {
  color: #0b7a4b;
  display: block;
  font-size: 24px;
  line-height: 1.1;
}

.suggested-price-summary small {
  color: #6b7280;
  display: block;
  margin-top: 4px;
}

.suggested-price-band {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.suggested-price-band > div {
  background: #fff;
  border: 1px solid #e4eee9;
  border-radius: 12px;
  padding: 10px 12px;
}

.suggested-price-band > div.highlight {
  border-color: #9ad9b6;
}

.suggested-price-band strong {
  color: #173529;
  font-size: 16px;
}

.suggested-price-meta {
  color: #6b7280;
  font-size: 12px;
  margin-top: 10px;
}

.total-line {
  color: #334155;
  margin: 12px 0 16px;
  text-align: right;
}

.total-line strong {
  color: #064e3b;
  font-size: 18px;
}

.package-dialog :deep(.el-dialog__body) {
  max-height: 70vh;
  overflow: auto;
}

@media (max-width: 900px) {
  .suggested-price-card {
    margin-left: 0;
  }

  .suggested-price-summary {
    flex-direction: column;
  }
}
</style>
