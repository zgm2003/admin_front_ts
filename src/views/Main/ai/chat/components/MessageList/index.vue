<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  CloseBold,
  CopyDocument,
  Delete,
  Document,
  Edit,
  Headset,
  Loading,
  Refresh,
  Star,
  StarFilled,
  VideoPause,
  VideoPlay,
} from '@element-plus/icons-vue'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { AiRoleEnum } from '@/enums'
import { announcePolite } from '@/shared/accessibility/announcer'
import type { Message } from '../../composables/types'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import type { AiMessageAttachmentRequest } from '@/api/ai/messages'
import MessageEditor from './MessageEditor.vue'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  messages: Message[]
  loading: boolean
  sending?: boolean
  interactionDisabled?: boolean
  selectionMode?: boolean
  selectedMessageIds?: number[]
  speechSupported?: boolean
  speakingMessageId?: number | null
  speechPaused?: boolean
  capabilities?: AiAgentEffectiveCapabilities
}>(), {
  sending: false,
  interactionDisabled: false,
  selectionMode: false,
  selectedMessageIds: () => [],
  speechSupported: false,
  speakingMessageId: null,
  speechPaused: false,
})

const emit = defineEmits<{
  copy: [message: Message]
  edit: [message: Message, payload: { content: string; attachments?: AiMessageAttachmentRequest[] }]
  regenerate: [message: Message]
  delete: [message: Message]
  feedback: [message: Message, liked: boolean]
  startSpeech: [message: Message]
  pauseSpeech: []
  resumeSpeech: []
  stopSpeech: []
  toggleSelection: [messageId: number, selected: boolean]
}>()

const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)
const editingMessageId = ref<number | null>(null)
const announcedTerminalMessages = new Set<string>()
let historyInitialized = false

function messageAnnouncementKey(message: Message) {
  return `${message.id}:${message.request_id}`
}

watch(() => [props.loading, props.messages] as const, ([loading, messages]) => {
  if (loading) return
  const completed = messages.filter((message) => (
    message.role === AiRoleEnum.ASSISTANT
    && !message.isStreaming
    && message.content.trim().length > 0
  ))
  if (!historyInitialized) {
    completed.forEach((message) => announcedTerminalMessages.add(messageAnnouncementKey(message)))
    historyInitialized = true
    return
  }
  for (const message of completed) {
    const key = messageAnnouncementKey(message)
    if (announcedTerminalMessages.has(key)) continue
    announcedTerminalMessages.add(key)
    announcePolite(t('accessibility.responseComplete'))
  }
}, { deep: true, flush: 'post', immediate: true })

watch(() => props.interactionDisabled, (disabled) => {
  if (disabled) editingMessageId.value = null
})

watch(() => props.messages.map(({ id }) => id), (ids) => {
  if (editingMessageId.value !== null && !ids.includes(editingMessageId.value)) {
    editingMessageId.value = null
  }
})

function getAttachments(message: Message) {
  return message.meta_json?.attachments ?? []
}

function handleImageClick(message: Message, url: string) {
  previewImages.value = getAttachments(message)
    .filter((attachment) => attachment.type === 'image')
    .map((attachment) => attachment.url)
  previewIndex.value = Math.max(0, previewImages.value.indexOf(url))
  previewVisible.value = true
}

function formatAttachmentBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function isAssistant(message: Message) {
  return message.role === AiRoleEnum.ASSISTANT
}

function isUser(message: Message) {
  return message.role === AiRoleEnum.USER
}

function isSelected(messageId: number) {
  return props.selectedMessageIds.includes(messageId)
}

function relatedMessage(message: Message) {
  if (message.paired_message_id !== null) {
    const paired = props.messages.find((candidate) => candidate.id === message.paired_message_id)
    if (paired) return paired
  }
  if (!message.request_id) return undefined
  return props.messages.find((candidate) => (
    candidate.request_id === message.request_id && candidate.role !== message.role
  ))
}

function interactionUnavailable(message: Message) {
  const related = relatedMessage(message)
  return props.interactionDisabled
    || message.isStreaming === true
    || message.settlement_pending
    || message.id <= 0
    || related?.isStreaming === true
    || related?.settlement_pending === true
}

function feedbackUnavailable(message: Message) {
  return interactionUnavailable(message)
    || message.run_id === null
    || message.delivery_state === 'stopped'
}

function beginEdit(message: Message) {
  if (interactionUnavailable(message)) return
  editingMessageId.value = message.id
}

function submitEdit(message: Message, payload: { content: string; attachments?: AiMessageAttachmentRequest[] }) {
  editingMessageId.value = null
  emit('edit', message, payload)
}

function toggleSpeech(message: Message) {
  if (props.speakingMessageId !== message.id) {
    emit('startSpeech', message)
    return
  }
  if (props.speechPaused) emit('resumeSpeech')
  else emit('pauseSpeech')
}

function speechLabel(message: Message) {
  if (props.speakingMessageId !== message.id) return t('aiChat.speakMessage')
  return props.speechPaused ? t('aiChat.resumeSpeech') : t('aiChat.pauseSpeech')
}
</script>

<template>
  <div
    class="message-list"
    :class="{ 'is-selecting': selectionMode }"
    role="log"
    aria-live="off"
    aria-relevant="additions"
    :aria-label="t('accessibility.chatMessages')"
    :aria-busy="loading || sending"
  >
    <div
      v-if="loading && messages.length === 0"
      class="state-tip"
      role="status"
    >
      <el-icon
        class="is-loading"
        :size="24"
      >
        <Loading />
      </el-icon>
      <span>{{ t('aiChat.loading') }}</span>
    </div>

    <template v-else>
      <article
        v-for="message in messages"
        :key="`${message.id}-${message.request_id || ''}`"
        class="message-row"
        :class="message.role === AiRoleEnum.USER ? 'user-row' : 'assistant-row'"
      >
        <div
          class="message-selection-gutter"
          :aria-hidden="!selectionMode"
        >
          <el-checkbox
            v-if="selectionMode"
            :model-value="isSelected(message.id)"
            :disabled="interactionUnavailable(message)"
            :aria-label="t('aiChat.selectMessage')"
            @change="emit('toggleSelection', message.id, Boolean($event))"
          />
        </div>

        <div
          v-if="isUser(message) && editingMessageId !== message.id && getAttachments(message).length > 0"
          class="message-attachments"
        >
          <template
            v-for="attachment in getAttachments(message)"
            :key="`${message.id}-${attachment.url}`"
          >
            <el-image
              v-if="attachment.type === 'image'"
              :src="attachment.url"
              :alt="attachment.name"
              fit="cover"
              lazy
              class="attachment-image"
              role="button"
              tabindex="0"
              :aria-label="t('accessibility.openImage', { name: attachment.name })"
              @click="handleImageClick(message, attachment.url)"
              @keydown.enter="handleImageClick(message, attachment.url)"
              @keydown.space.prevent="handleImageClick(message, attachment.url)"
            >
              <template #placeholder>
                <div class="attachment-placeholder">
                  <el-icon class="is-loading" :size="18"><Loading /></el-icon>
                </div>
              </template>
              <template #error>
                <div class="attachment-placeholder">{{ t('aiChat.imageLoadFailed') }}</div>
              </template>
            </el-image>
            <a
              v-else
              class="attachment-file"
              :href="attachment.url"
              target="_blank"
              rel="noopener noreferrer"
              :title="attachment.name"
            >
              <el-icon :size="20"><Document /></el-icon>
              <span class="attachment-file__copy">
                <span class="attachment-file__name">{{ attachment.name }}</span>
                <span class="attachment-file__size">{{ formatAttachmentBytes(attachment.size) }}</span>
              </span>
            </a>
          </template>
        </div>

        <MessageEditor
          v-if="isUser(message) && editingMessageId === message.id"
          :message="message"
          :capabilities="capabilities"
          :disabled="interactionUnavailable(message)"
          @submit="submitEdit(message, $event)"
          @cancel="editingMessageId = null"
        />
        <div
          v-else
          class="message-card"
        >
          <MarkdownRenderer
            v-if="message.content"
            :content="message.content"
            class="message-content"
          />
          <div
            v-else-if="isAssistant(message) && message.isStreaming"
            class="typing-dots"
            role="status"
            :aria-label="t('accessibility.loading')"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </div>
          <span
            v-else-if="isAssistant(message) && message.delivery_state !== 'stopped'"
            class="empty-content"
          >...</span>
        </div>

        <el-text
          v-if="isAssistant(message) && message.delivery_state === 'stopped'"
          tag="div"
          size="small"
          type="info"
        >
          {{ t('aiChat.generationStopped') }}
        </el-text>

        <div
          v-if="!message.isStreaming && editingMessageId !== message.id"
          class="message-actions"
          role="toolbar"
          :aria-label="t('common.actions.action')"
        >
          <el-tooltip
            :content="t('aiChat.copyMessage')"
            placement="top"
            :show-after="300"
          >
            <span class="action-trigger">
              <el-button
                text
                class="message-action-button"
                :disabled="!message.content.trim()"
                :aria-label="t('aiChat.copyMessage')"
                @click="emit('copy', message)"
              >
                <el-icon :size="15"><CopyDocument /></el-icon>
              </el-button>
            </span>
          </el-tooltip>

          <template v-if="isAssistant(message)">
            <el-tooltip
              :content="speechSupported ? speechLabel(message) : t('aiChat.speechNotSupported')"
              placement="top"
              :show-after="300"
            >
              <span class="action-trigger">
                <el-button
                  text
                  class="message-action-button"
                  :disabled="!speechSupported || !message.content.trim()"
                  :aria-label="speechLabel(message)"
                  @click="toggleSpeech(message)"
                >
                  <el-icon :size="15">
                    <VideoPlay v-if="speakingMessageId === message.id && speechPaused" />
                    <VideoPause v-else-if="speakingMessageId === message.id" />
                    <Headset v-else />
                  </el-icon>
                </el-button>
              </span>
            </el-tooltip>

            <el-tooltip
              v-if="speakingMessageId === message.id"
              :content="t('aiChat.stopSpeech')"
              placement="top"
              :show-after="300"
            >
              <span class="action-trigger">
                <el-button
                  text
                  class="message-action-button"
                  :aria-label="t('aiChat.stopSpeech')"
                  @click="emit('stopSpeech')"
                >
                  <el-icon :size="14"><CloseBold /></el-icon>
                </el-button>
              </span>
            </el-tooltip>

            <el-tooltip
              :content="message.liked ? t('aiChat.unlike') : t('aiChat.like')"
              placement="top"
              :show-after="300"
            >
              <span class="action-trigger">
                <el-button
                  text
                  class="message-action-button"
                  :class="{ 'is-liked': message.liked }"
                  :disabled="feedbackUnavailable(message)"
                  :aria-label="message.liked ? t('aiChat.unlike') : t('aiChat.like')"
                  @click="emit('feedback', message, !message.liked)"
                >
                  <el-icon :size="15">
                    <StarFilled v-if="message.liked" />
                    <Star v-else />
                  </el-icon>
                </el-button>
              </span>
            </el-tooltip>

            <el-tooltip
              :content="t('aiChat.regenerate')"
              placement="top"
              :show-after="300"
            >
              <span class="action-trigger">
                <el-button
                  text
                  class="message-action-button"
                  :disabled="interactionUnavailable(message) || message.paired_message_id === null"
                  :aria-label="t('aiChat.regenerate')"
                  @click="emit('regenerate', message)"
                >
                  <el-icon :size="15"><Refresh /></el-icon>
                </el-button>
              </span>
            </el-tooltip>
          </template>

          <el-tooltip
            v-if="isUser(message)"
            :content="t('aiChat.editMessage')"
            placement="top"
            :show-after="300"
          >
            <span class="action-trigger">
              <el-button
                text
                class="message-action-button"
                :disabled="interactionUnavailable(message)"
                :aria-label="t('aiChat.editMessage')"
                @click="beginEdit(message)"
              >
                <el-icon :size="15"><Edit /></el-icon>
              </el-button>
            </span>
          </el-tooltip>

          <el-tooltip
            :content="t('aiChat.deleteMessage')"
            placement="top"
            :show-after="300"
          >
            <span class="action-trigger">
              <el-button
                text
                class="message-action-button danger-action"
                :disabled="interactionUnavailable(message)"
                :aria-label="t('aiChat.deleteMessage')"
                @click="emit('delete', message)"
              >
                <el-icon :size="15"><Delete /></el-icon>
              </el-button>
            </span>
          </el-tooltip>
        </div>
      </article>
    </template>

    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<style scoped>
.message-list {
  width: min(var(--chat-content-width, 900px), calc(100% - 40px));
  margin: 0 auto;
  padding: 36px 0 30px;
}

.state-tip {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--el-text-color-secondary);
}

.message-row {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-bottom: 22px;
}

.user-row {
  align-items: flex-end;
}

.assistant-row {
  align-items: flex-start;
}

.message-selection-gutter {
  position: absolute;
  top: 7px;
  left: -34px;
  width: 28px;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-selection-gutter :deep(.el-checkbox) {
  height: 28px;
}

.message-card {
  max-width: 100%;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

.message-attachments {
  max-width: 72%;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-row .message-attachments {
  justify-content: flex-end;
}

.attachment-image {
  width: 132px;
  height: 100px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-light);
  cursor: zoom-in;
}

.attachment-placeholder {
  width: 132px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.attachment-file {
  width: min(260px, 100%);
  min-width: 0;
  min-height: 58px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 7px;
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  text-decoration: none;
}

.attachment-file:hover,
.attachment-file:focus-visible {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.attachment-file__copy {
  min-width: 0;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.attachment-file__name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-file__size {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 16px;
  font-variant-numeric: tabular-nums;
}

.user-row .message-card {
  max-width: 72%;
  padding: 10px 14px;
  border: 0;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.assistant-row .message-card {
  max-width: 100%;
  padding: 2px 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--el-text-color-primary);
}

.message-content {
  font-size: 15px;
  line-height: 1.75;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.message-content :deep(p:first-child) {
  margin-top: 0;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.user-row .message-content {
  line-height: 1.6;
}

.message-actions {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1px;
  margin-top: 2px;
  opacity: 0;
  transition: opacity 140ms ease;
}

.user-row .message-actions {
  justify-content: flex-end;
}

.message-row:hover .message-actions,
.message-row:focus-within .message-actions {
  opacity: 1;
}

.action-trigger {
  width: 30px;
  height: 30px;
  display: inline-flex;
}

.message-action-button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  min-height: 30px;
  margin: 0;
  padding: 0;
  border-radius: 6px;
  color: var(--el-text-color-secondary);
}

.message-action-button:hover,
.message-action-button:focus-visible,
.message-action-button.is-liked {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.danger-action:hover,
.danger-action:focus-visible {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.empty-content {
  color: var(--el-text-color-placeholder);
}

.typing-dots {
  min-width: 36px;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
  animation: typing 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing {
  0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}

@media (hover: none) {
  .message-actions {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .message-actions {
    transition: none;
  }

  .typing-dots span {
    animation: none;
  }
}

@media (max-width: 768px) {
  .message-list {
    width: calc(100% - 24px);
    padding: 20px 0 24px;
  }

  .message-list.is-selecting {
    width: calc(100% - 56px);
    margin-left: 44px;
  }

  .message-card,
  .message-attachments {
    max-width: 88%;
  }

  .assistant-row .message-card {
    max-width: 100%;
  }

  .message-row {
    margin-bottom: 14px;
  }

  .message-selection-gutter {
    left: -30px;
  }
}
</style>
