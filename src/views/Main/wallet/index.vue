<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatFen } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import RechargeCurrentOrder from './components/RechargeCurrentOrder.vue'
import RechargeForm from './components/RechargeForm.vue'
import RechargeHistory from './components/RechargeHistory.vue'
import RechargeOrderList from './components/RechargeOrderList.vue'
import RechargeSummary from './components/RechargeSummary.vue'
import type { RechargeOrderListItem } from './types'
import { useRechargePayment } from './useRechargePayment'

const { t } = useI18n()
const isMobile = useIsMobile()
const activeTab = shallowRef<'overview' | 'recharge' | 'orders' | 'history'>('overview')

const {
  availableChannelOptions,
  availablePayMethodOptions,
  canCancelOrder,
  canRecharge,
  canResumePayment,
  cancelOrder,
  cancelingOrder,
  copyPaymentContent,
  currentOrder,
  handlePageChange,
  handleOrderPageChange,
  historyLoading,
  orderLoading,
  orderPage,
  paymentDialogVisible,
  paymentView,
  popupBlocked,
  presetAmounts,
  rechargeOrders,
  recentRechargeOrders,
  rechargeAmount,
  recentOrdersLoading,
  refreshOrderStatus,
  resumePayment,
  selectRechargeOrder,
  selectedChannelId,
  selectedPayMethod,
  statusChecking,
  submitRecharge,
  submitting,
  summaryLoading,
  transactionPage,
  transactions,
  wallet,
} = useRechargePayment()

const paymentRawText = computed(() => {
  if (!paymentView.value) {
    return ''
  }

  return paymentView.value.raw ? JSON.stringify(paymentView.value.raw, null, 2) : paymentView.value.content
})

const canCopyPaymentContent = computed(() => Boolean(paymentView.value?.content))
const paymentDialogDesc = computed(() =>
  paymentView.value?.mode === 'qrcode'
    ? t('personal.recharge.paymentDialogScanDesc')
    : t('personal.recharge.paymentDialogDesc'),
)
const paymentCopyLabel = computed(() =>
  paymentView.value?.mode === 'qrcode' ? t('personal.recharge.copyQrLink') : t('personal.recharge.copyLink'),
)
const paymentSummaryItems = computed(() => {
  if (!currentOrder.value) {
    return []
  }

  return [
    {
      label: t('personal.recharge.payAmount'),
      value: `¥${formatFen(currentOrder.value.payAmount)}`,
      strong: true,
    },
    {
      label: t('personal.recharge.orderNo'),
      value: currentOrder.value.orderNo,
      strong: false,
    },
    {
      label: t('personal.recharge.channel'),
      value: currentOrder.value.channelText || '-',
      strong: false,
    },
    {
      label: t('personal.recharge.payMethod'),
      value: currentOrder.value.payMethodText || currentOrder.value.payMethod,
      strong: false,
    },
  ]
})

const handleViewOrder = (order: RechargeOrderListItem) => {
  selectRechargeOrder(order)
  activeTab.value = 'recharge'
}

const handleContinuePay = async (order: RechargeOrderListItem) => {
  selectRechargeOrder(order)
  await resumePayment()
}

const handleCancelOrder = async (order: RechargeOrderListItem) => {
  selectRechargeOrder(order)
  await cancelOrder()
}
</script>

<template>
  <div class="wallet-page">
    <div class="wallet-page__body">
      <div class="wallet-page__content">
        <el-tabs v-model="activeTab" :stretch="isMobile" class="wallet-tabs">
          <el-tab-pane :label="t('personal.recharge.summaryTitle')" name="overview">
            <div class="wallet-pane">
              <RechargeSummary :wallet="wallet" :loading="summaryLoading" />
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('personal.recharge.tabsRecharge')" name="recharge">
            <div class="wallet-pane wallet-pane--recharge">
              <RechargeForm
                :amount="rechargeAmount"
                :channel-id="selectedChannelId"
                :pay-method="selectedPayMethod"
                :submitting="submitting"
                :can-recharge="canRecharge"
                :preset-amounts="presetAmounts"
                :channel-options="availableChannelOptions"
                :pay-method-options="availablePayMethodOptions"
                @update:amount="rechargeAmount = $event"
                @update:channel-id="selectedChannelId = $event"
                @update:pay-method="selectedPayMethod = $event"
                @select-preset="rechargeAmount = $event"
                @submit="submitRecharge"
              />

              <RechargeCurrentOrder
                :current-order="currentOrder"
                :recent-orders="recentRechargeOrders"
                :recent-orders-loading="recentOrdersLoading"
                :popup-blocked="popupBlocked"
                :status-checking="statusChecking"
                :canceling-order="cancelingOrder"
                :can-cancel-order="canCancelOrder"
                :can-resume-payment="canResumePayment"
                @refresh-status="refreshOrderStatus(true)"
                @resume-pay="resumePayment"
                @cancel-order="cancelOrder"
                @view-order="selectRechargeOrder"
                @continue-pay="handleContinuePay"
                @cancel-order-row="handleCancelOrder"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('personal.recharge.tabsOrders')" name="orders">
            <div class="wallet-pane">
              <RechargeOrderList
                :orders="rechargeOrders"
                :loading="orderLoading"
                :page="orderPage"
                :current-order-no="currentOrder?.orderNo"
                @page-change="handleOrderPageChange"
                @view-order="handleViewOrder"
                @continue-pay="handleContinuePay"
                @cancel-order="handleCancelOrder"
              />
            </div>
          </el-tab-pane>

          <el-tab-pane :label="t('personal.recharge.tabsHistory')" name="history">
            <div class="wallet-pane">
              <RechargeHistory
                :transactions="transactions"
                :loading="historyLoading"
                :page="transactionPage"
                @page-change="handlePageChange"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>

  <el-dialog
    v-model="paymentDialogVisible"
    :width="isMobile ? '94vw' : '520px'"
    :title="t('personal.recharge.paymentDialogTitle')"
    append-to-body
    align-center
  >
    <div v-if="paymentView" class="payment-dialog">
      <div class="payment-dialog__desc">{{ paymentDialogDesc }}</div>

      <div v-if="paymentSummaryItems.length > 0" class="payment-summary">
        <div
          v-for="item in paymentSummaryItems"
          :key="item.label"
          class="payment-summary__item"
        >
          <span class="payment-summary__label">{{ item.label }}</span>
          <span class="payment-summary__value" :class="{ 'is-strong': item.strong }">{{ item.value }}</span>
        </div>
      </div>

      <template v-if="paymentView.mode === 'qrcode'">
        <div class="payment-qr">
          <div class="payment-qr__badge">{{ currentOrder?.payMethodText || t('personal.recharge.scanToPay') }}</div>
          <div class="payment-qr__frame">
            <img :src="paymentView.qrDataUrl" :alt="t('personal.recharge.scanToPay')" class="payment-qr__image">
          </div>
          <div class="payment-qr__hint">{{ t('personal.recharge.scanToPay') }}</div>
          <div class="payment-qr__subhint">{{ t('personal.recharge.qrCodeHint') }}</div>
        </div>
      </template>

      <template v-else>
        <el-alert
          :title="t('personal.recharge.unsupportedPayData')"
          type="info"
          :closable="false"
          show-icon
        />
        <el-input
          :model-value="paymentRawText"
          type="textarea"
          :rows="8"
          readonly
          class="payment-dialog__raw"
        />
      </template>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="paymentDialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button plain :loading="statusChecking" @click="refreshOrderStatus(true)">
          {{ t('personal.recharge.checkResult') }}
        </el-button>
        <el-button v-if="canCancelOrder" type="danger" plain :loading="cancelingOrder" @click="cancelOrder">
          {{ t('personal.recharge.cancelOrder') }}
        </el-button>
        <el-button v-if="canCopyPaymentContent" type="primary" @click="copyPaymentContent">
          {{ paymentCopyLabel }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss">
.wallet-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.wallet-page__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.wallet-page__content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.wallet-tabs {
  flex: 1 1 auto;
  min-height: 0;
}

.wallet-tabs :deep(.el-tabs__content) {
  overflow: visible;
}

.wallet-pane {
  min-height: 0;
}

.wallet-pane--recharge {
  display: grid;
  grid-template-columns: minmax(340px, 460px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.payment-dialog {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.payment-dialog__desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.payment-dialog__raw {
  margin-top: 6px;
}

.payment-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.payment-summary__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  background: #fff;
}

.payment-summary__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.payment-summary__value {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.payment-summary__value.is-strong {
  font-size: 16px;
  font-weight: 700;
}

.payment-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 22px 18px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.95) 0%, rgba(255, 255, 255, 1) 100%);
  text-align: center;
}

.payment-qr__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(64, 158, 255, 0.12);
  color: var(--el-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.payment-qr__frame {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 20px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
}

.payment-qr__image {
  width: 240px;
  height: 240px;
  max-width: 100%;
  object-fit: contain;
  border-radius: 12px;
  background: transparent;
}

.payment-qr__hint {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.payment-qr__subhint {
  max-width: 320px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 1120px) {
  .wallet-pane--recharge {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .payment-summary {
    grid-template-columns: 1fr;
  }

  .payment-qr {
    padding: 14px;
    border-radius: 16px;
  }

  .payment-qr__frame {
    padding: 10px;
    border-radius: 18px;
  }

  .payment-qr__image {
    width: min(100%, 220px);
    height: auto;
  }

  .dialog-footer {
    justify-content: stretch;
  }

  .dialog-footer .el-button {
    flex: 1 1 calc(50% - 5px);
    min-width: 0;
  }
}
</style>
