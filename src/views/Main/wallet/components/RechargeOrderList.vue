<script setup lang="ts">
import { computed } from 'vue'
import { BizStatus, PayStatus, RefundStatus, formatFen } from '@/enums'
import { AppTable } from '@/components/Table'
import { useI18n } from 'vue-i18n'
import type { RechargeOrderListItem, WalletTransactionPage } from '../types'

const props = defineProps<{
  orders: RechargeOrderListItem[]
  loading: boolean
  page: WalletTransactionPage
}>()

const emit = defineEmits<{
  'page-change': [page: WalletTransactionPage]
  'view-order': [order: RechargeOrderListItem]
  'continue-pay': [order: RechargeOrderListItem]
  'cancel-order': [order: RechargeOrderListItem]
}>()

const { t } = useI18n()
const columns = computed(() => [
  { key: 'order_no', label: t('pay_order.table.order_no') },
  { key: 'title', label: t('pay_order.table.title') },
  { key: 'transaction_no', label: t('personal.recharge.transactionNo') },
  { key: 'pay_amount', label: t('pay_order.table.pay_amount'), width: 120 },
  { key: 'channel_name', label: t('pay_order.table.channel') },
  { key: 'pay_method_text', label: t('pay_order.table.pay_method') },
  { key: 'pay_status_text', label: t('pay_order.table.pay_status'), width: 120 },
  { key: 'biz_status_text', label: t('pay_order.table.biz_status'), width: 120 },
  { key: 'refund_status_text', label: t('pay_order.table.refund_status'), width: 120 },
  { key: 'expire_time', label: t('pay_order.table.expire_time') },
  { key: 'pay_time', label: t('pay_order.table.pay_time') },
  { key: 'created_at', label: t('pay_order.table.created_at') },
  { key: 'actions', label: t('common.actions.action'), width: 220, overflowTooltip: false },
])

const isOngoingOrder = (row: RechargeOrderListItem) =>
  row.pay_status === PayStatus.PENDING || row.pay_status === PayStatus.PAYING

const payStatusType = (status: number) => {
  if (status === PayStatus.PAID) return 'success'
  if (status === PayStatus.CLOSED) return 'info'
  if (status === PayStatus.EXCEPTION) return 'danger'
  return 'warning'
}

const bizStatusType = (status: number) => {
  if (status === BizStatus.SUCCESS) return 'success'
  if (status === BizStatus.FAILED) return 'danger'
  if (status === BizStatus.MANUAL) return 'warning'
  if (status === BizStatus.EXECUTING) return 'primary'
  return 'info'
}

const refundStatusType = (status: number) => {
  if (status === RefundStatus.FULL) return 'success'
  if (status === RefundStatus.PARTIAL) return 'warning'
  if (status === RefundStatus.EXCEPTION) return 'danger'
  return 'info'
}
</script>

<template>
  <el-card shadow="never" class="recharge-card">
    <template #header>
      <div class="section-header">
        <div class="section-title">{{ t('personal.recharge.ordersTitle') }}</div>
        <div class="section-subtitle">{{ t('personal.recharge.ordersDesc') }}</div>
      </div>
    </template>

    <div class="table">
      <AppTable
        :columns="columns"
        :data="orders"
        :loading="loading"
        :pagination="page"
        row-key="order_no"
        :show-refresh="false"
        :show-column-setting="false"
        :fixed-footer="false"
        @update:pagination="emit('page-change', $event)"
      >
        <template #cell-title="{ row }">{{ row.title || '-' }}</template>
        <template #cell-transaction_no="{ row }">{{ row.transaction_no || '-' }}</template>
        <template #cell-pay_amount="{ row }">¥{{ formatFen(row.pay_amount) }}</template>
        <template #cell-channel_name="{ row }">{{ row.channel_name || '-' }}</template>
        <template #cell-pay_method_text="{ row }">{{ row.pay_method_text || row.pay_method || '-' }}</template>
        <template #cell-pay_status_text="{ row }">
          <el-tag :type="payStatusType(row.pay_status)" size="small">{{ row.pay_status_text }}</el-tag>
        </template>
        <template #cell-biz_status_text="{ row }">
          <el-tag :type="bizStatusType(row.biz_status)" size="small">{{ row.biz_status_text }}</el-tag>
        </template>
        <template #cell-refund_status_text="{ row }">
          <el-tag :type="refundStatusType(row.refund_status)" size="small">{{ row.refund_status_text }}</el-tag>
        </template>
        <template #cell-expire_time="{ row }">{{ row.expire_time || '-' }}</template>
        <template #cell-pay_time="{ row }">{{ row.pay_time || '-' }}</template>
        <template #cell-actions="{ row }">
          <div class="order-actions">
            <el-button type="primary" text @click="emit('view-order', row)">
              {{ t('personal.recharge.viewOrder') }}
            </el-button>
            <el-button
              type="success"
              text
              :disabled="!isOngoingOrder(row)"
              @click="emit('continue-pay', row)"
            >
              {{ t('personal.recharge.continuePay') }}
            </el-button>
            <el-button
              type="danger"
              text
              :disabled="!isOngoingOrder(row)"
              @click="emit('cancel-order', row)"
            >
              {{ t('personal.recharge.cancelOrder') }}
            </el-button>
          </div>
        </template>
      </AppTable>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.recharge-card {
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.section-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.order-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
}

@media (max-width: 768px) {
  .recharge-card {
    border-radius: 16px;
  }
}
</style>
