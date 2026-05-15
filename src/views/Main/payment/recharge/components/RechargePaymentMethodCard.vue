<script setup lang="ts">
import type { RechargePaymentMethod } from '@/api/payment/recharges'

const props = defineProps<{
  method: RechargePaymentMethod
}>()
</script>

<template>
  <section class="recharge-payment-method-card" :class="{ 'is-disabled': !props.method.enabled }">
    <div class="recharge-payment-method-card__icon">支</div>
    <div class="recharge-payment-method-card__body">
      <div class="recharge-payment-method-card__title">{{ props.method.label }}</div>
      <div class="recharge-payment-method-card__desc">
        {{ props.method.enabled ? '当前仅开放支付宝支付，系统会自动选择可用配置。' : '支付宝支付通道暂不可用，请联系管理员检查支付配置。' }}
      </div>
    </div>
    <el-tag :type="props.method.enabled ? 'success' : 'danger'" effect="plain">
      {{ props.method.enabled ? '可用' : '不可用' }}
    </el-tag>
  </section>
</template>

<style scoped>
.recharge-payment-method-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  margin-top: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 16px;
}

.recharge-payment-method-card.is-disabled {
  border-color: var(--el-border-color-lighter);
  opacity: .72;
}

.recharge-payment-method-card__icon {
  display: grid;
  flex: 0 0 42px;
  width: 42px;
  height: 42px;
  place-items: center;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  background: #1677ff;
  border-radius: 12px;
}

.recharge-payment-method-card__body {
  flex: 1 1 auto;
  min-width: 0;
}

.recharge-payment-method-card__title {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 650;
}

.recharge-payment-method-card__desc {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.55;
}
</style>
