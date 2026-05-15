<script setup lang="ts">
import type { PaymentOrderDetail } from '@/api/payment/orders'

defineProps<{
  detail: PaymentOrderDetail | null
  loading: boolean
}>()

function display(value: string | number | null | undefined): string | number {
  if (value === null || value === undefined || value === '') return '-'
  return value
}
</script>

<template>
  <div v-loading="loading" class="payment-order-detail-dialog">
    <el-empty v-if="!loading && !detail" description="暂无订单详情" />
    <el-descriptions
      v-else-if="detail"
      :column="2"
      border
    >
      <el-descriptions-item label="订单号">
        {{ display(detail.order_no) }}
      </el-descriptions-item>
      <el-descriptions-item label="支付配置">
        {{ display(detail.config_code) }}
      </el-descriptions-item>
      <el-descriptions-item label="支付渠道">
        {{ display(detail.provider_text) }}
      </el-descriptions-item>
      <el-descriptions-item label="支付方式">
        {{ display(detail.pay_method_text) }}
      </el-descriptions-item>
      <el-descriptions-item label="订单标题">
        {{ display(detail.subject) }}
      </el-descriptions-item>
      <el-descriptions-item label="金额">
        {{ display(detail.amount_text) }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        {{ display(detail.status_text) }}
      </el-descriptions-item>
      <el-descriptions-item label="支付宝交易号">
        {{ display(detail.alipay_trade_no) }}
      </el-descriptions-item>
      <el-descriptions-item label="支付链接" :span="2">
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
      <el-descriptions-item label="同步返回地址" :span="2">
        {{ display(detail.return_url) }}
      </el-descriptions-item>
      <el-descriptions-item label="过期时间">
        {{ display(detail.expired_at) }}
      </el-descriptions-item>
      <el-descriptions-item label="支付时间">
        {{ display(detail.paid_at) }}
      </el-descriptions-item>
      <el-descriptions-item label="关闭时间">
        {{ display(detail.closed_at) }}
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ display(detail.created_at) }}
      </el-descriptions-item>
      <el-descriptions-item label="失败原因" :span="2">
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
