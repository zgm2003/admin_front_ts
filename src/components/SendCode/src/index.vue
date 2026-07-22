<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { AppCaptchaOverlay } from '@/components/AppCaptcha'
import type { UserScene } from '@/types/user'
import { isSendCodeAccountValid, useCaptchaSendCode } from './useCaptchaSendCode'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  /** 发送目标账号（邮箱/手机号） */
  account: string
  /** 验证码场景 */
  scene: UserScene
  /** 输入框占位符 */
  placeholder?: string
  /** 输入框 ID，用于外部 label 关联 */
  inputId?: string
  /** 是否禁用发送按钮（额外条件） */
  sendDisabled?: boolean
  /** 外部发送流程是否进行中 */
  sending?: boolean
  /** 倒计时秒数 */
  countdown?: number
  /** 是否移动端样式（竖向排列） */
  mobile?: boolean
  /** 尺寸 */
  size?: 'large' | 'default' | 'small'
}>(), {
  placeholder: '',
  inputId: '',
  sendDisabled: false,
  sending: false,
  countdown: 60,
  mobile: false,
  size: 'default'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'request'): void
  (e: 'sent'): void
}>()

const modelValue = defineModel<string>({ default: '' })

const { t } = useI18n()
const isMobile = useIsMobile()

// 倒计时
const timer = ref(0)
let intervalId: ReturnType<typeof setInterval> | null = null

// 开始倒计时
const startCountdown = () => {
  if (intervalId) clearInterval(intervalId)
  timer.value = props.countdown
  intervalId = setInterval(() => {
    if (timer.value > 0) {
      timer.value--
    } else {
      clearInterval(intervalId!)
      intervalId = null
    }
  }, 1000)
}

const completeSend = () => {
  ElNotification.success(t('common.success.sendCode'))
  startCountdown()
  emit('sent')
}

const {
  captchaChallenge,
  captchaX,
  captchaLoading,
  captchaDialogVisible,
  sending: captchaSending,
  openCaptcha,
  refreshCaptcha,
  completeCaptcha,
  resetCaptcha,
} = useCaptchaSendCode({
  buildRequest: () => {
    const scene = props.scene
    if (scene === 'login') return null
    return { account: props.account.trim(), scene }
  },
  onSent: completeSend,
  onError: (_error, stage) => {
    if (stage === 'captcha') {
      ElNotification.error(t('login.validation.captchaLoadFailed'))
    }
  },
})

// 是否禁用发送按钮
const isSendDisabled = computed(() => {
  return !isSendCodeAccountValid(props.account, props.scene)
    || timer.value > 0
    || props.sendDisabled
    || props.sending
    || captchaSending.value
})

// 发送验证码
const sendCode = async () => {
  if (isSendDisabled.value) return

  const scene = props.scene
  if (scene === 'login') {
    emit('request')
    return
  }

  await openCaptcha()
}

// 重置倒计时（供外部调用）
const reset = () => {
  if (intervalId) { clearInterval(intervalId); intervalId = null }
  timer.value = 0
  modelValue.value = ''
  resetCaptcha()
}

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  resetCaptcha()
})

// 是否使用移动端布局
const useMobileLayout = computed(() => props.mobile || isMobile.value)

const textKeys = computed(() => {
  if (props.scene === 'login' || props.scene === 'forget') {
    return {
      placeholder: props.scene === 'login'
        ? 'auth.login.codePlaceholder'
        : 'auth.forget.codePlaceholder',
      getCode: 'auth.register.sendCode',
      retryAfter: 'auth.register.resend',
    }
  }

  return {
    placeholder: 'personal.security.codePlaceholder',
    getCode: 'personal.security.getCode',
    retryAfter: 'personal.security.retryAfter',
  }
})

// 暴露方法
defineExpose({ reset, sendCode, completeSend })
</script>

<template>
  <div
    v-bind="$attrs"
    class="send-code-wrapper"
    :class="{ 'is-mobile': useMobileLayout }"
  >
    <el-input 
      :id="inputId || undefined"
      v-model="modelValue" 
      autocomplete="one-time-code"
      :placeholder="placeholder || t(textKeys.placeholder)"
      :size="size"
      clearable
    />
    <el-button 
      type="primary" 
      :size="size"
      :loading="captchaSending || sending" 
      :disabled="isSendDisabled"
      :style="{ width: useMobileLayout ? '100%' : 'auto' }"
      @click="sendCode"
    >
      {{ timer > 0 ? t(textKeys.retryAfter, { timer }) : t(textKeys.getCode) }}
    </el-button>
  </div>
  <Teleport to="body">
    <AppCaptchaOverlay
      v-model="captchaDialogVisible"
      :challenge="captchaChallenge"
      :slider-x="captchaX"
      :loading="captchaLoading"
      :verifying="captchaSending"
      @update:slider-x="captchaX = $event"
      @refresh="refreshCaptcha"
      @complete="completeCaptcha"
    />
  </Teleport>
</template>

<style scoped lang="scss">
.send-code-wrapper {
  display: flex;
  gap: 10px;
  width: 100%;

  .el-input {
    flex: 1;
  }

  &.is-mobile {
    flex-direction: column;
  }
}
</style>
