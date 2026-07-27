<script setup lang="ts">
import { Close, Delete } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const props = withDefaults(defineProps<{
  count: number
  busy?: boolean
  disabled?: boolean
}>(), {
  busy: false,
  disabled: false,
})

const emit = defineEmits<{
  cancel: []
  delete: []
}>()
</script>

<template>
  <div
    class="message-selection-bar"
    role="toolbar"
    :aria-label="t('aiChat.deleteMessage')"
  >
    <span
      class="selection-count"
      aria-live="polite"
    >{{ t('aiChat.selectedMessages', { count: props.count }) }}</span>
    <el-button
      text
      class="selection-icon-button"
      :disabled="busy"
      :aria-label="t('common.actions.cancel')"
      @click="emit('cancel')"
    >
      <el-icon :size="17">
        <Close />
      </el-icon>
    </el-button>
    <el-button
      type="danger"
      class="selection-delete-button"
      :loading="busy"
      :disabled="disabled || count === 0"
      @click="emit('delete')"
    >
      <el-icon :size="16">
        <Delete />
      </el-icon>
      <span>{{ t('aiChat.deleteMessage') }}</span>
    </el-button>
  </div>
</template>

<style scoped>
.message-selection-bar {
  position: absolute;
  z-index: 12;
  bottom: 92px;
  left: 50%;
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px 7px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
  transform: translateX(-50%);
}

.selection-count {
  min-width: 72px;
  color: var(--el-text-color-regular);
  font-size: 13px;
  white-space: nowrap;
}

.selection-icon-button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  padding: 0;
}

.selection-delete-button {
  min-height: 32px;
  padding: 0 11px;
}

@media (max-width: 768px) {
  .message-selection-bar {
    bottom: 82px;
    max-width: calc(100% - 24px);
  }
}
</style>
