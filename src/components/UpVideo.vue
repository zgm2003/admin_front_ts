<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { ElIcon, ElNotification, ElPopover } from 'element-plus';
import { Plus, CircleCloseFilled } from '@element-plus/icons-vue';
import { uploadFileToCos,getCosUploadToken } from '@/utils/cosUpload.js';   // 直传 COS 工具方法

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  folderName: {
    type: String,
    default: 'videos',
  },
  width: {
    type: String,
    default: '100px',
  },
  isClearable: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['update:modelValue']);
const videoUrl = ref(props.modelValue); // 绑定 modelValue 的初始值
const loading = ref(false);

// 监听 modelValue 的变化，让 videoUrl 也同步
watch(() => props.modelValue, (newValue) => {
  videoUrl.value = newValue;
});

// 上传前逻辑：先获取临时 Token，再调用 COS 直传接口
const beforeUpload = async (file) => {
  loading.value = true;
  try {
    // 1. 请求后端获取临时上传凭证（已返回 data 本体）
    const config = await getCosUploadToken({ folderName: props.folderName });
    // 2. 使用 COS SDK 上传文件
    const result = await uploadFileToCos(file, config);
    // 设置视频地址，并同步到外部
    videoUrl.value = result.url;
    emit('update:modelValue', result.url);
  } catch (error) {
    console.error('上传失败', error);
    const msg = (error && error.response && (error.response.data?.message || error.response.data?.msg)) || error.message || '上传失败'
    ElNotification.error({ message: msg });
  } finally {
    loading.value = false;
  }
  return false; // 阻止默认上传行为
};

// 清除视频
const clear = () => {
  videoUrl.value = '';
  emit('update:modelValue', '');
};
</script>

<template>
  <div class="video-uploader-wrapper" v-loading="loading" :style="{ width: width, height: width }">
    <!-- 上传视频 -->
    <el-upload
        class="video-uploader"
        :before-upload="beforeUpload"
        accept="video/*"
    :show-file-list="false"
    >
    <!-- 上传图标 -->
    <el-icon v-if="!videoUrl" class="video-uploader-icon">
      <Plus />
    </el-icon>

    <!-- 通过 el-popover 实现视频预览 -->
    <el-popover placement="right-start" width="300" trigger="hover" v-if="videoUrl">
      <template #reference>
        <video :src="videoUrl" controls style="width: 100%; height: auto;"></video>
      </template>
      <video :src="videoUrl" controls style="width: 100%; height: auto;"></video>
    </el-popover>
    </el-upload>

    <!-- 清除按钮 -->
    <el-icon class="clear-icon" @click="clear" v-if="isClearable && videoUrl">
      <CircleCloseFilled />
    </el-icon>
  </div>
</template>

<style scoped>
.video-uploader-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px dashed grey;
  position: relative;
  overflow: hidden;
}

.video-uploader-icon {
  font-size: 40px;
  color: rgb(64, 158, 255);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.clear-icon {
  position: absolute;
  color: #f56c6c;
  right: 0;
  top: 0;
  cursor: pointer;
}

.video-uploader-wrapper:hover {
  border: 1px dashed rgb(64, 158, 255);
  cursor: pointer;
}
</style>
