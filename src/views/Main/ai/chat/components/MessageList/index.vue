<script setup lang="ts">
import {useI18n} from 'vue-i18n'
import {Loading, CopyDocument, Delete, RefreshRight} from '@element-plus/icons-vue'

const {t} = useI18n()

const props = defineProps<{
  messages: any[]
  loading: boolean
  sending?: boolean
}>()

const emit = defineEmits<{
  copy: [msg: any]
  delete: [msg: any]
  regenerate: [msg: any]
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

// 是否显示重新生成按钮（只有最后一条 AI 消息才显示）
const showRegenerate = (msg: any, index: number) => {
  if (msg.role === 1) return false // 用户消息不显示
  if (msg.isStreaming) return false // 流式中不显示
  // 是最后一条 AI 消息
  for (let i = props.messages.length - 1; i >= 0; i--) {
    if (props.messages[i].role !== 1) {
      return i === index
    }
  }
  return false
}
</script>

<template>
  <div class="message-list-container">
    <div v-if="loading" class="loading-tip">
      <el-icon class="is-loading"><Loading/></el-icon>
    </div>
    <div v-else class="message-list">
      <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="message-item"
          :class="{'user-message': msg.role === 1, 'assistant-message': msg.role !== 1}"
      >
        <div class="message-header">
          <span class="message-role">{{ getRoleName(msg.role) }}</span>
          <span class="message-time">{{ formatTime(msg.created_at) }}</span>
        </div>
        <div class="message-content">{{ msg.content }}</div>
        <!-- 操作按钮 -->
        <div class="message-actions" v-if="!msg.isStreaming">
          <el-tooltip :content="t('aiChat.copyMessage')" placement="top">
            <el-button text size="small" @click="emit('copy', msg)">
              <el-icon><CopyDocument/></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="t('aiChat.deleteMessage')" placement="top">
            <el-button text size="small" @click="emit('delete', msg)">
              <el-icon><Delete/></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip v-if="showRegenerate(msg, index)" :content="t('aiChat.regenerate')" placement="top">
            <el-button text size="small" :disabled="sending" @click="emit('regenerate', msg)">
              <el-icon><RefreshRight/></el-icon>
            </el-button>
          </el-tooltip>
        </div>
        <!-- 流式输出指示器 -->
        <div v-if="msg.isStreaming" class="streaming-indicator">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
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
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.message-time {
  font-size: 11px;
  opacity: 0.7;
}

.message-content {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.user-message .message-actions .el-button {
  color: rgba(255, 255, 255, 0.8);
}

.user-message .message-actions .el-button:hover {
  color: #fff;
}

.streaming-indicator {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.streaming-indicator .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
  animation: blink 1.4s infinite both;
}

.streaming-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.streaming-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 80%, 100% { opacity: 0.2; }
  40% { opacity: 1; }
}

@media (max-width: 768px) {
  .message-item {
    max-width: 90%;
  }
}
</style>
