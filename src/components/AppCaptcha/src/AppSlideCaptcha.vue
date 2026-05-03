<script setup lang="ts">
import { computed } from 'vue'
import { Slide as GoCaptchaSlide } from 'go-captcha-vue'
import 'go-captcha-vue/dist/style.css'
import type { SlideConfig } from 'go-captcha-vue/dist/components/slide/meta/config'
import type { SlideData, SlidePoint } from 'go-captcha-vue/dist/components/slide/meta/data'
import type { SlideEvent } from 'go-captcha-vue/dist/components/slide/meta/event'
import type { SlideCaptchaChallenge } from '@/types/captcha'

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
</style>
