<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CopyDocument, Loading } from '@element-plus/icons-vue'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { AiRoleEnum } from '@/enums'
import type { Message } from '../../composables/types'
import { announcePolite } from '@/shared/accessibility/announcer'

const { t } = useI18n()

const props = defineProps<{
  messages: Message[]
  loading: boolean
  sending?: boolean
}>()

const emit = defineEmits<{
  copy: [message: Message]
}>()

const previewVisible = ref(false)
const previewImages = ref<string[]>([])
const previewIndex = ref(0)
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

function getAttachments(message: Message) {
  return message.meta_json?.attachments ?? []
}

function handleImageClick(message: Message, index: number) {
  previewImages.value = getAttachments(message).map((attachment) => attachment.url)
  previewIndex.value = index
  previewVisible.value = true
}
</script>

<template>
  <div
    class="message-list"
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
          v-if="message.role === AiRoleEnum.USER && getAttachments(message).length > 0"
          class="message-attachments"
        >
          <el-image
            v-for="(attachment, index) in getAttachments(message)"
            :key="`${message.id}-${attachment.url}`"
            :src="attachment.url"
            :alt="attachment.name"
            fit="cover"
            lazy
            class="attachment-image"
            role="button"
            tabindex="0"
            :aria-label="t('accessibility.openImage', { name: attachment.name })"
            @click="handleImageClick(message, index)"
            @keydown.enter="handleImageClick(message, index)"
            @keydown.space.prevent="handleImageClick(message, index)"
          >
            <template #placeholder>
              <div class="attachment-placeholder">
                <el-icon
                  class="is-loading"
                  :size="18"
                >
                  <Loading />
                </el-icon>
              </div>
            </template>
            <template #error>
              <div class="attachment-placeholder">
                {{ t('aiChat.imageLoadFailed') }}
              </div>
            </template>
          </el-image>
        </div>
        <div class="message-card">
          <MarkdownRenderer
            v-if="message.content"
            :content="message.content"
            class="message-content"
          />
          <div
            v-else-if="message.role === AiRoleEnum.ASSISTANT && message.isStreaming"
            class="typing-dots"
            role="status"
            :aria-label="t('accessibility.loading')"
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </div>
          <span
            v-else-if="message.role === AiRoleEnum.ASSISTANT"
            class="empty-content"
          >...</span>
        </div>
        <div
          v-if="!message.isStreaming"
          class="message-actions"
        >
          <el-button
            text
            size="small"
            class="copy-button"
            :title="t('aiChat.copyMessage')"
            :aria-label="t('aiChat.copyMessage')"
            @click="emit('copy', message)"
          >
            <el-icon :size="15">
              <CopyDocument />
            </el-icon>
          </el-button>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 260px;
  color: var(--el-text-color-secondary);
}

.message-row {
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

.message-card {
  max-width: 100%;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 72%;
}

.user-row .message-attachments {
  justify-content: flex-end;
}

.attachment-image {
  width: 132px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  cursor: zoom-in;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.attachment-placeholder {
  width: 132px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  background: var(--el-fill-color-light);
}

.user-row .message-card {
  max-width: 72%;
  padding: 10px 14px;
  border: 0;
  border-radius: 8px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}

.assistant-row .message-card {
  max-width: 100%;
  padding: 2px 0;
  color: var(--el-text-color-primary);
  background: transparent;
  border: 0;
  border-radius: 0;
}

.message-content {
  font-size: 15px;
  line-height: 1.75;
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
  display: flex;
  justify-content: flex-start;
  min-height: 28px;
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

.copy-button {
  width: 28px;
  min-width: 28px;
  height: 28px;
  min-height: 28px;
  padding: 0;
  border-radius: 6px;
  color: var(--el-text-color-secondary);
}

.copy-button:hover,
.copy-button:focus-visible {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.empty-content {
  color: var(--el-text-color-placeholder);
}

.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 36px;
  min-height: 20px;
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
}
</style>
