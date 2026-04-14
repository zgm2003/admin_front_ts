<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatFen } from '@/enums/PayEnum'

const props = defineProps<{
  loading: boolean
  wallet: {
    balance: number
    frozen: number
    total_recharge: number
    total_consume: number
  }
}>()

defineEmits<{
  open: []
}>()

const { t } = useI18n()

function isWalletMetricHighlighted(value: number) {
  return value > 0
}

const walletMetrics = computed(() => [
  {
    key: 'balance',
    label: t('home.walletAvailable'),
    value: props.wallet.balance,
  },
  {
    key: 'frozen',
    label: t('home.walletFrozen'),
    value: props.wallet.frozen,
  },
  {
    key: 'total_recharge',
    label: t('home.walletTotalRecharge'),
    value: props.wallet.total_recharge,
  },
  {
    key: 'total_consume',
    label: t('home.walletTotalConsume'),
    value: props.wallet.total_consume,
  },
])
</script>

<template>
  <section class="dashboard-card wallet-card" v-loading="loading">
    <div class="card-head">
      <div>
        <div class="card-title">{{ $t('home.walletTitle') }}</div>
        <div class="card-subtitle">{{ $t('home.walletSubtitle') }}</div>
      </div>
      <el-button text type="primary" @click="$emit('open')">{{ $t('home.openWallet') }}</el-button>
    </div>

    <div class="wallet-grid">
      <div v-for="item in walletMetrics" :key="item.key" class="wallet-item">
        <span class="wallet-item__label">{{ item.label }}</span>
        <strong class="wallet-item__value" :class="{ 'is-highlight': isWalletMetricHighlighted(item.value) }">
          ¥{{ formatFen(item.value) }}
        </strong>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.dashboard-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  background: var(--el-bg-color);
  padding: 16px 16px 14px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.card-subtitle {
  margin-top: 4px;
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.wallet-grid {
  display: grid;
  flex: 1 1 auto;
  min-height: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.wallet-item {
  padding: 8px 10px;
  border-radius: 14px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 72px;
}

.wallet-item__label {
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.wallet-item__value {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.wallet-item__value.is-highlight {
  font-size: 24px;
  line-height: 1.1;
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .dashboard-card {
    padding: 14px;
  }

  .card-subtitle {
    margin-bottom: 10px;
  }

  .wallet-grid {
    grid-template-columns: 1fr;
  }
}
</style>
