<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatLineSquare, Microphone, Paperclip, Setting } from '@element-plus/icons-vue'
import { DIcon } from '@/components/DIcon'
import { EmojiPicker } from '@/components/EmojiPicker'

defineProps<{
  showHistoryButton?: boolean
  supportsAttachments: boolean
  sending: boolean
  disabled?: boolean
  attachmentLimitReached: boolean
  recording: boolean
  hasRuntimeParams: boolean
  hasCustomParams: boolean
  paramsExpanded: boolean
}>()
const emit = defineEmits<{
  openHistory: []
  addAttachment: []
  toggleVoice: []
  selectEmoji: [emoji: string]
  toggleParams: []
}>()

const { t } = useI18n()
const showEmojiPicker = ref(false)

function handleEmojiSelect(emoji: string) {
  emit('selectEmoji', emoji)
  showEmojiPicker.value = false
}
</script>

<template>
  <div class="toolbar-left">
    <el-button
      v-if="showHistoryButton"
      text
      class="toolbar-btn"
      :disabled="disabled"
      :title="t('aiChat.historyConversations')"
      :aria-label="t('aiChat.historyConversations')"
      @click="emit('openHistory')"
    >
      <el-icon :size="18">
        <ChatLineSquare />
      </el-icon>
    </el-button>
    <el-button
      v-if="supportsAttachments"
      text
      class="toolbar-btn"
      :disabled="sending || disabled || attachmentLimitReached || recording"
      :title="t('aiChat.addAttachment')"
      :aria-label="t('aiChat.addAttachment')"
      @click="emit('addAttachment')"
    >
      <el-icon :size="18">
        <Paperclip />
      </el-icon>
    </el-button>
    <el-button
      text
      class="toolbar-btn voice-btn"
      :class="{ 'is-recording': recording }"
      :disabled="sending || disabled"
      :title="t('aiChat.voiceInput')"
      :aria-label="t('aiChat.voiceInput')"
      :aria-pressed="recording"
      @click="emit('toggleVoice')"
    >
      <el-icon :size="18">
        <Microphone />
      </el-icon>
    </el-button>
    <el-popover
      v-model:visible="showEmojiPicker"
      placement="top-start"
      :width="320"
      trigger="click"
      :show-arrow="false"
      popper-class="emoji-popover"
    >
      <template #reference>
        <el-button
          text
          class="toolbar-btn"
          :disabled="sending || disabled || recording"
          :title="t('aiChat.insertEmoji')"
          :aria-label="t('aiChat.insertEmoji')"
        >
          <DIcon
            icon="fluent-emoji:grinning-face"
            :size="18"
          />
        </el-button>
      </template>
      <EmojiPicker @select="handleEmojiSelect" />
    </el-popover>
    <el-button
      v-if="hasRuntimeParams"
      text
      class="toolbar-btn"
      :class="{ 'params-active': hasCustomParams }"
      :disabled="sending || disabled"
      :title="t('aiChat.runtimeParams')"
      :aria-label="t('aiChat.runtimeParams')"
      :aria-expanded="paramsExpanded"
      aria-controls="ai-chat-runtime-params"
      @click="emit('toggleParams')"
    >
      <el-icon :size="18">
        <Setting />
      </el-icon>
    </el-button>
  </div>
</template>

<style scoped>
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-left :deep(.el-button + .el-button) {
  margin-left: 0;
}

.toolbar-btn {
  width: 36px;
  min-width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: 8px;
  color: var(--el-text-color-secondary);
}

.toolbar-btn:hover,
.toolbar-btn:focus-visible {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.voice-btn.is-recording {
  color: #fff !important;
  background: #16a46c !important;
  animation: voice-pulse 1.5s ease-in-out infinite;
}

.params-active {
  color: var(--el-color-primary) !important;
  background: var(--el-color-primary-light-9) !important;
}

:global(.emoji-popover) {
  padding: 0 !important;
  border: 0 !important;
  box-shadow: 0 12px 32px rgb(15 23 42 / 14%) !important;
}

@keyframes voice-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgb(22 164 108 / 45%); }
  50% { box-shadow: 0 0 0 8px rgb(22 164 108 / 0%); }
}

@media (prefers-reduced-motion: reduce) {
  .voice-btn.is-recording {
    animation: none;
  }
}

@media (max-width: 768px) {
  .toolbar-left {
    gap: 0;
  }

  .toolbar-btn {
    width: 40px;
    min-width: 40px;
    height: 40px;
    min-height: 40px;
  }
}
</style>
