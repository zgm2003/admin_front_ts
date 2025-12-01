<template>
  <div class="image-preview">
    <el-image
        :style="{ width: width, height: width }"
        :src="src"
        :zoom-rate="1.2"
        :max-scale="7"
        :min-scale="0.2"
        :preview-src-list="[src]"
        show-progress
        :initial-index="0"
        fit="cover"
    />
  </div>
</template>

<script lang="ts" setup>
import { defineProps, withDefaults } from 'vue'

const props = withDefaults(
    defineProps<{
      width?: string, // 图片宽度，高度保持一致
      src: string
    }>(),
    {
      width: '100px' // 默认宽度
    }
)
</script>

<style scoped>
.image-preview {
  /* 可根据需要添加额外样式 */

}
</style>
