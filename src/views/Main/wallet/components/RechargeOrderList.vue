<script setup lang="ts">
import { computed } from 'vue'
import { BizStatus, PayStatus, RefundStatus, formatFen } from '@/enums'
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
</script>

<template>
  <el-card shadow="never" class="recharge-card" v-loading="loading">
    <template #header>
      <div class="section-header">
        <div class="section-title">{{ t('personal.recharge.ordersTitle') }}</div>
        <div class="section-subtitle">{{ t('personal.recharge.ordersDesc') }}</div>
      </div>
    </template>

    <div class="order-table-wrap">
      <el-table
        :data="orders"
        size="small"
        class="order-table"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="order_no" :label="t('pay_order.table.order_no')" min-width="190" />

        <el-table-column :label="t('pay_order.table.pay_amount')" min-width="130">
          <template #default="{ row }">¥{{ formatFen(row.pay_amount) }}</template>
        </el-table-column>

        <el-table-column :label="t('pay_order.table.channel')" min-width="140">
          <template #default="{ row }">{{ row.channel_name || '-' }}</template>
        </el-table-column>

        <el-table-column prop="pay_method" :label="t('pay_order.table.pay_method')" min-width="120">
          <template #default="{ row }">{{ row.pay_method || '-' }}</template>
        </el-table-column>

        <el-table-column :label="t('pay_order.table.pay_status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="payStatusType(row.pay_status)" size="small">{{ row.pay_status_text }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('pay_order.table.biz_status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="bizStatusType(row.biz_status)" size="small">{{ row.biz_status_text }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('pay_order.table.refund_status')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="refundStatusType(row.refund_status)" size="small">{{ row.refund_status_text }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="expire_time" :label="t('pay_order.table.expire_time')" min-width="170">
          <template #default="{ row }">{{ row.expire_time || '-' }}</template>
        </el-table-column>

        <el-table-column prop="pay_time" :label="t('pay_order.table.pay_time')" min-width="170">
          <template #default="{ row }">{{ row.pay_time || '-' }}</template>
        </el-table-column>

        <el-table-column prop="created_at" :label="t('pay_order.table.created_at')" min-width="170" />

        <el-table-column :label="t('common.actions.action')" min-width="220" fixed="right">
          <template #default="{ row }">
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
        </el-table-column>

        <template #empty>
          <el-empty :description="t('personal.recharge.ordersEmpty')" />
        </template>
      </el-table>
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
  min-width: 1280px;
  width: 100%;
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
    min-width: 1080px;
  }

  .order-pagination {
    justify-content: center;
  }
}
</style>
