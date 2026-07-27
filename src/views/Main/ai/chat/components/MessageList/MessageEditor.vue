<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Close, Select } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { Message } from '../../composables/types'

const { t } = useI18n()
const props = withDefaults(defineProps<{
  message: Message
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  submit: [content: string]
  cancel: []
}>()

const content = ref(props.message.content)
const attachments = computed(() => props.message.meta_json?.attachments ?? [])
const canSubmit = computed(() => (
  !props.disabled
  && /\S/.test(content.value)
  && content.value !== props.message.content
))

watch(() => props.message.id, () => {
  content.value = props.message.content
})

function submit() {
  if (!canSubmit.value) return
  emit('submit', content.value)
}
</script>

<template>
  <div class="message-editor">
    <textarea
      v-model="content"
      class="message-editor-input"
      :disabled="disabled"
      :aria-label="t('aiChat.editMessage')"
      rows="3"
      @keydown.ctrl.enter.prevent="submit"
      @keydown.meta.enter.prevent="submit"
      @keydown.esc="emit('cancel')"
    />

    <div
      v-if="attachments.length > 0"
      class="message-editor-attachments"
      aria-readonly="true"
    >
      <div
        v-for="attachment in attachments"
        :key="attachment.url"
        class="message-editor-attachment"
      >
        <el-image
          :src="attachment.url"
          :alt="attachment.name"
          fit="cover"
          class="message-editor-thumbnail"
        />
        <span>{{ attachment.name }}</span>
      </div>
    </div>

    <div class="message-editor-actions">
      <el-button
        text
        class="editor-button"
      :aria-label="t('common.actions.cancel')"
      @click="emit('cancel')"
    >
        <el-icon :size="16">
          <Close />
        </el-icon>
      </el-button>
      <el-button
        type="primary"
        class="editor-submit"
        :disabled="!canSubmit"
      :aria-label="t('aiChat.editSubmit')"
      @click="submit"
    >
        <el-icon :size="16">
          <Select />
        </el-icon>
        <span>{{ t('aiChat.editSubmit') }}</span>
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.message-editor {
  width: min(560px, 100%);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.message-editor-input {
  width: 100%;
  min-height: 84px;
  resize: vertical;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 7px;
  outline: none;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.message-editor-input:focus-visible {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}

.message-editor-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.message-editor-attachment {
  min-width: 0;
  max-width: 220px;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.message-editor-attachment span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-editor-thumbnail {
  width: 34px;
  min-width: 34px;
  height: 34px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 5px;
}

.message-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.editor-button {
  width: 30px;
  min-width: 30px;
  height: 30px;
  padding: 0;
}

.editor-submit {
  min-height: 30px;
  padding: 0 10px;
}
</style>
