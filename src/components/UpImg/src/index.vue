<script setup lang="ts">
import {ref, watch} from 'vue'
import {Plus, CircleCloseFilled} from '@element-plus/icons-vue'
import {getUploadToken, uploadFileToCloud, validateFile} from '@/utils/cosUpload'

const props = defineProps({
  modelValue: {type: String, default: ''},
  folderName: {type: String, default: 'avatars'},
  width: {type: String, default: '100px'},
  isClearable: {type: Boolean, default: true},
  showInput: {type: Boolean, default: false}
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
  imageUrl.value = ''
  emit('update:modelValue', '')
}
const onInputChange = (val: string) => {
  imageUrl.value = val
  emit('update:modelValue', val)
}
</script>

<template>
  <div :class="['up-img-container', {vertical: showInput}]">
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
    <el-input v-if="showInput" :model-value="imageUrl" @update:model-value="onInputChange" placeholder="或输入图片URL" clearable class="url-input"/>
  </div>
</template>

<style scoped>
.up-img-container { display: flex; align-items: center; gap: 12px }
.up-img-container.vertical { flex-direction: column; align-items: flex-start; width: 100% }
.url-input { flex: 1; min-width: 0 }
.up-img-container.vertical .url-input { width: 100% }
@media (max-width: 768px) {
  .up-img-container { flex-direction: column; align-items: flex-start }
  .url-input { width: 100% }
}
.avatar-uploader-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px dashed grey;
  position: relative;
  overflow: hidden;
  flex-shrink: 0
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
