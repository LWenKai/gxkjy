<template>
  <section class="page-section">
    <div class="page-heading gx-page-heading">
      <div>
        <h1>&#x4F01;&#x4E1A;&#x516C;&#x5F00;&#x8D44;&#x6599;</h1>
        <p>&#x7EF4;&#x62A4;&#x626B;&#x7801;&#x516C;&#x5F00;&#x9875;&#x5C55;&#x793A;&#x7684;&#x4F01;&#x4E1A;&#x7B80;&#x4ECB;&#x3001;&#x8054;&#x7CFB;&#x65B9;&#x5F0F;&#x3001;&#x56FE;&#x7247;&#x548C; PDF &#x8D44;&#x6599;&#x3002;</p>
      </div>
      <div class="heading-actions">
        <el-button @click="router.push(`/companies/${companyId}`)">&#x8FD4;&#x56DE;&#x4F01;&#x4E1A;&#x8BE6;&#x60C5;</el-button>
      </div>
    </div>

    <el-alert
      class="detail-alert"
      :title="profileNotice"
      type="info"
      :closable="false"
      show-icon
    />

    <div class="profile-layout">
      <div class="panel profile-form-panel">
        <div class="panel-heading">
          <div>
            <h2>&#x516C;&#x5F00;&#x4FE1;&#x606F;</h2>
            <p>&#x8FD9;&#x91CC;&#x63A7;&#x5236;&#x626B;&#x7801;&#x9875;&#x4F01;&#x4E1A;&#x8D44;&#x6599;&#x6A21;&#x5757;&#x7684;&#x57FA;&#x7840;&#x5185;&#x5BB9;&#x3002;</p>
          </div>
        </div>

        <el-form
          v-loading="loading"
          :model="profileForm"
          label-width="110px"
          class="gx-form"
        >
          <el-form-item label="&#x516C;&#x5F00;&#x5C55;&#x793A;">
            <el-switch v-model="profileForm.is_public_enabled" />
            <span class="form-tip">&#x5173;&#x95ED;&#x540E;&#xFF0C;&#x626B;&#x7801;&#x9875;&#x4E0D;&#x5C55;&#x793A;&#x4F01;&#x4E1A;&#x8D44;&#x6599;&#x6A21;&#x5757;&#x3002;</span>
          </el-form-item>
          <el-form-item label="&#x4F01;&#x4E1A;&#x7B80;&#x4ECB;">
            <el-input
              v-model.trim="profileForm.intro"
              type="textarea"
              :rows="4"
              maxlength="500"
              show-word-limit
              :placeholder="introPlaceholder"
            />
          </el-form-item>
          <el-form-item label="&#x4E3B;&#x8425;&#x4EA7;&#x54C1;">
            <el-input v-model.trim="profileForm.main_products" :placeholder="productsPlaceholder" />
          </el-form-item>
          <el-form-item label="&#x5C55;&#x793A;&#x5730;&#x5740;">
            <el-input v-model.trim="profileForm.display_address" :placeholder="addressPlaceholder" />
          </el-form-item>
          <el-form-item label="&#x5C55;&#x793A;&#x7535;&#x8BDD;">
            <el-input v-model.trim="profileForm.display_phone" :placeholder="phonePlaceholder" />
          </el-form-item>
          <el-form-item label="&#x8D44;&#x8D28;&#x8BF4;&#x660E;">
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
            <el-button type="primary" :loading="saving" @click="saveProfile">&#x4FDD;&#x5B58;&#x516C;&#x5F00;&#x4FE1;&#x606F;</el-button>
          </div>
        </el-form>
      </div>

      <div class="panel upload-panel">
        <div class="panel-heading">
          <div>
            <h2>&#x4E0A;&#x4F20;&#x8D44;&#x6599;</h2>
            <p>&#x652F;&#x6301; jpg&#x3001;jpeg&#x3001;png&#x3001;webp&#x3001;pdf&#xFF0C;&#x5355;&#x6587;&#x4EF6;&#x4E0D;&#x8D85;&#x8FC7; 10MB&#x3002;</p>
          </div>
        </div>

        <el-form :model="uploadForm" label-width="90px" class="gx-form">
          <el-form-item label="&#x8D44;&#x6599;&#x540D;&#x79F0;">
            <el-input v-model.trim="uploadForm.file_name" :placeholder="fileNamePlaceholder" />
          </el-form-item>
          <el-form-item label="&#x8D44;&#x6599;&#x7C7B;&#x578B;">
            <el-select v-model="uploadForm.file_type" style="width: 100%">
              <el-option v-for="item in fileTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="&#x6392;&#x5E8F;">
            <el-input-number v-model="uploadForm.sort_order" :min="0" :max="999" />
          </el-form-item>
          <el-form-item label="&#x516C;&#x5F00;&#x5C55;&#x793A;">
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
              <strong>&#x9009;&#x62E9;&#x8D44;&#x6599;&#x6587;&#x4EF6;</strong>
              <div>&#x652F;&#x6301;&#x56FE;&#x7247;&#x548C; PDF&#xFF0C;&#x53EF;&#x62D6;&#x62FD;&#x5230;&#x8FD9;&#x91CC;</div>
              <small>&#x516C;&#x5F00;&#x540E;&#x4F1A;&#x5728;&#x626B;&#x7801;&#x9875;&#x5C55;&#x793A;&#x3002;</small>
            </div>
          </el-upload>
          <div v-if="selectedFile" class="selected-file">
            <span>{{ selectedFile.name }}</span>
            <small>{{ formatFileSize(selectedFile.size) }}</small>
          </div>
          <div class="form-actions">
            <el-button type="primary" :loading="uploading" @click="submitUpload">&#x4E0A;&#x4F20;&#x8D44;&#x6599;</el-button>
          </div>
        </el-form>
      </div>
    </div>

    <div class="panel">
      <div class="panel-heading">
        <div>
          <h2>&#x8D44;&#x6599;&#x5217;&#x8868;</h2>
          <p>&#x53EA;&#x6709;&#x72B6;&#x6001;&#x4E3A;&#x201C;&#x516C;&#x5F00;&#x201D;&#x7684;&#x8D44;&#x6599;&#x4F1A;&#x51FA;&#x73B0;&#x5728;&#x626B;&#x7801;&#x516C;&#x5F00;&#x9875;&#x3002;</p>
        </div>
        <el-button @click="loadProfile">&#x5237;&#x65B0;</el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="assets"
        border
        class="data-table adaptive-table"
        :empty-text="emptyText"
      >
        <el-table-column label="&#x9884;&#x89C8;" width="96" align="center">
          <template #default="{ row }: { row: CompanyProfileAsset }">
            <el-image
              v-if="isImage(row)"
              class="asset-thumb"
              :src="row.file_url"
              :preview-src-list="[row.file_url]"
              fit="cover"
              preview-teleported
            />
            <el-button v-else text type="primary" @click="openAsset(row)">&#x6253;&#x5F00;</el-button>
          </template>
        </el-table-column>
        <el-table-column label="&#x6587;&#x4EF6;&#x540D;&#x79F0;" min-width="180">
          <template #default="{ row }: { row: CompanyProfileAsset }">
            <el-tooltip :content="row.file_name" placement="top" :disabled="row.file_name.length < 18">
              <span class="truncate-text">{{ row.file_name }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="&#x6587;&#x4EF6;&#x7C7B;&#x578B;" min-width="120">
          <template #default="{ row }: { row: CompanyProfileAsset }">
            {{ fileTypeLabel(row.file_type) }}
          </template>
        </el-table-column>
        <el-table-column label="&#x5927;&#x5C0F;" width="110">
          <template #default="{ row }: { row: CompanyProfileAsset }">
            {{ formatFileSize(Number(row.file_size || 0)) }}
          </template>
        </el-table-column>
        <el-table-column label="&#x4E0A;&#x4F20;&#x65F6;&#x95F4;" min-width="160">
          <template #default="{ row }: { row: CompanyProfileAsset }">
            {{ formatDateTime(row.uploaded_at || row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="&#x6392;&#x5E8F;" width="80" />
        <el-table-column label="&#x516C;&#x5F00;&#x72B6;&#x6001;" width="100">
          <template #default="{ row }: { row: CompanyProfileAsset }">
            <el-tag :type="row.is_public ? 'success' : 'info'">
              {{ row.is_public ? publicText : hiddenText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="&#x64CD;&#x4F5C;" width="190" fixed="right">
          <template #default="{ row }: { row: CompanyProfileAsset }">
            <el-space :size="6" wrap>
              <el-button size="small" text type="primary" @click="openAsset(row)">&#x67E5;&#x770B;</el-button>
              <el-button size="small" text type="primary" @click="openEditDialog(row)">&#x7F16;&#x8F91;</el-button>
              <el-dropdown trigger="click">
                <el-button size="small" text>&#x66F4;&#x591A;</el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="toggleAsset(row, !row.is_public)">
                      {{ row.is_public ? setHiddenText : setPublicText }}
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="deleteAsset(row)">&#x5220;&#x9664;&#x8D44;&#x6599;</el-dropdown-item>
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
        <el-form-item label="&#x8D44;&#x6599;&#x540D;&#x79F0;" prop="file_name">
          <el-input v-model.trim="assetForm.file_name" />
        </el-form-item>
        <el-form-item label="&#x8D44;&#x6599;&#x7C7B;&#x578B;" prop="file_type">
          <el-select v-model="assetForm.file_type" style="width: 100%">
            <el-option v-for="item in fileTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="&#x6392;&#x5E8F;">
          <el-input-number v-model="assetForm.sort_order" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="&#x516C;&#x5F00;&#x5C55;&#x793A;">
          <el-switch v-model="assetForm.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">&#x53D6;&#x6D88;</el-button>
        <el-button type="primary" :loading="saving" @click="saveAsset">&#x4FDD;&#x5B58;</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules, UploadFile } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  deleteCompanyProfileFile,
  disableCompanyProfileFilePublic,
  enableCompanyProfileFilePublic,
  getCompanyProfile,
  updateCompanyProfile,
  updateCompanyProfileFile,
  uploadCompanyProfileFile,
} from '@/api/companyProfiles';
import type { CompanyProfileAsset } from '@/types/api';
import { formatDateTime } from '@/utils/time';

const route = useRoute();
const router = useRouter();
const companyId = String(route.params.id);
const loading = ref(false);
const saving = ref(false);
const uploading = ref(false);
const assetFormRef = ref<FormInstance>();
const assets = ref<CompanyProfileAsset[]>([]);
const editDialogVisible = ref(false);
const editingAsset = ref<CompanyProfileAsset | null>(null);
const selectedFile = ref<File | null>(null);

const acceptTypes = '.jpg,.jpeg,.png,.webp,.pdf';
const maxFileSize = 10 * 1024 * 1024;

const profileNotice = '\u516c\u5f00\u5f00\u5173\u6253\u5f00\u540e\uff0c\u8d44\u6599\u624d\u4f1a\u5c55\u793a\u5728\u626b\u7801\u516c\u5f00\u9875\uff1b\u9690\u85cf\u8d44\u6599\u4ec5\u540e\u53f0\u53ef\u89c1\u3002';
const introPlaceholder = '\u4f8b\u5982\uff1a\u4e3b\u8981\u4ece\u4e8b\u519c\u4ea7\u54c1\u751f\u4ea7\u3001\u914d\u9001\u6216\u98df\u54c1\u5b89\u5168\u5feb\u68c0\u7ba1\u7406\u3002';
const productsPlaceholder = '\u4f8b\u5982\uff1a\u852c\u83dc\u3001\u6c34\u679c\u3001\u519c\u4ea7\u54c1\u914d\u9001';
const addressPlaceholder = '\u5bf9\u5916\u5c55\u793a\u5730\u5740';
const phonePlaceholder = '\u5bf9\u5916\u8054\u7cfb\u7535\u8bdd';
const qualificationPlaceholder = '\u4f8b\u5982\uff1a\u5df2\u5efa\u7acb\u98df\u54c1\u5b89\u5168\u5feb\u68c0\u7559\u6863\u5236\u5ea6\uff0c\u5b9a\u671f\u5f00\u5c55\u5feb\u68c0\u3002';
const fileNamePlaceholder = '\u4e0d\u586b\u5219\u4f7f\u7528\u539f\u6587\u4ef6\u540d';
const emptyText = '\u6682\u65e0\u4f01\u4e1a\u8d44\u6599\uff0c\u8bf7\u5148\u4e0a\u4f20\u56fe\u7247\u6216 PDF';
const editDialogTitle = '\u7f16\u8f91\u8d44\u6599\u4fe1\u606f';
const publicText = '\u516c\u5f00';
const hiddenText = '\u9690\u85cf';
const setPublicText = '\u8bbe\u4e3a\u516c\u5f00';
const setHiddenText = '\u8bbe\u4e3a\u9690\u85cf';

const fileTypeOptions = [
  { label: '\u8425\u4e1a\u6267\u7167', value: 'license' },
  { label: '\u68c0\u6d4b\u5ba4\u7167\u7247', value: 'lab_photo' },
  { label: '\u8d44\u8d28\u8bc1\u4e66', value: 'qualification' },
  { label: '\u4f01\u4e1a\u7167\u7247', value: 'company_photo' },
  { label: '\u5176\u4ed6\u8d44\u6599', value: 'other' },
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
  file_name: [{ required: true, message: '\u8bf7\u8f93\u5165\u8d44\u6599\u540d\u79f0', trigger: 'blur' }],
  file_type: [{ required: true, message: '\u8bf7\u9009\u62e9\u8d44\u6599\u7c7b\u578b', trigger: 'change' }],
};

onMounted(loadProfile);

async function loadProfile() {
  loading.value = true;
  try {
    const data = await getCompanyProfile(companyId);
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
    const data = await updateCompanyProfile(companyId, profileForm);
    assets.value = data.assets || [];
    ElMessage.success('\u4f01\u4e1a\u516c\u5f00\u4fe1\u606f\u5df2\u4fdd\u5b58');
  } finally {
    saving.value = false;
  }
}

function handleFileSelect(uploadFile: UploadFile) {
  const raw = uploadFile.raw;
  if (!raw) return;
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(raw.type)) {
    ElMessage.error('\u4ec5\u652f\u6301 jpg\u3001jpeg\u3001png\u3001webp\u3001pdf \u6587\u4ef6');
    selectedFile.value = null;
    return;
  }
  if (raw.size > maxFileSize) {
    ElMessage.error('\u5355\u4e2a\u6587\u4ef6\u4e0d\u80fd\u8d85\u8fc7 10MB');
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
    ElMessage.warning('\u8bf7\u5148\u9009\u62e9\u8981\u4e0a\u4f20\u7684\u6587\u4ef6');
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
    await uploadCompanyProfileFile(companyId, formData);
    ElMessage.success('\u8d44\u6599\u5df2\u4e0a\u4f20');
    selectedFile.value = null;
    uploadForm.file_name = '';
    await loadProfile();
  } finally {
    uploading.value = false;
  }
}

function openEditDialog(asset: CompanyProfileAsset) {
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
    await updateCompanyProfileFile(editingAsset.value.id, assetForm);
    ElMessage.success('\u8d44\u6599\u4fe1\u606f\u5df2\u66f4\u65b0');
    editDialogVisible.value = false;
    await loadProfile();
  } finally {
    saving.value = false;
  }
}

async function toggleAsset(asset: CompanyProfileAsset, isPublic: boolean) {
  if (isPublic) await enableCompanyProfileFilePublic(asset.id);
  else await disableCompanyProfileFilePublic(asset.id);
  ElMessage.success(isPublic ? '\u8d44\u6599\u5df2\u8bbe\u4e3a\u516c\u5f00' : '\u8d44\u6599\u5df2\u8bbe\u4e3a\u9690\u85cf');
  await loadProfile();
}

async function deleteAsset(asset: CompanyProfileAsset) {
  await ElMessageBox.confirm(
    `\u786e\u5b9a\u5220\u9664\u201c${asset.file_name}\u201d\u5417\uff1f\u5220\u9664\u540e\u626b\u7801\u516c\u5f00\u9875\u5c06\u4e0d\u518d\u5c55\u793a\u8be5\u8d44\u6599\u3002`,
    '\u5220\u9664\u786e\u8ba4',
    { type: 'warning', confirmButtonText: '\u5220\u9664', cancelButtonText: '\u53d6\u6d88' },
  );
  await deleteCompanyProfileFile(asset.id);
  ElMessage.success('\u8d44\u6599\u5df2\u5220\u9664');
  await loadProfile();
}

function openAsset(asset: CompanyProfileAsset) {
  window.open(asset.file_url, '_blank', 'noopener,noreferrer');
}

function isImage(asset: CompanyProfileAsset) {
  return Boolean(asset.mime_type?.startsWith('image/')) || /\.(jpg|jpeg|png|webp)$/i.test(asset.file_url);
}

function fileTypeLabel(value: string) {
  return fileTypeOptions.find((item) => item.value === value)?.label || value || '\u5176\u4ed6\u8d44\u6599';
}

function formatFileSize(size: number) {
  if (!size) return '-';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
</script>
