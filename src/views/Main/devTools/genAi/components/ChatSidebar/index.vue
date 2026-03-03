<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus, Delete, ChatLineSquare } from '@element-plus/icons-vue'
import type { ConversationItem } from '@/api/devTools/genAi'

const { t } = useI18n()

defineProps<{
  conversationList: ConversationItem[]
  loading: boolean
  activeId: number | null
  disabled: boolean
}>()

const emit = defineEmits<{
  switch: [conv: ConversationItem]
  delete: [conv: ConversationItem]
  newChat: []
}>()
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-hd">
      <span class="sidebar-title">{{ t('aiCodeGen.history.title') }}</span>
      <el-button :icon="Plus" size="small" text @click="emit('newChat')" :disabled="disabled" />
    </div>
    <div class="sidebar-body" v-loading="loading">
      <div
        v-for="conv in conversationList"
        :key="conv.id"
        class="conv-item"
        :class="{ active: activeId === conv.id }"
        @click="emit('switch', conv)"
      >
        <el-icon class="conv-icon"><ChatLineSquare /></el-icon>
        <span class="conv-title">{{ conv.title || t('aiCodeGen.history.untitled') }}</span>
        <el-button
          class="conv-del"
          :icon="Delete"
          size="small"
          text
          @click.stop="emit('delete', conv)"
        />
      </div>
      <div v-if="!loading && conversationList.length === 0" class="sidebar-empty">
        {{ t('aiCodeGen.history.empty') }}
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}

.sidebar-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 600;
  font-size: 14px;
}

.sidebar-title {
  color: var(--el-text-color-primary);
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 2px;
}

.conv-item:hover {
  background: var(--el-fill-color);
}

.conv-item.active {
  background: var(--el-color-primary-light-9);
}

.conv-item.active .conv-title {
  color: var(--el-color-primary);
  font-weight: 500;
}

.conv-icon {
  flex-shrink: 0;
  font-size: 15px;
  color: var(--el-text-color-secondary);
}

.conv-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.conv-del {
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.conv-item:hover .conv-del {
  opacity: 0.6;
}

.conv-del:hover {
  opacity: 1 !important;
}

.sidebar-empty {
  text-align: center;
  padding: 32px 12px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}
</style>
