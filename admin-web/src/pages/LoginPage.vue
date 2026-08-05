<template>
  <main class="login-page">
    <header class="login-brand-top">
      <div class="brand-line">
        <span class="brand-name">谷芯快检云</span>
        <span class="brand-tag">管理后台</span>
      </div>
    </header>

    <section class="login-center">
      <div class="login-card">
        <div class="login-card-head">
          <h2>欢迎回来</h2>
          <p>请输入管理员账号登录</p>
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
          <div class="login-options">
            <el-checkbox v-model="rememberMe" size="small">记住我</el-checkbox>
          </div>
          <el-button
            class="login-button"
            type="primary"
            size="large"
            :loading="loading"
            @click="submitLogin"
          >
            进入后台
          </el-button>
        </el-form>

        <div class="login-demo">
          <p>演示账号</p>
          <div class="demo-buttons">
            <button type="button" class="demo-button" @click="fillDemo('admin', 'admin123')">
              管理员
            </button>
            <button type="button" class="demo-button" @click="fillDemo('company', 'company123')">
              企业账号
            </button>
          </div>
        </div>

        <p class="login-safe-tip">
          <Icon name="info" :size="13" />
          请勿在公共电脑保存账号信息。
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
import { loginAdmin } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);
const rememberMe = ref(false);

const form = reactive({
  username: '',
  password: '',
});

const savedAccount = localStorage.getItem('admin_remember_account');
if (savedAccount) {
  try {
    const parsed = JSON.parse(savedAccount);
    form.username = parsed.username || '';
    rememberMe.value = true;
  } catch {
    localStorage.removeItem('admin_remember_account');
  }
}

const rules: FormRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

function fillDemo(username: string, password: string) {
  form.username = username;
  form.password = password;
  ElMessage.info(`已填入 ${username === 'admin' ? '管理员' : '企业'} 演示账号`);
}

async function submitLogin() {
  await formRef.value?.validate();
  loading.value = true;

  try {
    const data = await loginAdmin(form);
    authStore.setSession(data.access_token, data.admin_user);
    if (rememberMe.value) {
      localStorage.setItem('admin_remember_account', JSON.stringify({ username: form.username }));
    } else {
      localStorage.removeItem('admin_remember_account');
    }
    ElMessage.success('登录成功');
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/dashboard';
    router.replace(redirect);
  } finally {
    loading.value = false;
  }
}
</script>
