<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import { MessageType } from '@/api/chat'
import { downloadFile } from '@/components/DownloadManager'
import { formatFileSize } from '@/utils/format'

interface MessageBubbleDisplayItem {
  messageType: MessageType
  content: string
  fileName: string
  fileSize: number | undefined
}

defineProps<{
  item: MessageBubbleDisplayItem
}>()
</script>

<template>
  <span
    v-if="item.messageType === MessageType.Text"
    class="msg-text"
  >
    {{ item.content }}
  </span>

  <span
    v-else-if="item.messageType === MessageType.Image"
    class="msg-image-wrapper"
  >
    <el-image
      :src="item.content"
      fit="contain"
      class="msg-image"
      :preview-src-list="[item.content]"
      preview-teleported
    />
  </span>

  <span
    v-else-if="item.messageType === MessageType.File"
    class="msg-file-bubble"
  >
    <span class="file-info">
      <span class="file-name">{{ item.fileName }}</span>
      <span class="file-size">{{ formatFileSize(item.fileSize) }}</span>
    </span>
    <button
      class="file-download"
      @click="downloadFile(item.content, item.fileName)"
    >
      <el-icon :size="16">
        <Download />
      </el-icon>
    </button>
  </span>

  <span
    v-else
    class="msg-text"
  >
    暂不支持的消息类型
  </span>
</template>

<style scoped>
.msg-text {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.msg-image-wrapper {
  display: block;
  max-width: 280px;
  overflow: hidden;
  border-radius: 8px;
}

.msg-image {
  display: block;
  width: auto;
  max-width: 100%;
  height: auto;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
}

.msg-file-bubble {
  display: flex;
  align-items: center;
  min-width: 180px;
  gap: 12px;
}

.file-info {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.file-download {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  cursor: pointer;
  transition: background 0.15s;
}

.file-download:hover {
  background: var(--el-color-primary-light-7);
}

@media (width <= 768px) {
  .msg-image-wrapper {
    max-width: 220px;
  }

  .msg-image {
    max-height: 250px;
  }
}
</style>
