<script setup lang="ts">
import { computed } from 'vue';
import PublicCertificatePage from './PublicCertificatePage.vue';
import ScreenPage from './ScreenPage.vue';

const isScreenPage = computed(() => {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path === '/screen';
});
</script>

<template>
  <ScreenPage v-if="isScreenPage" />
  <PublicCertificatePage v-else />
</template>
