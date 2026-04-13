<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElIcon } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { uploadFileToCloud, getUploadToken, validateFile } from '@/utils/cosUpload'
import { useIsMobile } from '@/hooks/useResponsive'

const isMobile = useIsMobile()

const props = defineProps({
  modelValue: { type: Array as any, default: () => [] },
  folderName: { type: String, default: 'images' },
  type: { type: String as () => 'image' | 'video', default: 'image' },
})
const emits = defineEmits(['update:modelValue'])

const mediaList = ref([...(props.modelValue as any[])])
const loading = ref(false)

const acceptType = computed(() => props.type === 'video' ? 'video/*' : 'image/*')
const listType = computed(() => props.type === 'video' ? 'text' : 'picture-card')

watch(() => props.modelValue, (newValue: any[]) => { mediaList.value = [...newValue] })

const beforeUpload = async (file: File) => {
  loading.value = true
  try {
    const config: any = await getUploadToken({ folderName: props.folderName })
    validateFile(file, config, props.type === 'video' ? 'file' : 'image')
    const result: any = await uploadFileToCloud(file, config)
    const uploadedMedia = { 
      name: (file as any).name, 
      url: result.url, 
      uid: Date.now() + Math.random().toString(36).substr(2, 9) 
    }
    mediaList.value.push(uploadedMedia as any)
    emits('update:modelValue', mediaList.value as any)
  } catch (error: any) {
    // 错误由 validateFile 或 uploadFileToCloud 内部处理
  } finally { 
    loading.value = false 
  }
  return false
}

const removeMedia = (file: any) => { 
  mediaList.value = mediaList.value.filter((item: any) => item.uid !== file.uid)
  emits('update:modelValue', mediaList.value as any) 
}

const dialogUrl = ref('')
const dialogVisible = ref(false)
const handlePreview = (file: any) => { 
  dialogUrl.value = file.url
  dialogVisible.value = true 
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
