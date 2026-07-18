<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
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
const router = useRouter()
const activeTab = shallowRef('wallet')
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
  { label: t('wallet.sourceAiGenerate'), value: 'ai_generate' },
  { label: t('wallet.sourceAiRefund'), value: 'ai_refund' },
])

const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', type: 'input', label: t('wallet.keyword'), placeholder: t('wallet.keywordPlaceholder'), width: 210 },
  { key: 'direction', type: 'select-v2', label: t('wallet.direction'), placeholder: t('wallet.direction'), width: 130, options: directionOptions.value },
  { key: 'source_type', type: 'select-v2', label: t('wallet.sourceType'), placeholder: t('wallet.sourceType'), width: 150, options: sourceTypeOptions.value },
  { key: 'dateRange', type: 'date-range', label: t('wallet.dateRange'), width: 260 },
])

const columns = computed(() => [
  { key: 'transaction_no', label: t('wallet.transactionNo'), minWidth: 190 },
  { key: 'direction_text', label: t('wallet.direction'), width: 100 },
  { key: 'amount_text', label: t('wallet.amount'), width: 110 },
  { key: 'balance_before_text', label: t('wallet.balanceBefore'), minWidth: 130 },
  { key: 'balance_after_text', label: t('wallet.balanceAfter'), minWidth: 130 },
  { key: 'source_type_text', label: t('wallet.sourceType'), width: 120 },
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

function goRecharge() {
  void router.push({ path: '/payment/recharge' })
}

async function refreshAll() {
  summary.value = await WalletApi.summary()
  await getList()
}

onMounted(() => {
  void refreshAll()
})

function emptySummary(): WalletSummaryResponse {
  return {
    balance_cents: 0,
    balance_text: '¥0.00',
    total_recharge_cents: 0,
    total_recharge_text: '¥0.00',
    total_consume_cents: 0,
    total_consume_text: '¥0.00',
  }
}
</script>

<template>
  <div class="personal-wallet-page">
    <el-tabs
      v-model="activeTab"
      class="personal-wallet-page__tabs"
    >
      <el-tab-pane
        :label="t('wallet.summary')"
        name="wallet"
      >
        <section class="personal-wallet-page__summary">
          <div
            v-for="item in summaryCards"
            :key="item.key"
            class="personal-wallet-page__summary-card"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>
        <div class="personal-wallet-page__actions">
          <el-button
            type="primary"
            @click="goRecharge"
          >
            {{ t('wallet.recharge') }}
          </el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane
        :label="t('wallet.fundsDetail')"
        name="transactions"
      >
        <section class="personal-wallet-page__transactions">
          <Search
            v-model="searchForm"
            :fields="searchFields"
            :collapse-count="2"
            @query="onSearch"
            @reset="onSearch"
          />

          <div class="personal-wallet-page__table">
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
                <el-tag
                  :type="tagType(row.direction)"
                  effect="light"
                >
                  {{ row.direction_text }}
                </el-tag>
              </template>
            </AppTable>
          </div>
        </section>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.personal-wallet-page,
.personal-wallet-page__tabs,
.personal-wallet-page__transactions {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.personal-wallet-page__tabs :deep(.el-tabs__header) {
  flex-shrink: 0;
}

.personal-wallet-page__tabs :deep(.el-tabs__content) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.personal-wallet-page__tabs :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.personal-wallet-page__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.personal-wallet-page__summary-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  background: var(--el-bg-color);
}

.personal-wallet-page__summary-card span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.personal-wallet-page__summary-card strong {
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
}

.personal-wallet-page__actions {
  margin-top: 16px;
}

.personal-wallet-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .personal-wallet-page__summary {
    grid-template-columns: 1fr;
  }
}
</style>
