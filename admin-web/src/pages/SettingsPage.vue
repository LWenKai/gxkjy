<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>系统设置</h1>
        <p>维护非敏感展示配置。数据库密码、JWT、OSS 密钥仍只允许保存在服务器环境变量中。</p>
      </div>
    </div>

    <div class="panel">
      <el-form
        ref="formRef"
        v-loading="loading"
        :model="form"
        :rules="rules"
        label-width="150px"
      >
        <el-form-item label="平台名称" prop="platform_name">
          <el-input v-model.trim="form.platform_name" />
        </el-form-item>
        <el-form-item label="服务电话" prop="service_phone">
          <el-input v-model.trim="form.service_phone" />
        </el-form-item>
        <el-form-item label="技术支持说明">
          <el-input v-model.trim="form.support_text" />
        </el-form-item>
        <el-form-item label="公开页底部说明">
          <el-input v-model.trim="form.public_footer_notice" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="合格证公开页提示">
          <el-input v-model.trim="form.certificate_public_notice" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="显示技术支持">
          <el-switch v-model="form.show_support_info" />
        </el-form-item>
        <el-form-item label="显示企业公开资料">
          <el-switch v-model="form.show_company_public_profile" />
        </el-form-item>
        <el-alert
          title="当前 public-h5 仍使用内置公开页文案；本页配置已入库，后续如需动态读取可单独接入公开配置接口。"
          type="info"
          show-icon
          :closable="false"
        />
        <div class="form-actions">
          <el-button type="primary" :loading="saving" @click="saveSettings">保存设置</el-button>
        </div>
      </el-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import { getSystemSettings, updateSystemSettings } from '@/api/systemSettings';
import type { SystemSettings } from '@/types/api';

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);

const form = reactive<SystemSettings>({
  platform_name: '谷芯快检云',
  service_phone: '13363412262',
  support_text: '由谷芯科技提供技术支持',
  public_footer_notice: '',
  certificate_public_notice: '',
  show_support_info: true,
  show_company_public_profile: true,
});

const rules: FormRules = {
  platform_name: [{ required: true, message: '请输入平台名称', trigger: 'blur' }],
  service_phone: [{ required: true, message: '请输入服务电话', trigger: 'blur' }],
};

onMounted(loadSettings);

async function loadSettings() {
  loading.value = true;
  try {
    Object.assign(form, await getSystemSettings());
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  await formRef.value?.validate();
  saving.value = true;
  try {
    Object.assign(form, await updateSystemSettings(form));
    ElMessage.success('系统设置已保存');
  } finally {
    saving.value = false;
  }
}
</script>
