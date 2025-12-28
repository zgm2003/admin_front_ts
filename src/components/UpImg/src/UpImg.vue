<script setup lang="ts">
import {ref, watch} from 'vue'
import {ElNotification} from 'element-plus'
import {Plus, CircleCloseFilled} from '@element-plus/icons-vue'
import {getUploadToken, uploadFileToCloud, validateFile} from '@/utils/cosUpload'

const props = defineProps({
  modelValue: {type: String, default: ''},
  folderName: {type: String, default: 'avatars'},
  width: {type: String, default: '100px'},
  isClearable: {type: Boolean, default: true}
})
const emit = defineEmits(['update:modelValue'])
const imageUrl = ref(props.modelValue)
const loading = ref(false)
watch(() => props.modelValue, (v) => {
  imageUrl.value = v
})
const beforeUpload = async (file: File) => {
  loading.value = true
  try {
    const config: any = await getUploadToken({folderName: props.folderName})
    validateFile(file, config, 'image')
    const result: any = await uploadFileToCloud(file, config)
    console.log('abc:',result)
    imageUrl.value = result.url
    emit('update:modelValue', result.url)
  } catch (error: any) {
    // const msg = (error && error.response && (error.response.data?.message || error.response.data?.msg)) || error.message || '上传失败'
    // ElNotification.error({ message: msg })
  } finally {
    loading.value = false
  }
  return false
}
const clear = () => {
  imageUrl.value = '';
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="avatar-uploader-wrapper" v-loading="loading" :style="{ width: width, height: width }">
    <el-upload class="avatar-uploader" :before-upload="beforeUpload" accept="image/*" :show-file-list="false">
      <el-icon v-if="!imageUrl" class="avatar-uploader-icon">
        <Plus/>
      </el-icon>
      <el-popover placement="right-start" width="250" trigger="hover" v-if="imageUrl">
        <template #reference>
          <el-image :src="imageUrl" fit="fill"/>
        </template>
        <el-image :src="imageUrl"/>
      </el-popover>
    </el-upload>
    <el-icon class="clear-icon" @click="clear" v-if="isClearable && imageUrl">
      <CircleCloseFilled/>
    </el-icon>
  </div>
</template>

<style scoped>
.avatar-uploader-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px dashed grey;
  position: relative;
  overflow: hidden
}

.avatar-uploader-wrapper .avatar-uploader-icon {
  font-size: 40px;
  color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%
}

.avatar-uploader-wrapper .clear-icon {
  position: absolute;
  color: #f56c6c;
  right: 0;
  top: 0;
  cursor: pointer
}

.avatar-uploader-wrapper:hover {
  border: 1px dashed #409EFF;
  cursor: pointer
}
</style>
