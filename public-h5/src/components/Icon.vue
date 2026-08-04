<script setup lang="ts">
// 统一图标组件：基于 @iconify/vue，默认使用 Lucide 线性细线风格。
// 用法：<Icon name="home" /> 或 <Icon name="lucide:home" /> 或 <Icon name="settings" :size="20" />
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = withDefaults(
  defineProps<{
    // 图标名，省略前缀时默认使用 lucide 集合
    name: string;
    size?: string | number;
    color?: string;
  }>(),
  {
    size: 18,
    color: 'currentColor',
  },
);

// 自动补全 lucide 前缀，保证全项目只用 Lucide 一套风格
const resolved = computed(() => {
  if (props.name.includes(':')) return props.name;
  return `lucide:${props.name}`;
});
</script>

<template>
  <Icon
    :icon="resolved"
    :width="size"
    :height="size"
    :color="color"
    class="gx-icon"
  />
</template>

<style scoped>
.gx-icon {
  display: inline-flex;
  vertical-align: middle;
  /* 线性细线风：统一描边宽度由图标本身决定，这里只控制对齐 */
}
</style>
