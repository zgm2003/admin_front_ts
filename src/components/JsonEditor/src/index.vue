<script setup lang="ts">
import { ElNotification } from 'element-plus'

const modelValue = defineModel<string>({ default: '' })

defineProps<{
  rows?: number
}>()

const validate = (): boolean => {
  try {
    JSON.parse(modelValue.value || '{}')
    return true
  } catch (e: any) {
    ElNotification.error({ message: `JSON 格式错误：${e?.message || ''}` })
    return false
  }
}

const format = () => {
  try {
    const obj = JSON.parse(modelValue.value || '{}')
    modelValue.value = JSON.stringify(obj, null, 2)
    ElNotification.success({ message: '已格式化 JSON' })
  } catch (e: any) {
    ElNotification.error({ message: `JSON 格式错误：${e?.message || ''}` })
  }
}

const onBlur = () => {
  try {
    const obj = JSON.parse(modelValue.value || '{}')
    modelValue.value = JSON.stringify(obj, null, 2)
  } catch {
    // 格式错误时不处理
  }
}

defineExpose({ validate })
</script>

<template>
  <div class="json-editor">
    <el-input type="textarea" v-model="modelValue" :rows="rows ?? 6" @blur="onBlur" />
    <div class="json-editor__actions">
      <el-button size="small" @click="format">格式化</el-button>
      <el-button size="small" @click="validate">校验</el-button>
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
