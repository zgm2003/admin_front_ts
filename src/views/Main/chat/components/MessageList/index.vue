<script setup lang="ts">
import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Bubble from 'vue-element-plus-x/es/Bubble/index.js'
import BubbleList from 'vue-element-plus-x/es/BubbleList/index.js'
import { useChatStore } from '@/store/chat'
import { useUserStore } from '@/store/user'
import { useIsMobile } from '@/hooks/useResponsive'
import { ChatRoomApi, ConversationType, MessageType, ParticipantRole, type MessageItem, type ParticipantItem } from '@/api/chat'
import { formatChatTime } from '@/utils/date'
import type {
  BubbleListBoundaryState,
  BubbleListInstance,
  BubbleListItemProps,
} from 'vue-element-plus-x/types/BubbleList'
import MessageBubbleContent from './MessageBubbleContent.vue'
import MessageContextMenu from './MessageContextMenu.vue'

const chatStore = useChatStore()
const userStore = useUserStore()
const isMobile = useIsMobile()

const bubbleListRef = useTemplateRef<BubbleListInstance>('bubbleListRef')
const loadingMore = shallowRef(false)

const currentUserId = computed(() => Number(userStore.user_id))
const groupParticipants = shallowRef<ParticipantItem[]>([])
const contextMenuVisible = shallowRef(false)
const contextMenuX = shallowRef(0)
const contextMenuY = shallowRef(0)
const contextMenuMessage = shallowRef<MessageItem | null>(null)

type MessageBubbleItemType = 'chat-message' | 'system-message'

interface MessageBubbleItem extends BubbleListItemProps {
  id: number
  key: number
  itemType: MessageBubbleItemType
  message: MessageItem
  messageType: MessageType
  content: string
  placement: 'start' | 'end'
  avatar: string
  avatarText: string
  senderName: string
  displayTime: string
  fileName: string
  fileSize: number | undefined
  isSelf: boolean
  recalled: boolean
}

const currentUserRole = computed(() => {
  const conversation = chatStore.currentConversation
  if (!conversation || conversation.type !== ConversationType.Group) return null

  const currentParticipant = groupParticipants.value.find(p => p.user_id === currentUserId.value)
  return currentParticipant?.role ?? null
})

const messageBubbleItems = computed<MessageBubbleItem[]>(() =>
  chatStore.currentMessages.map(toMessageBubbleItem),
)

const topStatus = computed<BubbleListBoundaryState | null>(() => {
  if (!chatStore.currentHasMore || messageBubbleItems.value.length === 0) return null

  return {
    type: loadingMore.value ? 'loading' : 'idle',
    text: loadingMore.value ? '加载中...' : '上滑加载更多',
  }
})

function toMessageBubbleItem(msg: MessageItem): MessageBubbleItem {
  const self = isSelf(msg)
  const senderName = getSenderName(msg)

  return {
    id: msg.id,
    key: msg.id,
    itemType: msg.type === MessageType.System ? 'system-message' : 'chat-message',
    message: msg,
    messageType: msg.type,
    content: msg.content,
    placement: self ? 'end' : 'start',
    avatar: msg.sender?.avatar || '',
    avatarText: senderName.charAt(0),
    senderName,
    displayTime: formatChatTime(msg.created_at),
    fileName: getFileName(msg),
    fileSize: getFileSize(msg),
    isSelf: self,
    recalled: isRecalled(msg),
    shape: 'corner',
    variant: 'filled',
    maxWidth: isMobile.value ? '90%' : '75%',
  }
}

function isSelf(msg: MessageItem): boolean {
  return msg.sender_id === currentUserId.value
}

function isRecalled(msg: MessageItem): boolean {
  return msg.meta_json?.recalled === true
}

function getSenderName(msg: MessageItem): string {
  return msg.sender?.username || `用户${msg.sender_id}`
}

function getFileName(msg: MessageItem): string {
  const name = msg.meta_json?.name
  return typeof name === 'string' && name.trim() ? name : '文件'
}

function getFileSize(msg: MessageItem): number | undefined {
  const size = msg.meta_json?.size
  return typeof size === 'number' ? size : undefined
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

async function loadGroupParticipants() {
  const conversation = chatStore.currentConversation
  if (!conversation || conversation.type !== ConversationType.Group) {
    groupParticipants.value = []
    return
  }

  try {
    const data = await ChatRoomApi.groupInfo({ conversation_id: conversation.id })
    groupParticipants.value = data.participants
  } catch {
    groupParticipants.value = []
  }
}

function scrollToBottom(smooth = true) {
  nextTick(() => {
    bubbleListRef.value?.scrollToBottom(smooth)
  })
}

async function handleLoadMoreTop() {
  if (loadingMore.value || !chatStore.currentHasMore) {
    bubbleListRef.value?.loadMoreTopComplete()
    return
  }

  loadingMore.value = true
  try {
    await chatStore.loadMoreMessages()
  } catch {
    ElMessage.error('加载历史消息失败')
  } finally {
    loadingMore.value = false
    await nextTick()
    bubbleListRef.value?.loadMoreTopComplete()
  }
}

function handleContextMenu(e: MouseEvent, msg: MessageItem) {
  if (msg.type === MessageType.System || isRecalled(msg)) return

  e.preventDefault()
  contextMenuMessage.value = msg
  contextMenuX.value = e.clientX
  contextMenuY.value = e.clientY + 10
  contextMenuVisible.value = true
}

function closeContextMenu() {
  contextMenuVisible.value = false
  contextMenuMessage.value = null
}

function canRecall(msg: MessageItem): boolean {
  if (isRecalled(msg)) return false

  const conversation = chatStore.currentConversation
  const isGroupChat = conversation?.type === ConversationType.Group
  const isSelfMessage = isSelf(msg)

  if (isSelfMessage) {
    if (isGroupChat) {
      const role = currentUserRole.value
      if (role === ParticipantRole.Owner || role === ParticipantRole.Admin) return true
      return Date.now() - new Date(msg.created_at).getTime() <= 120000
    }

    return Date.now() - new Date(msg.created_at).getTime() <= 120000
  }

  if (!isGroupChat) return false

  const role = currentUserRole.value
  if (!role) return false
  if (role === ParticipantRole.Owner) return true

  if (role === ParticipantRole.Admin) {
    const senderParticipant = groupParticipants.value.find(p => p.user_id === msg.sender_id)
    const senderRole = senderParticipant?.role
    return senderRole !== ParticipantRole.Owner && senderRole !== ParticipantRole.Admin
  }

  return false
}

async function handleCopy() {
  if (!contextMenuMessage.value) return
  const msg = contextMenuMessage.value
  closeContextMenu()

  let copyText = ''

  switch (msg.type) {
    case MessageType.Text:
    case MessageType.Image:
    case MessageType.File:
      copyText = msg.content
      break
    default:
      ElMessage.warning('该消息类型不支持复制')
      return
  }

  try {
    await navigator.clipboard.writeText(copyText)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}

async function handleRecall() {
  if (!contextMenuMessage.value) return
  const msg = contextMenuMessage.value
  closeContextMenu()

  try {
    await ChatRoomApi.recallMessage({ message_id: msg.id })
    ElMessage.success('已撤回')
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '撤回失败'))
  }
}

watch(
  () => chatStore.currentConversation?.id,
  () => {
    void loadGroupParticipants()
    scrollToBottom(false)
  },
  { immediate: true },
)

watch(() => chatStore.groupInfoVersion, () => {
  void loadGroupParticipants()
})

watch(
  () => chatStore.currentMessages.length,
  (newLen, oldLen) => {
    if (loadingMore.value || newLen <= (oldLen || 0)) return
    scrollToBottom()
  },
)

onMounted(() => scrollToBottom(false))

defineExpose({ scrollToBottom })
</script>

<template>
  <div
    class="message-list-shell"
    :class="{ 'is-mobile': isMobile }"
  >
    <BubbleList
      v-if="messageBubbleItems.length > 0"
      ref="bubbleListRef"
      class="message-list"
      :list="messageBubbleItems"
      item-key="id"
      item-type="itemType"
      :virtual="true"
      :auto-scroll="false"
      :show-back-button="true"
      :always-show-scrollbar="true"
      max-height="100%"
      :top-status="topStatus"
      @load-more-top="handleLoadMoreTop"
    >
      <template #item="{ item }">
        <div
          v-if="item.itemType === 'system-message'"
          class="msg-system"
        >
          <span class="system-text">{{ item.content }}</span>
        </div>

        <div
          v-else
          class="msg-row"
          :class="{ 'msg-self': item.isSelf }"
          @contextmenu.prevent="handleContextMenu($event, item.message)"
        >
          <Bubble
            :content="item.content"
            :placement="item.placement"
            :shape="item.shape"
            :variant="item.variant"
            :max-width="item.maxWidth"
            avatar-size="36px"
            avatar-gap="10px"
          >
            <template #avatar>
              <el-avatar
                :size="36"
                :src="item.avatar || undefined"
                class="msg-avatar"
              >
                {{ item.avatarText }}
              </el-avatar>
            </template>

            <template #header>
              <div class="msg-meta">
                <span class="msg-sender">{{ item.senderName }}</span>
                <span class="msg-time">{{ item.displayTime }}</span>
              </div>
            </template>

            <template #content>
              <MessageBubbleContent :item="item" />
            </template>
          </Bubble>
        </div>
      </template>
    </BubbleList>

    <div
      v-else
      class="empty-messages"
    >
      <span>暂无消息，发送第一条消息吧</span>
    </div>

    <MessageContextMenu
      :visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      :has-message="contextMenuMessage !== null"
      :can-recall="contextMenuMessage ? canRecall(contextMenuMessage) : false"
      @close="closeContextMenu"
      @recall="handleRecall"
      @copy="handleCopy"
    />
  </div>
</template>

<style scoped src="./message-list.css"></style>
