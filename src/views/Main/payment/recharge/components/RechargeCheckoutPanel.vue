<script setup lang="ts">
import type { RechargePackageItem, WalletSummary } from '@/api/payment/recharges'

const props = defineProps<{
  wallet: WalletSummary
  selectedPackage?: RechargePackageItem
  balanceAfterText: string
  submitting: boolean
  canSubmit: boolean
}>()

const emit = defineEmits<{
  submit: []
}>()
</script>

<template>
  <aside class="recharge-checkout-panel">
    <div class="recharge-checkout-panel__header">
      <div>
        <div class="recharge-checkout-panel__eyebrow">收银台</div>
        <h3 class="recharge-checkout-panel__title">确认充值</h3>
      </div>
      <el-tag type="primary" effect="light">Alipay</el-tag>
    </div>

    <div class="recharge-checkout-panel__amount">
      <span class="recharge-checkout-panel__label">应付金额</span>
      <strong>{{ props.selectedPackage?.amount_text || '请选择套餐' }}</strong>
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
      确认支付
    </el-button>

    <p class="recharge-checkout-panel__hint">
      点击后将在当前窗口跳转支付宝；支付完成会回到充值记录页。
    </p>
  </aside>
</template>

<style scoped>
.recharge-checkout-panel {
  position: sticky;
  top: 0;
  padding: 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  box-shadow: 0 14px 36px rgb(31 45 61 / 7%);
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

.recharge-checkout-panel__amount {
  padding: 20px 0 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.recharge-checkout-panel__label {
  display: block;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.recharge-checkout-panel__amount strong {
  color: var(--el-text-color-primary);
  font-size: 32px;
  line-height: 1;
}

.recharge-checkout-panel__summary {
  display: grid;
  gap: 10px;
  padding: 18px 0;
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
  margin: 12px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
