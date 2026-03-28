<script setup lang="ts">
import { computed } from 'vue'
import { formatFen, PayStatus } from '@/enums'
import { useI18n } from 'vue-i18n'
import type { DictOption } from '@/types/common'
import type { RechargeOrderState, RechargePresetOption } from '../types'

const props = defineProps<{
  amount: number | null
  channelId: number | null
  payMethod: string
  submitting: boolean
  statusChecking: boolean
  cancelingOrder: boolean
  canRecharge: boolean
  canCancelOrder: boolean
  canResumePayment: boolean
  popupBlocked: boolean
  presetAmounts: RechargePresetOption[]
  channelOptions: DictOption<number>[]
  payMethodOptions: DictOption<string>[]
  currentOrder: RechargeOrderState | null
}>()

const emit = defineEmits<{
  'update:amount': [value: number | null]
  'update:channel-id': [value: number | null]
  'update:pay-method': [value: string]
  'select-preset': [value: number]
  submit: []
  'cancel-order': []
  'refresh-status': []
  'resume-pay': []
}>()

const { t } = useI18n()

const configMissing = computed(() => props.channelOptions.length === 0 || props.payMethodOptions.length === 0)

const payStatusType = (status: number) => {
  if (status === PayStatus.PAID) return 'success'
  if (status === PayStatus.CLOSED) return 'info'
  if (status === PayStatus.EXCEPTION) return 'danger'
  return 'warning'
}

const presetLabel = (item: RechargePresetOption) => item.label ?? `¥${item.amount}`

const onAmountChange = (value: number | undefined) => {
  emit('update:amount', value ?? null)
}

const onChannelChange = (value: number | undefined) => {
  emit('update:channel-id', value ?? null)
}
</script>

<template>
  <el-card shadow="never" class="recharge-card">
    <template #header>
      <div class="section-header">
        <div class="section-title">{{ t('personal.recharge.formTitle') }}</div>
        <div class="section-subtitle">{{ t('personal.recharge.formDesc') }}</div>
      </div>
    </template>

    <el-alert
      v-if="configMissing"
      :title="t('personal.recharge.configHint')"
      type="warning"
      :closable="false"
      show-icon
      class="state-alert"
    />

    <div class="form-body">
      <div class="preset-block">
        <div class="block-label">{{ t('personal.recharge.preset') }}</div>
        <div class="preset-list">
          <el-button
            v-for="item in presetAmounts"
            :key="item.amount"
            class="preset-button"
            :type="amount === item.amount ? 'primary' : 'default'"
            :plain="amount !== item.amount"
            @click="emit('select-preset', item.amount)"
          >
            {{ presetLabel(item) }}
          </el-button>
        </div>
      </div>

      <el-form label-position="top" label-width="auto">
        <div class="field-grid">
          <el-form-item :label="t('personal.recharge.channel')">
            <el-select-v2
              :model-value="channelId ?? undefined"
              :options="channelOptions"
              class="field-control"
              @update:model-value="onChannelChange"
            />
          </el-form-item>

          <el-form-item :label="t('personal.recharge.payMethod')">
            <el-select-v2
              :model-value="payMethod || undefined"
              :options="payMethodOptions"
              class="field-control"
              @update:model-value="emit('update:pay-method', $event ?? '')"
            />
          </el-form-item>
        </div>

        <el-form-item :label="t('personal.recharge.customAmount')">
          <el-input-number
            :model-value="amount ?? undefined"
            :min="0.01"
            :precision="2"
            :step="10"
            controls-position="right"
            class="field-control"
            @update:model-value="onAmountChange"
          />
        </el-form-item>
      </el-form>

      <div v-if="currentOrder" class="order-card">
        <div class="order-card__header">
          <span class="order-card__title">{{ t('personal.recharge.orderInfoTitle') }}</span>
          <el-tag :type="payStatusType(currentOrder.payStatus)" effect="light">
            {{ currentOrder.payStatusText }}
          </el-tag>
        </div>

        <div class="order-grid">
          <div class="order-item">
            <span class="order-item__label">{{ t('personal.recharge.orderNo') }}</span>
            <span class="order-item__value">{{ currentOrder.orderNo }}</span>
          </div>
          <div class="order-item">
            <span class="order-item__label">{{ t('personal.recharge.payAmount') }}</span>
            <span class="order-item__value">¥{{ formatFen(currentOrder.payAmount) }}</span>
          </div>
          <div class="order-item">
            <span class="order-item__label">{{ t('personal.recharge.channel') }}</span>
            <span class="order-item__value">{{ currentOrder.channelText }}</span>
          </div>
          <div class="order-item">
            <span class="order-item__label">{{ t('personal.recharge.payMethod') }}</span>
            <span class="order-item__value">{{ currentOrder.payMethodText }}</span>
          </div>
          <div class="order-item">
            <span class="order-item__label">{{ t('personal.recharge.bizStatus') }}</span>
            <span class="order-item__value">{{ currentOrder.bizStatusText }}</span>
          </div>
          <div class="order-item">
            <span class="order-item__label">{{ t('personal.recharge.expireTime') }}</span>
            <span class="order-item__value">{{ currentOrder.expireTime || '-' }}</span>
          </div>
          <div class="order-item">
            <span class="order-item__label">{{ t('personal.recharge.transactionNo') }}</span>
            <span class="order-item__value">{{ currentOrder.transactionNo || '-' }}</span>
          </div>
          <div class="order-item">
            <span class="order-item__label">{{ t('personal.recharge.payTime') }}</span>
            <span class="order-item__value">{{ currentOrder.payTime || '-' }}</span>
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

      <div class="form-footer">
        <el-button
          type="primary"
          class="submit-button"
          :loading="submitting"
          :disabled="!canRecharge"
          @click="emit('submit')"
        >
          {{ t('personal.recharge.submit') }}
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.recharge-card {
  height: 100%;
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

.form-body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.state-alert {
  margin-bottom: 16px;
}

.block-label {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.preset-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  align-items: stretch;
}

.preset-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  height: 40px;
  margin-left: 0;
  padding: 0 16px;
  border-radius: 14px;
}

.preset-list :deep(.el-button + .el-button) {
  margin-left: 0;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field-control {
  width: 100%;
}

.order-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.order-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.order-card__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
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

.order-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.form-footer {
  display: flex;
  justify-content: flex-start;
}

.submit-button {
  min-width: 144px;
  border-radius: 14px;
}

@media (max-width: 768px) {
  .recharge-card {
    border-radius: 16px;
  }

  .preset-list,
  .field-grid,
  .order-grid {
    grid-template-columns: 1fr;
  }

  .preset-button {
    height: 38px;
    border-radius: 12px;
  }

  .order-card {
    padding: 14px;
  }

  .order-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .submit-button {
    width: 100%;
  }
}
</style>
