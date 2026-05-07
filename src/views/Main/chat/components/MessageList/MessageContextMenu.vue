<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { CopyDocument, RefreshLeft } from '@element-plus/icons-vue'
import { onClickOutside } from '@vueuse/core'

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  hasMessage: boolean
  canRecall: boolean
}>()

const emit = defineEmits<{
  close: []
  copy: []
  recall: []
}>()

const contextMenuRef = useTemplateRef<HTMLElement>('contextMenuRef')

onClickOutside(contextMenuRef, () => {
  if (props.visible) emit('close')
})
</script>

<template>
  <Teleport to="body">
    <ul
      v-show="visible"
      ref="contextMenuRef"
      class="context-menu"
      :style="{ left: x + 'px', top: y + 'px' }"
    >
      <li
        v-if="hasMessage && canRecall"
        @click="emit('recall')"
      >
        <el-icon><RefreshLeft /></el-icon>
        撤回
      </li>
      <li
        v-if="hasMessage"
        @click="emit('copy')"
      >
        <el-icon><CopyDocument /></el-icon>
        复制
      </li>
    </ul>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 3000;
  min-width: 120px;
  margin: 0;
  padding: 6px 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  list-style: none;
}

.context-menu li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: var(--el-text-color-primary);
  cursor: pointer;
  font-size: 13px;
  transition: background 0.15s;
}

.context-menu li:hover {
  background: var(--el-fill-color-light);
}

.context-menu .el-icon {
  color: var(--el-text-color-regular);
}
</style>
