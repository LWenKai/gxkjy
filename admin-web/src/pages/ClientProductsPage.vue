<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>企业产品库</h1>
        <p>管理本企业的常用产品信息，检测记录、合格证开具时可直接选用，避免重复录入。</p>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <el-input
          v-model.trim="keyword"
          clearable
          placeholder="搜索产品名称 / 产地 / 备注"
          style="width: 240px"
          @keyup.enter="search"
          @clear="search"
        />
        <el-select
          v-model="filterCategory"
          clearable
          placeholder="全部分类"
          style="width: 150px"
          @change="search"
        >
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.name" />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="状态"
          style="width: 130px"
          @change="search"
        >
          <el-option label="正常" value="normal" />
          <el-option label="已停用" value="disabled" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-button type="primary" @click="search">查询</el-button>
        <span class="toolbar-spacer" />
        <el-button type="primary" plain @click="openImport">批量导入</el-button>
        <el-button type="primary" plain @click="openCategoryMgr">分类管理</el-button>
        <el-button type="primary" @click="openCreate">新增产品</el-button>
      </div>

      <el-table v-loading="loading" :data="items" border class="data-table">
        <el-table-column type="index" label="#" width="56" align="center" />
        <el-table-column prop="product_name" label="产品名称" min-width="140" show-overflow-tooltip />
        <el-table-column prop="product_category" label="分类" min-width="110" show-overflow-tooltip>
          <template #default="{ row }: { row: Product }">{{ row.product_category || '—' }}</template>
        </el-table-column>
        <el-table-column prop="spec_model" label="规格" min-width="110" show-overflow-tooltip>
          <template #default="{ row }: { row: Product }">{{ row.spec_model || '—' }}</template>
        </el-table-column>
        <el-table-column prop="default_unit" label="默认单位" width="100" align="center">
          <template #default="{ row }: { row: Product }">{{ row.default_unit || '—' }}</template>
        </el-table-column>
        <el-table-column prop="origin" label="默认产地" min-width="140" show-overflow-tooltip>
          <template #default="{ row }: { row: Product }">{{ row.origin || '—' }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip>
          <template #default="{ row }: { row: Product }">{{ row.remark || '—' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="84" align="center">
          <template #default="{ row }: { row: Product }">
            <el-tag :type="row.status === 'disabled' ? 'info' : 'success'" size="small">
              {{ row.status === 'disabled' ? '已停用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }: { row: Product }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 'disabled'"
              link
              type="success"
              @click="handleEnable(row)"
            >启用</el-button>
            <el-button v-else link type="danger" @click="handleDisable(row)">停用</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && !items.length" description="暂无产品，点击右上角新增产品" />
    </div>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑产品' : '新增产品'"
      width="480px"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <el-form-item label="产品名称" prop="product_name">
          <el-input v-model.trim="form.product_name" maxlength="120" placeholder="例如：西红柿、黄瓜、猪肉" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="form.product_category"
            clearable
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入新分类"
            style="width: 100%"
          >
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model.trim="form.spec_model" maxlength="120" placeholder="可选，例如：500g/袋" />
        </el-form-item>
        <el-form-item label="默认单位">
          <el-select
            v-model="form.default_unit"
            filterable
            allow-create
            default-first-option
            placeholder="如：kg / 箱 / 份"
            style="width: 100%"
          >
            <el-option v-for="u in commonUnits" :key="u" :label="u" :value="u" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认产地">
          <el-input v-model.trim="form.origin" maxlength="255" placeholder="可选，开证时可继续修改" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model.trim="form.remark" maxlength="500" type="textarea" :rows="3" placeholder="内部备注，可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入 -->
    <el-dialog v-model="importVisible" title="批量导入产品" width="520px">
      <div class="import-tip">
        支持 <b>.xlsx / .xls / .csv</b> 文件。首行应为表头，可包含以下列（中文或英文均可）：
        <br />产品名称（必填）、分类、规格、默认单位、默认产地、备注。
      </div>
      <el-upload
        class="import-uploader"
        drag
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        accept=".xlsx,.xls,.csv"
        :on-change="handleFileChange"
        :on-exceed="() => ElMessage.warning('只能选择一个文件')"
      >
        <el-icon class="el-icon--upload"><i class="el-icon" style="font-size: 40px">📄</i></el-icon>
        <div class="el-upload__text">将文件拖到此处，或 <em>点击选择</em></div>
      </el-upload>
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="confirmImport">开始导入</el-button>
      </template>
    </el-dialog>

    <!-- 分类管理 -->
    <el-dialog v-model="categoryVisible" title="产品分类管理" width="460px">
      <div class="cat-add">
        <el-input
          v-model.trim="newCategory"
          placeholder="输入分类名称后回车或点击添加"
          style="flex: 1"
          @keyup.enter="addCategory"
        />
        <el-button type="primary" :loading="catSaving" @click="addCategory">添加</el-button>
      </div>
      <el-table :data="categories" border class="cat-table">
        <el-table-column prop="name" label="分类名称" min-width="160" />
        <el-table-column label="操作" width="100" align="center">
          <template #default="{ row }: { row: ClientProductCategory }">
            <el-button link type="danger" @click="removeCategory(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="categoryVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus';
import * as XLSX from 'xlsx';
import {
  deleteClientProduct,
  listClientProducts,
  listClientProductCategories,
  createClientProductCategory,
  deleteClientCategory,
  saveClientProduct,
  updateClientProduct,
  enableClientProduct,
  importClientProducts,
  type ClientProductCategory,
  type ClientProductPayload,
} from '@/api/client';
import type { Product } from '@/types/api';

const COMMON_CATEGORIES = ['蔬菜', '水果', '肉类', '禽蛋', '水产', '粮油', '干货', '其他'];
const commonUnits = ['kg', 'g', '箱', '袋', '份', '个', '盒', '斤', '吨'];

const items = ref<Product[]>([]);
const loading = ref(false);
const keyword = ref('');
const filterCategory = ref('');
const filterStatus = ref<'normal' | 'disabled' | 'all'>('normal');
const categories = ref<ClientProductCategory[]>([]);

async function loadItems() {
  loading.value = true;
  try {
    items.value = await listClientProducts({
      keyword: keyword.value || undefined,
      category: filterCategory.value || undefined,
      status: filterStatus.value,
    });
  } catch (e) {
    ElMessage.error((e as Error).message || '加载失败');
  } finally {
    loading.value = false;
  }
}

// 合并字典分类与常用预置分类，去重展示在下拉
const mergedCategories = ref<ClientProductCategory[]>([]);
async function loadCategories() {
  try {
    const list = await listClientProductCategories();
    categories.value = list;
    const names = new Set(list.map((c) => c.name));
    mergedCategories.value = [
      ...list,
      ...COMMON_CATEGORIES.filter((n) => !names.has(n)).map((n) => ({ id: `preset-${n}`, name: n })),
    ];
  } catch {
    categories.value = [];
  }
}

function search() {
  loadItems();
}

const dialogVisible = ref(false);
const editingId = ref<string | null>(null);
const saving = ref(false);
const formRef = ref<FormInstance | null>(null);
const form = reactive<ClientProductPayload>({
  product_name: '',
  product_category: '',
  spec_model: '',
  default_unit: 'kg',
  origin: '',
  remark: '',
});

const rules: FormRules<ClientProductPayload> = {
  product_name: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
};

function resetForm() {
  form.product_name = '';
  form.product_category = '';
  form.spec_model = '';
  form.default_unit = 'kg';
  form.origin = '';
  form.remark = '';
  editingId.value = null;
  formRef.value?.clearValidate();
}

function openCreate() {
  editingId.value = null;
  dialogVisible.value = true;
}

function openEdit(row: Product) {
  editingId.value = row.id;
  form.product_name = row.product_name;
  form.product_category = row.product_category || '';
  form.spec_model = row.spec_model || '';
  form.default_unit = row.default_unit || 'kg';
  form.origin = row.origin || '';
  form.remark = row.remark || '';
  dialogVisible.value = true;
}

async function handleSave() {
  if (!formRef.value) return;
  const ok = await formRef.value.validate().catch(() => false);
  if (!ok) return;
  saving.value = true;
  try {
    const payload: ClientProductPayload = {
      product_name: form.product_name,
      product_category: form.product_category || undefined,
      spec_model: form.spec_model || undefined,
      default_unit: form.default_unit || 'kg',
      origin: form.origin || undefined,
      remark: form.remark || undefined,
    };
    if (editingId.value) {
      await updateClientProduct(editingId.value, payload);
      ElMessage.success('已更新');
    } else {
      await saveClientProduct(payload);
      ElMessage.success('已新增');
    }
    dialogVisible.value = false;
    await loadCategories();
    loadItems();
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.message || '保存失败';
    ElMessage.error(msg);
  } finally {
    saving.value = false;
  }
}

async function handleDisable(row: Product) {
  try {
    await ElMessageBox.confirm(
      `确认停用产品「${row.product_name}」？停用后将从产品库中隐藏，不影响已有检测记录与合格证。`,
      '停用确认',
      { type: 'warning', confirmButtonText: '确认停用', cancelButtonText: '取消' },
    );
  } catch {
    return;
  }
  try {
    await deleteClientProduct(row.id);
    ElMessage.success('已停用');
    loadItems();
  } catch (e) {
    ElMessage.error((e as Error).message || '停用失败');
  }
}

async function handleEnable(row: Product) {
  try {
    await enableClientProduct(row.id);
    ElMessage.success('已启用');
    loadItems();
  } catch (e) {
    ElMessage.error((e as Error).message || '启用失败');
  }
}

// 批量导入
const importVisible = ref(false);
const importing = ref(false);
const importFile = ref<File | null>(null);

function openImport() {
  importFile.value = null;
  importVisible.value = true;
}

function handleFileChange(file: UploadFile) {
  importFile.value = (file.raw as File) || null;
}

async function confirmImport() {
  if (!importFile.value) {
    ElMessage.warning('请先选择文件');
    return;
  }
  importing.value = true;
  try {
    const rows = await parseImportFile(importFile.value);
    if (!rows.length) {
      ElMessage.warning('文件中未解析到有效数据');
      return;
    }
    const result = await importClientProducts(rows);
    const msg = `导入完成：成功 ${result.created + result.updated} 条，失败 ${result.failed} 条`;
    if (result.failed > 0) {
      ElMessage.warning(`${msg}；失败明细：${result.errors.slice(0, 3).join('；')}`);
    } else {
      ElMessage.success(msg);
    }
    importVisible.value = false;
    await loadCategories();
    loadItems();
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '导入失败');
  } finally {
    importing.value = false;
  }
}

function parseImportFile(file: File): Promise<ClientProductPayload[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
        const rows: ClientProductPayload[] = json.map((r) => ({
          product_name: String(r['产品名称'] ?? r['product_name'] ?? '').trim(),
          product_category: String(r['分类'] ?? r['product_category'] ?? '').trim() || undefined,
          spec_model: String(r['规格'] ?? r['spec_model'] ?? '').trim() || undefined,
          default_unit: String(r['默认单位'] ?? r['default_unit'] ?? '').trim() || undefined,
          origin: String(r['默认产地'] ?? r['origin'] ?? '').trim() || undefined,
          remark: String(r['备注'] ?? r['remark'] ?? '').trim() || undefined,
        }));
        resolve(rows.filter((r) => r.product_name));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// 分类管理
const categoryVisible = ref(false);
const newCategory = ref('');
const catSaving = ref(false);

function openCategoryMgr() {
  categoryVisible.value = true;
}

async function addCategory() {
  const name = newCategory.value.trim();
  if (!name) {
    ElMessage.warning('请输入分类名称');
    return;
  }
  catSaving.value = true;
  try {
    await createClientProductCategory(name);
    newCategory.value = '';
    await loadCategories();
    ElMessage.success('已添加');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '添加失败');
  } finally {
    catSaving.value = false;
  }
}

async function removeCategory(c: ClientProductCategory) {
  try {
    await ElMessageBox.confirm(`确认删除分类「${c.name}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  try {
    await deleteClientCategory(c.id);
    await loadCategories();
    ElMessage.success('已删除');
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || e?.message || '删除失败');
  }
}

onMounted(() => {
  loadItems();
  loadCategories();
});
</script>

<style scoped>
.page-section {
  padding: 4px;
}
.page-heading {
  margin-bottom: 16px;
}
.page-heading h1 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 4px;
}
.page-heading p {
  margin: 0;
  color: #8a94a6;
  font-size: 13px;
}
.panel {
  background: #fff;
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.toolbar-spacer {
  flex: 1;
}
.data-table {
  width: 100%;
}
.import-tip {
  color: #8a94a6;
  font-size: 13px;
  margin-bottom: 14px;
  line-height: 1.6;
}
.import-uploader {
  width: 100%;
}
.cat-add {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}
.cat-table {
  width: 100%;
}
</style>
