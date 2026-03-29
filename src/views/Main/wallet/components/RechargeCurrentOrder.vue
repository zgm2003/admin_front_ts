<script setup lang="ts">
import { computed } from 'vue'
import { BizStatus, formatFen, PayStatus, RefundStatus } from '@/enums'
import { AppTable } from '@/components/Table'
import { useI18n } from 'vue-i18n'
import type { RechargeOrderListItem, RechargeOrderState } from '../types'

const props = defineProps<{
  currentOrder: RechargeOrderState | null
  recentOrders: RechargeOrderListItem[]
  recentOrdersLoading: boolean
  popupBlocked: boolean
  statusChecking: boolean
  cancelingOrder: boolean
  canCancelOrder: boolean
  canResumePayment: boolean
}>()

const emit = defineEmits<{
  'refresh-status': []
  'resume-pay': []
  'cancel-order': []
  'cancel-order-row': [order: RechargeOrderListItem]
  'view-order': [order: RechargeOrderListItem]
  'continue-pay': [order: RechargeOrderListItem]
}>()

const { t } = useI18n()

const recentOrderColumns = computed(() => [
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
  { key: 'created_at', label: t('pay_order.table.created_at') },
  { key: 'actions', label: t('common.actions.action'), width: 220, overflowTooltip: false },
])

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

const isOngoingOrder = (status: number) =>
  status === PayStatus.PENDING || status === PayStatus.PAYING

const isCancelingRow = (row: RechargeOrderListItem) =>
  props.cancelingOrder && props.currentOrder?.orderNo === row.order_no
</script>

<template>
  <el-card shadow="never" class="order-card">
    <template #header>
      <div class="section-header">
        <div class="section-title">{{ t('personal.recharge.orderInfoTitle') }}</div>
        <div class="section-subtitle">{{ t('personal.recharge.orderInfoDesc') }}</div>
      </div>
    </template>

    <div v-if="currentOrder" class="current-order">
      <div class="current-order__header">
        <span class="current-order__order-no">{{ currentOrder.orderNo }}</span>
        <el-tag :type="payStatusType(currentOrder.payStatus)" effect="light">
          {{ currentOrder.payStatusText }}
        </el-tag>
      </div>

      <div class="order-grid">
        <div class="order-item">
          <span class="order-item__label">{{ t('personal.recharge.payAmount') }}</span>
          <span class="order-item__value">¥{{ formatFen(currentOrder.payAmount) }}</span>
        </div>
        <div class="order-item">
          <span class="order-item__label">{{ t('personal.recharge.channel') }}</span>
          <span class="order-item__value">{{ currentOrder.channelText || '-' }}</span>
        </div>
        <div class="order-item">
          <span class="order-item__label">{{ t('personal.recharge.payMethod') }}</span>
          <span class="order-item__value">{{ currentOrder.payMethodText || currentOrder.payMethod || '-' }}</span>
        </div>
        <div class="order-item">
          <span class="order-item__label">{{ t('personal.recharge.bizStatus') }}</span>
          <span class="order-item__value">{{ currentOrder.bizStatusText || '-' }}</span>
        </div>
        <div class="order-item">
          <span class="order-item__label">{{ t('personal.recharge.expireTime') }}</span>
          <span class="order-item__value">{{ currentOrder.expireTime || '-' }}</span>
        </div>
        <div class="order-item">
          <span class="order-item__label">{{ t('personal.recharge.payTime') }}</span>
          <span class="order-item__value">{{ currentOrder.payTime || '-' }}</span>
        </div>
        <div class="order-item">
          <span class="order-item__label">{{ t('personal.recharge.transactionNo') }}</span>
          <span class="order-item__value">{{ currentOrder.transactionNo || '-' }}</span>
        </div>
        <div class="order-item">
          <span class="order-item__label">{{ t('personal.recharge.orderNo') }}</span>
          <span class="order-item__value">{{ currentOrder.orderNo }}</span>
        </div>
      </div>

      <el-alert
        v-if="popupBlocked"
        :title="t('personal.recharge.popupBlocked')"
        type="warning"
        :closable="false"
        show-icon
        class="state-alert"
      />

      <div class="order-actions">
        <el-button plain :loading="statusChecking" @click="emit('refresh-status')">
          {{ t('personal.recharge.checkResult') }}
        </el-button>
        <el-button v-if="canResumePayment" type="primary" plain @click="emit('resume-pay')">
          {{ popupBlocked ? t('personal.recharge.openPayPage') : t('personal.recharge.continuePay') }}
        </el-button>
        <el-button v-if="canCancelOrder" type="danger" plain :loading="cancelingOrder" @click="emit('cancel-order')">
          {{ t('personal.recharge.cancelOrder') }}
        </el-button>
      </div>
    </div>

    <el-empty
      v-else
      :description="t('personal.recharge.noCurrentOrder')"
      :image-size="72"
      class="current-order-empty"
    />

    <div class="recent-section">
      <div class="recent-section__header">
        <div class="recent-section__title">{{ t('personal.recharge.recentOrdersTitle') }}</div>
        <div class="recent-section__desc">{{ t('personal.recharge.recentOrdersDesc') }}</div>
      </div>

      <div class="table">
        <AppTable
          :columns="recentOrderColumns"
          :data="recentOrders"
          :loading="recentOrdersLoading"
          row-key="order_no"
          :show-refresh="false"
          :show-column-setting="false"
          :fixed-footer="false"
        >
          <template #cell-title="{ row }">{{ row.title || '-' }}</template>
          <template #cell-transaction_no="{ row }">{{ row.transaction_no || '-' }}</template>
          <template #cell-pay_amount="{ row }">¥{{ formatFen(row.pay_amount) }}</template>
          <template #cell-channel_name="{ row }">{{ row.channel_name || '-' }}</template>
          <template #cell-pay_method_text="{ row }">{{ row.pay_method_text || row.pay_method || '-' }}</template>
          <template #cell-pay_status_text="{ row }">
            <el-tag :type="payStatusType(row.pay_status)" size="small" effect="light">
              {{ row.pay_status_text }}
            </el-tag>
          </template>
          <template #cell-biz_status_text="{ row }">
            <el-tag :type="bizStatusType(row.biz_status)" size="small" effect="light">
              {{ row.biz_status_text }}
            </el-tag>
          </template>
          <template #cell-refund_status_text="{ row }">
            <el-tag :type="refundStatusType(row.refund_status)" size="small" effect="light">
              {{ row.refund_status_text }}
            </el-tag>
          </template>
          <template #cell-expire_time="{ row }">{{ row.expire_time || '-' }}</template>
          <template #cell-actions="{ row }">
            <div class="recent-table__actions">
              <el-button type="primary" text @click="emit('view-order', row)">
                {{ t('personal.recharge.viewOrder') }}
              </el-button>
              <el-button
                v-if="isOngoingOrder(row.pay_status)"
                type="success"
                text
                @click="emit('continue-pay', row)"
              >
                {{ t('personal.recharge.continuePay') }}
              </el-button>
              <el-button
                v-if="isOngoingOrder(row.pay_status)"
                type="danger"
                text
                :loading="isCancelingRow(row)"
                @click="emit('cancel-order-row', row)"
              >
                {{ t('personal.recharge.cancelOrder') }}
              </el-button>
            </div>
          </template>
        </AppTable>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.order-card {
  border-radius: 18px;
  border: 1px solid var(--el-border-color-lighter);
}

.section-header,
.recent-section__header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title,
.recent-section__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.section-subtitle,
.recent-section__desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.current-order {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%);
  border: 1px solid var(--el-border-color-lighter);
}

.current-order__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.current-order__order-no {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.order-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
}

.order-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-item__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.order-item__value {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.state-alert {
  margin-top: -2px;
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.current-order-empty {
  padding-block: 8px 18px;
}

.recent-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 18px;
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.recent-table__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .order-card {
    border-radius: 16px;
  }

  .current-order {
    padding: 14px;
  }

  .current-order__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-grid {
    grid-template-columns: 1fr;
  }

  .order-actions {
    width: 100%;
  }

  .order-actions .el-button {
    flex: 1 1 auto;
    margin-left: 0;
  }
}
</style>
