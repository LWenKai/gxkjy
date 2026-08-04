<template>
  <section class="page-section">
    <div class="page-heading">
      <div>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
    </div>

    <div class="panel placeholder-panel">
      <slot>
        <p>该功能将在后续阶段按第一版计划逐步完善。</p>
      </slot>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>
