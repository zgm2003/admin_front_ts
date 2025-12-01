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
  <div class="image-container" :style="{'--item-width': width + 'px', '--parent-width': (width + 2) + 'px'}">
    <el-popover :placement="position" :width="380" trigger="hover">
      <template #reference>
        <div class="img-box">
          <el-image
              :src="src"
              :style="{ width: width + 'px', height: width + 'px', 'border-radius': '5px' }"
              fit="contain"
          />
        </div>
      </template>
      <el-image
          :src="src"
          style="width: 350px; border: 1px solid #c8d7e9; border-radius: 5px;"
          fit="contain"
      />
    </el-popover>
  </div>
</template>

<style scoped lang="less">
.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-box {
  width: var(--parent-width);
  height: var(--parent-width);
  border: 1px solid #c8d7e9;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
