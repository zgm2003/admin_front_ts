<script setup lang="ts">
import {useI18n} from 'vue-i18n'
import {Loading, CopyDocument, Delete, RefreshRight, User, ChatDotRound} from '@element-plus/icons-vue'
import MarkdownRenderer from '@/components/MarkdownRenderer/index.vue'

const {t} = useI18n()

const props = defineProps<{
  messages: any[]
  loading: boolean
  sending?: boolean
  userAvatar?: string    // 用户头像
  agentAvatar?: string   // 智能体头像
}>()

const emit = defineEmits<{
  copy: [msg: any]
  delete: [msg: any]
  regenerate: [msg: any]
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
</script>

<template>
  <div class="message-list-container">
    <div v-if="loading" class="loading-tip">
      <el-icon class="is-loading" :size="24"><Loading/></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else class="message-list">
      <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="message-row"
          :class="{'user-row': msg.role === 1}"
      >
        <!-- 头像 -->
        <div class="avatar" :class="msg.role === 1 ? 'user-avatar' : 'ai-avatar'">
          <!-- 用户头像 -->
          <template v-if="msg.role === 1">
            <el-avatar v-if="userAvatar" :src="userAvatar" :size="36"/>
            <el-icon v-else :size="20"><User/></el-icon>
          </template>
          <!-- AI 头像 -->
          <template v-else>
            <el-avatar v-if="agentAvatar" :src="agentAvatar" :size="36"/>
            <el-icon v-else :size="20"><ChatDotRound/></el-icon>
          </template>
        </div>
        
        <!-- 消息内容区 -->
        <div class="message-body">
          <div class="message-bubble" :class="msg.role === 1 ? 'user-bubble' : 'ai-bubble'">
            <!-- 用户消息纯文本，AI 消息用 Markdown 渲染 -->
            <div v-if="msg.role === 1" class="message-text">{{ msg.content }}</div>
            <MarkdownRenderer v-else :content="msg.content" class="message-text"/>
          </div>
          
          <!-- 操作按钮 - 仅 hover 时显示 -->
          <div class="message-actions" v-if="!msg.isStreaming">
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
  padding: 0 16px;
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
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 0;
}

/* 消息行 */
.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-row.user-row {
  flex-direction: row-reverse;
}

/* 头像 */
.avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  overflow: hidden;
}

.avatar :deep(.el-avatar) {
  border-radius: 8px;
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-avatar {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

/* 消息体 */
.message-body {
  flex: 1;
  min-width: 0;
  max-width: 85%;
}

.user-row .message-body {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* 气泡 */
.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
}

.user-bubble {
  background: var(--el-color-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.ai-bubble {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  border-bottom-left-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.message-text {
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.user-bubble .message-text {
  white-space: pre-wrap;
}

/* 操作按钮 */
.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message-row:hover .message-actions {
  opacity: 1;
}

.message-actions :deep(.el-button) {
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
}

/* 流式输出指示器 */
.streaming-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding-left: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
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

/* 响应式 */
@media (max-width: 768px) {
  .message-list-container {
    padding: 0 8px;
  }
  
  .message-list {
    gap: 16px;
  }
  
  .message-body {
    max-width: 90%;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
  }
}
</style>
