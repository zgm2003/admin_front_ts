<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Close, Paperclip, Select } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import type { AiMessageAttachmentRequest } from '@/api/ai/messages'
import PendingAttachments from '../MessageInput/PendingAttachments.vue'
import { useAttachments, type SeededAttachment } from '../MessageInput/use-attachments'
import type { Message } from '../../composables/types'

const { t } = useI18n()
const props = withDefaults(defineProps<{
  message: Message
  capabilities?: AiAgentEffectiveCapabilities
  disabled?: boolean
}>(), {
  disabled: false,
  capabilities: undefined,
})

const emit = defineEmits<{
  submit: [payload: { content: string; attachments?: AiMessageAttachmentRequest[] }]
  cancel: []
}>()

const content = ref(props.message.content)
const originalAttachmentSignature = ref('[]')
const {
  setFileInputRef,
  pendingAttachments,
  supportsAttachments,
  accept,
  isLimitReached,
  canSubmitAttachments,
  blockingReason,
  completedAttachments,
  seedAttachments,
  handleUploadClick,
  handleFileChange,
  removeAttachment,
  retryAttachment,
} = useAttachments(() => props.capabilities, () => !props.disabled)

function asSeededAttachments(message: Message): SeededAttachment[] {
  const result: SeededAttachment[] = []
  for (const raw of message.meta_json?.attachments ?? []) {
    const item = raw as unknown as Partial<SeededAttachment>
    if ((item.type !== 'image' && item.type !== 'file')
      || !item.object_key || !item.url || !item.name
      || typeof item.size !== 'number' || item.size <= 0) continue
    result.push({
      type: item.type,
      object_key: item.object_key,
      url: item.url,
      mime_type: item.mime_type || 'application/octet-stream',
      name: item.name,
      size: item.size,
    })
  }
  return result
}

function attachmentSignature(values: readonly AiMessageAttachmentRequest[]) {
  return JSON.stringify(values.map((item) => [
    item.type, item.object_key, item.url, item.mime_type, item.name, item.size,
  ]))
}

function resetEditor() {
  content.value = props.message.content
  seedAttachments(asSeededAttachments(props.message))
  originalAttachmentSignature.value = attachmentSignature(
    completedAttachments().map((item) => item.request),
  )
}

watch(() => props.message.id, resetEditor, { immediate: true })

const requestAttachments = computed(() => completedAttachments().map((item) => item.request))
const attachmentsChanged = computed(() => (
  attachmentSignature(requestAttachments.value) !== originalAttachmentSignature.value
))
const blockingMessage = computed(() => {
  switch (blockingReason.value) {
    case 'provider_api_protocol_unsupported': return t('aiChat.providerApiProtocolUnsupported')
    case 'official_model_unsupported': return t('aiChat.modelFileInputUnsupported')
    case 'transport_unsupported': return t('aiChat.transportFileInputUnsupported')
    case 'upload_rule_unavailable': return t('aiChat.uploadRuleUnavailable')
    case 'image_unsupported': return t('aiChat.modelNotSupportImage')
    default: return blockingReason.value ? t('aiChat.attachmentTypeUnsupported') : ''
  }
})
const canSubmit = computed(() => (
  !props.disabled
  && canSubmitAttachments.value
  && (content.value.trim().length > 0 || requestAttachments.value.length > 0)
  && (content.value !== props.message.content || attachmentsChanged.value)
))

function submit() {
  if (!canSubmit.value) return
  emit('submit', {
    content: content.value,
    ...(attachmentsChanged.value ? { attachments: requestAttachments.value } : {}),
  })
}
</script>

<template>
  <div class="message-editor">
    <textarea
      v-model="content"
      class="message-editor-input"
      :disabled="disabled"
      :aria-label="t('aiChat.editMessage')"
      rows="3"
      @keydown.ctrl.enter.prevent="submit"
      @keydown.meta.enter.prevent="submit"
      @keydown.esc="emit('cancel')"
    />

    <PendingAttachments
      v-if="pendingAttachments.length"
      :attachments="pendingAttachments"
      :blocking-message="blockingMessage"
      @remove="removeAttachment"
      @retry="retryAttachment"
    />

    <div class="message-editor-actions">
      <el-tooltip
        v-if="supportsAttachments"
        :content="t('aiChat.addAttachment')"
        placement="top"
        :show-after="300"
      >
        <span>
          <el-button
            text
            class="editor-button"
            :disabled="disabled || isLimitReached"
            :aria-label="t('aiChat.addAttachment')"
            @click="handleUploadClick"
          >
            <el-icon :size="16"><Paperclip /></el-icon>
          </el-button>
        </span>
      </el-tooltip>
      <span class="message-editor-actions__spacer" />
      <el-button
        text
        class="editor-button"
        :aria-label="t('common.actions.cancel')"
        @click="emit('cancel')"
      >
        <el-icon :size="16"><Close /></el-icon>
      </el-button>
      <el-button
        type="primary"
        class="editor-submit"
        :disabled="!canSubmit"
        :aria-label="t('aiChat.editSubmit')"
        @click="submit"
      >
        <el-icon :size="16"><Select /></el-icon>
        <span>{{ t('aiChat.editSubmit') }}</span>
      </el-button>
    </div>

    <input
      v-if="supportsAttachments"
      :ref="setFileInputRef"
      type="file"
      :accept="accept"
      multiple
      tabindex="-1"
      aria-hidden="true"
      class="message-editor-file-input"
      @change="handleFileChange"
    >
  </div>
</template>

<style scoped>
.message-editor {
  width: min(560px, 100%);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.message-editor-input {
  width: 100%;
  min-height: 84px;
  resize: vertical;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 7px;
  outline: none;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.message-editor-input:focus-visible {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}

.message-editor-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.message-editor-actions__spacer {
  flex: 1;
}

.editor-button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  padding: 0;
}

.editor-submit {
  min-height: 30px;
  padding: 0 10px;
}

.message-editor-file-input {
  display: none;
}
</style>
