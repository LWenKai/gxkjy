<template>
  <section class="page-section">
    <div class="page-heading gx-page-heading">
      <div>
        <h1>官网内容配置</h1>
        <p>维护官网首页文案、联系电话和展示开关。未配置时官网会使用默认内容。</p>
      </div>
      <div class="heading-actions">
        <el-button @click="openWebsite">打开官网</el-button>
      </div>
    </div>

    <div class="panel">
      <el-form
        ref="formRef"
        v-loading="loading"
        :model="form"
        :rules="rules"
        label-width="130px"
        class="gx-form"
      >
        <el-form-item label="首页主标题" prop="home_title">
          <el-input v-model.trim="form.home_title" maxlength="80" show-word-limit />
        </el-form-item>
        <el-form-item label="首页副标题" prop="home_subtitle">
          <el-input v-model.trim="form.home_subtitle" type="textarea" :rows="3" maxlength="220" show-word-limit />
        </el-form-item>
        <el-form-item label="主按钮文案">
          <el-input v-model.trim="form.primary_button_text" />
        </el-form-item>
        <el-form-item label="副按钮文案">
          <el-input v-model.trim="form.secondary_button_text" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contact_phone">
          <el-input v-model.trim="form.contact_phone" />
        </el-form-item>
        <el-form-item label="微信咨询说明">
          <el-input v-model.trim="form.wechat_tip" maxlength="160" show-word-limit />
        </el-form-item>
        <el-form-item label="公司简介">
          <el-input v-model.trim="form.company_intro" type="textarea" :rows="5" maxlength="700" show-word-limit />
        </el-form-item>
        <el-form-item label="展示资料中心">
          <el-switch v-model="form.show_materials" />
        </el-form-item>
        <el-form-item label="展示快检云模块">
          <el-switch v-model="form.show_cloud_module" />
        </el-form-item>
        <div class="form-actions">
          <el-button type="primary" :loading="saving" @click="save">保存官网配置</el-button>
        </div>
      </el-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { getWebsiteSettings, updateWebsiteSettings } from '@/api/website';
import type { WebsiteSettings } from '@/types/api';

const loading = ref(false);
const saving = ref(false);
const formRef = ref<FormInstance>();

const form = reactive<WebsiteSettings>({
  home_title: '',
  home_subtitle: '',
  primary_button_text: '',
  secondary_button_text: '',
  contact_phone: '',
  wechat_tip: '',
  company_intro: '',
  show_materials: true,
  show_cloud_module: true,
});

const rules: FormRules = {
  home_title: [{ required: true, message: '请输入首页主标题', trigger: 'blur' }],
  home_subtitle: [{ required: true, message: '请输入首页副标题', trigger: 'blur' }],
  contact_phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
};

onMounted(load);

async function load() {
  loading.value = true;
  try {
    Object.assign(form, await getWebsiteSettings());
  } finally {
    loading.value = false;
  }
}

async function save() {
  await formRef.value?.validate();
  saving.value = true;
  try {
    Object.assign(form, await updateWebsiteSettings(form));
    ElMessage.success('官网配置已保存');
  } finally {
    saving.value = false;
  }
}

function openWebsite() {
  window.open('https://www.gxkjy.com', '_blank', 'noopener,noreferrer');
}
</script>
