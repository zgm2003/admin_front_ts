<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {Promotion} from '@element-plus/icons-vue'

const {t} = useI18n()

const props = defineProps<{
  sending: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

// 自动调整高度
const adjustHeight = () => {
  const textarea = textareaRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
  }
}

// 发送消息
const handleSend = () => {
  if (props.sending || props.disabled) return
  const content = inputText.value.trim()
  if (!content) return
  emit('send', content)
}

// 键盘事件：Enter 发送，Shift+Enter 换行
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 处理输入
const handleInput = (e: Event) => {
  inputText.value = (e.target as HTMLTextAreaElement).value
  adjustHeight()
}

// 暴露清空方法
defineExpose({
  clear: () => {
    inputText.value = ''
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  }
})
</script>

<template>
  <div class="input-wrapper">
    <div class="input-container" :class="{disabled: disabled, focused: false}">
      <textarea
          ref="textareaRef"
          :value="inputText"
          @input="handleInput"
          @keydown="handleKeydown"
          :placeholder="disabled ? '请先选择智能体' : t('aiChat.inputPlaceholder')"
          :disabled="sending || disabled"
          rows="1"
          class="chat-textarea"
      />
      <button
          class="send-button"
          :class="{active: inputText.trim() && !sending}"
          :disabled="!inputText.trim() || sending || disabled"
          @click="handleSend"
      >
        <el-icon v-if="!sending" :size="20"><Promotion/></el-icon>
        <el-icon v-else class="is-loading" :size="20"><Promotion/></el-icon>
      </button>
    </div>
    <div class="input-hint">
      <span>Enter 发送，Shift + Enter 换行</span>
    </div>
  </div>
</template>

<style scoped>
.input-wrapper {
  padding: 16px 24px 24px;
  background: var(--el-bg-color);
}

.input-container {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-light);
  border-radius: 16px;
  transition: all 0.2s ease;
  max-width: 800px;
  margin: 0 auto;
}

.input-container:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8);
}

.input-container.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-textarea {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  min-height: 24px;
  max-height: 200px;
  font-family: inherit;
}

.chat-textarea::placeholder {
  color: var(--el-text-color-placeholder);
}

.chat-textarea:disabled {
  cursor: not-allowed;
}

.send-button {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.send-button.active {
  background: var(--el-color-primary);
  color: #fff;
}

.send-button.active:hover {
  background: var(--el-color-primary-dark-2);
}

.send-button:disabled {
  cursor: not-allowed;
}

.input-hint {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

@media (max-width: 768px) {
  .input-wrapper {
    padding: 12px 16px 16px;
  }
  
  .input-container {
    border-radius: 12px;
    padding: 10px 12px;
  }
  
  .input-hint {
    display: none;
  }
}
</style>
