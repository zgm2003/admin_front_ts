<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';
import { ElIcon, ElNotification } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { uploadFileToCos,getCosUploadToken } from '@/utils/cosUpload.js';   // 直传 COS 工具方法

// 定义 props 和 emits
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [], // 初始值为空数组
  },
  folderName: {
    type: String,
    default: 'avatars',
  },
});

const emits = defineEmits(['update:modelValue']);

// 内部状态：images 存储上传的图片对象，loading 控制上传状态
const images = ref([...props.modelValue]);
const loading = ref(false);

// 监听外部 modelValue 更新，同步内部 images
watch(() => props.modelValue, (newValue) => {
  images.value = [...newValue];
});

// 上传前逻辑：获取 COS 临时凭证并上传图片
const beforeUpload = async (file) => {
  loading.value = true;
  try {
    // 1. 请求后端获取临时上传凭证（已返回 data 本体）
    const config = await getCosUploadToken({ folderName: props.folderName });
    // 2. 调用 COS 直传方法上传文件
    const result = await uploadFileToCos(file, config);
    // 构造上传成功后的图片对象，生成 uid 用于标识
    const uploadedImage = {
      name: file.name,
      url: result.url,
      uid: Date.now() + Math.random().toString(36).substr(2, 9),
    };
    images.value.push(uploadedImage);
    emits('update:modelValue', images.value);
  } catch (error) {
    console.error('上传失败', error);
    const msg = (error && error.response && (error.response.data?.message || error.response.data?.msg)) || error.message || '上传失败'
    ElNotification.error({ message: msg });
  } finally {
    loading.value = false;
  }
  return false; // 阻止默认上传行为
};

// 删除图片：根据 uid 过滤删除指定图片
const removeImage = (file) => {
  images.value = images.value.filter((image) => image.uid !== file.uid);
  emits('update:modelValue', images.value);
};

// 预览图片：点击预览时弹出 el-dialog 展示大图
const dialogImageUrl = ref('');
const dialogVisible = ref(false);
const handlePictureCardPreview = (file) => {
  dialogImageUrl.value = file.url;
  dialogVisible.value = true;
};
</script>

<template>
  <div>
    <el-upload
        :before-upload="beforeUpload"
        :on-remove="removeImage"
        :on-preview="handlePictureCardPreview"
        accept="image/*"
        list-type="picture-card"
        v-model:file-list="images"
        v-loading="loading"
        multiple
    >
      <el-icon>
        <Plus />
      </el-icon>
    </el-upload>
    <el-dialog v-model="dialogVisible">
      <el-image :src="dialogImageUrl"></el-image>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 根据需要添加样式 */
</style>
