<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { Microphone, Promotion } from '@element-plus/icons-vue'
import { useIsMobile } from '@/hooks/useResponsive'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import type { AIRuntimeParams } from '@/api/ai/messages'
import PendingAttachments from './PendingAttachments.vue'
import MessageInputToolbar from './MessageInputToolbar.vue'
import RuntimeParamsPanel from './RuntimeParamsPanel.vue'
import { createRuntimeParams, type RuntimeParameterDraft } from './runtime-params'
import { useAttachments, type Attachment } from './use-attachments'
import type { CapabilityConflicts, ComposerCapabilityState } from './capability-transition'
import { useSpeechInput } from './use-speech-input'

const { t } = useI18n()
const isMobile = useIsMobile()
const props = defineProps<{
  sending: boolean
  disabled?: boolean
  isStreaming?: boolean
  isStopping?: boolean
  showHistoryBtn?: boolean
  agentId?: number | null
  conversationId?: number | null
  capabilities?: AiAgentEffectiveCapabilities
}>()
const emit = defineEmits<{
  send: [content: string, attachments?: Attachment[], runtimeParams?: AIRuntimeParams]
  stop: []
  openHistory: []
}>()

const MAX_CONTENT_LENGTH = 30000
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()
const showParamsPanel = ref(false)
const runtimeTemperature = ref<RuntimeParameterDraft>(temperatureDefault())
const runtimeMaxHistory = ref<RuntimeParameterDraft>(maxHistoryDefault())
const hasCustomParams = computed(() => (
  (props.capabilities?.runtime_parameters.temperature.supported === true && runtimeTemperature.value.enabled)
  || (props.capabilities?.runtime_parameters.max_history.supported === true && runtimeMaxHistory.value.enabled)
))
const hasRuntimeParams = computed(() => (
  props.capabilities?.runtime_parameters.temperature.supported === true
  || props.capabilities?.runtime_parameters.max_history.supported === true
))
const showCharCount = computed(() => inputText.value.length > MAX_CONTENT_LENGTH * 0.9)

function getRequestParams(): AIRuntimeParams {
  return createRuntimeParams({
    temperature: props.capabilities?.runtime_parameters.temperature.supported
      ? runtimeTemperature.value : undefined,
    maxHistory: props.capabilities?.runtime_parameters.max_history.supported
      ? runtimeMaxHistory.value : undefined,
  })
}

function temperatureDefault(): RuntimeParameterDraft {
  return {
    enabled: false,
    value: props.capabilities?.runtime_parameters.temperature.default ?? 1,
  }
}

function maxHistoryDefault(): RuntimeParameterDraft {
  return {
    enabled: false,
    value: props.capabilities?.runtime_parameters.max_history.default ?? 20,
  }
}

function resetParams() {
  runtimeTemperature.value = temperatureDefault()
  runtimeMaxHistory.value = maxHistoryDefault()
}

watch(() => [props.agentId, props.conversationId] as const, () => {
  resetParams()
  showParamsPanel.value = false
})

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
  supportsAttachments,
  accept,
  isLimitReached,
  canSubmitAttachments,
  blockingReason,
  completedAttachments,
  handleUploadClick,
  handleFileChange,
  removeAttachment,
  clearAttachments,
  retryAttachment,
  handlePaste,
  handleDragOver,
  handleDragLeave,
  handleDrop,
} = useAttachments(() => props.capabilities, () => Boolean(props.agentId) && !props.disabled)

const attachmentBlockingMessage = computed(() => {
  switch (blockingReason.value) {
    case 'provider_api_protocol_unsupported': return t('aiChat.providerApiProtocolUnsupported')
    case 'official_model_unsupported': return t('aiChat.modelFileInputUnsupported')
    case 'transport_unsupported': return t('aiChat.transportFileInputUnsupported')
    case 'upload_rule_unavailable': return t('aiChat.uploadRuleUnavailable')
    case 'image_unsupported': return t('aiChat.modelNotSupportImage')
    case 'too_many': return t('aiChat.maxAttachmentsReached')
    case 'message_total_too_large': return t('aiChat.attachmentTotalTooLarge')
    default: return blockingReason.value ? t('aiChat.attachmentTypeUnsupported') : ''
  }
})

function handleEmojiSelect(emoji: string) {
  const textarea = textareaRef.value
  if (!textarea) {
    inputText.value += emoji
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
}

function handleSend() {
  if (props.sending || props.disabled) return
  const content = inputText.value.trim()
  if (!canSubmitAttachments.value) {
    ElNotification.warning({
      message: attachmentBlockingMessage.value
        || (pendingAttachments.value.some((attachment) => attachment.status === 'failed')
          ? t('aiChat.uploadHasError')
          : t('aiChat.waitUpload')),
    })
    return
  }

  const attachments: Attachment[] = completedAttachments()
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

function getCapabilityState(): ComposerCapabilityState {
  return {
    attachments: pendingAttachments.value.map((attachment) => ({
      id: attachment.id,
      kind: attachment.kind,
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size,
    })),
    temperatureEnabled: runtimeTemperature.value.enabled,
  }
}

function clearCapabilityConflicts(conflicts: CapabilityConflicts) {
  if (conflicts.temperature) runtimeTemperature.value = temperatureDefault()
}

defineExpose({
  clear: () => {
    inputText.value = ''
    clearAttachments()
    if (textareaRef.value) textareaRef.value.style.height = 'auto'
  },
  focus: () => textareaRef.value?.focus(),
  getRequestParams,
  getCapabilityState,
  clearCapabilityConflicts,
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
        v-if="showParamsPanel && capabilities"
        id="ai-chat-runtime-params"
        v-model:temperature="runtimeTemperature"
        v-model:max-history="runtimeMaxHistory"
        :capabilities="capabilities"
        :has-custom-params="hasCustomParams"
        @reset="resetParams"
      />

      <PendingAttachments
        v-if="pendingAttachments.length"
        :attachments="pendingAttachments"
        :blocking-message="attachmentBlockingMessage"
        @remove="removeAttachment"
        @retry="retryAttachment"
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
          <MessageInputToolbar
            :show-history-button="showHistoryBtn"
            :supports-attachments="supportsAttachments"
            :sending="sending"
            :disabled="disabled"
            :attachment-limit-reached="isLimitReached"
            :recording="isRecording"
            :has-runtime-params="hasRuntimeParams"
            :has-custom-params="hasCustomParams"
            :params-expanded="showParamsPanel"
            @open-history="emit('openHistory')"
            @add-attachment="handleUploadClick"
            @toggle-voice="toggleVoiceInput"
            @select-emoji="handleEmojiSelect"
            @toggle-params="showParamsPanel = !showParamsPanel"
          />
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
            <template v-if="supportsAttachments && !isMobile">{{ t('aiChat.inputHintAttachment') }}</template>
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
          :title="isStopping ? t('aiChat.stopping') : t('accessibility.stopGenerating')"
          :aria-label="isStopping ? t('aiChat.stopping') : t('accessibility.stopGenerating')"
          :disabled="isStopping"
          :aria-busy="isStopping"
          @click="emit('stop')"
        >
          <div class="stop-icon" />
        </button>
        <el-button
          v-else
          type="primary"
          class="send-button"
          :disabled="(!inputText.trim() && completedAttachments().length === 0) || !canSubmitAttachments || sending || disabled || isRecording"
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

    <input
      v-if="supportsAttachments"
      :ref="setFileInputRef"
      type="file"
      :accept="accept"
      multiple
      tabindex="-1"
      aria-hidden="true"
      style="display:none"
      @change="handleFileChange"
    >
  </div>
</template>

<style scoped src="./styles.css"></style>
