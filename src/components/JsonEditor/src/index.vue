<script setup lang="ts">
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { formatJsonEditorValue, parseJsonEditorValue, requireJsonParseErrorMessage } from './json'

const modelValue = defineModel<string>({ default: '' })
const { t } = useI18n()

const props = withDefaults(defineProps<{
  rows?: number
}>(), {
  rows: 6,
})

function notifyJsonParseError(error: unknown) {
  const message = requireJsonParseErrorMessage(error)
  ElNotification.error({ message: t('jsonEditor.invalidJson', { message }) })
}

const validate = (): boolean => {
  try {
    parseJsonEditorValue(modelValue.value)
    return true
  } catch (error: unknown) {
    notifyJsonParseError(error)
    return false
  }
}

const format = () => {
  try {
    modelValue.value = formatJsonEditorValue(modelValue.value)
    ElNotification.success({ message: t('jsonEditor.formatted') })
  } catch (error: unknown) {
    notifyJsonParseError(error)
  }
}

const onBlur = () => {
  try {
    modelValue.value = formatJsonEditorValue(modelValue.value)
  } catch {
    return
  }
}

defineExpose({ validate })
</script>

<template>
  <div class="json-editor">
    <el-input
      v-model="modelValue"
      type="textarea"
      :rows="props.rows"
      @blur="onBlur"
    />
    <div class="json-editor__actions">
      <el-button
        size="small"
        @click="format"
      >
        {{ t('jsonEditor.format') }}
      </el-button>
      <el-button
        size="small"
        @click="validate"
      >
        {{ t('jsonEditor.validate') }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.json-editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.json-editor__actions {
  display: flex;
  gap: 8px;
}
</style>
