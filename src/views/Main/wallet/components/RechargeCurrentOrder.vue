<script setup lang="ts">
import { computed } from 'vue'
import { formatFen, PayStatus } from '@/enums'
import { useI18n } from 'vue-i18n'
import type { RechargeOrderListItem, RechargeOrderState } from '../types'

const props = defineProps<{
  currentOrder: RechargeOrderState | null
  recentOrders: RechargeOrderListItem[]
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
  'view-order': [order: RechargeOrderListItem]
  'continue-pay': [order: RechargeOrderListItem]
}>()

const { t } = useI18n()

const hasRecentOrders = computed(() => props.recentOrders.length > 0)

const payStatusType = (status: number) => {
  if (status === PayStatus.PAID) return 'success'
  if (status === PayStatus.CLOSED) return 'info'
  if (status === PayStatus.EXCEPTION) return 'danger'
  return 'warning'
}

const isOngoingOrder = (status: number) =>
  status === PayStatus.PENDING || status === PayStatus.PAYING
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

      <div v-if="hasRecentOrders" class="recent-list">
        <div
          v-for="order in recentOrders"
          :key="order.order_no"
          class="recent-item"
          :class="{ 'is-active': currentOrder?.orderNo === order.order_no }"
        >
          <div class="recent-item__top">
            <span class="recent-item__order-no">{{ order.order_no }}</span>
            <el-tag :type="payStatusType(order.pay_status)" size="small" effect="light">
              {{ order.pay_status_text }}
            </el-tag>
          </div>

          <div class="recent-item__meta">
            <span>¥{{ formatFen(order.pay_amount) }}</span>
            <span>{{ order.created_at }}</span>
          </div>

          <div class="recent-item__bottom">
            <span class="recent-item__summary">{{ order.channel_name || '-' }} / {{ order.pay_method || '-' }}</span>
            <div class="recent-item__actions">
              <el-button type="primary" text @click="emit('view-order', order)">
                {{ t('personal.recharge.viewOrder') }}
              </el-button>
              <el-button
                v-if="isOngoingOrder(order.pay_status)"
                type="primary"
                text
                @click="emit('continue-pay', order)"
              >
                {{ t('personal.recharge.continuePay') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else :description="t('personal.recharge.recentOrdersEmpty')" :image-size="60" />
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

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.recent-item.is-active {
  border-color: rgba(64, 158, 255, 0.45);
  box-shadow: 0 10px 30px rgba(64, 158, 255, 0.08);
}

.recent-item__top,
.recent-item__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.recent-item__order-no {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.recent-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.recent-item__summary {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.recent-item__actions {
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

  .current-order__header,
  .recent-item__top,
  .recent-item__bottom,
  .recent-item__meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .order-grid {
    grid-template-columns: 1fr;
  }

  .order-actions,
  .recent-item__actions {
    width: 100%;
  }

  .order-actions .el-button,
  .recent-item__actions .el-button {
    flex: 1 1 auto;
    margin-left: 0;
  }
}
</style>
