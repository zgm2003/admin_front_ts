<script setup lang="ts">
import { computed } from 'vue'
import { BizStatus, PayStatus, RefundStatus, formatFen } from '@/enums'
import { AppTable } from '@/components/Table'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import type { RechargeOrderListItem, WalletTransactionPage } from '../types'

const props = defineProps<{
  orders: RechargeOrderListItem[]
  loading: boolean
  page: WalletTransactionPage
  currentOrderNo?: string
}>()

const emit = defineEmits<{
  'page-change': [page: number]
  'view-order': [order: RechargeOrderListItem]
  'continue-pay': [order: RechargeOrderListItem]
  'cancel-order': [order: RechargeOrderListItem]
}>()

const { t } = useI18n()
const isMobile = useIsMobile()

const showPagination = computed(() => props.page.total > props.page.page_size)
const paginationLayout = computed(() => (isMobile.value ? 'prev, pager, next' : 'total, prev, pager, next'))
const columns = computed(() => [
  { key: 'order_no', label: t('pay_order.table.order_no'), minWidth: 190 },
  { key: 'title', label: t('pay_order.table.title'), minWidth: 220 },
  { key: 'transaction_no', label: t('personal.recharge.transactionNo'), minWidth: 190 },
  { key: 'pay_amount', label: t('pay_order.table.pay_amount'), minWidth: 130 },
  { key: 'channel_name', label: t('pay_order.table.channel'), minWidth: 140 },
  { key: 'pay_method_text', label: t('pay_order.table.pay_method'), minWidth: 120 },
  { key: 'pay_status_text', label: t('pay_order.table.pay_status'), minWidth: 120 },
  { key: 'biz_status_text', label: t('pay_order.table.biz_status'), minWidth: 120 },
  { key: 'refund_status_text', label: t('pay_order.table.refund_status'), minWidth: 120 },
  { key: 'expire_time', label: t('pay_order.table.expire_time'), minWidth: 170 },
  { key: 'pay_time', label: t('pay_order.table.pay_time'), minWidth: 170 },
  { key: 'created_at', label: t('pay_order.table.created_at'), minWidth: 170 },
  { key: 'actions', label: t('common.actions.action'), minWidth: 220, fixed: 'right', overflowTooltip: false },
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

const tableRowClassName = ({ row }: { row: RechargeOrderListItem }) =>
  row.order_no === props.currentOrderNo ? 'is-current-order' : ''

const tableProps = computed(() => ({
  size: 'small',
  rowClassName: tableRowClassName,
  emptyText: t('personal.recharge.ordersEmpty'),
}))
</script>

<template>
  <el-card shadow="never" class="recharge-card">
    <template #header>
      <div class="section-header">
        <div class="section-title">{{ t('personal.recharge.ordersTitle') }}</div>
        <div class="section-subtitle">{{ t('personal.recharge.ordersDesc') }}</div>
      </div>
    </template>

    <div class="order-table-wrap">
      <AppTable
        :columns="columns"
        :data="orders"
        :loading="loading"
        row-key="order_no"
        class="order-table"
        :show-refresh="false"
        :show-column-setting="false"
        :fixed-footer="false"
        :table-props="tableProps"
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
              type="primary"
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

    <div v-if="showPagination" class="order-pagination">
      <el-pagination
        :current-page="page.current_page"
        :page-size="page.page_size"
        :total="page.total"
        :layout="paginationLayout"
        :small="isMobile"
        :pager-count="isMobile ? 5 : 7"
        @current-change="emit('page-change', $event)"
      />
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

.order-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.order-table {
  min-width: 1680px;
}

.order-table :deep(.table-toolbar) {
  display: none;
}

.order-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.order-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

:deep(.el-table__body tr.is-current-order > td) {
  background: rgba(64, 158, 255, 0.08);
}

@media (max-width: 768px) {
  .recharge-card {
    border-radius: 16px;
  }

  .order-table {
    min-width: 1440px;
  }

  .order-pagination {
    justify-content: center;
  }
}
</style>
