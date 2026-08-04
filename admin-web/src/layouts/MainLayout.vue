<template>
  <el-container class="admin-layout">
    <el-aside width="232px" class="admin-aside">
      <div class="brand">
        <div class="brand-mark">GX</div>
        <div>
          <div class="brand-title">&#x8C37;&#x82AF;&#x5FEB;&#x68C0;&#x4E91;</div>
          <div class="brand-subtitle">&#x7BA1;&#x7406;&#x540E;&#x53F0;</div>
        </div>
      </div>

      <el-menu class="admin-menu" :default-active="activePath" router>
        <el-menu-item-group v-for="group in menuGroups" :key="group.title" :title="group.title">
          <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-header">
        <div>
          <div class="header-title">{{ routeTitle }}</div>
          <div class="header-subtitle">谷芯快检云管理后台</div>
        </div>
        <div class="admin-user">
          <span>{{ authStore.displayName }}</span>
          <el-button text type="primary" @click="logout">&#x9000;&#x51FA;&#x767B;&#x5F55;</el-button>
        </div>
      </el-header>

      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const menuGroups = [
  {
    title: '\u603b\u89c8',
    items: [{ path: '/dashboard', label: '\u7ecf\u8425\u6570\u636e\u770b\u677f' }],
  },
  {
    title: '\u9500\u552e\u7ecf\u8425',
    items: [
      { path: '/customers', label: '\u5ba2\u6237\u7ba1\u7406' },
      { path: '/sales-products', label: '\u9500\u552e\u4ea7\u54c1\u5e93' },
    ],
  },
  {
    title: '\u5ba2\u6237\u4ea4\u4ed8',
    items: [
      { path: '/companies', label: '\u4f01\u4e1a\u7aef\u7ba1\u7406' },
      { path: '/products', label: '\u5f00\u8bc1\u4ea7\u54c1\u5e93' },
      { path: '/devices', label: '\u68c0\u6d4b\u8bbe\u5907' },
      { path: '/printers', label: '\u6253\u5370\u8bbe\u5907' },
    ],
  },
  {
    title: '\u68c0\u6d4b\u4e0e\u5408\u683c\u8bc1',
    items: [
      { path: '/detection-records', label: '\u68c0\u6d4b\u8bb0\u5f55' },
      { path: '/certificates', label: '\u5408\u683c\u8bc1\u7ba1\u7406' },
    ],
  },
  {
    title: '\u5382\u5bb6\u5bf9\u63a5',
    items: [
      { path: '/manufacturer-interfaces', label: '\u5382\u5bb6\u63a5\u53e3' },
      { path: '/manufacturer-upload-logs', label: '\u4e0a\u4f20\u65e5\u5fd7' },
    ],
  },
  {
    title: '\u7cfb\u7edf\u652f\u6301',
    items: [
      { path: '/operation-logs', label: '\u64cd\u4f5c\u65e5\u5fd7' },
      { path: '/help', label: '\u5e2e\u52a9\u4e0e\u8bf4\u660e' },
      { path: '/settings', label: '\u7cfb\u7edf\u8bbe\u7f6e' },
    ],
  },
];

const routeTitle = computed(() => String(route.meta.title || '\u7ba1\u7406\u540e\u53f0'));
const activePath = computed(() => {
  if (route.path.startsWith('/companies')) return '/companies';
  if (route.path.startsWith('/customers')) return '/customers';
  if (route.path.startsWith('/sales-products')) return '/sales-products';
  if (route.path.startsWith('/test-detection-records')) return '/test-detection-records/create';
  if (route.path.startsWith('/website/materials')) return '/website/materials';
  if (route.path.startsWith('/website/settings')) return '/website/settings';
  return route.path;
});

function logout() {
  authStore.clearSession();
  router.replace('/login');
}
</script>
