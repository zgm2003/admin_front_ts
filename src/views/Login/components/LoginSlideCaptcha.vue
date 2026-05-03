<script setup lang="ts">
import { computed } from 'vue'
import type { UserCaptchaChallenge } from '@/types/user'

const props = defineProps<{
  enabled: boolean
  challenge: UserCaptchaChallenge | null
  modelValue: number
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'refresh'): void
}>()

const sliderValue = computed({
  get: () => props.modelValue,
  set: (value: number) => emit('update:modelValue', value),
})

const sliderMax = computed(() => {
  if (!props.challenge) return 0
  return Math.max(0, props.challenge.image_width - props.challenge.tile_width)
})

const stageStyle = computed(() => {
  if (!props.challenge) return {}
  return {
    width: `${props.challenge.image_width}px`,
    height: `${props.challenge.image_height}px`,
  }
})

const tileStyle = computed(() => {
  if (!props.challenge) return {}
  return {
    width: `${props.challenge.tile_width}px`,
    height: `${props.challenge.tile_height}px`,
    left: `${props.modelValue}px`,
    top: `${props.challenge.tile_y}px`,
  }
})
</script>

<template>
  <div
    v-if="enabled"
    class="login-slide-captcha"
  >
    <div class="captcha-header">
      <span
        class="captcha-title"
      >
        滑动验证
      </span>
      <el-button
        link
        type="primary"
        size="small"
        :loading="loading"
        @click="$emit('refresh')"
      >
        刷新
      </el-button>
    </div>

    <div
      v-loading="loading"
      class="captcha-body"
    >
      <div
        v-if="challenge"
        class="captcha-stage"
        :style="stageStyle"
      >
        <img
          class="captcha-master"
          :src="challenge.master_image"
          alt="滑动验证码背景"
        >
        <img
          class="captcha-tile"
          :src="challenge.tile_image"
          alt="滑块"
          :style="tileStyle"
        >
      </div>
      <div
        v-else
        class="captcha-empty"
      >
        验证码加载中
      </div>
    </div>

    <el-slider
      v-if="challenge"
      v-model="sliderValue"
      class="captcha-slider"
      :min="0"
      :max="sliderMax"
      :show-tooltip="false"
    />
    <p class="captcha-tip">
      拖动滑块，使拼图对齐缺口
    </p>
  </div>
</template>

<style scoped lang="scss">
.login-slide-captcha {
  padding: 10px 12px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

.captcha-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.captcha-title {
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.captcha-body {
  display: flex;
  justify-content: center;
  min-height: 160px;
}

.captcha-stage {
  position: relative;
  overflow: hidden;
  flex: 0 0 auto;
  border-radius: 12px;
  background: #e2e8f0;
}

.captcha-master {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
}

.captcha-tile {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.captcha-empty {
  width: 100%;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #eef2f7;
  color: #64748b;
  font-size: 13px;
}

.captcha-slider {
  margin-top: 8px;
}

.captcha-tip {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}
</style>
