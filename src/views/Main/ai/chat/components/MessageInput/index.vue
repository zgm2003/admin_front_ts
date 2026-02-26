<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { Picture, Close, Loading, ChatLineSquare, Microphone, Setting, RefreshRight } from '@element-plus/icons-vue'
import { DIcon } from '@/components/DIcon'
import { EmojiPicker } from '@/components/EmojiPicker'
import { useIsMobile } from '@/hooks/useResponsive'
import { getUploadToken, validateFile, uploadFileToCloud, type UploadConfig } from '@/utils/cosUpload'

const { t } = useI18n()
const isMobile = useIsMobile()

// Types
interface Modalities {
  image?: boolean
  audio?: boolean
  video?: boolean
  file?: boolean
}

interface Attachment {
  type: 'image'
  url: string
  name: string
  size: number
}

interface PendingAttachment {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
  error?: string
}

const props = defineProps<{
  sending: boolean
  disabled?: boolean
  modalities?: Modalities
  isStreaming?: boolean
  showHistoryBtn?: boolean
}>()

const emit = defineEmits<{
  send: [content: string, attachments?: Attachment[], runtimeParams?: Record<string, number>]
  stop: []
  openHistory: []
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const pendingAttachments = ref<PendingAttachment[]>([])
const isDragging = ref(false)
const showEmojiPicker = ref(false)
const showParamsPanel = ref(false)

// ==================== Runtime Params ====================
const runtimeTemperature = ref<number | null>(null)
const runtimeMaxTokens = ref<number | null>(null)
const runtimeMaxHistory = ref<number | null>(null)

const hasCustomParams = computed(() => runtimeTemperature.value !== null || runtimeMaxTokens.value !== null || runtimeMaxHistory.value !== null)

const getRequestParams = () => {
  const result: Record<string, number> = {}
  if (runtimeTemperature.value !== null) result.temperature = runtimeTemperature.value
  if (runtimeMaxTokens.value !== null) result.max_tokens = runtimeMaxTokens.value
  if (runtimeMaxHistory.value !== null) result.max_history = runtimeMaxHistory.value
  return result
}

const resetParams = () => {
  runtimeTemperature.value = null
  runtimeMaxTokens.value = null
  runtimeMaxHistory.value = null
}

const MAX_IMAGES = 5

const supportsImage = computed(() => props.modalities?.image === true)
const isImageLimitReached = computed(() => pendingAttachments.value.length >= MAX_IMAGES)

// ==================== textarea 自动高度 ====================

const adjustHeight = () => {
  const textarea = textareaRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }
}

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
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    ElNotification.error({ message: t('aiChat.voiceNotSupported') })
    return
  }

  try {
    recognition = new SpeechRecognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      isRecording.value = true
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }
      if (finalTranscript) {
        inputText.value += finalTranscript
        nextTick(adjustHeight)
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        ElNotification.warning({ message: t('aiChat.voiceNoSpeech') })
      } else if (event.error === 'not-allowed') {
        ElNotification.error({ message: t('aiChat.voiceDenied') })
      } else {
        ElNotification.error({ message: t('aiChat.voiceError') + ': ' + event.error })
      }
      stopVoiceInput()
    }

    recognition.onend = () => {
      isRecording.value = false
    }

    recognition.start()
  } catch (err: any) {
    ElNotification.error({ message: err.message || t('aiChat.voiceError') })
    isRecording.value = false
  }
}

function stopVoiceInput() {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  isRecording.value = false
}

onUnmounted(() => {
  if (recognition) { recognition.stop(); recognition = null }
})

// ==================== 图片上传 ====================

const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

const createPreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.readAsDataURL(file)
  })
}

const uploadFile = async (pending: PendingAttachment) => {
  const item = pendingAttachments.value.find(a => a.id === pending.id)
  if (!item) return

  item.status = 'uploading'

  let config: UploadConfig | null = null
  try {
    config = await getUploadToken({ folderName: 'ai_chat_images' })
  } catch {
    item.status = 'error'
    item.error = t('aiChat.tokenError')
    ElNotification.error({ message: item.error })
    return
  }

  try {
    validateFile(pending.file, config, 'image')
  } catch (error: any) {
    item.status = 'error'
    item.error = error.message
    ElNotification.error({ message: item.error })
    return
  }

  try {
    const result = await uploadFileToCloud(pending.file, config)
    item.url = result.url
    item.status = 'done'
  } catch {
    item.status = 'error'
    item.error = t('aiChat.networkError')
    ElNotification.error({ message: item.error })
  }
}

const addImageFiles = async (files: FileList | File[]) => {
  if (!supportsImage.value) {
    ElNotification.warning({ message: t('aiChat.modelNotSupportImage') })
    return
  }

  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
  const availableSlots = MAX_IMAGES - pendingAttachments.value.length

  if (availableSlots <= 0) {
    ElNotification.warning({ message: t('aiChat.maxImagesReached', { max: MAX_IMAGES }) })
    return
  }

  const filesToAdd = imageFiles.slice(0, availableSlots)
  if (filesToAdd.length < imageFiles.length) {
    ElNotification.warning({ message: t('aiChat.maxImagesReached', { max: MAX_IMAGES }) })
  }

  for (const file of filesToAdd) {
    const preview = await createPreview(file)
    const pending: PendingAttachment = { id: generateId(), file, preview, status: 'pending' }
    pendingAttachments.value.push(pending)
    uploadFile(pending)
  }
}

const handleUploadClick = () => { fileInputRef.value?.click() }

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    addImageFiles(input.files)
    input.value = ''
  }
}

const removeAttachment = (id: string) => {
  const idx = pendingAttachments.value.findIndex(a => a.id === id)
  if (idx !== -1) pendingAttachments.value.splice(idx, 1)
}

// ==================== 粘贴 & 拖拽 ====================

const handlePaste = (e: ClipboardEvent) => {
  if (!supportsImage.value) return
  const items = e.clipboardData?.items
  if (!items) return

  const imageFiles: File[] = []
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) imageFiles.push(file)
    }
  }
  if (imageFiles.length > 0) {
    e.preventDefault()
    addImageFiles(imageFiles)
  }
}

const handleDragOver = (e: DragEvent) => {
  if (!supportsImage.value) return
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
  if (!supportsImage.value) return
  const files = e.dataTransfer?.files
  if (files?.length) addImageFiles(files)
}

// ==================== Emoji ====================

function handleEmojiSelect(emoji: string) {
  const textarea = textareaRef.value
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    inputText.value = inputText.value.substring(0, start) + emoji + inputText.value.substring(end)
    nextTick(() => {
      textarea.focus()
      const newPos = start + emoji.length
      textarea.setSelectionRange(newPos, newPos)
      adjustHeight()
    })
  } else {
    inputText.value += emoji
  }
  showEmojiPicker.value = false
}

// ==================== 发送 ====================

const handleSend = () => {
  if (props.sending || props.disabled) return

  const content = inputText.value.trim()
  const hasContent = content.length > 0
  const hasAttachments = pendingAttachments.value.length > 0

  const uploading = pendingAttachments.value.some(a => a.status === 'uploading')
  if (uploading) {
    ElNotification.warning({ message: t('aiChat.waitUpload') })
    return
  }

  const failed = pendingAttachments.value.some(a => a.status === 'error')
  if (failed) {
    ElNotification.warning({ message: t('aiChat.uploadHasError') })
    return
  }

  if (!hasContent && !hasAttachments) return

  const attachments: Attachment[] = pendingAttachments.value
    .filter(a => a.status === 'done' && a.url)
    .map(a => ({ type: 'image' as const, url: a.url!, name: a.file.name, size: a.file.size }))

  emit('send', content, attachments.length > 0 ? attachments : undefined, hasCustomParams.value ? getRequestParams() : undefined)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

const handleInput = (e: Event) => {
  inputText.value = (e.target as HTMLTextAreaElement).value
  adjustHeight()
}

// ==================== 暴露方法 ====================

defineExpose({
  clear: () => {
    inputText.value = ''
    pendingAttachments.value = []
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  },
  focus: () => { textareaRef.value?.focus() },
  getRequestParams
})
</script>

<template>
  <div
    class="message-input"
    :class="{ 'is-dragging': isDragging }"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
  >
    <!-- 工具栏 -->
    <div class="input-toolbar">
      <div class="toolbar-left">
        <!-- 历史会话 -->
        <el-button v-if="showHistoryBtn" text class="toolbar-btn" :disabled="disabled" @click="emit('openHistory')" :title="t('aiChat.historyConversations')">
          <el-icon :size="18"><ChatLineSquare /></el-icon>
        </el-button>
        <!-- 图片上传 -->
        <el-button v-if="supportsImage" text class="toolbar-btn" :disabled="sending || disabled || isImageLimitReached || isRecording" @click="handleUploadClick" :title="t('aiChat.uploadImage')">
          <el-icon :size="18"><Picture /></el-icon>
        </el-button>
        <!-- 语音 -->
        <el-button text class="toolbar-btn voice-btn" :class="{ 'is-recording': isRecording }" :disabled="sending || disabled" @click="toggleVoiceInput" :title="t('aiChat.voiceInput')">
          <el-icon :size="18"><Microphone /></el-icon>
        </el-button>
        <!-- Emoji -->
        <el-popover v-model:visible="showEmojiPicker" placement="top-start" :width="320" trigger="click" :show-arrow="false" popper-class="emoji-popover">
          <template #reference>
            <el-button text class="toolbar-btn" :disabled="sending || disabled || isRecording" :title="t('aiChat.insertEmoji')">
              <DIcon icon="fluent-emoji:grinning-face" :size="18" />
            </el-button>
          </template>
          <EmojiPicker @select="handleEmojiSelect" />
        </el-popover>
        <!-- 参数设置 -->
        <el-button text class="toolbar-btn" :class="{ 'params-active': hasCustomParams }" :disabled="sending || disabled" @click="showParamsPanel = !showParamsPanel" :title="t('aiChat.runtimeParams')">
          <el-icon :size="18"><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 参数设置面板（v-if 懒加载，不常驻 DOM） -->
    <div v-if="showParamsPanel" class="params-panel">
      <div class="params-header">
        <span class="params-title">{{ t('aiChat.runtimeParams') }}</span>
        <button class="params-reset-btn" :class="{ active: hasCustomParams }" @click="resetParams">
          <el-icon :size="12"><RefreshRight /></el-icon>
          {{ t('aiChat.resetParams') }}
        </button>
      </div>
      <div class="params-items">
        <div class="params-item">
          <div class="params-item-header">
            <span class="params-item-label">{{ t('aiChat.temperature') }}</span>
            <span class="params-item-value" :class="{ custom: runtimeTemperature !== null }">
              {{ runtimeTemperature !== null ? runtimeTemperature.toFixed(1) : t('aiChat.useDefault') }}
            </span>
          </div>
          <el-slider :model-value="runtimeTemperature ?? 1" @update:model-value="(v: number | number[]) => runtimeTemperature = v as number" :min="0" :max="2" :step="0.1" :show-tooltip="false" size="small" />
        </div>
        <div class="params-item">
          <div class="params-item-header">
            <span class="params-item-label">{{ t('aiChat.maxTokens') }}</span>
            <span class="params-item-value" :class="{ custom: runtimeMaxTokens !== null }">
              {{ runtimeMaxTokens !== null ? runtimeMaxTokens.toLocaleString() : t('aiChat.useDefault') }}
            </span>
          </div>
          <el-slider :model-value="runtimeMaxTokens ?? 4096" @update:model-value="(v: number | number[]) => runtimeMaxTokens = v as number" :min="256" :max="32768" :step="256" :show-tooltip="false" size="small" />
        </div>
      </div>
      <div class="params-item params-item-full">
        <div class="params-item-header">
          <span class="params-item-label">{{ t('aiChat.maxHistory') }}</span>
          <span class="params-item-value" :class="{ custom: runtimeMaxHistory !== null }">
            {{ runtimeMaxHistory !== null ? runtimeMaxHistory : '20' }}
          </span>
        </div>
        <el-slider :model-value="runtimeMaxHistory ?? 20" @update:model-value="(v: number | number[]) => runtimeMaxHistory = v as number" :min="1" :max="50" :step="1" :show-tooltip="false" size="small" />
      </div>
    </div>

    <!-- 待发送附件预览区 -->
    <div v-if="pendingAttachments.length" class="pending-area">
      <div v-for="att in pendingAttachments" :key="att.id" class="pending-item" :class="{ error: att.status === 'error' }">
        <img :src="att.preview" :alt="att.file.name" class="pending-thumb" />
        <!-- 上传中遮罩 -->
        <div v-if="att.status === 'uploading'" class="pending-overlay">
          <el-icon class="is-loading" :size="20" color="#fff"><Loading /></el-icon>
        </div>
        <!-- 错误遮罩 -->
        <div v-if="att.status === 'error'" class="pending-overlay error">
          <span class="error-text">{{ att.error || t('aiChat.uploadFailed') }}</span>
        </div>
        <!-- 删除按钮 -->
        <button class="pending-remove" @click="removeAttachment(att.id)">
          <el-icon :size="12"><Close /></el-icon>
        </button>
      </div>
    </div>

    <!-- 文本输入区 -->
    <div class="input-body">
      <textarea
        ref="textareaRef"
        :value="inputText"
        @input="handleInput"
        @keydown="handleKeydown"
        @paste="handlePaste"
        :placeholder="disabled ? t('aiChat.selectAgentFirst') : t('aiChat.inputPlaceholder')"
        :disabled="sending || disabled || isRecording"
        rows="1"
        class="chat-textarea"
      />
    </div>

    <!-- 底部：状态 + 发送/停止 -->
    <div class="input-footer">
      <span v-if="isRecording" class="recording-status">
        <el-icon class="recording-icon" :size="14"><Microphone /></el-icon>
        {{ t('aiChat.voiceRecording') }}
      </span>
      <span v-else class="input-hint">
        {{ isMobile ? t('aiChat.inputHintMobile') : t('aiChat.inputHint') }}
        <template v-if="supportsImage && !isMobile">{{ t('aiChat.inputHintImage') }}</template>
      </span>
      <!-- 停止按钮 -->
      <button v-if="isStreaming" class="stop-button" @click="emit('stop')">
        <div class="stop-icon"></div>
      </button>
      <!-- 发送按钮 -->
      <el-button
        v-else
        type="primary"
        size="small"
        :disabled="(!inputText.trim() && pendingAttachments.length === 0) || sending || disabled || isRecording"
        @click="handleSend"
      >
        {{ t('aiChat.send') }}
      </el-button>
    </div>

    <!-- 隐藏的文件选择器 -->
    <input ref="fileInputRef" type="file" accept="image/*" multiple style="display:none" @change="handleFileChange" />
  </div>
</template>

<style scoped>
.message-input {
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.message-input.is-dragging {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 工具栏 */
.input-toolbar {
  display: flex;
  align-items: center;
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

/* 语音按钮录音态 */
.voice-btn.is-recording {
  color: #fff !important;
  background: #07c160 !important;
  animation: voice-pulse 1.5s ease-in-out infinite;
}

@keyframes voice-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(7, 193, 96, 0.7); }
  50% { box-shadow: 0 0 0 10px rgba(7, 193, 96, 0); }
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
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid transparent;
}

.pending-item.error {
  border-color: var(--el-color-danger);
}

.pending-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pending-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pending-overlay.error {
  background: rgba(245, 108, 108, 0.8);
}

.error-text {
  font-size: 10px;
  color: #fff;
  text-align: center;
  padding: 4px;
}

.pending-remove {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.pending-item:hover .pending-remove {
  opacity: 1;
}

/* 输入区 */
.input-body {
  padding: 0 12px;
}

.chat-textarea {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  min-height: 24px;
  max-height: 200px;
  padding: 6px 4px;
  font-family: inherit;
}

.chat-textarea::placeholder {
  color: var(--el-text-color-placeholder);
}

.chat-textarea:disabled {
  cursor: not-allowed;
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* 停止按钮 */
.stop-button {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: var(--el-color-danger);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.stop-button:hover {
  background: var(--el-color-danger-dark-2);
}

.stop-icon {
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 2px;
}

/* Emoji popover */
:global(.emoji-popover) {
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

/* 参数设置 */
.params-active {
  color: var(--el-color-primary) !important;
}

.params-panel {
  margin: 4px 12px 2px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.params-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.params-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.params-reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  border: none;
  background: none;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s;
}

.params-reset-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.params-reset-btn.active {
  color: var(--el-color-primary);
}

.params-items {
  display: flex;
  gap: 16px;
}

.params-item {
  flex: 1;
  min-width: 0;
}

.params-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.params-item-label {
  font-size: 11px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.params-item-value {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--el-fill-color);
  transition: all 0.2s;
}

.params-item-value.custom {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-weight: 500;
}

/* el-slider 微调 */
:deep(.el-slider) {
  --el-slider-height: 4px;
  --el-slider-button-size: 14px;
}

/* 移动端适配：参数面板竖排 + 整体紧凑 */
@media (max-width: 768px) {
  .params-items {
    flex-direction: column;
    gap: 6px;
  }

  .params-panel {
    margin: 2px 8px;
    padding: 6px 8px;
    gap: 6px;
  }

  .params-title {
    font-size: 11px;
  }

  .params-reset-btn {
    font-size: 10px;
  }

  .params-item-label {
    font-size: 10px;
  }

  .params-item-value {
    font-size: 10px;
    padding: 0 4px;
  }

  .params-item-header {
    margin-bottom: 2px;
  }

  .input-toolbar {
    padding: 4px 8px 0;
  }

  .toolbar-btn {
    width: 28px;
    height: 28px;
    min-height: 28px;
  }

  .input-body {
    padding: 0 8px;
  }

  .input-footer {
    padding: 2px 8px 6px;
  }

  .input-hint {
    font-size: 11px;
  }

  .pending-area {
    padding: 4px 8px;
    gap: 6px;
  }

  .pending-item {
    width: 48px;
    height: 48px;
  }
}
</style>
