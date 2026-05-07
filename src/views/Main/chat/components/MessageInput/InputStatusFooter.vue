<script setup lang="ts">
import { Promotion, Microphone } from '@element-plus/icons-vue'

const props = defineProps<{
  isRecording: boolean
  uploading: boolean
  disabled: boolean
  isMobile: boolean
}>()

const emit = defineEmits<{
  send: []
}>()
</script>

<template>
  <div
    class="input-footer"
    :class="{ 'is-mobile': props.isMobile }"
  >
    <span
      v-if="props.isRecording"
      class="recording-status"
    >
      <el-icon
        class="recording-icon"
        :size="14"
      >
        <Microphone />
      </el-icon>
      正在识别语音，点击停止
    </span>
    <span
      v-else-if="props.uploading"
      class="upload-status"
    >
      <el-icon
        class="is-loading"
        :size="14"
      >
        <Promotion />
      </el-icon>
      上传中...
    </span>
    <span
      v-else
      class="input-hint"
    >
      Enter 发送 / Shift+Enter 换行
    </span>
    <el-button
      type="primary"
      size="small"
      :disabled="props.disabled"
      @click="emit('send')"
    >
      发送(S)
    </el-button>
  </div>
</template>

<style scoped>
.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 12px 8px;
}

.input-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.input-footer.is-mobile .input-hint {
  display: none;
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
}

.recording-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #07c160;
}

.recording-icon {
  animation: recording-blink 1s ease-in-out infinite;
}

@keyframes recording-blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
