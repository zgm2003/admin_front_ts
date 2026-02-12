<script setup lang="ts">
import { ref } from 'vue'
import { Picture, Document, Promotion } from '@element-plus/icons-vue'
import { ChatRoomApi, MessageType, ConversationType } from '@/api/chat'
import { useChatStore } from '@/store/chat'

const chatStore = useChatStore()

const content = ref('')
const fileInput = ref<HTMLInputElement>()
const imageInput = ref<HTMLInputElement>()

/** 防抖：正在输入通知，3 秒内只发一次 */
let typingTimer: ReturnType<typeof setTimeout> | null = null
let lastTypingTime = 0

function handleInput() {
  const now = Date.now()
  if (now - lastTypingTime < 3000) return
  lastTypingTime = now
  const conv = chatStore.currentConversation
  if (!conv || conv.type !== ConversationType.Private) return
  ChatRoomApi.typing({ conversation_id: conv.id }).catch(() => {})
  if (typingTimer) clearTimeout(typingTimer)
  typingTimer = setTimeout(() => { lastTypingTime = 0 }, 3000)
}

/** 发送文本消息 */
async function handleSend() {
  const text = content.value.trim()
  if (!text || !chatStore.currentConversation) return
  content.value = ''
  await chatStore.sendMessage(chatStore.currentConversation.id, MessageType.Text, text)
}

/** 键盘事件：Enter 发送，Shift+Enter 换行 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

/** 选择图片 */
function handlePickImage() {
  imageInput.value?.click()
}

/** 选择文件 */
function handlePickFile() {
  fileInput.value?.click()
}

/** 图片选中后发送 */
async function handleImageChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !chatStore.currentConversation) return
  // 简单使用本地 URL 占位（实际 COS 上传后续添加）
  const url = URL.createObjectURL(file)
  await chatStore.sendMessage(
    chatStore.currentConversation.id,
    MessageType.Image,
    url,
    { name: file.name, size: file.size },
  )
  // 重置 input
  if (imageInput.value) imageInput.value.value = ''
}

/** 文件选中后发送 */
async function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !chatStore.currentConversation) return
  const url = URL.createObjectURL(file)
  await chatStore.sendMessage(
    chatStore.currentConversation.id,
    MessageType.File,
    url,
    { name: file.name, size: file.size },
  )
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <div class="message-input">
    <!-- 工具栏 -->
    <div class="input-toolbar">
      <el-tooltip content="发送图片" placement="top">
        <el-button text size="small" @click="handlePickImage">
          <el-icon :size="18"><Picture /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="发送文件" placement="top">
        <el-button text size="small" @click="handlePickFile">
          <el-icon :size="18"><Document /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <el-input
        v-model="content"
        type="textarea"
        :autosize="{ minRows: 1, maxRows: 6 }"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        resize="none"
        @input="handleInput"
        @keydown="handleKeydown"
      />
      <el-button
        type="primary"
        :icon="Promotion"
        circle
        size="small"
        class="send-btn"
        :disabled="!content.trim() || chatStore.sending"
        @click="handleSend"
      />
    </div>

    <!-- 隐藏的文件选择器 -->
    <input ref="imageInput" type="file" accept="image/*" hidden @change="handleImageChange" />
    <input ref="fileInput" type="file" hidden @change="handleFileChange" />
  </div>
</template>

<style scoped>
.message-input {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 8px 16px 12px;
  background: var(--el-bg-color);
}

.input-toolbar {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
}

.input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.input-area :deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.6;
  background: var(--el-fill-color-light);
  box-shadow: none;
  border: 1px solid transparent;
  transition: border-color 0.2s;
}

.input-area :deep(.el-textarea__inner:focus) {
  border-color: var(--el-color-primary-light-5);
}

.send-btn {
  flex-shrink: 0;
  margin-bottom: 2px;
}
</style>
