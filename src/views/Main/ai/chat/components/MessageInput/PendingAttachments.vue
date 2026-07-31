<script setup lang="ts">
import { Close, Document, Loading, RefreshRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { PendingAttachment } from './use-attachments'

defineProps<{
  attachments: readonly PendingAttachment[]
  blockingMessage?: string
}>()
const emit = defineEmits<{
  remove: [id: string]
  retry: [id: string]
}>()
const { t } = useI18n()

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="pending-wrap">
    <div class="pending-area">
      <div
        v-for="attachment in attachments"
        :key="attachment.id"
        class="pending-item"
        :class="[
          `pending-item--${attachment.kind}`,
          { 'is-failed': attachment.status === 'failed' },
        ]"
        :data-attachment-kind="attachment.kind"
      >
        <img
          v-if="attachment.kind === 'image' && attachment.preview"
          :src="attachment.preview"
          :alt="attachment.name"
          class="pending-thumb"
        >
        <template v-else>
          <el-icon class="pending-file-icon" :size="22"><Document /></el-icon>
          <span class="pending-file-copy">
            <span class="pending-file-name" :title="attachment.name">{{ attachment.name }}</span>
            <span class="pending-file-size">{{ formatBytes(attachment.size) }}</span>
          </span>
        </template>

        <div
          v-if="attachment.status === 'queued' || attachment.status === 'uploading' || attachment.status === 'retrying'"
          class="pending-overlay"
          :class="{ 'pending-overlay--file': attachment.kind === 'file' }"
          role="status"
          :aria-label="t('aiChat.attachmentUploading')"
        >
          <el-icon class="is-loading" :size="18"><Loading /></el-icon>
        </div>

        <div
          v-if="attachment.status === 'failed'"
          class="pending-error"
          :title="attachment.error || t('aiChat.uploadFailed')"
        >
          {{ attachment.error || t('aiChat.uploadFailed') }}
        </div>

        <el-tooltip :content="t('aiChat.removeAttachment')" placement="top" :show-after="300">
          <button
            type="button"
            class="pending-action pending-remove"
            :aria-label="t('aiChat.removeAttachment')"
            @click="emit('remove', attachment.id)"
          >
            <el-icon :size="12"><Close /></el-icon>
          </button>
        </el-tooltip>

        <el-tooltip
          v-if="attachment.status === 'failed'"
          :content="t('aiChat.retryAttachment')"
          placement="top"
          :show-after="300"
        >
          <button
            type="button"
            class="pending-action pending-retry"
            data-testid="attachment-retry"
            :aria-label="t('aiChat.retryAttachment')"
            @click="emit('retry', attachment.id)"
          >
            <el-icon :size="13"><RefreshRight /></el-icon>
          </button>
        </el-tooltip>
      </div>
    </div>
    <p v-if="blockingMessage" class="pending-blocking" role="alert">
      {{ blockingMessage }}
    </p>
  </div>
</template>

<style scoped src="./pending-attachments.css"></style>
