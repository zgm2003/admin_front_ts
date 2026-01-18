<template>
  <span v-if="icon" class="dynamic-icon-wrapper">
    <!-- Iconify 图标 -->
    <Icon v-if="isIconify" :icon="icon" :width="size" :height="size" />
    <!-- Element Plus 图标 -->
    <el-icon v-else :size="size">
      <component :is="icon" />
    </el-icon>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  icon?: string
  size?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  size: 18
})

// 判断是否为 Iconify 图标格式（包含冒号）
const isIconify = computed(() => {
  return props.icon && props.icon.includes(':')
})
</script>

<style scoped>
/* 包裹容器 - 确保图标垂直居中 */
.dynamic-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Element Plus 图标容器 */
.el-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
