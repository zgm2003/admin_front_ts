<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    default: 56
  },
  // 控制 popover 位置，默认右侧显示
  position: {
    type: String,
    default: 'right-start'
  }
})
</script>

<template>
  <div class="video-container" :style="{'--item-width': width + 'px', '--parent-width': (width + 2) + 'px'}">
    <el-popover :placement="position" :width="380" trigger="hover">
      <template #reference>
        <div class="video-box">
          <video
              :src="src"
              :style="{ width: width + 'px', height: width + 'px', 'border-radius': '5px' }"
              muted
              playsinline
          />
        </div>
      </template>
      <video
          :src="src"
          controls
          style="width: 350px; border: 1px solid #c8d7e9; border-radius: 5px;"
      />
    </el-popover>
  </div>
</template>

<style scoped lang="less">
.video-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-box {
  width: var(--parent-width);
  height: var(--parent-width);
  border: 1px solid #c8d7e9;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
