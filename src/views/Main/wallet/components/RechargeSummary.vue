<script setup lang="ts">
import { computed } from 'vue'
import { formatFen } from '@/enums'
import { useI18n } from 'vue-i18n'
import type { WalletSummaryItem } from '../types'

const props = defineProps<{
  wallet: WalletSummaryItem | null
  loading: boolean
}>()

const { t } = useI18n()

const stats = computed(() => {
  if (!props.wallet) {
    return []
  }

  return [
    { key: 'balance', label: t('personal.recharge.currentBalance'), value: props.wallet.balance, tone: 'primary' },
    { key: 'frozen', label: t('personal.recharge.frozen'), value: props.wallet.frozen, tone: 'warning' },
    { key: 'total_recharge', label: t('personal.recharge.totalRecharge'), value: props.wallet.total_recharge, tone: 'primary' },
    { key: 'total_consume', label: t('personal.recharge.totalConsume'), value: props.wallet.total_consume, tone: 'danger' },
  ]
})
</script>

<template>
  <el-card shadow="never" class="recharge-card" v-loading="loading">
    <template #header>
      <div class="section-header">
        <div>
          <div class="section-title">{{ t('personal.recharge.summaryTitle') }}</div>
          <div class="section-subtitle">{{ t('personal.recharge.summaryDesc') }}</div>
        </div>
      </div>
    </template>

    <div v-if="wallet" class="summary-grid">
      <div
        v-for="item in stats"
        :key="item.key"
        class="summary-item"
        :class="`is-${item.tone}`"
      >
        <span class="summary-label">{{ item.label }}</span>
        <strong class="summary-value">¥{{ formatFen(item.value) }}</strong>
      </div>
    </div>

    <el-empty v-else :description="t('personal.recharge.noWallet')" />

    <div v-if="wallet?.created_at" class="summary-footer">
      {{ t('personal.recharge.walletCreatedAt') }}: {{ wallet.created_at }}
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
  align-items: flex-start;
  justify-content: space-between;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.section-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid transparent;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, rgba(255, 255, 255, 0.96) 100%);
}

.summary-item.is-primary {
  border-color: rgba(64, 158, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(64, 158, 255, 0.08);
}

.summary-item.is-success {
  border-color: rgba(103, 194, 58, 0.18);
  box-shadow: inset 0 1px 0 rgba(103, 194, 58, 0.08);
}

.summary-item.is-warning {
  border-color: rgba(230, 162, 60, 0.2);
  box-shadow: inset 0 1px 0 rgba(230, 162, 60, 0.08);
}

.summary-item.is-danger {
  border-color: rgba(245, 108, 108, 0.2);
  box-shadow: inset 0 1px 0 rgba(245, 108, 108, 0.08);
}

.summary-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.summary-value {
  font-size: 24px;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.summary-footer {
  margin-top: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item {
    padding: 14px;
    border-radius: 16px;
  }

  .summary-value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
