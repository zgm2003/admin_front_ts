<script setup lang="ts">
import {useI18n} from 'vue-i18n'
import {Loading} from '@element-plus/icons-vue'

const {t} = useI18n()

const props = defineProps<{
  messages: any[]
  loading: boolean
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

// 获取角色名称
const getRoleName = (role: number) => {
  return role === 1 ? t('aiChat.you') : t('aiChat.assistant')
}
</script>

<template>
  <div class="message-list-container">
    <div v-if="loading" class="loading-tip">
      <el-icon class="is-loading"><Loading/></el-icon>
    </div>
    <div v-else class="message-list">
      <div
          v-for="msg in messages"
          :key="msg.id"
          class="message-item"
          :class="{'user-message': msg.role === 1, 'assistant-message': msg.role !== 1}"
      >
        <div class="message-role">{{ getRoleName(msg.role) }}</div>
        <div class="message-content">{{ msg.content }}</div>
        <div class="message-time">{{ formatTime(msg.created_at) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-list-container {
  height: 100%;
}

.loading-tip {
  padding: 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-item {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
}

.user-message {
  align-self: flex-end;
  background: var(--el-color-primary);
  color: #fff;
}

.user-message .message-role,
.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.assistant-message {
  align-self: flex-start;
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.message-role {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 4px;
}

.message-content {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-time {
  font-size: 11px;
  margin-top: 6px;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .message-item {
    max-width: 90%;
  }
}
</style>
