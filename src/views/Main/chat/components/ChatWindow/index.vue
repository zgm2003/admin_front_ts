<script setup lang="ts">
import { ref, computed } from 'vue'
import { Setting } from '@element-plus/icons-vue'
import { useChatStore } from '@/store/chat'
import { ConversationType } from '@/api/chat'
import MessageList from '../MessageList/index.vue'
import MessageInput from '../MessageInput/index.vue'
import GroupSidebar from '../GroupSidebar/index.vue'

const chatStore = useChatStore()

const conversation = computed(() => chatStore.currentConversation)
const isGroup = computed(() => conversation.value?.type === ConversationType.Group)

// 群聊侧边栏
const showGroupSidebar = ref(false)

/** 会话标题 */
const title = computed(() => {
  const conv = conversation.value
  if (!conv) return ''
  if (conv.type === ConversationType.Group) {
    return conv.name || '群聊'
  }
  return conv.name || '私聊'
})

/** 副标题（群聊显示成员数） */
const subtitle = computed(() => {
  const conv = conversation.value
  if (!conv) return ''
  if (conv.type === ConversationType.Group) {
    return `${conv.member_count} 人`
  }
  return ''
})

/** 正在输入提示（仅私聊） */
const typingText = computed(() => {
  if (isGroup.value) return ''
  const users = chatStore.currentTypingUsers
  if (users.length === 0) return ''
  return '对方正在输入...'
})
</script>

<template>
  <div class="chat-window">
    <!-- 头部 -->
    <div class="window-header">
      <div class="header-info">
        <el-avatar :size="32" :src="conversation?.avatar || undefined" class="header-avatar">
          {{ (title || '?')[0] }}
        </el-avatar>
        <div class="header-text">
          <span class="header-title">{{ title }}</span>
          <span v-if="subtitle" class="header-subtitle">{{ subtitle }}</span>
        </div>
      </div>
      <div v-if="isGroup" class="header-actions">
        <el-tooltip content="群聊设置" placement="bottom">
          <el-button text size="small" @click="showGroupSidebar = true">
            <el-icon :size="18"><Setting /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <!-- 正在输入提示 -->
    <div v-if="typingText" class="typing-bar">
      <span class="typing-dot-group">
        <span class="t-dot"></span>
        <span class="t-dot"></span>
        <span class="t-dot"></span>
      </span>
      <span class="typing-text">{{ typingText }}</span>
    </div>

    <!-- 消息列表 -->
    <MessageList class="window-messages" />

    <!-- 输入框 -->
    <MessageInput />

    <!-- 群聊侧边栏 -->
    <GroupSidebar v-if="isGroup" v-model:visible="showGroupSidebar" />
  </div>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.window-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  flex-shrink: 0;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-avatar {
  flex-shrink: 0;
}

.header-text {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.header-actions {
  flex-shrink: 0;
}

.typing-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-extra-light);
  flex-shrink: 0;
}

.typing-dot-group {
  display: flex;
  gap: 3px;
}

.t-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  animation: t-bounce 1.4s infinite ease-in-out both;
}

.t-dot:nth-child(1) { animation-delay: 0s; }
.t-dot:nth-child(2) { animation-delay: 0.2s; }
.t-dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes t-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

.typing-text {
  line-height: 1;
}

.window-messages {
  flex: 1;
  min-height: 0;
}
</style>
