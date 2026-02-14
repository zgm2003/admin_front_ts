<script setup lang="ts">
import { ref, nextTick, watch, onMounted, computed } from 'vue'
import { Loading, Download } from '@element-plus/icons-vue'
import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'
import { useIsMobile } from '@/hooks/useResponsive'
import { MessageType, type MessageItem } from '@/api/chat'
import { formatChatTime } from '@/utils/date'
import { formatFileSize } from '@/utils/format'
import { downloadFile } from '@/components/DownloadManager'

const chatStore = useChatStore()
const userStore = useUserStore()
const isMobile = useIsMobile()

const scrollRef = ref<InstanceType<typeof import('element-plus')['ElScrollbar']>>()
const loadingMore = ref(false)

const currentUserId = computed(() => Number(userStore.user_id))

function isSelf(msg: MessageItem): boolean {
  return msg.sender_id === currentUserId.value
}

function getSenderName(msg: MessageItem): string {
  return msg.sender?.username || `用户${msg.sender_id}`
}

function getAvatarText(msg: MessageItem): string {
  return getSenderName(msg).charAt(0)
}

function scrollToBottom() {
  nextTick(() => {
    scrollRef.value?.setScrollTop(999999)
  })
}

async function handleScroll({ scrollTop }: { scrollTop: number }) {
  if (scrollTop > 50 || loadingMore.value || !chatStore.currentHasMore) return
  loadingMore.value = true
  const wrapEl = scrollRef.value?.wrapRef
  const prevHeight = wrapEl?.scrollHeight || 0
  try {
    await chatStore.loadMoreMessages()
    nextTick(() => {
      const newHeight = wrapEl?.scrollHeight || 0
      scrollRef.value?.setScrollTop(newHeight - prevHeight)
    })
  } finally {
    loadingMore.value = false
  }
}

watch(
  () => chatStore.currentMessages.length,
  (newLen, oldLen) => {
    if (newLen > (oldLen || 0)) scrollToBottom()
  },
)

watch(() => chatStore.currentConversation?.id, () => scrollToBottom())

onMounted(() => scrollToBottom())

defineExpose({ scrollToBottom })
</script>

<template>
  <el-scrollbar ref="scrollRef" class="message-list" :class="{ 'is-mobile': isMobile }" @scroll="handleScroll">
    <!-- 加载更多 -->
    <div v-if="chatStore.currentHasMore" class="load-more-tip">
      <template v-if="loadingMore">
        <el-icon class="is-loading" :size="16"><Loading /></el-icon>
        <span>加载中...</span>
      </template>
      <span v-else class="load-hint">上滑加载更多</span>
    </div>

    <!-- 消息列表 -->
    <div class="messages">
      <template v-for="msg in chatStore.currentMessages" :key="msg.id">
        <!-- 系统消息 -->
        <div v-if="msg.type === MessageType.System" class="msg-system">
          <span class="system-text">{{ msg.content }}</span>
        </div>

        <!-- 普通消息 -->
        <div v-else class="msg-row" :class="{ 'msg-self': isSelf(msg) }">
          <!-- 头像 -->
          <el-avatar :size="36" :src="msg.sender?.avatar || undefined" class="msg-avatar">
            {{ getAvatarText(msg) }}
          </el-avatar>

          <!-- 消息体 -->
          <div class="msg-body">
            <div class="msg-meta">
              <span class="msg-sender">{{ getSenderName(msg) }}</span>
              <span class="msg-time">{{ formatChatTime(msg.created_at) }}</span>
            </div>

            <!-- 文本消息 -->
            <div v-if="msg.type === MessageType.Text" class="msg-bubble">
              <span class="msg-text">{{ msg.content }}</span>
            </div>

            <!-- 图片消息 -->
            <div v-else-if="msg.type === MessageType.Image" class="msg-image-wrapper">
              <el-image
                :src="msg.content"
                fit="contain"
                class="msg-image"
                :preview-src-list="[msg.content]"
                preview-teleported
              />
            </div>

            <!-- 文件消息 -->
            <div v-else-if="msg.type === MessageType.File" class="msg-bubble msg-file-bubble">
              <div class="file-info">
                <span class="file-name">{{ msg.meta_json?.name || '文件' }}</span>
                <span class="file-size">{{ formatFileSize(msg.meta_json?.size) }}</span>
              </div>
              <button class="file-download" @click="downloadFile(msg.content, msg.meta_json?.name)">
                <el-icon :size="16"><Download /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 空状态 -->
    <div v-if="chatStore.currentMessages.length === 0" class="empty-messages">
      <span>暂无消息，发送第一条消息吧</span>
    </div>
  </el-scrollbar>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow: hidden;
}

.load-more-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.load-hint {
  cursor: default;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

/* 系统消息 */
.msg-system {
  display: flex;
  justify-content: center;
  padding: 4px 0;
}

.system-text {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  padding: 2px 12px;
  border-radius: 10px;
}

/* 消息行 */
.msg-row {
  display: flex;
  gap: 10px;
  max-width: 75%;
}

.msg-row.msg-self {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.msg-avatar {
  flex-shrink: 0;
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 600;
}

.msg-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.msg-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.msg-self .msg-meta {
  flex-direction: row-reverse;
}

.msg-sender {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.msg-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* 消息气泡 */
.msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--el-fill-color-light);
  word-break: break-word;
}

.msg-self .msg-bubble {
  background: var(--el-color-primary-light-8);
}

.msg-text {
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--el-text-color-primary);
}

/* 图片消息 - 无气泡背景，像微信一样 */
.msg-image-wrapper {
  max-width: 280px;
  border-radius: 8px;
  overflow: hidden;
}

.msg-image {
  display: block;
  max-width: 100%;
  max-height: 300px;
  width: auto;
  height: auto;
  cursor: pointer;
  border-radius: 8px;
}

/* 文件消息 */
.msg-file-bubble {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 13px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.file-download {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  transition: background 0.15s;
}

.file-download:hover {
  background: var(--el-color-primary-light-7);
}

/* 空状态 */
.empty-messages {
  display: flex;
  justify-content: center;
  padding: 48px 16px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* ========== 移动端适配 ========== */
.message-list.is-mobile .messages {
  padding: 12px 8px;
  gap: 12px;
}

.message-list.is-mobile .msg-row {
  max-width: 90%;
}

.message-list.is-mobile .msg-image-wrapper {
  max-width: 220px;
}

.message-list.is-mobile .msg-image {
  max-height: 250px;
}

.message-list.is-mobile .msg-avatar {
  width: 32px;
  height: 32px;
  font-size: 12px;
}
</style>
