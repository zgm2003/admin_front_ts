<script setup>
import { defineProps, defineEmits } from 'vue';
import { ElNotification } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { uploadFileToCos,getCosUploadToken } from '@/utils/cosUpload.js';   // 直传 COS 工具方法

const props = defineProps({
  folderName: {
    type: String,
    default: 'chatImages', // 根据需要修改文件夹名称
  },
  size: {
    type: [String, Number],
    default: 20, // 图标大小，默认 20
  },
});

const emit = defineEmits(['upload-success']);

// 使用 el-upload 组件的 before-upload 钩子进行自定义上传逻辑
const beforeUpload = async (file) => {
  try {
    // 获取临时凭证（已返回 data 本体）
    const config = await getCosUploadToken({folderName: props.folderName});
    // 使用 COS 直传接口上传文件
    const result = await uploadFileToCos(file, config);
    // 上传成功后，向父组件抛出图片 URL
    emit('upload-success', result.url);
  } catch (error) {
    const msg = (error && error.response && (error.response.data?.message || error.response.data?.msg)) || error.message || '上传失败'
    ElNotification.error({ message: msg });
  }
  return false; // 阻止 el-upload 默认上传行为
};
</script>

<template>
  <el-upload
      class="upload-icon"
      :before-upload="beforeUpload"
      accept="image/*"
      :show-file-list="false"
      multiple
  >
    <el-icon :size="size" style="cursor: pointer;">
      <Picture/>
    </el-icon>
  </el-upload>
</template>

<style scoped>
.upload-icon {
  display: inline-block;
}
</style>
