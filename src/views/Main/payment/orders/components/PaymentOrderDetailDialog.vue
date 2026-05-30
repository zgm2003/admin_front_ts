<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PaymentOrderDetail } from '@/api/payment/orders'

defineProps<{
  detail: PaymentOrderDetail | null
  loading: boolean
}>()

const { t } = useI18n()

function display(value: string | number | null | undefined): string | number {
  if (value === null || value === undefined || value === '') return '-'
  return value
}
</script>

<template>
  <div v-loading="loading" class="payment-order-detail-dialog">
    <el-empty v-if="!loading && !detail" :description="t('paymentOrder.detail.empty')" />
    <el-descriptions
      v-else-if="detail"
      :column="2"
      border
    >
      <el-descriptions-item :label="t('paymentOrder.detail.orderNo')">
        {{ display(detail.order_no) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.configCode')">
        {{ display(detail.config_code) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.provider')">
        {{ display(detail.provider_text) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.payMethod')">
        {{ display(detail.pay_method_text) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.subject')">
        {{ display(detail.subject) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.amount')">
        {{ display(detail.amount_text) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.status')">
        {{ display(detail.status_text) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.alipayTradeNo')">
        {{ display(detail.alipay_trade_no) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.payURL')" :span="2">
        <el-link
          v-if="detail.pay_url"
          :href="detail.pay_url"
          target="_blank"
          type="primary"
        >
          {{ detail.pay_url }}
        </el-link>
        <span v-else>-</span>
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.expiredAt')">
        {{ display(detail.expired_at) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.paidAt')">
        {{ display(detail.paid_at) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.closedAt')">
        {{ display(detail.closed_at) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.createdAt')">
        {{ display(detail.created_at) }}
      </el-descriptions-item>
      <el-descriptions-item :label="t('paymentOrder.detail.failureReason')" :span="2">
        {{ display(detail.failure_reason) }}
      </el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<style scoped>
.payment-order-detail-dialog {
  min-height: 180px;
}

.payment-order-detail-dialog :deep(.el-descriptions__cell) {
  word-break: break-all;
}
</style>

