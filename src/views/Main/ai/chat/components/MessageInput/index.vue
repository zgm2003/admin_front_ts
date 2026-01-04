<script setup lang="ts">
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()

const props = defineProps<{
  sending: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
}>()

const inputText = ref('')

// 发送消息
const handleSend = () => {
  if (props.sending || props.disabled) return
  const content = inputText.value.trim()
  if (!content) return
  emit('send', content)
  // 不在这里清空，由父组件成功后调用 clear()
}

// 键盘事件：Enter 发送，Shift+Enter 换行
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

// 暴露清空方法
defineExpose({
  clear: () => { inputText.value = '' }
})
</script>

<template>
  <div class="input-area">
    <el-input
        v-model="inputText"
        type="textarea"
        :rows="2"
        :placeholder="disabled ? '暂无可用智能体' : t('aiChat.inputPlaceholder')"
        :disabled="sending || disabled"
        @keydown="handleKeydown"
        resize="none"
    />
    <el-button
        type="primary"
        :loading="sending"
        :disabled="!inputText.trim()"
        @click="handleSend"
        class="send-btn"
    >
      {{ t('aiChat.send') }}
    </el-button>
  </div>
</template>

<style scoped>
.input-area {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-light);
  display: flex;
  gap: 12px;
  background: var(--el-bg-color);
}

.input-area :deep(.el-textarea__inner) {
  resize: none;
}

.send-btn {
  align-self: flex-end;
}
</style>
