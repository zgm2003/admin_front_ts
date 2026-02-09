<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { UploadFilled, Delete } from '@element-plus/icons-vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [val: string] }>()

const { t } = useI18n()

const isDragOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const hasContent = computed(() => !!props.modelValue)

/** 读取 .sig 文件文本内容 */
function readSigFile(file: File) {
  if (!file.name.endsWith('.sig')) {
    ElMessage.warning(t('tauriVersion.signature.onlySig'))
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = (e.target?.result as string)?.trim()
    if (text) emit('update:modelValue', text)
  }
  reader.readAsText(file)
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) readSigFile(file)
}

function onDragOver() { isDragOver.value = true }
function onDragLeave() { isDragOver.value = false }
function onClickUpload() { fileInputRef.value?.click() }

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) readSigFile(file)
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function onClear() { emit('update:modelValue', '') }
</script>

<template>
  <div class="signature-input">
    <!-- 拖拽/点击上传区域 -->
    <div
      v-if="!hasContent"
      class="signature-drop-zone"
      :class="{ 'is-dragover': isDragOver }"
      @drop.prevent="onDrop"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @click="onClickUpload"
    >
      <el-icon :size="32" class="drop-icon"><UploadFilled /></el-icon>
      <div class="drop-text">{{ t('tauriVersion.signature.dropHint') }}</div>
      <div class="drop-sub">{{ t('tauriVersion.signature.acceptTip') }}</div>
    </div>

    <!-- 已有内容：textarea + 操作按钮 -->
    <div v-else class="signature-content">
      <el-input
        :model-value="props.modelValue"
        @update:model-value="(v: string) => emit('update:modelValue', v)"
        type="textarea"
        :rows="4"
        :placeholder="t('tauriVersion.signature.placeholder')"
      />
      <div class="signature-actions">
        <el-button text size="small" @click="onClickUpload">{{ t('tauriVersion.signature.reUpload') }}</el-button>
        <el-button text size="small" type="danger" :icon="Delete" @click="onClear">{{ t('tauriVersion.signature.clear') }}</el-button>
      </div>
    </div>

    <!-- 无内容时：手动输入入口 -->
    <div v-if="!hasContent" class="signature-manual">
      <span class="manual-divider">{{ t('tauriVersion.signature.or') }}</span>
      <el-input
        :model-value="props.modelValue"
        @update:model-value="(v: string) => emit('update:modelValue', v)"
        type="textarea"
        :rows="3"
        :placeholder="t('tauriVersion.signature.placeholder')"
      />
    </div>

    <input ref="fileInputRef" type="file" accept=".sig" style="display: none" @change="onFileChange" />
  </div>
</template>

<style scoped>
.signature-input { width: 100%; }

.signature-drop-zone {
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--el-fill-color-lighter);
}
.signature-drop-zone:hover,
.signature-drop-zone.is-dragover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.drop-icon { color: var(--el-text-color-secondary); margin-bottom: 8px; }
.signature-drop-zone:hover .drop-icon,
.signature-drop-zone.is-dragover .drop-icon { color: var(--el-color-primary); }
.drop-text { font-size: 14px; color: var(--el-text-color-regular); }
.drop-sub { font-size: 12px; color: var(--el-text-color-placeholder); margin-top: 4px; }

.signature-content { width: 100%; }
.signature-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 4px;
}

.signature-manual { margin-top: 12px; }
.manual-divider {
  display: block;
  text-align: center;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 8px;
  position: relative;
}
.manual-divider::before,
.manual-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: calc(50% - 30px);
  height: 1px;
  background: var(--el-border-color-lighter);
}
.manual-divider::before { left: 0; }
.manual-divider::after { right: 0; }
</style>
