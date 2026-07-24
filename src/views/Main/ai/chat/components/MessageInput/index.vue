<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { ChatLineSquare, Microphone, Picture, Promotion, Setting } from '@element-plus/icons-vue'
import { DIcon } from '@/components/DIcon'
import { EmojiPicker } from '@/components/EmojiPicker'
import { useIsMobile } from '@/hooks/useResponsive'
import type { AIRuntimeParams } from '@/api/ai/messages'
import PendingAttachments from './PendingAttachments.vue'
import RuntimeParamsPanel from './RuntimeParamsPanel.vue'
import { createRuntimeParams } from './runtime-params'
import { useImageAttachments, type Attachment } from './use-image-attachments'
import { useSpeechInput } from './use-speech-input'

const { t } = useI18n()
const isMobile = useIsMobile()
const props = defineProps<{
  sending: boolean
  disabled?: boolean
  isStreaming?: boolean
  showHistoryBtn?: boolean
}>()
const emit = defineEmits<{
  send: [content: string, attachments?: Attachment[], runtimeParams?: AIRuntimeParams]
  stop: []
  openHistory: []
}>()

const MAX_CONTENT_LENGTH = 30000
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const showEmojiPicker = ref(false)
const showParamsPanel = ref(false)
const runtimeTemperature = ref<number | null>(null)
const runtimeMaxTokens = ref<number | null>(null)
const runtimeMaxHistory = ref<number | null>(null)
const hasCustomParams = computed(() => (
  runtimeTemperature.value !== null
  || runtimeMaxTokens.value !== null
  || runtimeMaxHistory.value !== null
))
const showCharCount = computed(() => inputText.value.length > MAX_CONTENT_LENGTH * 0.9)

function getRequestParams(): AIRuntimeParams {
  return createRuntimeParams(
    runtimeTemperature.value,
    runtimeMaxTokens.value,
    runtimeMaxHistory.value,
  )
}

function resetParams() {
  runtimeTemperature.value = null
  runtimeMaxTokens.value = null
  runtimeMaxHistory.value = null
}

function adjustHeight() {
  const textarea = textareaRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
}

const { isRecording, toggleVoiceInput } = useSpeechInput(inputText, adjustHeight)
const {
  setFileInputRef,
  pendingAttachments,
  isDragging,
  supportsImage,
  isImageLimitReached,
  handleUploadClick,
  handleFileChange,
  removeAttachment,
  handlePaste,
  handleDragOver,
  handleDragLeave,
  handleDrop,
} = useImageAttachments()

function handleEmojiSelect(emoji: string) {
  const textarea = textareaRef.value
  if (!textarea) {
    inputText.value += emoji
    showEmojiPicker.value = false
    return
  }

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  inputText.value = inputText.value.substring(0, start) + emoji + inputText.value.substring(end)
  nextTick(() => {
    textarea.focus()
    const newPosition = start + emoji.length
    textarea.setSelectionRange(newPosition, newPosition)
    adjustHeight()
  })
  showEmojiPicker.value = false
}

function handleSend() {
  if (props.sending || props.disabled) return
  const content = inputText.value.trim()
  if (pendingAttachments.value.some((attachment) => attachment.status === 'uploading')) {
    ElNotification.warning({ message: t('aiChat.waitUpload') })
    return
  }
  if (pendingAttachments.value.some((attachment) => attachment.status === 'error')) {
    ElNotification.warning({ message: t('aiChat.uploadHasError') })
    return
  }

  const attachments: Attachment[] = pendingAttachments.value
    .filter((attachment) => attachment.status === 'done' && attachment.url)
    .map((attachment) => ({
      type: 'image',
      url: attachment.url as string,
      name: attachment.file.name,
      size: attachment.file.size,
    }))
  if (!content && attachments.length === 0) return
  emit(
    'send',
    content,
    attachments.length > 0 ? attachments : undefined,
    hasCustomParams.value ? getRequestParams() : undefined,
  )
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey) return
  event.preventDefault()
  handleSend()
}

function handleInput(event: Event) {
  inputText.value = (event.target as HTMLTextAreaElement).value
  adjustHeight()
}

defineExpose({
  clear: () => {
    inputText.value = ''
    pendingAttachments.value = []
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  },
  focus: () => textareaRef.value?.focus(),
  getRequestParams,
})
</script>

<template>
  <div
    class="message-input"
    :class="{ 'is-dragging': isDragging }"
    role="region"
    :aria-label="t('accessibility.chatComposer')"
    :aria-busy="sending"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
  >
    <div class="composer-shell">
      <RuntimeParamsPanel
        v-if="showParamsPanel"
        id="ai-chat-runtime-params"
        v-model:temperature="runtimeTemperature"
        v-model:max-tokens="runtimeMaxTokens"
        v-model:max-history="runtimeMaxHistory"
        :has-custom-params="hasCustomParams"
        @reset="resetParams"
      />

      <PendingAttachments
        v-if="pendingAttachments.length"
        :attachments="pendingAttachments"
        @remove="removeAttachment"
      />

      <div class="input-body">
        <label
          class="sr-only"
          for="ai-chat-input"
        >{{ t('accessibility.inputLabel') }}</label>
        <textarea
          id="ai-chat-input"
          ref="textareaRef"
          :value="inputText"
          :placeholder="disabled ? t('aiChat.selectAgentFirst') : t('aiChat.inputPlaceholder')"
          :disabled="sending || disabled || isRecording"
          :maxlength="MAX_CONTENT_LENGTH"
          rows="1"
          class="chat-textarea"
          :aria-describedby="showCharCount ? 'ai-chat-hint ai-chat-count' : 'ai-chat-hint'"
          aria-keyshortcuts="Enter"
          @input="handleInput"
          @keydown="handleKeydown"
          @paste="handlePaste"
        />
      </div>

      <div class="input-footer">
        <div
          class="input-toolbar"
          role="toolbar"
          :aria-label="t('accessibility.chatToolbar')"
        >
          <div class="toolbar-left">
            <el-button
              v-if="showHistoryBtn"
              text
              class="toolbar-btn"
              :disabled="disabled"
              :title="t('aiChat.historyConversations')"
              :aria-label="t('aiChat.historyConversations')"
              @click="emit('openHistory')"
            >
              <el-icon :size="18">
                <ChatLineSquare />
              </el-icon>
            </el-button>
            <el-button
              v-if="supportsImage"
              text
              class="toolbar-btn"
              :disabled="sending || disabled || isImageLimitReached || isRecording"
              :title="t('aiChat.uploadImage')"
              :aria-label="t('aiChat.uploadImage')"
              @click="handleUploadClick"
            >
              <el-icon :size="18">
                <Picture />
              </el-icon>
            </el-button>
            <el-button
              text
              class="toolbar-btn voice-btn"
              :class="{ 'is-recording': isRecording }"
              :disabled="sending || disabled"
              :title="t('aiChat.voiceInput')"
              :aria-label="t('aiChat.voiceInput')"
              :aria-pressed="isRecording"
              @click="toggleVoiceInput"
            >
              <el-icon :size="18">
                <Microphone />
              </el-icon>
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
                <el-button
                  text
                  class="toolbar-btn"
                  :disabled="sending || disabled || isRecording"
                  :title="t('aiChat.insertEmoji')"
                  :aria-label="t('aiChat.insertEmoji')"
                >
                  <DIcon
                    icon="fluent-emoji:grinning-face"
                    :size="18"
                  />
                </el-button>
              </template>
              <EmojiPicker @select="handleEmojiSelect" />
            </el-popover>
            <el-button
              text
              class="toolbar-btn"
              :class="{ 'params-active': hasCustomParams }"
              :disabled="sending || disabled"
              :title="t('aiChat.runtimeParams')"
              :aria-label="t('aiChat.runtimeParams')"
              :aria-expanded="showParamsPanel"
              aria-controls="ai-chat-runtime-params"
              @click="showParamsPanel = !showParamsPanel"
            >
              <el-icon :size="18">
                <Setting />
              </el-icon>
            </el-button>
          </div>
        </div>

        <div class="input-status">
          <span
            v-if="isRecording"
            id="ai-chat-hint"
            class="recording-status"
            role="status"
          >
            <el-icon
              class="recording-icon"
              :size="14"
            ><Microphone /></el-icon>
            {{ t('aiChat.voiceRecording') }}
          </span>
          <span
            v-else
            id="ai-chat-hint"
            class="sr-only"
          >
            {{ isMobile ? t('aiChat.inputHintMobile') : t('aiChat.inputHint') }}
            <template v-if="supportsImage && !isMobile">{{ t('aiChat.inputHintImage') }}</template>
          </span>
          <span
            v-if="showCharCount"
            id="ai-chat-count"
            class="char-count"
            :class="{ 'near-limit': inputText.length >= MAX_CONTENT_LENGTH }"
          >
            {{ inputText.length.toLocaleString() }} / {{ MAX_CONTENT_LENGTH.toLocaleString() }}
          </span>
        </div>

        <button
          v-if="isStreaming"
          type="button"
          class="stop-button"
          :title="t('accessibility.stopGenerating')"
          :aria-label="t('accessibility.stopGenerating')"
          @click="emit('stop')"
        >
          <div class="stop-icon" />
        </button>
        <el-button
          v-else
          type="primary"
          class="send-button"
          :disabled="(!inputText.trim() && pendingAttachments.every((item) => item.status !== 'done')) || sending || disabled || isRecording"
          :title="t('aiChat.send')"
          :aria-label="t('aiChat.send')"
          :aria-busy="sending"
          @click="handleSend"
        >
          <el-icon :size="18">
            <Promotion />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 隐藏的文件选择器 -->
    <input
      :ref="setFileInputRef"
      type="file"
      accept="image/*"
      multiple
      tabindex="-1"
      aria-hidden="true"
      style="display:none"
      @change="handleFileChange"
    >
  </div>
</template>

<style scoped src="./styles.css"></style>
