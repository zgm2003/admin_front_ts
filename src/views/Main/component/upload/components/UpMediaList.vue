<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElIcon } from 'element-plus'
import type { UploadFile, UploadUserFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { uploadFileToCloud, getUploadToken, validateFile } from '@/lib/upload'
import { useIsMobile } from '@/hooks/useResponsive'

const isMobile = useIsMobile()

interface MediaItem {
  name: string
  url: string
  uid: number
}

const props = withDefaults(defineProps<{
  modelValue?: MediaItem[]
  folderName?: string
  type?: 'image' | 'video'
}>(), {
  modelValue: () => [],
  folderName: 'images',
  type: 'image',
})
const emits = defineEmits<{
  'update:modelValue': [value: MediaItem[]]
}>()

const mediaList = ref<UploadUserFile[]>([...props.modelValue])
const loading = ref(false)

const acceptType = computed(() => props.type === 'video' ? 'video/*' : 'image/*')
const listType = computed(() => props.type === 'video' ? 'text' : 'picture-card')

watch(() => props.modelValue, (newValue: MediaItem[]) => { mediaList.value = [...newValue] })

const beforeUpload = async (file: File) => {
  loading.value = true
  try {
    const fileKind = props.type === 'video' ? 'file' : 'image'
    const config = await getUploadToken({ folderName: props.folderName, fileName: file.name, fileSize: file.size, fileKind })
    validateFile(file, config, props.type === 'video' ? 'file' : 'image')
    const result = await uploadFileToCloud(file, config)
    const uploadedMedia = { 
      name: file.name,
      url: result.url, 
      uid: Date.now()
    }
    mediaList.value.push(uploadedMedia)
    emits('update:modelValue', toMediaItems(mediaList.value))
  } catch {
    // 错误由 validateFile 或 uploadFileToCloud 内部处理
  } finally { 
    loading.value = false 
  }
  return false
}

const removeMedia = (file: UploadFile) => {
  mediaList.value = mediaList.value.filter((item) => item.uid !== file.uid)
  emits('update:modelValue', toMediaItems(mediaList.value))
}

const dialogUrl = ref('')
const dialogVisible = ref(false)
const handlePreview = (file: UploadFile) => {
  dialogUrl.value = file.url || ''
  dialogVisible.value = true 
}

function toMediaItems(values: UploadUserFile[]): MediaItem[] {
  return values.flatMap((item) => {
    if (!item.url || typeof item.uid !== 'number') {
      return []
    }
    return [{ name: item.name, url: item.url, uid: item.uid }]
  })
}
</script>

<template>
  <div>
    <el-upload 
      :before-upload="beforeUpload" 
      :on-remove="removeMedia" 
      :on-preview="handlePreview" 
      :accept="acceptType" 
      :list-type="listType" 
      v-model:file-list="mediaList" 
      v-loading="loading" 
      multiple
    >
      <el-icon><Plus /></el-icon>
    </el-upload>
    <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '600px'">
      <el-image v-if="type === 'image'" :src="dialogUrl" fit="contain" style="max-height: 70vh; width: 100%"/>
      <video v-else :src="dialogUrl" controls style="max-width: 100%; max-height: 70vh"/>
    </AppDialog>
  </div>
</template>

<style scoped>
</style>
