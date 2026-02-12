<script setup lang="ts">
import { ref } from 'vue'
import { ChatLineRound, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onClickOutside } from '@vueuse/core'
import { useChatStore } from '@/store/chat'
import { ConversationType, type ConversationItem } from '@/api/chat'
import { CommonEnum } from '@/enums'
import { formatChatTime } from '@/utils/date'

const chatStore = useChatStore()

const emit = defineEmits<{
  select: [conv: ConversationItem]
}>()

// ========== 置顶 ==========
function isPinned(conv: ConversationItem): boolean {
  return conv.is_pinned === CommonEnum.YES
}

async function togglePin(conv: ConversationItem) {
  try {
    await chatStore.togglePin(conv.id)
  } catch {
    ElMessage.error('操作失败')
  }
}

// ========== 右键菜单 ==========
const ctxVisible = ref(false)
const ctxLeft = ref(0)
const ctxTop = ref(0)
const ctxConv = ref<ConversationItem | null>(null)
const ctxMenuRef = ref<HTMLElement | null>(null)

function openCtxMenu(e: MouseEvent, conv: ConversationItem) {
  e.preventDefault()
  ctxConv.value = conv
  ctxLeft.value = e.clientX
  ctxTop.value = e.clientY + 4
  ctxVisible.value = true
}

onClickOutside(ctxMenuRef, () => {
  if (ctxVisible.value) ctxVisible.value = false
})

function ctxOpen() {
  ctxVisible.value = false
  if (ctxConv.value) emit('select', ctxConv.value)
}

function ctxPin() {
  ctxVisible.value = false
  if (ctxConv.value) togglePin(ctxConv.value)
}

async function ctxMarkRead() {
  ctxVisible.value = false
  if (!ctxConv.value || !ctxConv.value.unread_count) return
  try {
    await chatStore.markRead(ctxConv.value.id)
  } catch {
    ElMessage.error('操作失败')
  }
}

async function ctxDelete() {
  ctxVisible.value = false
  if (!ctxConv.value) return
  const conv = ctxConv.value
  const name = getDisplayName(conv)
  const isGroup = conv.type === ConversationType.Group
  const msg = isGroup
    ? `确定从列表中移除「${name}」？聊天记录将被清除，但不会退出群聊。`
    : `确定从列表中移除与「${name}」的会话？聊天记录将被清除，不影响好友关系。`
  await ElMessageBox.confirm(msg, '移除会话', { type: 'warning' })
  try {
    await chatStore.deleteConversation(conv.id)
    ElMessage.success('已移除')
  } catch {
    ElMessage.error('操作失败')
  }
}

// ========== 会话显示 ==========

function getDisplayName(conv: ConversationItem): string {
  if (conv.type === ConversationType.Group) return conv.name || '群聊'
  return conv.name || '私聊'
}

function getAvatarText(conv: ConversationItem): string {
  return getDisplayName(conv).charAt(0)
}

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
        :class="{ active: chatStore.currentConversation?.id === conv.id, pinned: isPinned(conv) }"
        @click="handleSelect(conv)"
        @contextmenu.prevent="openCtxMenu($event, conv)"
      >
        <el-avatar :size="42" :src="conv.avatar || undefined" class="conv-avatar">
          {{ getAvatarText(conv) }}
        </el-avatar>
        <div class="conv-info">
          <div class="conv-top">
            <span class="conv-name">
              {{ getDisplayName(conv) }}
            </span>
            <span class="conv-time">{{ formatChatTime(conv.last_message_at) }}</span>
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

    <!-- 右键菜单 -->
    <ul ref="ctxMenuRef" v-show="ctxVisible" class="ctx-menu" :style="{ left: ctxLeft + 'px', top: ctxTop + 'px' }">
      <li @click="ctxOpen">打开会话</li>
      <li @click="ctxPin">{{ ctxConv && isPinned(ctxConv) ? '取消置顶' : '置顶会话' }}</li>
      <li :class="{ 'ctx-disabled': !ctxConv?.unread_count }" @click="ctxMarkRead">标记已读</li>
      <li class="ctx-danger" @click="ctxDelete">移除会话</li>
    </ul>
  </div>
</template>

<style scoped>
.conversation-list-wrap { display: flex; flex-direction: column; height: 100%; }
.loading-tip { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: var(--el-text-color-secondary); }
.empty-tip { display: flex; flex-direction: column; align-items: center; padding: 48px 24px; color: var(--el-text-color-secondary); text-align: center; }
.empty-icon { color: var(--el-text-color-placeholder); margin-bottom: 12px; }
.empty-hint { font-size: 12px; color: var(--el-text-color-placeholder); margin-top: 4px; }
.list-scrollbar { flex: 1; }

.conversation-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; cursor: pointer; transition: background 0.15s ease; user-select: none; }
.conversation-item:hover { background: var(--el-fill-color-light); }
.conversation-item.active { background: var(--el-color-primary-light-9); }
.conversation-item.pinned { background: var(--el-fill-color-extra-light); }
.conversation-item.pinned.active { background: var(--el-color-primary-light-9); }

.conv-avatar { flex-shrink: 0; background: var(--el-color-primary-light-7); color: var(--el-color-primary); font-size: 16px; font-weight: 600; }
.conv-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.conv-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.conv-name { flex: 1; min-width: 0; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-time { flex-shrink: 0; font-size: 12px; color: var(--el-text-color-placeholder); }
.conv-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.conv-preview { flex: 1; min-width: 0; font-size: 12px; color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-badge :deep(.el-badge__content) { font-size: 11px; height: 18px; line-height: 18px; padding: 0 5px; }

/* 右键菜单 - 对齐 TabTag 风格 */
.ctx-menu { position: fixed; z-index: 3000; list-style: none; margin: 0; padding: 6px 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; box-shadow: var(--el-box-shadow-light); min-width: 120px; }
.ctx-menu li { display: flex; align-items: center; padding: 8px 16px; font-size: 13px; color: var(--el-text-color-primary); cursor: pointer; transition: background 0.15s; }
.ctx-menu li:hover { background: var(--el-fill-color-light); }
.ctx-menu .ctx-danger { color: var(--el-color-danger); }
.ctx-menu .ctx-danger:hover { background: var(--el-color-danger-light-9); }
.ctx-menu .ctx-disabled { color: var(--el-text-color-placeholder); cursor: not-allowed; }
.ctx-menu .ctx-disabled:hover { background: transparent; }
</style>
