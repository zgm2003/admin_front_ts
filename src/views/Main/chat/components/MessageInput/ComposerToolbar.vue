<script setup lang="ts">
import { Picture, FolderOpened, Microphone } from '@element-plus/icons-vue'
import { DIcon } from '@/components/DIcon'
import { EmojiPicker } from '@/components/EmojiPicker'

const props = defineProps<{
  uploading: boolean
  isRecording: boolean
  emojiPickerVisible: boolean
}>()

const emit = defineEmits<{
  'pick-image': []
  'pick-file': []
  'toggle-voice': []
  'emoji-select': [emoji: string]
  'update:emojiPickerVisible': [visible: boolean]
}>()

function handleEmojiVisibleChange(visible: boolean) {
  emit('update:emojiPickerVisible', visible)
}

function handleEmojiSelect(emoji: string) {
  emit('emoji-select', emoji)
}
</script>

<template>
  <div class="input-toolbar">
    <div class="toolbar-left">
      <el-button
        text
        class="toolbar-btn"
        :disabled="props.uploading || props.isRecording"
        title="发送图片"
        @click="emit('pick-image')"
      >
        <el-icon :size="18">
          <Picture />
        </el-icon>
      </el-button>
      <el-button
        text
        class="toolbar-btn"
        :disabled="props.uploading || props.isRecording"
        title="发送文件"
        @click="emit('pick-file')"
      >
        <el-icon :size="18">
          <FolderOpened />
        </el-icon>
      </el-button>
      <el-button
        text
        class="toolbar-btn voice-btn"
        :class="{ 'is-recording': props.isRecording }"
        :disabled="props.uploading"
        title="语音转文字"
        @click="emit('toggle-voice')"
      >
        <el-icon :size="18">
          <Microphone />
        </el-icon>
      </el-button>
      <el-popover
        :visible="props.emojiPickerVisible"
        placement="top-start"
        :width="320"
        trigger="click"
        :show-arrow="false"
        popper-class="emoji-popover"
        @update:visible="handleEmojiVisibleChange"
      >
        <template #reference>
          <el-button
            text
            class="toolbar-btn"
            :disabled="props.uploading || props.isRecording"
            title="插入表情"
          >
            <DIcon
              icon="fluent-emoji:grinning-face"
              :size="18"
            />
          </el-button>
        </template>
        <EmojiPicker @select="handleEmojiSelect" />
      </el-popover>
    </div>
  </div>
</template>

<style scoped>
.input-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.voice-btn.is-recording {
  color: #fff !important;
  background: #07c160 !important;
  animation: voice-pulse 1.5s ease-in-out infinite;
}

@keyframes voice-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(7, 193, 96, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(7, 193, 96, 0);
  }
}

:global(.emoji-popover) {
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
}
</style>
