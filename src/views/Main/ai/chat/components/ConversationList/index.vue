<script setup lang="ts">
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'
import {Plus, Loading, MoreFilled, Edit, Delete} from '@element-plus/icons-vue'

const {t} = useI18n()

const props = defineProps<{
  conversations: any[]
  loading: boolean
  currentId: number | null
}>()

const emit = defineEmits<{
  select: [conv: any]
  create: []
  rename: [conv: any]
  delete: [conv: any]
}>()

// 格式化时间
const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) {
    return d.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
  }
  return d.toLocaleDateString('zh-CN', {month: 'short', day: 'numeric'}) + ' ' +
      d.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'})
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <el-button type="primary" @click="emit('create')" style="width: 100%">
        <el-icon><Plus/></el-icon>
        {{ t('aiChat.newConversation') }}
      </el-button>
    </div>
    <el-scrollbar class="conversation-list">
      <div v-if="loading" class="loading-tip">
        <el-icon class="is-loading"><Loading/></el-icon>
      </div>
      <div v-else-if="conversations.length === 0" class="empty-tip">
        {{ t('aiChat.noConversation') }}
      </div>
      <div
          v-else
          v-for="conv in conversations"
          :key="conv.id"
          class="conversation-item"
          :class="{active: conv.id === currentId}"
          @click="emit('select', conv)"
      >
        <div class="conv-info">
          <div class="conv-title">{{ conv.title || t('aiChat.untitled') }}</div>
          <div class="conv-time">{{ formatTime(conv.last_message_at || conv.created_at) }}</div>
        </div>
        <el-dropdown trigger="click" @click.stop>
          <el-button text size="small" class="conv-menu-btn" @click.stop>
            <el-icon><MoreFilled/></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="emit('rename', conv)">
                <el-icon><Edit/></el-icon>
                {{ t('aiChat.rename') }}
              </el-dropdown-item>
              <el-dropdown-item @click="emit('delete', conv)" divided>
                <el-icon><Delete/></el-icon>
                {{ t('aiChat.delete') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.sidebar {
  width: 280px;
  min-width: 280px;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.conversation-list {
  flex: 1;
  overflow: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: background 0.2s;
}

.conversation-item:hover {
  background: var(--el-fill-color-light);
}

.conversation-item.active {
  background: var(--el-color-primary-light-9);
}

.conv-info {
  flex: 1;
  min-width: 0;
}

.conv-title {
  font-size: 14px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.conv-menu-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-item:hover .conv-menu-btn {
  opacity: 1;
}

.loading-tip,
.empty-tip {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    min-width: 100%;
  }
}
</style>
