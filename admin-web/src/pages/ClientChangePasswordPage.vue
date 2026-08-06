<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>修改密码</h1>
      </div>
    </div>

    <div class="panel" style="max-width: 520px">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="110px"
        class="pwd-form"
      >
        <el-form-item label="原密码" prop="old_password">
          <el-input
            v-model="form.old_password"
            type="password"
            show-password
            placeholder="请输入当前密码"
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input
            v-model="form.new_password"
            type="password"
            show-password
            placeholder="至少 6 位"
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirm_password">
          <el-input
            v-model="form.confirm_password"
            type="password"
            show-password
            placeholder="请再次输入新密码"
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">保存新密码</el-button>
        </el-form-item>
      </el-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { reactive, ref } from 'vue';
import { changeClientPassword } from '@/api/client';

const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
});

const rules: FormRules = {
  old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== form.new_password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

async function submit() {
  await formRef.value?.validate();
  loading.value = true;
  try {
    await changeClientPassword({
      old_password: form.old_password,
      new_password: form.new_password,
    });
    ElMessage.success('密码修改成功，请使用新密码登录');
    form.old_password = '';
    form.new_password = '';
    form.confirm_password = '';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.pwd-form {
  padding-top: 8px;
}
</style>
