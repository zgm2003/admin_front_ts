<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { ElIcon, ElNotification } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { uploadFileToCloud, getUploadToken, validateFile } from '@/utils/cosUpload'

const props = defineProps({
  modelValue: { type: Array as any, default: () => [] },
  folderName: { type: String, default: 'avatars' },
})
const emits = defineEmits(['update:modelValue'])
const images = ref([...(props.modelValue as any[])])
const loading = ref(false)
watch(() => props.modelValue, (newValue: any[]) => { images.value = [...newValue] })
const beforeUpload = async (file: File) => {
  loading.value = true
  try {
    const config: any = await getUploadToken({ folderName: props.folderName })
    validateFile(file, config, 'image')
    const result: any = await uploadFileToCloud(file, config)
    const uploadedImage = { name: (file as any).name, url: result.url, uid: Date.now() + Math.random().toString(36).substr(2, 9) }
    images.value.push(uploadedImage as any)
    emits('update:modelValue', images.value as any)
  } catch (error: any) {
    // const msg = (error && error.response && (error.response.data?.message || error.response.data?.msg)) || error.message || '上传失败'
    // ElNotification.error({ message: msg })
  } finally { loading.value = false }
  return false
}
const removeImage = (file: any) => { images.value = images.value.filter((image: any) => image.uid !== file.uid); emits('update:modelValue', images.value as any) }
const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const handlePictureCardPreview = (file: any) => { dialogImageUrl.value = file.url; dialogVisible.value = true }
</script>

<template>
  <div>
    <el-upload :before-upload="beforeUpload" :on-remove="removeImage" :on-preview="handlePictureCardPreview" accept="image/*" list-type="picture-card" v-model:file-list="images" v-loading="loading" multiple>
      <el-icon><Plus /></el-icon>
    </el-upload>
    <el-dialog v-model="dialogVisible">
      <el-image :src="dialogImageUrl"></el-image>
    </el-dialog>
  </div>
  </template>

<style scoped>
</style>
