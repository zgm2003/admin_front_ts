<template>
  <el-dialog
    :model-value="visible"
    title="找回密码"
    width="440px"
    append-to-body
    destroy-on-close
    class="login-forgot-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <div class="forgot-content">
      <div class="step-indicator">
        <div :class="['step-item', { active: step >= 1 }]">
          <div class="step-num">1</div>
          <span class="step-text">身份验证</span>
        </div>
        <div class="step-line"></div>
        <div :class="['step-item', { active: step >= 2 }]">
          <div class="step-num">2</div>
          <span class="step-text">重置密码</span>
        </div>
      </div>

      <div v-if="step === 1" class="step-content animate-fade-in">
        <div class="input-group">
          <label class="input-label">邮箱 / 手机号</label>
          <el-input v-model="form.account" placeholder="请输入邮箱或手机号" class="custom-input">
            <template #prefix><el-icon><Message /></el-icon></template>
          </el-input>
        </div>
        <div class="input-group">
          <label class="input-label">验证码</label>
          <div class="code-input-wrapper">
            <el-input v-model="form.code" placeholder="6位验证码" maxlength="6" class="custom-input flex-1">
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
            <el-button
              class="code-btn"
              :disabled="countdown > 0 || isSendingCode"
              :type="countdown > 0 ? 'info' : 'primary'"
              :loading="isSendingCode"
              plain
              @click="$emit('sendCode')"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </div>
        <el-button type="primary" class="submit-btn mt-4" @click="$emit('next')">下一步</el-button>
      </div>

      <div v-else class="step-content animate-fade-in">
        <div class="input-group">
          <label class="input-label">新密码</label>
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            class="custom-input"
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </div>
        <div class="input-group">
          <label class="input-label">确认密码</label>
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            class="custom-input"
          >
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </div>
        <div class="forgot-actions">
          <el-button class="back-btn" @click="$emit('back')">返回上一步</el-button>
          <el-button type="primary" class="submit-btn flex-1" :loading="isSubmitting" @click="$emit('reset')">
            {{ isSubmitting ? '重置中...' : '提交重置' }}
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { Message, Lock } from '@element-plus/icons-vue'

defineProps<{
  visible: boolean
  step: number
  form: { account: string; code: string; newPassword: string; confirmPassword: string }
  countdown: number
  isSendingCode: boolean
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  sendCode: []
  next: []
  back: []
  reset: []
}>()
</script>
