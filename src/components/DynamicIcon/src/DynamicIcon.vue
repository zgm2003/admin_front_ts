<template>
  <span v-if="icon" class="dynamic-icon-wrapper">
    <!-- Iconify 图标 -->
    <Icon v-if="isIconify" :icon="icon" :width="size" :height="size" />
    <!-- Element Plus 图标（动态加载） -->
    <el-icon v-else-if="elementIcon" :size="size">
      <component :is="elementIcon" />
    </el-icon>
  </span>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
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

// 动态导入 Element Plus 图标
const elementIcon = shallowRef<any>(null)

watch(() => props.icon, async (iconName) => {
  if (!iconName || isIconify.value) {
    elementIcon.value = null
    return
  }
  
  try {
    const icons = await import('@element-plus/icons-vue')
    elementIcon.value = (icons as any)[iconName]
  } catch (e) {
    console.warn(`Icon "${iconName}" not found`)
    elementIcon.value = null
  }
}, { immediate: true })
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
