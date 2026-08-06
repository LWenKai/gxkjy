<template>
  <main class="login-page">
    <div class="login-bg-deco login-bg-deco--1"></div>
    <div class="login-bg-deco login-bg-deco--2"></div>

    <section class="login-center">
      <div class="login-card">
        <div class="login-brand">
          <img class="login-logo-img" src="/logo-icon.png" alt="谷芯科技" />
          <div class="login-brand-text">
            <strong>谷芯快检云</strong>
            <span>客户工作台</span>
          </div>
        </div>

      <div class="login-card-head">
        <h2>客户登录</h2>
      </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @keyup.enter="submitLogin"
        >
          <el-form-item label="账号" prop="username">
            <el-input
              v-model.trim="form.username"
              size="large"
              placeholder="请输入账号"
              autocomplete="username"
            >
              <template #prefix>
                <Icon name="user" :size="18" />
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              placeholder="请输入密码"
              autocomplete="current-password"
              show-password
            >
              <template #prefix>
                <Icon name="lock" :size="18" />
              </template>
            </el-input>
          </el-form-item>
          <el-button
            class="login-button"
            type="primary"
            size="large"
            :loading="loading"
            @click="submitLogin"
          >
            进入工作台
          </el-button>
        </el-form>

        <p class="login-safe-tip">
          <Icon name="info" :size="13" />
          账号与微信小程序通用，请勿在公共电脑保存密码。
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loginClient } from '@/api/client';
import { useClientAuthStore } from '@/stores/clientAuth';

const router = useRouter();
const route = useRoute();
const authStore = useClientAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function submitLogin() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    const data = await loginClient(form);
    authStore.setSession(data.access_token, data.company_user, data.company);
    ElMessage.success('登录成功');
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/client/dashboard';
    router.replace(redirect);
  } catch (error) {
    const message = (error as { message?: string })?.message;
    if (message) ElMessage.error(message);
  } finally {
    loading.value = false;
  }
}
</script>
