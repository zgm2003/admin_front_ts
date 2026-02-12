<script setup lang="ts">
import { ChatLineRound, Loading } from '@element-plus/icons-vue'
import { useChatStore } from '@/store/chat'
import { ConversationType, type ConversationItem } from '@/api/chat'
import { formatTimeAgo } from '@/utils/date'

const chatStore = useChatStore()

const emit = defineEmits<{
  select: [conv: ConversationItem]
}>()

/** 获取会话显示名称 */
function getDisplayName(conv: ConversationItem): string {
  if (conv.type === ConversationType.Group) {
    return conv.name || '群聊'
  }
  // 私聊：使用会话名称（后端应返回对方用户名）
  return conv.name || '私聊'
}

/** 获取头像文字 */
function getAvatarText(conv: ConversationItem): string {
  const name = getDisplayName(conv)
  return name.charAt(0)
}

/** 处理选中会话 */
function handleSelect(conv: ConversationItem) {
  emit('select', conv)
}
</script>

<template>
  <div class="conversation-list-wrap">
    <!-- 加载中 -->
    <div v-if="chatStore.loading" class="loading-tip">
      <el-icon class="is-loading" :size="20"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="chatStore.conversations.length === 0" class="empty-tip">
      <el-icon :size="48" class="empty-icon"><ChatLineRound /></el-icon>
      <p>暂无会话</p>
      <p class="empty-hint">创建私聊或群聊开始聊天</p>
    </div>

    <!-- 会话列表 -->
    <el-scrollbar v-else class="list-scrollbar">
      <div
        v-for="conv in chatStore.conversations"
        :key="conv.id"
        class="conversation-item"
        :class="{ active: chatStore.currentConversation?.id === conv.id }"
        @click="handleSelect(conv)"
      >
        <!-- 头像 -->
        <el-avatar :size="42" :src="conv.avatar || undefined" class="conv-avatar">
          {{ getAvatarText(conv) }}
        </el-avatar>

        <!-- 中间信息 -->
        <div class="conv-info">
          <div class="conv-top">
            <span class="conv-name">{{ getDisplayName(conv) }}</span>
            <span class="conv-time">{{ formatTimeAgo(conv.last_message_at) }}</span>
          </div>
          <div class="conv-bottom">
            <span class="conv-preview">{{ conv.last_message_preview || '' }}</span>
            <el-badge
              v-if="conv.unread_count > 0"
              :value="conv.unread_count > 99 ? '99+' : conv.unread_count"
              class="conv-badge"
            />
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.conversation-list-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.loading-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
  color: var(--el-text-color-secondary);
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.empty-icon {
  color: var(--el-text-color-placeholder);
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.list-scrollbar {
  flex: 1;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.conversation-item:hover {
  background: var(--el-fill-color-light);
}

.conversation-item.active {
  background: var(--el-color-primary-light-9);
}

.conv-avatar {
  flex-shrink: 0;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.conv-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.conv-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.conv-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.conv-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.conv-preview {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-badge :deep(.el-badge__content) {
  font-size: 11px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
}
</style>
