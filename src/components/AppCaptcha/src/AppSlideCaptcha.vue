<script setup lang="ts">
import { computed } from 'vue'
import { Slide as GoCaptchaSlide } from 'go-captcha-vue'
import 'go-captcha-vue/dist/style.css'
import type { SlideCaptchaChallenge } from '@/types/captcha'

interface SlideConfig {
  width?: number
  height?: number
  thumbWidth?: number
  thumbHeight?: number
  verticalPadding?: number
  horizontalPadding?: number
  showTheme?: boolean
  title?: string
  iconSize?: number
}

interface SlideData {
  thumbX: number
  thumbY: number
  thumbWidth: number
  thumbHeight: number
  image: string
  thumb: string
}

interface SlidePoint {
  x: number
  y: number
}

interface SlideEvent {
  move?: (x: number, y: number) => void
  refresh?: () => void
  close?: () => void
  confirm?: (point: SlidePoint, reset: () => void) => void
}

const props = withDefaults(defineProps<{
  challenge: SlideCaptchaChallenge | null
  modelValue: number
  loading: boolean
  title?: string
}>(), {
  title: '请拖动滑块完成拼图',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
  (e: 'refresh'): void
  (e: 'close'): void
  (e: 'complete', value: number): void
}>()

const captchaConfig = computed<SlideConfig>(() => {
  const challenge = props.challenge
  if (!challenge) {
    return {
      width: 300,
      height: 220,
      thumbWidth: 44,
      thumbHeight: 44,
      showTheme: true,
      title: props.title,
      iconSize: 18,
    }
  }

  return {
    width: challenge.image_width,
    height: challenge.image_height,
    thumbWidth: challenge.tile_width,
    thumbHeight: challenge.tile_height,
    showTheme: true,
    title: props.title,
    iconSize: 18,
    verticalPadding: 0,
    horizontalPadding: 0,
  }
})

const captchaData = computed<SlideData>(() => {
  const challenge = props.challenge
  if (!challenge) {
    return {
      thumbX: 0,
      thumbY: 0,
      thumbWidth: 0,
      thumbHeight: 0,
      image: '',
      thumb: '',
    }
  }

  return {
    thumbX: challenge.tile_x,
    thumbY: challenge.tile_y,
    thumbWidth: challenge.tile_width,
    thumbHeight: challenge.tile_height,
    image: challenge.master_image,
    thumb: challenge.tile_image,
  }
})

function updateCaptchaPoint(point: SlidePoint) {
  const x = Math.round(point.x)
  emit('update:modelValue', x)
  return x
}

const captchaEvents = computed<SlideEvent>(() => ({
  move: (x: number, y: number) => updateCaptchaPoint({ x, y }),
  refresh: () => emit('refresh'),
  close: () => emit('close'),
  confirm: (point: SlidePoint) => {
    const x = updateCaptchaPoint(point)
    emit('complete', x)
  },
}))
</script>

<template>
  <div
    v-loading="loading"
    class="app-slide-captcha"
  >
    <div
      v-if="challenge"
      class="app-slide-captcha__official"
    >
      <GoCaptchaSlide
        :config="captchaConfig"
        :data="captchaData"
        :events="captchaEvents"
      />
    </div>
    <div
      v-else
      class="app-slide-captcha__empty"
    >
      验证码加载中
    </div>
  </div>
</template>

<style scoped lang="scss">
.app-slide-captcha {
  box-sizing: border-box;
  width: fit-content;
  max-width: calc(100vw - 32px);
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.22);
}

.app-slide-captcha__official {
  max-width: 100%;
}

.app-slide-captcha__empty {
  width: 300px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #eef2f7;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 480px) {
  .app-slide-captcha {
    max-width: calc(100vw - 24px);
    padding: 12px;
  }
}
</style>
