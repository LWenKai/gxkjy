<template>
  <el-container class="admin-layout">
    <el-aside :width="collapsed ? '76px' : '232px'" class="admin-aside" :class="{ collapsed }">
      <div class="brand">
        <span class="brand-logo">
          <Icon name="shield-check" :size="22" />
        </span>
        <div class="brand-text" v-show="!collapsed">
          <div class="brand-title">&#x8C37;&#x82AF;&#x5FEB;&#x68C0;&#x4E91;</div>
          <div class="brand-subtitle">&#x7BA1;&#x7406;&#x540E;&#x53F0;</div>
        </div>
      </div>

      <el-menu class="admin-menu" :default-active="activePath" router :collapse="collapsed" :collapse-transition="false">
        <el-menu-item-group v-for="group in menuGroups" :key="group.title" :title="collapsed ? '' : group.title">
          <el-menu-item v-for="item in group.items" :key="item.path" :index="item.path">
            <Icon :name="item.icon" :size="18" />
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu-item-group>
      </el-menu>

      <div class="aside-footer">
        <button class="collapse-btn" type="button" @click="collapsed = !collapsed" :title="collapsed ? '展开' : '收起'">
          <Icon :name="collapsed ? 'panel-left-open' : 'panel-left-close'" :size="18" />
        </button>
        <div class="user-block" v-show="!collapsed">
          <span class="user-avatar">{{ avatarText }}</span>
          <div class="user-meta">
            <strong>{{ authStore.displayName }}</strong>
            <button class="user-logout" type="button" @click="logout">退出登录</button>
          </div>
        </div>
      </div>
    </el-aside>

    <el-container>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const menuGroups = [
  {
    title: '\u603b\u89c8',
    items: [{ path: '/dashboard', label: '\u7ecf\u8425\u6570\u636e\u770b\u677f', icon: 'layout-dashboard' }],
  },
  {
    title: '\u9500\u552e\u7ecf\u8425',
    items: [
      { path: '/customers', label: '\u5ba2\u6237\u7ba1\u7406', icon: 'users' },
      { path: '/sales-products', label: '\u9500\u552e\u4ea7\u54c1\u5e93', icon: 'package' },
    ],
  },
  {
    title: '\u5ba2\u6237\u4ea4\u4ed8',
    items: [
      { path: '/companies', label: '\u4f01\u4e1a\u7aef\u7ba1\u7406', icon: 'building-2' },
      { path: '/products', label: '\u5f00\u8bc1\u4ea7\u54c1\u5e93', icon: 'box' },
      { path: '/devices', label: '\u68c0\u6d4b\u8bbe\u5907', icon: 'cpu' },
      { path: '/printers', label: '\u6253\u5370\u8bbe\u5907', icon: 'printer' },
    ],
  },
  {
    title: '\u68c0\u6d4b\u4e0e\u5408\u683c\u8bc1',
    items: [
      { path: '/detection-records', label: '\u68c0\u6d4b\u8bb0\u5f55', icon: 'clipboard-list' },
      { path: '/certificates', label: '\u5408\u683c\u8bc1\u7ba1\u7406', icon: 'badge-check' },
    ],
  },
  {
    title: '\u5382\u5bb6\u5bf9\u63a5',
    items: [
      { path: '/manufacturer-interfaces', label: '\u5382\u5bb6\u63a5\u53e3', icon: 'plug' },
      { path: '/manufacturer-upload-logs', label: '\u4e0a\u4f20\u65e5\u5fd7', icon: 'upload' },
    ],
  },
  {
    title: '\u7cfb\u7edf\u652f\u6301',
    items: [
      { path: '/operation-logs', label: '\u64cd\u4f5c\u65e5\u5fd7', icon: 'scroll-text' },
      { path: '/help', label: '\u5e2e\u52a9\u4e0e\u8bf4\u660e', icon: 'help-circle' },
      { path: '/settings', label: '\u7cfb\u7edf\u8bbe\u7f6e', icon: 'settings' },
    ],
  },
];

const collapsed = ref(false);

const avatarText = computed(() => {
  const name = authStore.displayName || '管';
  return name.slice(0, 1);
});

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
