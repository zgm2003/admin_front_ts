<script setup lang="ts">
import { computed, nextTick, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loading, Promotion } from '@element-plus/icons-vue'

const { t } = useI18n()

const props = defineProps<{
  sending: boolean
  disabled?: boolean
  isStreaming?: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const inputText = shallowRef('')
const textareaRef = shallowRef<HTMLTextAreaElement | null>(null)

const canSend = computed(() => inputText.value.trim().length > 0 && !props.sending && !props.disabled)

function adjustHeight() {
  const textarea = textareaRef.value
  if (!textarea) return
  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
}

function handleInput() {
  nextTick(adjustHeight)
}

function submit() {
  const content = inputText.value.trim()
  if (!content || !canSend.value) return
  emit('send', content)
}

function clear() {
  inputText.value = ''
  nextTick(adjustHeight)
}

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ clear, focus })
</script>

<template>
  <footer class="message-input-wrap">
    <div class="message-input-box" :class="{ disabled }">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="message-textarea"
        :placeholder="disabled ? t('aiChat.selectAgentFirst') : t('aiChat.inputPlaceholder')"
        :disabled="disabled"
        rows="1"
        @input="handleInput"
        @keydown.enter.exact.prevent="submit"
      />
      <el-button class="send-btn" type="primary" circle :disabled="!canSend" @click="submit">
        <el-icon v-if="sending" class="is-loading" :size="18"><Loading /></el-icon>
        <el-icon v-else :size="18"><Promotion /></el-icon>
      </el-button>
    </div>
    <div class="input-hint">{{ t('aiChat.inputHint') }}</div>
  </footer>
</template>

<style scoped>
.message-input-wrap {
  padding: 14px 20px 18px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

.message-input-box {
  max-width: 860px;
  min-height: 52px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px 10px 10px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 16px;
  background: var(--el-bg-color);
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.message-input-box:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}

.message-input-box.disabled {
  background: var(--el-fill-color-lighter);
}

.message-textarea {
  flex: 1;
  max-height: 180px;
  min-height: 28px;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--el-text-color-primary);
  font: inherit;
  line-height: 1.6;
}

.message-textarea::placeholder {
  color: var(--el-text-color-placeholder);
}

.send-btn {
  flex: none;
}

.input-hint {
  max-width: 860px;
  margin: 7px auto 0;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  text-align: right;
}
</style>
