<template>
  <!-- Iconify 图标 -->
  <el-icon v-if="isIconify && icon" :size="size" class="dynamic-icon">
    <Icon :icon="icon" class="iconify" />
  </el-icon>

  <!-- Element Plus 图标（运行时按需加载） -->
  <el-icon v-else-if="resolvedEpIcon" :size="size" class="dynamic-icon">
    <component :is="resolvedEpIcon" />
  </el-icon>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { Icon } from '@iconify/vue'
import type { Component } from 'vue'

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

const resolvedEpIcon = shallowRef<Component | null>(null)

let epIconsModulePromise: Promise<Record<string, Component>> | null = null
const epIconCache = new Map<string, Component | null>()

async function resolveElementPlusIcon(name: string): Promise<Component | null> {
  if (!name) return null
  if (epIconCache.has(name)) return epIconCache.get(name) ?? null

  if (!epIconsModulePromise) {
    epIconsModulePromise = import('@element-plus/icons-vue') as unknown as Promise<Record<string, Component>>
  }

  try {
    const mod = await epIconsModulePromise
    const comp = (mod as any)[name] as Component | undefined
    const value = comp ?? null
    epIconCache.set(name, value)
    return value
  } catch {
    epIconCache.set(name, null)
    return null
  }
}

watch(
  () => props.icon,
  async (val) => {
    if (!val || isIconify.value) {
      resolvedEpIcon.value = null
      return
    }

    resolvedEpIcon.value = await resolveElementPlusIcon(val)
  },
  { immediate: true }
)
</script>

<style scoped>
.dynamic-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dynamic-icon :deep(.iconify) {
  width: 1em;
  height: 1em;
  display: block;
}
</style>
