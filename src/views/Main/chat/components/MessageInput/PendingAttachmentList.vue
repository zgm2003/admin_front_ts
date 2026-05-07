<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { formatFileSize } from '@/utils/format'
import type { PendingAttachment } from './useChatPendingAttachments'

const props = defineProps<{
  attachments: readonly PendingAttachment[]
  isMobile: boolean
}>()

const emit = defineEmits<{
  remove: [id: string]
}>()
</script>

<template>
  <div
    class="pending-area"
    :class="{ 'is-mobile': props.isMobile }"
  >
    <div
      v-for="attachment in props.attachments"
      :key="attachment.id"
      class="pending-item"
      :class="attachment.type === 'image' ? 'pending-image' : 'pending-file'"
    >
      <img
        v-if="attachment.type === 'image'"
        :src="attachment.previewUrl"
        class="pending-thumb"
      >
      <div
        v-else
        class="pending-file-info"
      >
        <span class="pending-file-name">{{ attachment.file.name }}</span>
        <span class="pending-file-size">{{ formatFileSize(attachment.file.size) }}</span>
      </div>
      <el-button
        circle
        size="small"
        type="danger"
        class="pending-remove"
        @click="emit('remove', attachment.id)"
      >
        <el-icon :size="12">
          <Close />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<style scoped>
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

.pending-area.is-mobile .pending-thumb {
  width: 48px;
  height: 48px;
}

.pending-area.is-mobile .pending-file {
  max-width: 160px;
}
</style>
