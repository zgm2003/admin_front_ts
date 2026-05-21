<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useTable } from '@/components/Table'
import { WalletApi, type WalletDirection, type WalletLedgerPageInitResponse, type WalletSourceType, type WalletTransactionItem, type WalletTransactionListParams } from '@/api/wallet'
import type { SearchField, SearchFormModel } from '@/components/Search/types'
import type { DictOption } from '@/types/common'

type WalletLedgerSearchForm = WalletTransactionListParams & SearchFormModel & {
  user_id_text: string
  dateRange: string[]
}

const { t } = useI18n()

const dict = shallowRef<WalletLedgerPageInitResponse['dict']>({
  direction_arr: [],
  source_type_arr: [],
})
const searchForm = ref<WalletLedgerSearchForm>({
  current_page: 1,
  page_size: 20,
  user_id_text: '',
  keyword: '',
  direction: '',
  source_type: '',
  date_start: '',
  date_end: '',
  dateRange: [],
})

const directionOptions = computed<DictOption<WalletDirection>[]>(() => (
  dict.value.direction_arr.length > 0 ? dict.value.direction_arr : [
    { label: t('wallet.directionIn'), value: 'in' },
    { label: t('wallet.directionOut'), value: 'out' },
  ]
))

const sourceTypeOptions = computed<DictOption<WalletSourceType>[]>(() => (
  dict.value.source_type_arr.length > 0 ? dict.value.source_type_arr : [
    { label: t('wallet.sourceRecharge'), value: 'recharge' },
    { label: t('wallet.sourceConsume'), value: 'consume' },
  ]
))

const apiSearchForm = computed<WalletTransactionListParams>(() => {
  const [dateStart, dateEnd] = searchForm.value.dateRange
  return {
    current_page: searchForm.value.current_page,
    page_size: searchForm.value.page_size,
    user_id: parsePositiveID(searchForm.value.user_id_text),
    keyword: searchForm.value.keyword,
    direction: searchForm.value.direction,
    source_type: searchForm.value.source_type,
    date_start: dateStart || '',
    date_end: dateEnd || '',
  }
})

const ledgerApi = { list: WalletApi.ledger }
const { loading, data, page, onPageChange, refresh, resetPage, getList } = useTable<WalletTransactionItem, WalletTransactionListParams>({
  api: ledgerApi,
  searchForm: apiSearchForm,
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', type: 'input', label: t('wallet.keyword'), placeholder: t('wallet.ledgerKeywordPlaceholder'), width: 210 },
  { key: 'user_id_text', type: 'input', label: t('wallet.userId'), placeholder: t('wallet.userId'), width: 130 },
  { key: 'direction', type: 'select-v2', label: t('wallet.direction'), placeholder: t('wallet.direction'), width: 130, options: directionOptions.value },
  { key: 'source_type', type: 'select-v2', label: t('wallet.sourceType'), placeholder: t('wallet.sourceType'), width: 130, options: sourceTypeOptions.value },
  { key: 'dateRange', type: 'date-range', label: t('wallet.dateRange'), width: 260 },
])

const columns = computed(() => [
  { key: 'transaction_no', label: t('wallet.transactionNo'), minWidth: 190 },
  { key: 'user_id', label: t('wallet.userId'), width: 100 },
  { key: 'username', label: t('wallet.username'), minWidth: 130 },
  { key: 'account', label: t('wallet.account'), minWidth: 170 },
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

function parsePositiveID(value: string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

async function refreshAll() {
  const result = await WalletApi.ledgerInit()
  dict.value = result.dict
  await getList()
}

onMounted(() => {
  void refreshAll()
})
</script>

<template>
  <div class="wallet-ledger-page">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="3"
      @query="onSearch"
      @reset="onSearch"
    />

    <div class="wallet-ledger-page__table">
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
.wallet-ledger-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.wallet-ledger-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
</style>
