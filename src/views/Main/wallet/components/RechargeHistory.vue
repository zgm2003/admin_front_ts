<script setup lang="ts">
import { computed } from 'vue'
import { WalletType, formatFen } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import type { WalletTransactionItem, WalletTransactionPage } from '../types'

const props = defineProps<{
  transactions: WalletTransactionItem[]
  loading: boolean
  page: WalletTransactionPage
}>()

const emit = defineEmits<{
  'page-change': [page: number]
}>()

const { t } = useI18n()
const isMobile = useIsMobile()

const showPagination = computed(() => props.page.total > props.page.page_size)
const paginationLayout = computed(() => (isMobile.value ? 'prev, pager, next' : 'total, prev, pager, next'))

const typeTag = (type: number) => {
  if (type === WalletType.RECHARGE || type === WalletType.REFUND || type === WalletType.UNFREEZE) {
    return 'success'
  }

  if (type === WalletType.CONSUME || type === WalletType.FREEZE) {
    return 'warning'
  }

  if (type === WalletType.ADJUST) {
    return 'info'
  }

  return undefined
}

const formatDelta = (value: number) => `${value >= 0 ? '+' : '-'}¥${formatFen(Math.abs(value))}`
</script>

<template>
  <el-card shadow="never" class="recharge-card" v-loading="loading">
    <template #header>
      <div class="section-header">
        <div class="section-title">{{ t('personal.recharge.historyTitle') }}</div>
        <div class="section-subtitle">{{ t('personal.recharge.historyDesc') }}</div>
      </div>
    </template>

    <div class="history-table-wrap">
      <el-table :data="transactions" size="small" class="history-table">
        <el-table-column :label="t('personal.recharge.type')" min-width="120">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.type)" size="small">{{ row.type_text }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('personal.recharge.change')" min-width="180">
          <template #default="{ row }">
            <div class="delta-stack">
              <span
                v-if="row.available_delta"
                class="delta-line"
                :class="row.available_delta > 0 ? 'is-positive' : 'is-negative'"
              >
                {{ t('personal.recharge.available') }} {{ formatDelta(row.available_delta) }}
              </span>
              <span
                v-if="row.frozen_delta"
                class="delta-line"
                :class="row.frozen_delta > 0 ? 'is-positive' : 'is-negative'"
              >
                {{ t('personal.recharge.frozen') }} {{ formatDelta(row.frozen_delta) }}
              </span>
              <span v-if="!row.available_delta && !row.frozen_delta" class="delta-line is-empty">-</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column :label="t('personal.recharge.balanceAfter')" min-width="120">
          <template #default="{ row }">
            ¥{{ formatFen(row.balance_after) }}
          </template>
        </el-table-column>

        <el-table-column prop="title" :label="t('personal.recharge.titleCol')" min-width="180" />
        <el-table-column prop="remark" :label="t('personal.recharge.remark')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="order_no" :label="t('personal.recharge.orderNo')" min-width="160" />
        <el-table-column prop="created_at" :label="t('personal.recharge.createdAt')" min-width="180" />

        <template #empty>
          <el-empty :description="t('personal.recharge.historyEmpty')" />
        </template>
      </el-table>
    </div>

    <div v-if="showPagination" class="history-pagination">
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

.history-table {
  min-width: 760px;
  width: 100%;
}

.history-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.delta-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.delta-line {
  font-size: 12px;
  line-height: 1.4;
}

.delta-line.is-positive {
  color: #67c23a;
}

.delta-line.is-negative {
  color: #f56c6c;
}

.delta-line.is-empty {
  color: var(--el-text-color-disabled);
}

.history-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

@media (max-width: 768px) {
  .recharge-card {
    border-radius: 16px;
  }

  .history-table {
    min-width: 680px;
  }

  .history-pagination {
    justify-content: center;
  }
}
</style>
