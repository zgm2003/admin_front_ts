<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { ElIcon, ElNotification, ElPopover } from 'element-plus'
import { Plus, CircleCloseFilled } from '@element-plus/icons-vue'
import { uploadFileToCloud, getUploadToken } from '@/utils/cosUpload'

const props = defineProps({
  modelValue: { type: String, default: '' },
  folderName: { type: String, default: 'videos' },
  width: { type: String, default: '100px' },
  isClearable: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])
const videoUrl = ref(props.modelValue)
const loading = ref(false)
watch(() => props.modelValue, (newValue) => { videoUrl.value = newValue })
const beforeUpload = async (file: File) => {
  loading.value = true
  try {
    const config: any = await getUploadToken({ folderName: props.folderName })
    const result: any = await uploadFileToCloud(file, config)
    videoUrl.value = result.url
    emit('update:modelValue', result.url)
  } catch (error: any) {
    // const msg = (error && error.response && (error.response.data?.message || error.response.data?.msg)) || error.message || '上传失败'
    // ElNotification.error({ message: msg })
  } finally { loading.value = false }
  return false
}
const clear = () => { videoUrl.value = ''; emit('update:modelValue', '') }
</script>

<template>
  <div class="video-uploader-wrapper" v-loading="loading" :style="{ width: width, height: width }">
    <el-upload class="video-uploader" :before-upload="beforeUpload" accept="video/*" :show-file-list="false">
      <el-icon v-if="!videoUrl" class="video-uploader-icon"><Plus /></el-icon>
      <el-popover placement="right-start" width="300" trigger="hover" v-if="videoUrl">
        <template #reference>
          <video :src="videoUrl" controls style="width: 100%; height: auto;"></video>
        </template>
        <video :src="videoUrl" controls style="width: 100%; height: auto;"></video>
      </el-popover>
    </el-upload>
    <el-icon class="clear-icon" @click="clear" v-if="isClearable && videoUrl"><CircleCloseFilled /></el-icon>
  </div>
  </template>

<style scoped>
.video-uploader-wrapper { display: flex; align-items: center; justify-content: center; border-radius: 10px; border: 1px dashed grey; position: relative; overflow: hidden }
.video-uploader-icon { font-size: 40px; color: rgb(64, 158, 255); display: flex; align-items: center; justify-content: center; height: 100% }
.clear-icon { position: absolute; color: #f56c6c; right: 0; top: 0; cursor: pointer }
.video-uploader-wrapper:hover { border: 1px dashed rgb(64, 158, 255); cursor: pointer }
</style>
