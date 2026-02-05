<template>
  <!-- Iconify 图标 -->
  <Icon v-if="isIconify && icon" :icon="icon" :width="size" :height="size" class="d-icon" />

  <!-- Element Plus 图标（运行时按需加载） -->
  <component v-else-if="resolvedEpIcon" :is="resolvedEpIcon" :style="iconStyle" class="d-icon" />
</template>

<script setup lang="ts">
import { computed, shallowRef, watchEffect } from 'vue'
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

const iconStyle = computed(() => ({
  width: typeof props.size === 'number' ? `${props.size}px` : props.size,
  height: typeof props.size === 'number' ? `${props.size}px` : props.size,
}))

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

watchEffect(async () => {
  const iconName = props.icon
  if (!iconName || isIconify.value) {
    resolvedEpIcon.value = null
    return
  }

  if (epIconCache.has(iconName)) {
    resolvedEpIcon.value = epIconCache.get(iconName) ?? null
  } else {
    resolvedEpIcon.value = await resolveElementPlusIcon(iconName)
  }
})
</script>

<style scoped>
.d-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
