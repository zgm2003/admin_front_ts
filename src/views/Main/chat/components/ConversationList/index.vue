<script setup lang="ts">
import { computed, type CSSProperties } from 'vue'
import { ChatLineRound, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Conversations from 'vue-element-plus-x/es/Conversations/index.js'
import { useChatStore } from '@/store/chat'
import { ConversationType, type ConversationItem } from '@/api/chat'
import { CommonEnum } from '@/enums'
import { formatChatTime } from '@/utils/date'
import type {
  ConversationItem as XConversationItem,
  ConversationMenu,
  ConversationMenuCommand,
} from 'vue-element-plus-x/types/Conversations'
import ConversationListItemContent from './ConversationListItemContent.vue'

const chatStore = useChatStore()

const emit = defineEmits<{
  select: [conv: ConversationItem]
}>()

type ConversationCommand = 'open' | 'pin' | 'mark-read' | 'remove'

interface ConversationListItem extends ConversationItem, XConversationItem {
  key: number
  label: string
  displayName: string
  avatarText: string
  displayTime: string
  preview: string
  unreadLabel: string
  pinned: boolean
}

const activeConversationId = computed(() => chatStore.currentConversation?.id)

const conversationItems = computed<ConversationListItem[]>(() =>
  chatStore.conversations.map(toConversationListItem),
)

const conversationPanelStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  padding: '8px 0 8px 8px',
  backgroundColor: 'var(--el-bg-color)',
  borderRadius: '0',
  boxShadow: 'none',
}

const conversationItemStyle: CSSProperties = {
  marginRight: '8px',
  padding: '10px 12px',
  borderRadius: '14px',
}

const conversationItemHoverStyle: CSSProperties = {
  backgroundColor: 'var(--el-fill-color-light)',
}

const conversationItemActiveStyle: CSSProperties = {
  backgroundColor: 'var(--el-color-primary-light-9)',
}

const conversationMenuStyle: CSSProperties = {
  minWidth: '128px',
}

const conversationMenu: ConversationMenu[] = [
  { label: '打开会话', key: 'open', command: 'open' },
  { label: '置顶会话', key: 'pin', command: 'pin' },
  { label: '标记已读', key: 'mark-read', command: 'mark-read' },
  {
    label: '移除会话',
    key: 'remove',
    command: 'remove',
    divided: true,
    menuItemHoverStyle: {
      color: 'var(--el-color-danger)',
      backgroundColor: 'var(--el-color-danger-light-9)',
    },
  },
]

function toConversationListItem(conv: ConversationItem): ConversationListItem {
  const displayName = getDisplayName(conv)
  return {
    ...conv,
    key: conv.id,
    label: displayName,
    displayName,
    avatarText: displayName.charAt(0),
    displayTime: formatChatTime(conv.last_message_at),
    preview: conv.last_message_preview || '',
    unreadLabel: conv.unread_count > 99 ? '99+' : String(conv.unread_count),
    pinned: isPinned(conv),
  }
}

function isPinned(conv: ConversationItem): boolean {
  return conv.is_pinned === CommonEnum.YES
}

function getDisplayName(conv: ConversationItem): string {
  if (conv.type === ConversationType.Group) return conv.name || '群聊'
  return conv.name || '私聊'
}

function isConversationCommand(command: ConversationMenuCommand): command is ConversationCommand {
  return command === 'open'
    || command === 'pin'
    || command === 'mark-read'
    || command === 'remove'
}

async function handleConversationChange(item: ConversationListItem) {
  await selectConversation(item)
}

async function handleConversationMenuCommand(command: ConversationMenuCommand, item: ConversationListItem) {
  if (!isConversationCommand(command)) return

  switch (command) {
    case 'open':
      await selectConversation(item)
      return
    case 'pin':
      await togglePin(item)
      return
    case 'mark-read':
      await markConversationRead(item)
      return
    case 'remove':
      await removeConversation(item)
  }
}

async function selectConversation(conv: ConversationItem) {
  try {
    await chatStore.selectConversation(conv)
    emit('select', conv)
  } catch {
    ElMessage.error('操作失败')
  }
}

async function togglePin(conv: ConversationItem) {
  try {
    await chatStore.togglePin(conv.id)
  } catch {
    ElMessage.error('操作失败')
  }
}

async function markConversationRead(conv: ConversationItem) {
  if (!conv.unread_count) return

  try {
    await chatStore.markRead(conv.id)
  } catch {
    ElMessage.error('操作失败')
  }
}

async function removeConversation(conv: ConversationItem) {
  const name = getDisplayName(conv)
  const isGroup = conv.type === ConversationType.Group
  const msg = isGroup
    ? `确定从列表中移除「${name}」？聊天记录将被清除，但不会退出群聊。`
    : `确定从列表中移除与「${name}」的会话？聊天记录将被清除，不影响好友关系。`

  try {
    await ElMessageBox.confirm(msg, '移除会话', { type: 'warning' })
  } catch {
    return
  }

  try {
    await chatStore.deleteConversation(conv.id)
    ElMessage.success('已移除')
  } catch {
    ElMessage.error('操作失败')
  }
}
</script>

<template>
  <div class="conversation-list-wrap">
    <div
      v-if="chatStore.loading"
      class="loading-tip"
    >
      <el-icon
        class="is-loading"
        :size="20"
      >
        <Loading />
      </el-icon>
      <span>加载中...</span>
    </div>

    <div
      v-else-if="conversationItems.length === 0"
      class="empty-tip"
    >
      <el-icon
        :size="48"
        class="empty-icon"
      >
        <ChatLineRound />
      </el-icon>
      <p>
        暂无会话
      </p>
      <p class="empty-hint">
        创建私聊或群聊开始聊天
      </p>
    </div>

    <Conversations
      v-else
      :items="conversationItems"
      :active="activeConversationId"
      row-key="id"
      label-key="label"
      :style="conversationPanelStyle"
      :items-style="conversationItemStyle"
      :items-hover-style="conversationItemHoverStyle"
      :items-active-style="conversationItemActiveStyle"
      :items-menu-opened-style="conversationItemActiveStyle"
      :menu="conversationMenu"
      :menu-style="conversationMenuStyle"
      :show-built-in-menu="true"
      show-built-in-menu-type="hover"
      menu-class-name="chat-conversation-menu"
      :menu-teleported="true"
      :label-height="58"
      @change="handleConversationChange"
      @menu-command="handleConversationMenuCommand"
    >
      <template #label="{ item }">
        <ConversationListItemContent :item="item" />
      </template>

      <template #menu="{ item }">
        <el-dropdown-menu>
          <el-dropdown-item command="open">
            打开会话
          </el-dropdown-item>
          <el-dropdown-item command="pin">
            {{ item.pinned ? '取消置顶' : '置顶会话' }}
          </el-dropdown-item>
          <el-dropdown-item
            command="mark-read"
            :disabled="item.unread_count <= 0"
          >
            标记已读
          </el-dropdown-item>
          <el-dropdown-item
            divided
            command="remove"
            class="conversation-menu-danger"
          >
            移除会话
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </Conversations>
  </div>
</template>

<style scoped>
.conversation-list-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
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

:global(.chat-conversation-menu .conversation-menu-danger) {
  color: var(--el-color-danger);
}

:global(.chat-conversation-menu .conversation-menu-danger:not(.is-disabled):focus) {
  background-color: var(--el-color-danger-light-9);
}
</style>
