<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>单位信息</h1>
      </div>
    </div>

    <div v-loading="loading" class="panel">
      <div class="panel-heading">
        <div>
          <h2>单位基础信息</h2>
        </div>
        <el-button type="primary" :loading="saving" @click="saveUnit">保存修改</el-button>
      </div>
      <el-form :model="form" label-width="110px" class="unit-form">
        <el-form-item label="企业名称" prop="name">
          <el-input v-model.trim="form.name" placeholder="请输入企业名称" />
        </el-form-item>
        <el-form-item label="联系人" prop="contact_name">
          <el-input v-model.trim="form.contact_name" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model.trim="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="注册地址" prop="address">
          <el-input v-model.trim="form.address" placeholder="请输入注册地址" />
        </el-form-item>
        <el-form-item label="产地/基地" prop="origin_address">
          <el-input v-model.trim="form.origin_address" placeholder="请输入产地或基地地址" />
        </el-form-item>
      </el-form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
import {
  getClientCompany,
  updateClientCompany,
} from '@/api/client';
import { useClientAuthStore } from '@/stores/clientAuth';
import type { ClientCompany } from '@/types/api';

const authStore = useClientAuthStore();
const company = ref<ClientCompany | null>(null);
const loading = ref(false);
const saving = ref(false);

const form = reactive({
  name: '',
  contact_name: '',
  phone: '',
  address: '',
  origin_address: '',
});

onMounted(loadCompany);

async function loadCompany() {
  loading.value = true;
  try {
    const data = await getClientCompany();
    company.value = data;
    authStore.company = data;
    form.name = data.name || '';
    form.contact_name = data.contact_name || '';
    form.phone = data.phone || '';
    form.address = data.address || '';
    form.origin_address = data.origin_address || '';
  } finally {
    loading.value = false;
  }
}

async function saveUnit() {
  saving.value = true;
  try {
    const data = await updateClientCompany({
      name: form.name,
      contact_name: form.contact_name,
      phone: form.phone,
      address: form.address,
      origin_address: form.origin_address,
    });
    company.value = data;
    authStore.company = data;
    ElMessage.success('单位信息已保存');
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.unit-form {
  max-width: 640px;
}
</style>
