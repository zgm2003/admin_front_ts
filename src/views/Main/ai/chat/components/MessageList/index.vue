<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CopyDocument, Loading } from '@element-plus/icons-vue'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { AiRoleEnum } from '@/enums'
import type { Message } from '../../composables/types'

const { t } = useI18n()

defineProps<{
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
  <div class="message-list">
    <div v-if="loading && messages.length === 0" class="state-tip">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span>{{ t('aiChat.loading') }}</span>
    </div>

    <template v-else>
      <article
        v-for="message in messages"
        :key="`${message.id}-${message.request_id || ''}`"
        class="message-row"
        :class="message.role === AiRoleEnum.USER ? 'user-row' : 'assistant-row'"
      >
        <div class="message-meta">
          {{ message.role === AiRoleEnum.USER ? t('aiChat.you') : t('aiChat.assistant') }}
        </div>
        <div v-if="message.role === AiRoleEnum.USER && getAttachments(message).length > 0" class="message-attachments">
          <el-image
            v-for="(attachment, index) in getAttachments(message)"
            :key="`${message.id}-${attachment.url}`"
            :src="attachment.url"
            :alt="attachment.name"
            fit="cover"
            lazy
            class="attachment-image"
            @click="handleImageClick(message, index)"
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
        </div>
        <div class="message-card">
          <MarkdownRenderer v-if="message.content" :content="message.content" class="message-content" />
          <div v-else-if="message.isStreaming" class="typing-dots">
            <span />
            <span />
            <span />
          </div>
          <span v-else class="empty-content">...</span>
        </div>
        <div v-if="!message.isStreaming" class="message-actions">
          <el-button text size="small" @click="emit('copy', message)">
            <el-icon :size="15"><CopyDocument /></el-icon>
            {{ t('aiChat.copyMessage') }}
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
  width: min(860px, calc(100% - 32px));
  margin: 0 auto;
  padding: 24px 0 40px;
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
  gap: 6px;
  margin-bottom: 22px;
}

.message-meta {
  padding: 0 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.user-row {
  align-items: flex-end;
}

.assistant-row {
  align-items: flex-start;
}

.message-card {
  max-width: min(720px, 100%);
  padding: 12px 14px;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 6%);
}

.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: min(720px, 100%);
}

.user-row .message-attachments {
  justify-content: flex-end;
}

.attachment-image {
  width: 144px;
  height: 108px;
  border-radius: 10px;
  overflow: hidden;
  cursor: zoom-in;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.attachment-placeholder {
  width: 144px;
  height: 108px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  background: var(--el-fill-color-light);
}

.user-row .message-card {
  color: #fff;
  background: var(--el-color-primary);
  border-bottom-right-radius: 4px;
}

.assistant-row .message-card {
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-bottom-left-radius: 4px;
}

.message-content {
  line-height: 1.7;
  word-break: break-word;
}

.user-row .message-content :deep(*) {
  color: inherit;
}

.message-actions {
  display: flex;
  justify-content: flex-start;
  min-height: 24px;
}

.user-row .message-actions {
  justify-content: flex-end;
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
</style>
