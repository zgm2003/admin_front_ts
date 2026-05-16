<script setup lang="ts">
import { computed } from 'vue'
import type { RechargePackageItem, RechargePaymentMethod, WalletSummary } from '@/api/payment/recharges'

const props = defineProps<{
  wallet: WalletSummary
  paymentMethod: RechargePaymentMethod
  selectedPackage?: RechargePackageItem
  balanceAfterText: string
  submitting: boolean
  canSubmit: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()

const submitText = computed(() => {
  if (!props.paymentMethod.enabled) return '支付通道不可用'
  if (!props.selectedPackage) return '先选择金额'
  return '确认支付'
})
const methodStatusText = computed(() => (props.paymentMethod.enabled ? '可用' : '不可用'))
const methodTagType = computed(() => (props.paymentMethod.enabled ? 'success' : 'danger'))
const hintText = computed(() => (
  props.paymentMethod.enabled
    ? '点击后将在当前窗口跳转支付宝；支付完成会回到充值记录页。'
    : '请先到支付配置启用支付宝，再创建充值单。'
))
</script>

<template>
  <aside class="recharge-checkout-panel">
    <div class="recharge-checkout-panel__header">
      <div>
        <div class="recharge-checkout-panel__eyebrow">
          收银台
        </div>
        <h3 class="recharge-checkout-panel__title">
          确认充值
        </h3>
      </div>
      <span class="recharge-checkout-panel__status">安全收银台</span>
    </div>

    <div class="recharge-checkout-panel__amount-card">
      <span class="recharge-checkout-panel__label">应付金额</span>
      <strong>
        <span>{{ props.selectedPackage?.amount_text || '请选择套餐' }}</span>
        <em v-if="props.selectedPackage">元</em>
      </strong>
      <small>充值完成后自动入账到钱包余额</small>
    </div>

    <div
      class="recharge-checkout-panel__method"
      :class="{ 'is-disabled': !props.paymentMethod.enabled }"
    >
      <div class="recharge-checkout-panel__method-icon">
        支
      </div>
      <div class="recharge-checkout-panel__method-body">
        <span>支付方式</span>
        <b>{{ props.paymentMethod.label }}</b>
      </div>
      <el-tag
        :type="methodTagType"
        effect="plain"
        size="small"
      >
        {{ methodStatusText }}
      </el-tag>
    </div>

    <div class="recharge-checkout-panel__summary">
      <div class="recharge-checkout-panel__row">
        <span>当前余额</span>
        <b>{{ props.wallet.balance_text }}</b>
      </div>
      <div class="recharge-checkout-panel__row">
        <span>预计充值后</span>
        <b>{{ props.selectedPackage ? props.balanceAfterText : '-' }}</b>
      </div>
      <div class="recharge-checkout-panel__row">
        <span>累计充值</span>
        <b>{{ props.wallet.total_recharge_text }}</b>
      </div>
    </div>

    <el-button
      class="recharge-checkout-panel__button"
      type="primary"
      size="large"
      :disabled="!props.canSubmit"
      :loading="props.submitting"
      @click="emit('submit')"
    >
      {{ submitText }}
    </el-button>

    <p class="recharge-checkout-panel__hint">
      {{ hintText }}
    </p>
  </aside>
</template>

<style scoped>
.recharge-checkout-panel {
  flex: 0 0 auto;
  padding: 16px;
  background: var(--el-bg-color);
  border: 1px solid rgb(64 158 255 / 18%);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgb(31 45 61 / 6%);
}

.recharge-checkout-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.recharge-checkout-panel__eyebrow {
  margin-bottom: 4px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.recharge-checkout-panel__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 650;
}

.recharge-checkout-panel__status {
  flex: 0 0 auto;
  padding: 5px 10px;
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 650;
  line-height: 1;
  background: rgb(64 158 255 / 10%);
  border: 1px solid rgb(64 158 255 / 14%);
  border-radius: 999px;
}

.recharge-checkout-panel__amount-card {
  padding: 14px;
  margin-top: 14px;
  background: linear-gradient(180deg, rgb(64 158 255 / 8%), rgb(64 158 255 / 3%));
  border: 1px solid rgb(64 158 255 / 12%);
  border-radius: 15px;
}

.recharge-checkout-panel__label {
  display: block;
  margin-bottom: 7px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.recharge-checkout-panel__amount-card strong {
  display: flex;
  align-items: baseline;
  gap: 6px;
  color: var(--el-text-color-primary);
  font-size: 30px;
  line-height: 1;
}

.recharge-checkout-panel__amount-card em {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-style: normal;
}

.recharge-checkout-panel__amount-card small {
  display: block;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.recharge-checkout-panel__method {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-top: 12px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.recharge-checkout-panel__method.is-disabled {
  background: var(--el-fill-color-extra-light);
}

.recharge-checkout-panel__method-icon {
  display: grid;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  place-items: center;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  background: #1677ff;
  border-radius: 10px;
  box-shadow: 0 6px 14px rgb(22 119 255 / 18%);
}

.recharge-checkout-panel__method-body {
  display: grid;
  flex: 1 1 auto;
  gap: 3px;
  min-width: 0;
}

.recharge-checkout-panel__method-body span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.recharge-checkout-panel__method-body b {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 650;
}

.recharge-checkout-panel__summary {
  display: grid;
  gap: 8px;
  padding: 14px 0;
}

.recharge-checkout-panel__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.recharge-checkout-panel__row b {
  color: var(--el-text-color-primary);
  font-weight: 650;
}

.recharge-checkout-panel__button {
  width: 100%;
}

.recharge-checkout-panel__hint {
  margin: 10px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.55;
}
</style>
