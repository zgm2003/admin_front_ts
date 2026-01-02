<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElNotification } from 'element-plus'
import { UsersApi } from '@/api/user/users'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'

const props = withDefaults(defineProps<{
  /** 发送目标账号（邮箱/手机号） */
  account: string
  /** 验证码场景 */
  scene: 'login' | 'bind_phone' | 'bind_email' | 'change_password'
  /** 输入框占位符 */
  placeholder?: string
  /** 是否禁用发送按钮（额外条件） */
  sendDisabled?: boolean
  /** 倒计时秒数 */
  countdown?: number
  /** 是否移动端样式（竖向排列） */
  mobile?: boolean
}>(), {
  placeholder: '',
  sendDisabled: false,
  countdown: 60,
  mobile: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'sent'): void
}>()

const modelValue = defineModel<string>({ default: '' })

const { t } = useI18n()
const isMobile = useIsMobile()

// 倒计时
const timer = ref(0)
const loading = ref(false)

// 是否禁用发送按钮
const isSendDisabled = computed(() => {
  return !props.account || timer.value > 0 || props.sendDisabled
})

// 发送验证码
const sendCode = async () => {
  if (isSendDisabled.value) return
  
  loading.value = true
  try {
    await UsersApi.sendCode({ account: props.account, scene: props.scene })
    ElNotification.success(t('common.success.sendCode'))
    startCountdown()
    emit('sent')
  } finally {
    loading.value = false
  }
}

// 开始倒计时
const startCountdown = () => {
  timer.value = props.countdown
  const interval = setInterval(() => {
    if (timer.value > 0) {
      timer.value--
    } else {
      clearInterval(interval)
    }
  }, 1000)
}

// 重置倒计时（供外部调用）
const reset = () => {
  timer.value = 0
  modelValue.value = ''
}

// 是否使用移动端布局
const useMobileLayout = computed(() => props.mobile || isMobile.value)

// 暴露方法
defineExpose({ reset, sendCode })
</script>

<template>
  <div class="send-code-wrapper" :class="{ 'is-mobile': useMobileLayout }">
    <el-input 
      v-model="modelValue" 
      :placeholder="placeholder || t('personal.security.codePlaceholder')" 
      clearable
    />
    <el-button 
      type="primary" 
      @click="sendCode" 
      :loading="loading" 
      :disabled="isSendDisabled"
      :style="{ width: useMobileLayout ? '100%' : 'auto' }"
    >
      {{ timer > 0 ? t('personal.security.retryAfter', { timer }) : t('personal.security.getCode') }}
    </el-button>
  </div>
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
