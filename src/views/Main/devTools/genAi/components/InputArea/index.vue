<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Promotion } from '@element-plus/icons-vue'
import type { TemplateItem } from '../../composables/types'

const { t } = useI18n()

defineProps<{
  sending: boolean
  modelValue: string
  templates: TemplateItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [val: string]
  send: []
}>()

const handleKeydown = (e: KeyboardEvent | Event) => {
  const ke = e as KeyboardEvent
  if (ke.key === 'Enter' && !ke.shiftKey) {
    ke.preventDefault()
    emit('send')
  }
}

const onTemplateSelect = (prompt: string) => {
  emit('update:modelValue', prompt)
}
</script>

<template>
  <div class="input-area">
    <el-input
      :model-value="modelValue"
      @update:model-value="(v: string) => emit('update:modelValue', v)"
      type="textarea"
      :rows="3"
      :placeholder="sending ? t('aiCodeGen.inputPlaceholderSending') : t('aiCodeGen.inputPlaceholder')"
      :disabled="sending"
      resize="none"
      @keydown="handleKeydown"
    />
    <div class="input-actions">
      <el-dropdown trigger="click" :disabled="sending" @command="onTemplateSelect">
        <el-button :disabled="sending" size="default">
          {{ t('aiCodeGen.template.title') }}
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="tpl in templates" :key="tpl.key" :command="tpl.prompt">
              <span class="tpl-icon">{{ tpl.icon }}</span> {{ tpl.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button
        type="primary"
        :icon="Promotion"
        :loading="sending"
        :disabled="!modelValue.trim() || sending"
        @click="emit('send')"
      >
        {{ sending ? t('aiCodeGen.sending') : t('aiCodeGen.send') }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.input-area {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.input-area :deep(.el-textarea__inner) {
  border-radius: 10px;
  font-size: 14px;
  padding: 10px 14px;
}

.input-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.tpl-icon {
  margin-right: 4px;
}
</style>
