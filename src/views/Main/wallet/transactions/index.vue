<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useTable } from '@/components/Table'
import { WalletApi, type WalletDirection, type WalletSourceType, type WalletSummaryResponse, type WalletTransactionItem, type WalletTransactionListParams } from '@/api/wallet'
import type { SearchField, SearchFormModel } from '@/components/Search/types'
import type { DictOption } from '@/types/common'

type WalletTransactionSearchForm = WalletTransactionListParams & SearchFormModel & {
  dateRange: string[]
}

const { t } = useI18n()

const summary = ref<WalletSummaryResponse>(emptySummary())
const searchForm = ref<WalletTransactionSearchForm>({
  current_page: 1,
  page_size: 20,
  keyword: '',
  direction: '',
  source_type: '',
  date_start: '',
  date_end: '',
  dateRange: [],
})

const apiSearchForm = computed<WalletTransactionListParams>(() => {
  const [dateStart, dateEnd] = searchForm.value.dateRange
  return {
    current_page: searchForm.value.current_page,
    page_size: searchForm.value.page_size,
    keyword: searchForm.value.keyword,
    direction: searchForm.value.direction,
    source_type: searchForm.value.source_type,
    date_start: dateStart || '',
    date_end: dateEnd || '',
  }
})

const transactionApi = { list: WalletApi.transactions }
const { loading, data, page, onPageChange, refresh, resetPage, getList } = useTable<WalletTransactionItem, WalletTransactionListParams>({
  api: transactionApi,
  searchForm: apiSearchForm,
})

const summaryCards = computed(() => [
  { key: 'balance', label: t('wallet.balance'), value: summary.value.balance_text },
  { key: 'totalRecharge', label: t('wallet.totalRecharge'), value: summary.value.total_recharge_text },
  { key: 'totalConsume', label: t('wallet.totalConsume'), value: summary.value.total_consume_text },
])

const directionOptions = computed<DictOption<WalletDirection>[]>(() => [
  { label: t('wallet.directionIn'), value: 'in' },
  { label: t('wallet.directionOut'), value: 'out' },
])

const sourceTypeOptions = computed<DictOption<WalletSourceType>[]>(() => [
  { label: t('wallet.sourceRecharge'), value: 'recharge' },
  { label: t('wallet.sourceConsume'), value: 'consume' },
])

const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', type: 'input', label: t('wallet.keyword'), placeholder: t('wallet.keywordPlaceholder'), width: 210 },
  { key: 'direction', type: 'select-v2', label: t('wallet.direction'), placeholder: t('wallet.direction'), width: 130, options: directionOptions.value },
  { key: 'source_type', type: 'select-v2', label: t('wallet.sourceType'), placeholder: t('wallet.sourceType'), width: 130, options: sourceTypeOptions.value },
  { key: 'dateRange', type: 'date-range', label: t('wallet.dateRange'), width: 260 },
])

const columns = computed(() => [
  { key: 'transaction_no', label: t('wallet.transactionNo'), minWidth: 190 },
  { key: 'direction_text', label: t('wallet.direction'), width: 100 },
  { key: 'amount_text', label: t('wallet.amount'), width: 110 },
  { key: 'balance_before_text', label: t('wallet.balanceBefore'), minWidth: 130 },
  { key: 'balance_after_text', label: t('wallet.balanceAfter'), minWidth: 130 },
  { key: 'source_type_text', label: t('wallet.sourceType'), width: 110 },
  { key: 'remark', label: t('wallet.remark'), minWidth: 160 },
  { key: 'created_at', label: t('wallet.createdAt'), minWidth: 170 },
])

const tableProps = computed(() => ({ height: '100%' }))

function onSearch() {
  resetPage()
  void getList()
}

function tagType(direction: WalletDirection) {
  return direction === 'in' ? 'success' : 'warning'
}

async function refreshAll() {
  const result = await WalletApi.summary()
  summary.value = result
  await getList()
}

onMounted(() => {
  void refreshAll()
})

function emptySummary(): WalletSummaryResponse {
  return {
    balance_cents: 0,
    balance_text: '0.00',
    total_recharge_cents: 0,
    total_recharge_text: '0.00',
    total_consume_cents: 0,
    total_consume_text: '0.00',
  }
}
</script>

<template>
  <div class="wallet-transactions-page">
    <div class="wallet-transactions-page__summary">
      <div
        v-for="item in summaryCards"
        :key="item.key"
        class="wallet-transactions-page__summary-card"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </div>
    </div>

    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="2"
      @query="onSearch"
      @reset="onSearch"
    />

    <div class="wallet-transactions-page__table">
      <AppTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="page"
        :table-props="tableProps"
        row-key="id"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #cell-direction_text="{ row }">
          <el-tag :type="tagType(row.direction)" effect="light">
            {{ row.direction_text }}
          </el-tag>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.wallet-transactions-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.wallet-transactions-page__summary {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.wallet-transactions-page__summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.wallet-transactions-page__summary-card span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.wallet-transactions-page__summary-card strong {
  color: var(--el-text-color-primary);
  font-size: 22px;
  font-weight: 700;
}

.wallet-transactions-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .wallet-transactions-page__summary {
    grid-template-columns: 1fr;
  }
}
</style>
