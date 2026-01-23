<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElNotification } from 'element-plus'
import { UploadFilled, Loading, Document } from '@element-plus/icons-vue'
import { getUploadToken, uploadFileToCloud, type UploadConfig } from '@/utils/cosUpload'
import { useIsMobile } from '@/hooks/useResponsive'

const props = withDefaults(defineProps<{
  modelValue?: string
  folderName: string
  accept?: string
  disabled?: boolean
  tip?: string
}>(), {
  modelValue: '',
  accept: '*',
  disabled: false,
  tip: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'success': [data: { url: string; size: number; name: string }]
}>()

const isMobile = useIsMobile()
const uploading = ref(false)
const fileName = ref('')

const displayUrl = computed(() => props.modelValue)

const handleUpload = async (options: any) => {
  const file = options.file as File
  if (!file) return

  uploading.value = true
  fileName.value = file.name

  try {
    const config: UploadConfig = await getUploadToken({ folderName: props.folderName })
    const { url } = await uploadFileToCloud(file, config)
    emit('update:modelValue', url)
    emit('success', { url, size: file.size, name: file.name })
    ElNotification.success({ message: '上传成功' })
  } catch (e: any) {
    ElNotification.error({ message: e.message || '上传失败' })
  } finally {
    uploading.value = false
  }
}

const clearFile = () => {
  emit('update:modelValue', '')
  fileName.value = ''
}
</script>

<template>
  <div class="up-file" :class="{ 'is-mobile': isMobile }">
    <el-upload
      drag
      :auto-upload="true"
      :show-file-list="false"
      :http-request="handleUpload"
      :accept="accept"
      :disabled="disabled || uploading"
    >
      <div v-if="uploading" class="uploading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>上传中...</span>
      </div>
      <div v-else-if="displayUrl" class="uploaded">
        <el-icon><Document /></el-icon>
        <span class="file-name">{{ fileName || '已上传文件' }}</span>
        <el-button type="danger" text size="small" @click.stop="clearFile">删除</el-button>
      </div>
      <div v-else class="placeholder">
        <el-icon class="upload-icon"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          <template v-if="isMobile">点击上传文件</template>
          <template v-else>拖拽文件到此处或 <em>点击上传</em></template>
        </div>
        <div v-if="tip" class="el-upload__tip">{{ tip }}</div>
      </div>
    </el-upload>
  </div>
</template>

<style scoped>
.up-file { width: 100%; }
.up-file :deep(.el-upload) { width: 100%; }
.up-file :deep(.el-upload-dragger) { width: 100%; padding: 20px; }
.uploading, .uploaded, .placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.upload-icon { font-size: 40px; color: var(--el-text-color-placeholder); }
.uploaded { color: var(--el-color-success); }
.file-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.el-upload__tip { font-size: 12px; color: var(--el-text-color-secondary); }

/* 移动端适配 */
.is-mobile :deep(.el-upload-dragger) { padding: 16px 12px; }
.is-mobile .upload-icon { font-size: 32px; }
.is-mobile .file-name { max-width: 150px; font-size: 13px; }
.is-mobile .el-upload__tip { font-size: 11px; }
</style>
