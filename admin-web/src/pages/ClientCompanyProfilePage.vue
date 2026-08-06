<template>
  <section class="page-section">
    <div class="page-heading gx-page-heading">
      <div>
        <h1>企业公开资料</h1>
      </div>
    </div>

    <div class="profile-layout">
      <div class="panel profile-form-panel">
        <div class="panel-heading">
          <div>
            <h2>公开信息</h2>
          </div>
        </div>

        <el-form
          v-loading="loading"
          :model="profileForm"
          label-width="110px"
          class="gx-form"
        >
          <el-form-item label="公开展示：">
            <el-switch v-model="profileForm.is_public_enabled" />
          </el-form-item>
          <el-form-item label="企业简介：">
            <el-input
              v-model.trim="profileForm.intro"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              :placeholder="introPlaceholder"
            />
          </el-form-item>
          <el-form-item label="主营产品：">
            <el-input v-model.trim="profileForm.main_products" :placeholder="productsPlaceholder" />
          </el-form-item>
          <el-form-item label="展示地址：">
            <el-input v-model.trim="profileForm.display_address" :placeholder="addressPlaceholder" />
          </el-form-item>
          <el-form-item label="展示电话：">
            <el-input v-model.trim="profileForm.display_phone" :placeholder="phonePlaceholder" />
          </el-form-item>
          <el-form-item label="资质说明：">
            <el-input
              v-model.trim="profileForm.qualification_description"
              type="textarea"
              :rows="3"
              maxlength="300"
              show-word-limit
              :placeholder="qualificationPlaceholder"
            />
          </el-form-item>
          <div class="form-actions">
            <el-button type="primary" :loading="saving" @click="saveProfile">保存公开信息</el-button>
          </div>
        </el-form>
      </div>

      <div class="panel upload-panel">
        <div class="panel-heading">
          <div>
            <h2>上传资料</h2>
          </div>
        </div>

        <el-form :model="uploadForm" label-width="90px" class="gx-form">
          <el-form-item label="资料名称：">
            <el-input v-model.trim="uploadForm.file_name" :placeholder="fileNamePlaceholder" />
          </el-form-item>
          <el-form-item label="资料类型：">
            <el-select v-model="uploadForm.file_type" style="width: 100%">
              <el-option v-for="item in fileTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="排序：">
            <el-input-number v-model="uploadForm.sort_order" :min="0" :max="999" />
          </el-form-item>
          <el-form-item label="公开展示：">
            <el-switch v-model="uploadForm.is_public" />
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
              <div>支持图片和 PDF，可拖拽到这里</div>
            </div>
          </el-upload>
          <div v-if="selectedFile" class="selected-file">
            <span>{{ selectedFile.name }}</span>
            <small>{{ formatFileSize(selectedFile.size) }}</small>
          </div>
          <div class="form-actions">
            <el-button type="primary" :loading="uploading" @click="submitUpload">上传资料</el-button>
          </div>
        </el-form>
      </div>
    </div>

    <div class="panel">
      <div class="panel-heading">
        <div>
          <h2>资料列表</h2>
        </div>
        <el-button @click="loadProfile">刷新</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="assets"
        border
        class="data-table adaptive-table"
        :empty-text="emptyText"
      >
        <el-table-column label="预览" width="96" align="center">
          <template #default="{ row }: { row: ClientCompanyProfileAsset }">
            <el-image
              v-if="isImage(row)"
              class="asset-thumb"
              :src="row.file_url"
              :preview-src-list="[row.file_url]"
              fit="cover"
              preview-teleported
            />
            <el-button v-else text type="primary" @click="openAsset(row)">打开</el-button>
          </template>
        </el-table-column>
        <el-table-column label="文件名称" min-width="180">
          <template #default="{ row }: { row: ClientCompanyProfileAsset }">
            <el-tooltip :content="row.file_name" placement="top" :disabled="row.file_name.length < 18">
              <span class="truncate-text">{{ row.file_name }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="文件类型" min-width="120">
          <template #default="{ row }: { row: ClientCompanyProfileAsset }">
            {{ fileTypeLabel(row.file_type) }}
          </template>
        </el-table-column>
        <el-table-column label="排序" width="80" prop="sort_order" />
        <el-table-column label="公开状态" width="100">
          <template #default="{ row }: { row: ClientCompanyProfileAsset }">
            <el-tag :type="row.is_public ? 'success' : 'info'">
              {{ row.is_public ? publicText : hiddenText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="190" fixed="right">
          <template #default="{ row }: { row: ClientCompanyProfileAsset }">
            <el-space :size="6" wrap>
              <el-button size="small" text type="primary" @click="openAsset(row)">查看</el-button>
              <el-button size="small" text type="primary" @click="openEditDialog(row)">编辑</el-button>
              <el-dropdown trigger="click">
                <el-button size="small" text>更多</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="toggleAsset(row, !row.is_public)">
                      {{ row.is_public ? setHiddenText : setPublicText }}
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deleteAsset(row)">删除资料</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="editDialogVisible" :title="editDialogTitle" width="560px">
      <el-form ref="assetFormRef" :model="assetForm" :rules="assetRules" label-width="100px">
        <el-form-item label="资料名称" prop="file_name">
          <el-input v-model.trim="assetForm.file_name" />
        </el-form-item>
        <el-form-item label="资料类型" prop="file_type">
          <el-select v-model="assetForm.file_type" style="width: 100%">
            <el-option v-for="item in fileTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序：">
          <el-input-number v-model="assetForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="公开展示：">
          <el-switch v-model="assetForm.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveAsset">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import {
  deleteClientProfileFile,
  getClientCompanyProfile,
  setClientProfileFilePublic,
  updateClientCompanyProfile,
  updateClientProfileFile,
  uploadClientProfileFile,
} from '@/api/client';
import type { ClientCompanyProfileAsset } from '@/types/api';

const loading = ref(false);
const saving = ref(false);
const uploading = ref(false);
const assetFormRef = ref<FormInstance>();
const assets = ref<ClientCompanyProfileAsset[]>([]);
const editDialogVisible = ref(false);
const editingAsset = ref<ClientCompanyProfileAsset | null>(null);
const selectedFile = ref<File | null>(null);

const acceptTypes = '.jpg,.jpeg,.png,.webp,.pdf';
const maxFileSize = 10 * 1024 * 1024;

const introPlaceholder = '例如：主要从事农产品生产、配送或食品安全快检管理。';
const productsPlaceholder = '例如：蔬菜、水果、农产品配送';
const addressPlaceholder = '对外展示地址';
const phonePlaceholder = '对外联系电话';
const qualificationPlaceholder = '例如：已建立食品安全快检留档制度，定期快检。';
const fileNamePlaceholder = '不填则使用原文件名';
const emptyText = '暂无企业资料，请先上传图片或 PDF';
const editDialogTitle = '编辑资料信息';
const publicText = '公开';
const hiddenText = '隐藏';
const setPublicText = '设为公开';
const setHiddenText = '设为隐藏';

const fileTypeOptions = [
  { label: '营业执照', value: 'license' },
  { label: '检测室照片', value: 'lab_photo' },
  { label: '资质证书', value: 'qualification' },
  { label: '企业照片', value: 'company_photo' },
  { label: '其他资料', value: 'other' },
];

const profileForm = reactive({
  intro: '',
  main_products: '',
  display_address: '',
  display_phone: '',
  qualification_description: '',
  is_public_enabled: false,
});

const uploadForm = reactive({
  file_name: '',
  file_type: 'company_photo',
  is_public: true,
  sort_order: 0,
});

const assetForm = reactive({
  file_name: '',
  file_type: 'company_photo',
  is_public: true,
  sort_order: 0,
});

const assetRules: FormRules = {
  file_name: [{ required: true, message: '请输入资料名称', trigger: 'blur' }],
  file_type: [{ required: true, message: '请选择资料类型', trigger: 'change' }],
};

onMounted(loadProfile);

async function loadProfile() {
  loading.value = true;
  try {
    const data = await getClientCompanyProfile();
    Object.assign(profileForm, {
      intro: data.intro,
      main_products: data.main_products,
      display_address: data.display_address,
      display_phone: data.display_phone,
      qualification_description: data.qualification_description,
      is_public_enabled: data.is_public_enabled,
    });
    assets.value = data.assets || [];
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  saving.value = true;
  try {
    const data = await updateClientCompanyProfile({ ...profileForm });
    assets.value = data.assets || [];
    ElMessage.success('企业公开信息已保存');
  } finally {
    saving.value = false;
  }
}

function handleFileSelect(uploadFile: UploadFile) {
  const raw = uploadFile.raw;
  if (!raw) return;
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(raw.type)) {
    ElMessage.error('仅支持 jpg、jpeg、png、webp、pdf 文件');
    selectedFile.value = null;
    return;
  }
  if (raw.size > maxFileSize) {
    ElMessage.error('单个文件不能超过 10MB');
    selectedFile.value = null;
    return;
  }
  selectedFile.value = raw;
  if (!uploadForm.file_name) {
    uploadForm.file_name = raw.name.replace(/\.[^.]+$/, '');
  }
  if (raw.type === 'application/pdf' && uploadForm.file_type === 'company_photo') {
    uploadForm.file_type = 'qualification';
  }
}

async function submitUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择要上传的文件');
    return;
  }
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('file_name', uploadForm.file_name || selectedFile.value.name);
    formData.append('file_type', uploadForm.file_type);
    formData.append('is_public', String(uploadForm.is_public));
    formData.append('sort_order', String(uploadForm.sort_order || 0));
    await uploadClientProfileFile(formData);
    ElMessage.success('资料已上传');
    selectedFile.value = null;
    uploadForm.file_name = '';
    await loadProfile();
  } finally {
    uploading.value = false;
  }
}

function openEditDialog(asset: ClientCompanyProfileAsset) {
  editingAsset.value = asset;
  assetForm.file_name = asset.file_name;
  assetForm.file_type = asset.file_type || 'company_photo';
  assetForm.is_public = asset.is_public;
  assetForm.sort_order = asset.sort_order || 0;
  editDialogVisible.value = true;
}

async function saveAsset() {
  await assetFormRef.value?.validate();
  if (!editingAsset.value) return;
  saving.value = true;
  try {
    await updateClientProfileFile(editingAsset.value.id, { ...assetForm });
    ElMessage.success('资料信息已更新');
    editDialogVisible.value = false;
    await loadProfile();
  } finally {
    saving.value = false;
  }
}

async function toggleAsset(asset: ClientCompanyProfileAsset, isPublic: boolean) {
  await setClientProfileFilePublic(asset.id, isPublic);
  ElMessage.success(isPublic ? '资料已设为公开' : '资料已设为隐藏');
  await loadProfile();
}

async function deleteAsset(asset: ClientCompanyProfileAsset) {
  await ElMessageBox.confirm(
    `确定删除“${asset.file_name}”吗？删除后扫码公开页将不再展示该资料。`,
    '删除确认',
    { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
  );
  await deleteClientProfileFile(asset.id);
  ElMessage.success('资料已删除');
  await loadProfile();
}

function openAsset(asset: ClientCompanyProfileAsset) {
  window.open(asset.file_url, '_blank', 'noopener,noreferrer');
}

function isImage(asset: ClientCompanyProfileAsset) {
  return Boolean(asset.file_url) && /\.(jpg|jpeg|png|webp)$/i.test(asset.file_url);
}

function fileTypeLabel(value: string) {
  return fileTypeOptions.find((item) => item.value === value)?.label || value || '其他资料';
}

function formatFileSize(size: number) {
  if (!size) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<style scoped>
.profile-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 980px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}
.upload-drop {
  padding: 20px;
  text-align: center;
  color: #5b6573;
}
.selected-file {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding: 8px 12px;
  background: #f4f8f6;
  border-radius: 8px;
  font-size: 13px;
}
.form-actions {
  margin-top: 12px;
}
.asset-thumb {
  width: 56px;
  height: 42px;
  border-radius: 6px;
}
.truncate-text {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
