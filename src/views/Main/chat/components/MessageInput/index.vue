<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import XSender from 'vue-element-plus-x/es/XSender/index.js'
import ComposerToolbar from './ComposerToolbar.vue'
import PendingAttachmentList from './PendingAttachmentList.vue'
import InputStatusFooter from './InputStatusFooter.vue'
import { useChatPendingAttachments } from './useChatPendingAttachments'
import { useChatVoiceInput } from './useChatVoiceInput'
import { ChatRoomApi, MessageType, ConversationType } from '@/api/chat'
import { useChatStore } from '@/store/chat'
import { useIsMobile } from '@/hooks/useResponsive'
import { getUploadToken, uploadFileToCloud, validateFile, type UploadConfig } from '@/lib/upload'

type XSenderFocusType = 'first' | 'last' | 'mark'

interface XSenderInstance {
  focus: (type: XSenderFocusType) => void
  clear: () => void
  setText: (text: string) => void
  getModelValue: () => { text: string; html: string }
}

const chatStore = useChatStore()
const isMobile = useIsMobile()

const content = ref('')
const senderRef = ref<XSenderInstance | null>(null)
const imageInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const showEmojiPicker = ref(false)

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

function setSenderText(text: string) {
  content.value = text
  senderRef.value?.setText(text)
}

function clearSenderText() {
  content.value = ''
  senderRef.value?.clear()
}

function focusSender() {
  nextTick(() => senderRef.value?.focus('last'))
}

function syncSenderText() {
  content.value = senderRef.value?.getModelValue().text ?? ''
}

// ==================== 语音转文字（Web Speech API） ====================

const { isRecording, toggleVoiceInput } = useChatVoiceInput({
  content,
  setText: setSenderText,
  getErrorMessage,
})

// ==================== 待发送附件（粘贴/拖拽） ====================

const {
  pendingAttachments,
  addPendingAttachment,
  removePending,
  releasePendingAttachments,
  drainPendingAttachments,
} = useChatPendingAttachments()

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

function handleSenderChange() {
  syncSenderText()
  handleInput()
}

function handleSenderPasteFile(firstFile: File, fileList: FileList) {
  const files = Array.from(fileList)
  if (files.length === 0) {
    addPendingAttachment(firstFile)
    return
  }
  for (const file of files) {
    addPendingAttachment(file)
  }
}

// ==================== 发送（文本 + 待发送附件） ====================

async function handleSend() {
  syncSenderText()
  const text = content.value.trim()
  const attachments = [...pendingAttachments.value]
  if (!text && attachments.length === 0) return
  if (!chatStore.currentConversation) return

  const convId = chatStore.currentConversation.id

  if (text) {
    try {
      await chatStore.sendMessage(convId, MessageType.Text, text)
      clearSenderText()
    } catch (error: unknown) {
      ElMessage.error(getErrorMessage(error, '发送失败'))
      return
    }
  }

  if (attachments.length > 0) {
    const attachmentsToSend = drainPendingAttachments()
    uploading.value = true
    try {
      let imageConfig: UploadConfig | null = null
      let fileConfig: UploadConfig | null = null
      for (const att of attachmentsToSend) {
        try {
          let config: UploadConfig | null = att.type === 'image' ? imageConfig : fileConfig
          if (!config) {
            config = await getUploadToken({
              folderName: att.type === 'image' ? 'chat_images' : 'chat_files',
              fileName: att.file.name || (att.type === 'image' ? 'clipboard.png' : 'file'),
              fileSize: att.file.size,
              fileKind: att.type === 'image' ? 'image' : 'file',
            })
            if (att.type === 'image') imageConfig = config
            else fileConfig = config
          }
          validateFile(att.file, config, att.type === 'image' ? 'image' : 'file')
          const { url } = await uploadFileToCloud(att.file, config)
          const msgType = att.type === 'image' ? MessageType.Image : MessageType.File
          try {
            await chatStore.sendMessage(convId, msgType, url, {
              name: att.file.name || (att.type === 'image' ? 'clipboard.png' : 'file'),
              size: att.file.size,
            })
          } catch (sendError: unknown) {
            ElMessage.error(getErrorMessage(sendError, `${att.file.name} 发送失败`))
          }
        } catch (error: unknown) {
          ElMessage.error(getErrorMessage(error, `${att.file.name} 上传失败`))
        }
      }
    } catch (error: unknown) {
      ElMessage.error(getErrorMessage(error, '获取上传凭证失败'))
    } finally {
      releasePendingAttachments(attachmentsToSend)
      uploading.value = false
    }
  }

  focusSender()
}

// ==================== 工具栏按钮：图片/文件（直接发送） ====================

function handlePickImage() {
  imageInput.value?.click()
}

async function handleImageChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  const conversation = chatStore.currentConversation
  if (!files?.length || !conversation) return

  uploading.value = true
  try {
    for (const file of Array.from(files)) {
      try {
        const config: UploadConfig = await getUploadToken({ folderName: 'chat_images', fileName: file.name, fileSize: file.size, fileKind: 'image' })
        validateFile(file, config, 'image')
        const { url } = await uploadFileToCloud(file, config)
        await chatStore.sendMessage(
          conversation.id,
          MessageType.Image,
          url,
          { name: file.name, size: file.size },
        )
      } catch (error: unknown) {
        ElMessage.error(getErrorMessage(error, `图片 ${file.name} 上传失败`))
      }
    }
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '获取上传凭证失败'))
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
  const conversation = chatStore.currentConversation
  if (!file || !conversation) return

  uploading.value = true
  try {
    const config: UploadConfig = await getUploadToken({ folderName: 'chat_files', fileName: file.name, fileSize: file.size, fileKind: 'file' })
    validateFile(file, config, 'file')
    const { url } = await uploadFileToCloud(file, config)
    await chatStore.sendMessage(
      conversation.id,
      MessageType.File,
      url,
      { name: file.name, size: file.size },
    )
  } catch (error: unknown) {
    ElMessage.error(getErrorMessage(error, '文件上传失败'))
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

// ==================== 拖拽：文件/图片放入待发送区 ====================

function handleDrop(e: DragEvent) {
  e.preventDefault()
  const files = e.dataTransfer?.files
  if (!files?.length) return

  for (const file of Array.from(files)) {
    addPendingAttachment(file)
  }
}

function handleDragover(e: DragEvent) {
  e.preventDefault()
}

// ==================== Emoji 选择 ====================

function handleEmojiSelect(emoji: string) {
  setSenderText(`${content.value}${emoji}`)
  showEmojiPicker.value = false
  focusSender()
}
</script>

<template>
  <div
    class="message-input"
    :class="{ uploading, 'is-mobile': isMobile }"
    @drop="handleDrop"
    @dragover="handleDragover"
  >
    <ComposerToolbar
      v-model:emoji-picker-visible="showEmojiPicker"
      :uploading="uploading"
      :is-recording="isRecording"
      @pick-image="handlePickImage"
      @pick-file="handlePickFile"
      @toggle-voice="toggleVoiceInput"
      @emoji-select="handleEmojiSelect"
    />

    <PendingAttachmentList
      v-if="pendingAttachments.length"
      :attachments="pendingAttachments"
      :is-mobile="isMobile"
      @remove="removePending"
    />

    <div class="input-body">
      <XSender
        ref="senderRef"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        submit-type="enter"
        :auto-focus="false"
        :disabled="uploading || isRecording"
        :loading="chatStore.sending || uploading"
        :clearable="false"
        @submit="handleSend"
        @change="handleSenderChange"
        @paste-file="handleSenderPasteFile"
      >
        <template #action-list>
          <span
            class="sender-action-spacer"
            aria-hidden="true"
          />
        </template>
      </XSender>
    </div>

    <InputStatusFooter
      :is-recording="isRecording"
      :uploading="uploading"
      :is-mobile="isMobile"
      :disabled="(!content.trim() && pendingAttachments.length === 0) || uploading || chatStore.sending || isRecording"
      @send="handleSend"
    />

    <input
      ref="imageInput"
      type="file"
      accept="image/*"
      multiple
      hidden
      @change="handleImageChange"
    >
    <input
      ref="fileInput"
      type="file"
      hidden
      @change="handleFileChange"
    >
  </div>
</template>

<style scoped>
.message-input {
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.input-body {
  padding: 0 12px;
}
.input-body :deep(.elx-x-sender) {
  box-shadow: none;
  border-radius: 10px;
  background: var(--el-fill-color-extra-light);
}
.input-body :deep(.elx-x-sender::after) {
  border-color: transparent;
}
.input-body :deep(.elx-x-sender:focus-within) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
}
.input-body :deep(.elx-x-sender__content) {
  padding: 2px 6px;
}
.input-body :deep(.chat-rich-text) {
  min-height: 72px;
  max-height: 168px;
  padding: 8px 6px;
  font-size: 14px;
  line-height: 1.6;
}
.input-body :deep(.chat-placeholder-wrap) {
  padding: 8px 6px;
  font-size: 14px;
  font-weight: 400;
}

.sender-action-spacer {
  display: none;
}

.message-input.uploading .input-body {
  opacity: 0.6;
}
</style>
