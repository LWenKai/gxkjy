<template>
  <section class="page-section">
    <div class="page-heading gx-page-heading">
      <div>
        <h1>官网资料管理</h1>
        <p>上传、编辑和公开官网资料。公开资料会展示在官网资料中心。</p>
      </div>
      <div class="heading-actions">
        <el-button @click="loadMaterials">刷新</el-button>
        <el-button type="primary" @click="uploadDialogVisible = true">上传资料</el-button>
      </div>
    </div>

    <el-alert
      class="detail-alert"
      title="官网资料用于客户了解谷芯科技业务，不等同于监管正式报表。请勿上传含密码、密钥、客户隐私的文件。"
      type="info"
      :closable="false"
      show-icon
    />

    <div class="panel search-panel">
      <el-form class="filter-form" :model="query" inline>
        <el-form-item label="分类">
          <el-select v-model="query.category" clearable placeholder="全部分类">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="公开状态">
          <el-select v-model="query.is_public" clearable placeholder="全部">
            <el-option label="公开" :value="true" />
            <el-option label="隐藏" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="首页推荐">
          <el-select v-model="query.is_recommended" clearable placeholder="全部">
            <el-option label="推荐" :value="true" />
            <el-option label="不推荐" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="panel">
      <el-table
        v-loading="loading"
        :data="materials"
        border
        class="data-table adaptive-table"
        empty-text="暂无官网资料，请先上传"
      >
        <el-table-column label="资料" min-width="230">
          <template #default="{ row }: { row: WebsiteMaterial }">
            <div class="code-stack">
              <strong>{{ row.title }}</strong>
              <span>{{ row.file_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" min-width="130" />
        <el-table-column label="简介" min-width="240">
          <template #default="{ row }: { row: WebsiteMaterial }">
            <el-tooltip :content="row.description" placement="top" :disabled="!row.description || row.description.length < 22">
              <span class="truncate-text">{{ row.description || '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="格式/大小" min-width="130">
          <template #default="{ row }: { row: WebsiteMaterial }">
            <div class="code-stack">
              <span>{{ formatMime(row.mime_type) }}</span>
              <small>{{ formatFileSize(Number(row.file_size || 0)) }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="状态" width="150">
          <template #default="{ row }: { row: WebsiteMaterial }">
            <el-tag :type="row.is_public ? 'success' : 'info'">
              {{ row.is_public ? '公开' : '隐藏' }}
            </el-tag>
            <el-tag v-if="row.is_recommended" class="tag-gap" type="warning">首页推荐</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }: { row: WebsiteMaterial }">
            <div class="table-actions">
              <el-button text type="primary" @click="openMaterial(row)">查看</el-button>
              <el-button text type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-button text :type="row.is_public ? 'warning' : 'success'" @click="togglePublic(row)">
                {{ row.is_public ? '隐藏' : '公开' }}
              </el-button>
              <el-button text type="danger" @click="removeMaterial(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.page_size"
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          :page-sizes="[10, 20, 50]"
          @change="loadMaterials"
        />
      </div>
    </div>

    <el-dialog v-model="uploadDialogVisible" title="上传官网资料" width="620px">
      <el-form :model="uploadForm" label-width="110px">
        <el-form-item label="资料名称">
          <el-input v-model.trim="uploadForm.title" placeholder="例如：快检室标准配置资料" />
        </el-form-item>
        <el-form-item label="资料分类">
          <el-select v-model="uploadForm.category" style="width: 100%">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model.trim="uploadForm.description" type="textarea" :rows="3" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="uploadForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="公开展示">
          <el-switch v-model="uploadForm.is_public" />
        </el-form-item>
        <el-form-item label="推荐首页">
          <el-switch v-model="uploadForm.is_recommended" />
        </el-form-item>
        <el-upload
          drag
          :auto-upload="false"
          :show-file-list="false"
          :on-change="handleFileSelect"
          :accept="acceptTypes"
        >
          <div class="upload-drop">
            <strong>选择资料文件</strong>
            <div>支持图片、PDF、Word、Excel、PPT，单文件不超过 20MB</div>
          </div>
        </el-upload>
        <div v-if="selectedFile" class="selected-file">
          <span>{{ selectedFile.name }}</span>
          <small>{{ formatFileSize(selectedFile.size) }}</small>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editDialogVisible" title="编辑官网资料" width="620px">
      <el-form ref="editFormRef" :model="editForm" :rules="rules" label-width="110px">
        <el-form-item label="资料名称" prop="title">
          <el-input v-model.trim="editForm.title" />
        </el-form-item>
        <el-form-item label="资料分类" prop="category">
          <el-select v-model="editForm.category" style="width: 100%">
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model.trim="editForm.description" type="textarea" :rows="3" maxlength="300" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="editForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="公开展示">
          <el-switch v-model="editForm.is_public" />
        </el-form-item>
        <el-form-item label="推荐首页">
          <el-switch v-model="editForm.is_recommended" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import {
  deleteWebsiteMaterial,
  listWebsiteMaterials,
  updateWebsiteMaterial,
  uploadWebsiteMaterial,
} from '@/api/website';
import type { WebsiteMaterial } from '@/types/api';

const loading = ref(false);
const uploading = ref(false);
const saving = ref(false);
const uploadDialogVisible = ref(false);
const editDialogVisible = ref(false);
const selectedFile = ref<File | null>(null);
const editingMaterial = ref<WebsiteMaterial | null>(null);
const editFormRef = ref<FormInstance>();
const materials = ref<WebsiteMaterial[]>([]);
const total = ref(0);

const categoryOptions = ['公司介绍', '快检室方案', '产品资料', '操作说明', '对接资料', '案例资料', '其他附件'];
const acceptTypes = '.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
const maxFileSize = 20 * 1024 * 1024;

const query = reactive({
  page: 1,
  page_size: 10,
  category: '',
  is_public: '' as boolean | '',
  is_recommended: '' as boolean | '',
});

const uploadForm = reactive({
  title: '',
  category: '快检室方案',
  description: '',
  is_public: true,
  is_recommended: false,
  sort_order: 0,
});

const editForm = reactive({
  title: '',
  category: '',
  description: '',
  is_public: true,
  is_recommended: false,
  sort_order: 0,
});

const rules: FormRules = {
  title: [{ required: true, message: '请输入资料名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择资料分类', trigger: 'change' }],
};

onMounted(loadMaterials);

async function loadMaterials() {
  loading.value = true;
  try {
    const data = await listWebsiteMaterials(query);
    materials.value = data.items;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.page = 1;
  loadMaterials();
}

function resetQuery() {
  query.page = 1;
  query.category = '';
  query.is_public = '';
  query.is_recommended = '';
  loadMaterials();
}

function handleFileSelect(uploadFile: UploadFile) {
  const raw = uploadFile.raw;
  if (!raw) return;
  const ext = raw.name.split('.').pop()?.toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
  if (!ext || !allowed.includes(ext)) {
    ElMessage.error('文件格式不支持');
    selectedFile.value = null;
    return;
  }
  if (raw.size > maxFileSize) {
    ElMessage.error('单个文件不能超过 20MB');
    selectedFile.value = null;
    return;
  }
  selectedFile.value = raw;
  if (!uploadForm.title) uploadForm.title = raw.name.replace(/\.[^.]+$/, '');
}

async function submitUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择资料文件');
    return;
  }
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('title', uploadForm.title || selectedFile.value.name.replace(/\.[^.]+$/, ''));
    formData.append('file_name', selectedFile.value.name);
    formData.append('category', uploadForm.category);
    formData.append('description', uploadForm.description);
    formData.append('is_public', String(uploadForm.is_public));
    formData.append('is_recommended', String(uploadForm.is_recommended));
    formData.append('sort_order', String(uploadForm.sort_order || 0));
    await uploadWebsiteMaterial(formData);
    ElMessage.success('官网资料已上传');
    uploadDialogVisible.value = false;
    selectedFile.value = null;
    uploadForm.title = '';
    uploadForm.description = '';
    await loadMaterials();
  } finally {
    uploading.value = false;
  }
}

function openEditDialog(row: WebsiteMaterial) {
  editingMaterial.value = row;
  editForm.title = row.title;
  editForm.category = row.category;
  editForm.description = row.description;
  editForm.is_public = row.is_public;
  editForm.is_recommended = row.is_recommended;
  editForm.sort_order = row.sort_order;
  editDialogVisible.value = true;
}

async function saveEdit() {
  await editFormRef.value?.validate();
  if (!editingMaterial.value) return;
  saving.value = true;
  try {
    await updateWebsiteMaterial(editingMaterial.value.id, editForm);
    ElMessage.success('官网资料已保存');
    editDialogVisible.value = false;
    await loadMaterials();
  } finally {
    saving.value = false;
  }
}

async function togglePublic(row: WebsiteMaterial) {
  await updateWebsiteMaterial(row.id, { is_public: !row.is_public });
  ElMessage.success(row.is_public ? '资料已隐藏' : '资料已公开');
  await loadMaterials();
}

async function removeMaterial(row: WebsiteMaterial) {
  await ElMessageBox.confirm(
    `确定删除“${row.title}”吗？删除后官网不再展示该资料。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  );
  await deleteWebsiteMaterial(row.id);
  ElMessage.success('官网资料已删除');
  await loadMaterials();
}

function openMaterial(row: WebsiteMaterial) {
  window.open(row.file_url, '_blank', 'noopener,noreferrer');
}

function formatMime(value?: string | null) {
  if (!value) return '-';
  if (value.startsWith('image/')) return value.replace('image/', '').toUpperCase();
  if (value.includes('pdf')) return 'PDF';
  if (value.includes('word')) return 'Word';
  if (value.includes('excel') || value.includes('sheet')) return 'Excel';
  if (value.includes('powerpoint') || value.includes('presentation')) return 'PPT';
  return value;
}

function formatFileSize(size: number) {
  if (!size) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<style scoped>
.tag-gap {
  margin-left: 6px;
}
</style>
