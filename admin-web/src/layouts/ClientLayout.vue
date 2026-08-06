<template>
  <el-container class="admin-layout">
    <el-aside :width="collapsed ? '76px' : '232px'" class="admin-aside" :class="{ collapsed }">
      <div class="brand">
        <img class="brand-logo-img" src="/logo-icon.png" alt="谷芯科技" />
        <div class="brand-text" v-show="!collapsed">
          <div class="brand-title">谷芯快检云</div>
          <div class="brand-subtitle">客户工作台</div>
        </div>
      </div>

      <el-menu
        class="admin-menu"
        :default-active="activePath"
        router
        :collapse="collapsed"
        :collapse-transition="false"
      >
        <el-menu-item index="/client/dashboard">
          <Icon name="layout-dashboard" :size="18" />
          <span>工作台首页</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasModule('unit')" index="/client/unit">
          <Icon name="building-2" :size="18" />
          <span>单位信息</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasModule('unit')" index="/client/company-profile">
          <Icon name="file-text" :size="18" />
          <span>公开资料</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasModule('detection')" index="/client/detection-records">
          <Icon name="clipboard-list" :size="18" />
          <span>检测记录</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasModule('certificate')" index="/client/certificates">
          <Icon name="badge-check" :size="18" />
          <span>合格证</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasModule('products')" index="/client/products">
          <Icon name="package" :size="18" />
          <span>企业产品库</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasModule('screen')" index="/client/big-screen">
          <Icon name="monitor" :size="18" />
          <span>企业大屏</span>
        </el-menu-item>
        <el-menu-item index="/client/change-password">
          <Icon name="key" :size="18" />
          <span>账号安全</span>
        </el-menu-item>
      </el-menu>

      <div class="aside-footer">
        <button
          class="collapse-btn"
          type="button"
          @click="collapsed = !collapsed"
          :title="collapsed ? '展开' : '收起'"
        >
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
import { useClientAuthStore } from '@/stores/clientAuth';

const route = useRoute();
const router = useRouter();
const authStore = useClientAuthStore();

const collapsed = ref(false);

const avatarText = computed(() => {
  const name = authStore.displayName || '客';
  return name.slice(0, 1);
});

const activePath = computed(() => {
  if (route.path.startsWith('/client/unit')) return '/client/unit';
  if (route.path.startsWith('/client/company-profile')) return '/client/company-profile';
  if (route.path.startsWith('/client/detection-records')) return '/client/detection-records';
  if (route.path.startsWith('/client/certificates')) return '/client/certificates';
  return '/client/dashboard';
});

function logout() {
  authStore.clearSession();
  router.replace('/client/login');
}
</script>
