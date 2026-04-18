<script setup lang="ts">
import { ref, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, FolderOpened, Promotion, Close, Microphone } from '@element-plus/icons-vue'
import { DIcon } from '@/components/DIcon'
import { ChatRoomApi, MessageType, ConversationType } from '@/api/chat'
import { useChatStore } from '@/store/chat'
import { useIsMobile } from '@/hooks/useResponsive'
import { getUploadToken, uploadFileToCloud, validateFile, type UploadConfig } from '@/lib/upload'
import { formatFileSize } from '@/utils/format'
import { EmojiPicker } from '@/components/EmojiPicker'

const chatStore = useChatStore()
const isMobile = useIsMobile()

const content = ref('')
const textareaRef = ref<InstanceType<typeof import('element-plus')['ElInput']>>()
const imageInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const showEmojiPicker = ref(false)

// ==================== 语音转文字（Web Speech API） ====================

const isRecording = ref(false)
let recognition: any = null

function toggleVoiceInput() {
  if (isRecording.value) {
    stopVoiceInput()
  } else {
    startVoiceInput()
  }
}

function startVoiceInput() {
  // 检查浏览器支持
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    ElMessage.error('当前浏览器不支持语音识别')
    return
  }

  try {
    recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN' // 中文识别
    recognition.continuous = true // 持续识别
    recognition.interimResults = true // 显示临时结果

    recognition.onstart = () => {
      isRecording.value = true
      ElMessage.success('开始语音输入')
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }

      // 将识别结果追加到输入框
      if (finalTranscript) {
        content.value += finalTranscript
      }
    }

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error)
      if (event.error === 'no-speech') {
        ElMessage.warning('未检测到语音，请重试')
      } else if (event.error === 'not-allowed') {
        ElMessage.error('麦克风权限被拒绝')
      } else {
        ElMessage.error('语音识别失败: ' + event.error)
      }
      stopVoiceInput()
    }

    recognition.onend = () => {
      isRecording.value = false
    }

    recognition.start()
  } catch (err: any) {
    ElMessage.error(err.message || '启动语音识别失败')
    isRecording.value = false
  }
}

function stopVoiceInput() {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  isRecording.value = false
  ElMessage.info('语音输入已停止')
}

// 组件卸载时清理语音识别
onUnmounted(() => {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
})

// ==================== 待发送附件（粘贴/拖拽） ====================

interface PendingAttachment {
  id: string
  file: File
  type: 'image' | 'file'
  previewUrl?: string // 图片预览用的 blob URL
}

const pendingAttachments = ref<PendingAttachment[]>([])

function addPendingImage(file: File) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const previewUrl = URL.createObjectURL(file)
  pendingAttachments.value.push({ id, file, type: 'image', previewUrl })
}

function addPendingFile(file: File) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  pendingAttachments.value.push({ id, file, type: 'file' })
}

function removePending(id: string) {
  const idx = pendingAttachments.value.findIndex(a => a.id === id)
  if (idx !== -1) {
    const found = pendingAttachments.value[idx]
    if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl)
    pendingAttachments.value.splice(idx, 1)
  }
}

// ==================== 正在输入通知 ====================

let lastTypingTime = 0

function handleInput() {
  const now = Date.now()
  if (now - lastTypingTime < 3000) return
  lastTypingTime = now
  const conv = chatStore.currentConversation
  if (!conv || conv.type !== ConversationType.Private) return
  ChatRoomApi.typing({ conversation_id: conv.id }).catch(() => {})
}

// ==================== 发送（文本 + 待发送附件） ====================

async function handleSend() {
  const text = content.value.trim()
  const attachments = [...pendingAttachments.value]
  if (!text && attachments.length === 0) return
  if (!chatStore.currentConversation) return

  const convId = chatStore.currentConversation.id

  // 先发文本
  if (text) {
    try {
      await chatStore.sendMessage(convId, MessageType.Text, text)
      // 发送成功后才清空输入
      content.value = ''
    } catch (err: any) {
      ElMessage.error(err.message || '发送失败')
      return // 文本发送失败，不继续发送附件
    }
  }

  // 清空待发送附件
  pendingAttachments.value = []

  // 再逐个上传并发送附件
  if (attachments.length > 0) {
    uploading.value = true
    try {
      // 分别获取图片和文件的上传凭证
      const hasImages = attachments.some(a => a.type === 'image')
      const hasFiles = attachments.some(a => a.type === 'file')
      let imageConfig: UploadConfig | null = null
      let fileConfig: UploadConfig | null = null
      if (hasImages) imageConfig = await getUploadToken({ folderName: 'chat_images' })
      if (hasFiles) fileConfig = await getUploadToken({ folderName: 'chat_files' })

      for (const att of attachments) {
        try {
          const config = att.type === 'image' ? imageConfig! : fileConfig!
          validateFile(att.file, config, att.type === 'image' ? 'image' : 'file')
          const { url } = await uploadFileToCloud(att.file, config)
          const msgType = att.type === 'image' ? MessageType.Image : MessageType.File
          try {
            await chatStore.sendMessage(convId, msgType, url, {
              name: att.file.name || (att.type === 'image' ? 'clipboard.png' : 'file'),
              size: att.file.size,
            })
          } catch (sendErr: any) {
            ElMessage.error(sendErr.message || `${att.file.name} 发送失败`)
          }
        } catch (err: any) {
          ElMessage.error(err.message || `${att.file.name} 上传失败`)
        }
        // 释放 blob URL
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl)
      }
    } catch (err: any) {
      ElMessage.error(err.message || '获取上传凭证失败')
    } finally {
      uploading.value = false
    }
  }

  nextTick(() => textareaRef.value?.focus())
}

function handleKeydown(e: Event | KeyboardEvent) {
  const ke = e as KeyboardEvent
  if (ke.key === 'Enter' && !ke.shiftKey) {
    ke.preventDefault()
    handleSend()
  }
}

// ==================== 工具栏按钮：图片/文件（直接发送） ====================

function handlePickImage() {
  imageInput.value?.click()
}

async function handleImageChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files?.length || !chatStore.currentConversation) return

  uploading.value = true
  try {
    const config: UploadConfig = await getUploadToken({ folderName: 'chat_images' })
    for (const file of Array.from(files)) {
      try {
        validateFile(file, config, 'image')
        const { url } = await uploadFileToCloud(file, config)
        await chatStore.sendMessage(
          chatStore.currentConversation!.id,
          MessageType.Image,
          url,
          { name: file.name, size: file.size },
        )
      } catch (err: any) {
        ElMessage.error(err.message || `图片 ${file.name} 上传失败`)
      }
    }
  } catch (err: any) {
    ElMessage.error(err.message || '获取上传凭证失败')
  } finally {
    uploading.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}

function handlePickFile() {
  fileInput.value?.click()
}

async function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !chatStore.currentConversation) return

  uploading.value = true
  try {
    const config: UploadConfig = await getUploadToken({ folderName: 'chat_files' })
    validateFile(file, config, 'file')
    const { url } = await uploadFileToCloud(file, config)
    await chatStore.sendMessage(
      chatStore.currentConversation.id,
      MessageType.File,
      url,
      { name: file.name, size: file.size },
    )
  } catch (err: any) {
    ElMessage.error(err.message || '文件上传失败')
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

// ==================== 粘贴：图片和文件放入待发送区 ====================

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  // 优先处理图片
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) addPendingImage(file)
      return
    }
  }

  // 处理文件（Windows 文件管理器复制的文件）
  const files = e.clipboardData?.files
  if (files && files.length > 0) {
    e.preventDefault()
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        addPendingImage(file)
      } else {
        addPendingFile(file)
      }
    }
  }
}

// ==================== 拖拽：文件/图片放入待发送区 ====================

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (!files?.length) return

  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) {
      addPendingImage(file)
    } else {
      addPendingFile(file)
    }
  }
}

function handleDragover(e: DragEvent) {
  e.preventDefault()
}

// ==================== Emoji 选择 ====================

function handleEmojiSelect(emoji: string) {
  // 在光标位置插入 emoji
  const textarea = textareaRef.value?.$el?.querySelector('textarea')
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content.value
    content.value = text.substring(0, start) + emoji + text.substring(end)
    // 恢复光标位置
    nextTick(() => {
      textarea.focus()
      const newPos = start + emoji.length
      textarea.setSelectionRange(newPos, newPos)
    })
  } else {
    content.value += emoji
  }
  showEmojiPicker.value = false
}
</script>

<template>
  <div
    class="message-input"
    :class="{ uploading, 'is-mobile': isMobile }"
    @drop="handleDrop"
    @dragover="handleDragover"
  >
    <!-- 工具栏 -->
    <div class="input-toolbar">
      <div class="toolbar-left">
        <el-button text class="toolbar-btn" @click="handlePickImage" :disabled="uploading || isRecording" title="发送图片">
          <el-icon :size="18"><Picture /></el-icon>
        </el-button>
        <el-button text class="toolbar-btn" @click="handlePickFile" :disabled="uploading || isRecording" title="发送文件">
          <el-icon :size="18"><FolderOpened /></el-icon>
        </el-button>
        <el-button
          text
          class="toolbar-btn voice-btn"
          :class="{ 'is-recording': isRecording }"
          @click="toggleVoiceInput"
          :disabled="uploading"
          title="语音转文字"
        >
          <el-icon :size="18"><Microphone /></el-icon>
        </el-button>
        <el-popover
          v-model:visible="showEmojiPicker"
          placement="top-start"
          :width="320"
          trigger="click"
          :show-arrow="false"
          popper-class="emoji-popover"
        >
          <template #reference>
            <el-button text class="toolbar-btn" :disabled="uploading || isRecording" title="插入表情">
              <DIcon icon="fluent-emoji:grinning-face" :size="18" />
            </el-button>
          </template>
          <EmojiPicker @select="handleEmojiSelect" />
        </el-popover>
      </div>
    </div>

    <!-- 待发送附件预览区 -->
    <div v-if="pendingAttachments.length" class="pending-area">
      <div
        v-for="att in pendingAttachments"
        :key="att.id"
        class="pending-item"
        :class="att.type === 'image' ? 'pending-image' : 'pending-file'"
      >
        <!-- 图片缩略图 -->
        <img v-if="att.type === 'image'" :src="att.previewUrl" class="pending-thumb" />
        <!-- 文件信息 -->
        <div v-else class="pending-file-info">
          <span class="pending-file-name">{{ att.file.name }}</span>
          <span class="pending-file-size">{{ formatFileSize(att.file.size) }}</span>
        </div>
        <!-- 移除按钮 -->
        <el-button circle size="small" type="danger" class="pending-remove" @click="removePending(att.id)">
          <el-icon :size="12"><Close /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 文本输入区 -->
    <div class="input-body">
      <el-input
        ref="textareaRef"
        v-model="content"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 8 }"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        resize="none"
        :disabled="uploading || isRecording"
        @input="handleInput"
        @keydown="handleKeydown"
        @paste="handlePaste"
      />
    </div>

    <!-- 底部：上传状态 + 发送按钮 -->
    <div class="input-footer">
      <span v-if="isRecording" class="recording-status">
        <el-icon class="recording-icon" :size="14"><Microphone /></el-icon>
        正在识别语音，点击停止
      </span>
      <span v-else-if="uploading" class="upload-status">
        <el-icon class="is-loading" :size="14"><Promotion /></el-icon>
        上传中...
      </span>
      <span v-else class="input-hint">Enter 发送 / Shift+Enter 换行</span>
      <el-button
        type="primary"
        size="small"
        :disabled="(!content.trim() && pendingAttachments.length === 0) || uploading || chatStore.sending || isRecording"
        @click="handleSend"
      >
        发送(S)
      </el-button>
    </div>

    <!-- 隐藏的文件选择器 -->
    <input ref="imageInput" type="file" accept="image/*" multiple hidden @change="handleImageChange" />
    <input ref="fileInput" type="file" hidden @change="handleFileChange" />
  </div>
</template>

<style scoped>
.message-input {
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

/* 工具栏 */
.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px 2px;
}

.toolbar-left {
  display: flex;
  gap: 2px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  min-height: 32px;
}

/* 语音按钮 - 录音时变绿 */
.voice-btn.is-recording {
  color: #fff !important;
  background: #07c160 !important;
  animation: voice-pulse 1.5s ease-in-out infinite;
}

@keyframes voice-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(7, 193, 96, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(7, 193, 96, 0);
  }
}

/* 待发送附件预览区 */
.pending-area {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 12px;
}

.pending-item {
  position: relative;
}

.pending-image {
  display: inline-block;
}

.pending-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid var(--el-border-color-lighter);
}

.pending-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  max-width: 200px;
}

.pending-file-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pending-file-name {
  font-size: 12px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pending-file-size {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.pending-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  min-height: 18px;
  padding: 0;
  transition: transform 0.15s;
}

.pending-remove:hover {
  transform: scale(1.15);
}

/* 输入区 */
.input-body {
  padding: 0 12px;
}

.input-body :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 6px 4px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
}

.input-body :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

/* 底部 */
.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px 8px;
}

.input-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
}

.recording-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #07c160;
}

.recording-icon {
  animation: recording-blink 1s ease-in-out infinite;
}

@keyframes recording-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* 上传中整体降低透明度 */
.message-input.uploading .input-body {
  opacity: 0.6;
}

/* ========== 移动端适配 ========== */
.message-input.is-mobile .pending-thumb {
  width: 48px;
  height: 48px;
}

.message-input.is-mobile .pending-file {
  max-width: 160px;
}

.message-input.is-mobile .input-hint {
  display: none;
}

/* Emoji popover 样式 */
:global(.emoji-popover) {
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
