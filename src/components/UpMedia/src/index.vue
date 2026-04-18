<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, CircleCloseFilled } from '@element-plus/icons-vue'
import { getUploadToken, uploadFileToCloud, validateFile } from '@/lib/upload'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String as () => 'image' | 'video', default: 'image' },
  folderName: { type: String, default: '' },
  width: { type: String, default: '100px' },
  isClearable: { type: Boolean, default: true },
  showInput: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue'])

const mediaUrl = ref(props.modelValue)
const loading = ref(false)

// 根据类型计算默认文件夹和接受类型
const defaultFolder = computed(() => props.folderName || (props.type === 'video' ? 'videos' : 'images'))
const acceptType = computed(() => props.type === 'video' ? 'video/*' : 'image/*')
const placeholder = computed(() => props.type === 'video' 
  ? t('components.upMedia.videoPlaceholder') 
  : t('components.upMedia.imagePlaceholder'))

watch(() => props.modelValue, (v) => {
  mediaUrl.value = v
})

const beforeUpload = async (file: File) => {
  loading.value = true
  try {
    const config: any = await getUploadToken({ folderName: defaultFolder.value })
    if (props.type === 'image') {
      validateFile(file, config, 'image')
    }
    const result: any = await uploadFileToCloud(file, config)
    mediaUrl.value = result.url
    emit('update:modelValue', result.url)
  } catch (error: any) {
    // 错误由 request.ts 统一处理
  } finally {
    loading.value = false
  }
  return false
}

const clear = () => {
  mediaUrl.value = ''
  emit('update:modelValue', '')
}

const onInputChange = (val: string) => {
  mediaUrl.value = val
  emit('update:modelValue', val)
}
</script>

<template>
  <div :class="['up-media-container', { vertical: showInput }]">
    <div class="media-uploader-wrapper" v-loading="loading" :style="{ width: width, height: width }">
      <el-upload class="media-uploader" :before-upload="beforeUpload" :accept="acceptType" :show-file-list="false">
        <el-icon v-if="!mediaUrl" class="media-uploader-icon">
          <Plus />
        </el-icon>
        <el-popover placement="right-start" :width="type === 'video' ? 300 : 250" trigger="hover" v-if="mediaUrl">
          <template #reference>
            <!-- 图片预览 -->
            <el-image v-if="type === 'image'" :src="mediaUrl" fit="fill" />
            <!-- 视频预览 -->
            <video v-else :src="mediaUrl" controls style="width: 100%; height: auto;" />
          </template>
          <el-image v-if="type === 'image'" :src="mediaUrl" />
          <video v-else :src="mediaUrl" controls style="width: 100%; height: auto;" />
        </el-popover>
      </el-upload>
      <el-icon class="clear-icon" @click="clear" v-if="isClearable && mediaUrl">
        <CircleCloseFilled />
      </el-icon>
    </div>
    <el-input 
      v-if="showInput" 
      :model-value="mediaUrl" 
      @update:model-value="onInputChange" 
      :placeholder="placeholder" 
      clearable 
      class="url-input"
    />
  </div>
</template>

<style scoped>
.up-media-container { display: flex; align-items: center; gap: 12px }
.up-media-container.vertical { flex-direction: column; align-items: flex-start; width: 100% }
.url-input { flex: 1; min-width: 0 }
.up-media-container.vertical .url-input { width: 100% }

@media (max-width: 768px) {
  .up-media-container { flex-direction: column; align-items: flex-start; }
  .url-input { width: 100%; }
}

.media-uploader-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px dashed grey;
  position: relative;
  overflow: hidden;
  flex-shrink: 0
}

.media-uploader-wrapper .media-uploader-icon {
  font-size: 40px;
  color: #409EFF;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%
}

.media-uploader-wrapper .clear-icon {
  position: absolute;
  color: #f56c6c;
  right: 0;
  top: 0;
  cursor: pointer
}

.media-uploader-wrapper:hover {
  border: 1px dashed #409EFF;
  cursor: pointer
}
</style>
