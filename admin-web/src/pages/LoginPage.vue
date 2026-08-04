<template>
  <main class="login-page">
    <section class="login-visual">
      <div class="login-brand">
        <div class="brand-mark large">GX</div>
        <div>
          <h1>&#x8C37;&#x82AF;&#x5FEB;&#x68C0;&#x4E91;</h1>
          <p>&#x98DF;&#x54C1;&#x5FEB;&#x68C0;&#x6570;&#x5B57;&#x5316;&#x7BA1;&#x7406;&#x5E73;&#x53F0;</p>
        </div>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="login-card-head">
          <h2>&#x767B;&#x5F55;&#x7CFB;&#x7EDF;</h2>
          <p>&#x8BF7;&#x8F93;&#x5165;&#x7BA1;&#x7406;&#x5458;&#x8D26;&#x53F7;</p>
        </div>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          @keyup.enter="submitLogin"
        >
          <el-form-item label="&#x8D26;&#x53F7;" prop="username">
            <el-input
              v-model.trim="form.username"
              size="large"
              placeholder="&#x8BF7;&#x8F93;&#x5165;&#x8D26;&#x53F7;"
              autocomplete="username"
            />
          </el-form-item>
          <el-form-item label="&#x5BC6;&#x7801;" prop="password">
            <el-input
              v-model="form.password"
              size="large"
              type="password"
              placeholder="&#x8BF7;&#x8F93;&#x5165;&#x5BC6;&#x7801;"
              autocomplete="current-password"
              show-password
            />
          </el-form-item>
          <el-button
            class="login-button"
            type="primary"
            size="large"
            :loading="loading"
            @click="submitLogin"
          >
            &#x8FDB;&#x5165;&#x540E;&#x53F0;
          </el-button>
        </el-form>
        <p class="login-safe-tip">&#x8BF7;&#x52FF;&#x5728;&#x516C;&#x5171;&#x7535;&#x8111;&#x4FDD;&#x5B58;&#x8D26;&#x53F7;&#x4FE1;&#x606F;&#x3002;</p>
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

const form = reactive({
  username: '',
  password: '',
});

const rules: FormRules = {
  username: [{ required: true, message: '\u8bf7\u8f93\u5165\u8d26\u53f7', trigger: 'blur' }],
  password: [{ required: true, message: '\u8bf7\u8f93\u5165\u5bc6\u7801', trigger: 'blur' }],
};

async function submitLogin() {
  await formRef.value?.validate();
  loading.value = true;

  try {
    const data = await loginAdmin(form);
    authStore.setSession(data.access_token, data.admin_user);
    ElMessage.success('\u767b\u5f55\u6210\u529f');
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/dashboard';
    router.replace(redirect);
  } finally {
    loading.value = false;
  }
}
</script>
