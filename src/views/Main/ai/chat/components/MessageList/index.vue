<script setup lang="ts">
import {useI18n} from 'vue-i18n'
import {Loading, CopyDocument, Delete, RefreshRight, Top, Bottom} from '@element-plus/icons-vue'
import MarkdownRenderer from '@/components/MarkdownRenderer/index.vue'

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
  feedback: [msg: any, feedback: number | null]  // 1=点赞 2=点踩 null=取消
}>()

// 是否显示重新生成按钮（只有最后一条 AI 消息才显示）
const showRegenerate = (msg: any, index: number) => {
  if (msg.role === 1) return false
  if (msg.isStreaming) return false
  for (let i = props.messages.length - 1; i >= 0; i--) {
    if (props.messages[i].role !== 1) {
      return i === index
    }
  }
  return false
}

// 获取消息的反馈状态
const getFeedback = (msg: any): number | null => {
  return msg.meta_json?.feedback ?? null
}

// 点击反馈按钮
const handleFeedback = (msg: any, feedback: number) => {
  const current = getFeedback(msg)
  // 点击已选中的反馈则取消
  emit('feedback', msg, current === feedback ? null : feedback)
}
</script>

<template>
  <div class="message-list-container">
    <!-- 只在没有消息且正在加载时显示 loading -->
    <div v-if="loading && messages.length === 0" class="loading-tip">
      <el-icon class="is-loading" :size="24"><Loading/></el-icon>
      <span>加载中...</span>
    </div>
    <!-- 有消息时始终显示消息列表 -->
    <div v-else class="message-list">
      <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="message-row"
          :class="{'user-row': msg.role === 1}"
      >
        <!-- 消息内容区 -->
        <div class="message-body" :class="{'user-body': msg.role === 1}">
          <div class="message-bubble" :class="msg.role === 1 ? 'user-bubble' : 'ai-bubble'">
            <!-- 用户消息纯文本，AI 消息用 Markdown 渲染 -->
            <div v-if="msg.role === 1" class="message-text">{{ msg.content }}</div>
            <MarkdownRenderer v-else :content="msg.content" class="message-text"/>
          </div>
          
          <!-- 操作按钮 - 仅 hover 时显示 -->
          <div class="message-actions" v-if="!msg.isStreaming">
            <!-- AI 消息显示点赞/点踩 -->
            <template v-if="msg.role === 2">
              <el-button 
                text size="small" 
                :class="{ 'feedback-active': getFeedback(msg) === 1 }"
                @click="handleFeedback(msg, 1)"
              >
                <el-icon :size="16"><Top /></el-icon>
              </el-button>
              <el-button 
                text size="small" 
                :class="{ 'feedback-active': getFeedback(msg) === 2 }"
                @click="handleFeedback(msg, 2)"
              >
                <el-icon :size="16"><Bottom /></el-icon>
              </el-button>
            </template>
            <el-button type="info" text size="small" :icon="CopyDocument" @click="emit('copy', msg)">
              复制
            </el-button>
            <el-button type="info" text size="small" :icon="Delete" @click="emit('delete', msg)">
              删除
            </el-button>
            <el-button 
              v-if="showRegenerate(msg, index)" 
              type="info" text size="small" 
              :icon="RefreshRight" 
              :disabled="sending" 
              @click="emit('regenerate', msg)"
            >
              重新生成
            </el-button>
          </div>
          
          <!-- 流式输出指示器 -->
          <div v-if="msg.isStreaming" class="streaming-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-list-container {
  height: 100%;
  overflow-y: auto;
}

.loading-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: var(--el-text-color-secondary);
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 0;
  max-width: 768px;
  margin: 0 auto;
}

/* 消息行 */
.message-row {
  display: flex;
  flex-direction: column;
  padding: 0 16px;
}

.message-row.user-row {
  align-items: flex-end;
}

/* 消息体 */
.message-body {
  max-width: 100%;
  min-width: 0;
  position: relative;
}

.user-body {
  max-width: 70%;
}

/* 消息气泡 */
.message-bubble {
  padding: 12px 16px;
  border-radius: 20px;
}

/* 用户消息 - 气泡风格 */
.user-bubble {
  background: var(--el-color-primary);
  color: #fff;
  border-radius: 20px 20px 4px 20px;
}

/* AI 消息 - 无气泡，直接显示 */
.ai-bubble {
  padding: 0;
  background: transparent;
  border: none;
  color: var(--el-text-color-primary);
}

.message-text {
  font-size: 15px;
  line-height: 1.75;
  word-break: break-word;
}

.user-bubble .message-text {
  white-space: pre-wrap;
}

/* 操作按钮 - ChatGPT 风格 */
.message-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.user-row .message-actions {
  justify-content: flex-end;
}

.message-row:hover .message-actions {
  opacity: 1;
}

.message-actions :deep(.el-button) {
  font-size: 13px;
  padding: 6px 8px;
  height: auto;
  color: var(--el-text-color-secondary);
  border-radius: 6px;
}

.message-actions :deep(.el-button:hover) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.message-actions :deep(.el-button .el-icon) {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  transition: color 0.15s ease;
}

.message-actions :deep(.el-button:hover .el-icon) {
  color: var(--el-text-color-primary);
}

.message-actions :deep(.feedback-active),
.message-actions :deep(.feedback-active:hover) {
  background: var(--el-color-primary-light-9) !important;
}

.message-actions :deep(.feedback-active .el-icon) {
  color: var(--el-color-primary) !important;
}

/* 流式输出指示器 */
.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding-left: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-secondary);
  animation: typing 1.4s infinite ease-in-out both;
}

.typing-dot:nth-child(1) { animation-delay: 0s; }
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .message-list {
    gap: 20px;
    padding: 16px 0;
  }
  
  .message-row {
    padding: 0 12px;
  }
  
  .user-body {
    max-width: 85%;
  }
  
  .message-text {
    font-size: 14px;
  }
}
</style>
