<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useTable } from '@/components/Table'
import { WalletApi, type WalletUserItem, type WalletUserListParams } from '@/api/wallet'
import type { SearchField, SearchFormModel } from '@/components/Search/types'

type WalletUserSearchForm = WalletUserListParams & SearchFormModel

const { t } = useI18n()

const searchForm = ref<WalletUserSearchForm>({
  current_page: 1,
  page_size: 20,
  keyword: '',
})

const walletUserApi = { list: WalletApi.walletUsersList }
const { loading, data, page, onPageChange, refresh, resetPage, getList } = useTable<WalletUserItem, WalletUserListParams>({
  api: walletUserApi,
  searchForm,
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', type: 'input', label: t('wallet.keyword'), placeholder: t('wallet.userKeywordPlaceholder'), width: 220 },
])

const columns = computed(() => [
  { key: 'user_id', label: t('wallet.userId'), width: 100 },
  { key: 'username', label: t('wallet.username'), minWidth: 130 },
  { key: 'account', label: t('wallet.account'), minWidth: 170 },
  { key: 'balance', label: t('wallet.balance'), width: 150 },
  { key: 'available_balance', label: t('wallet.availableBalance'), width: 150 },
  { key: 'held_amount', label: t('wallet.heldAmount'), width: 130 },
  { key: 'total_recharge', label: t('wallet.totalRecharge'), width: 150 },
  { key: 'total_consume', label: t('wallet.totalConsume'), width: 150 },
  { key: 'updated_at', label: t('wallet.updatedAt'), minWidth: 170 },
])

const tableProps = computed(() => ({ height: '100%' }))

function onSearch() {
  resetPage()
  void getList()
}

async function refreshAll() {
  await WalletApi.walletUsersPageInit()
  await getList()
}

onMounted(() => {
  void refreshAll()
})
</script>

<template>
  <div class="wallet-users-page">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />

    <div class="wallet-users-page__table">
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
        <template #cell-balance="{ row }">
          <span>¥{{ row.balance }}</span>
        </template>
        <template #cell-available_balance="{ row }">
          <span>¥{{ row.available_balance }}</span>
        </template>
        <template #cell-held_amount="{ row }">
          <span>¥{{ row.held_amount }}</span>
        </template>
        <template #cell-total_recharge="{ row }">
          <span>¥{{ row.total_recharge }}</span>
        </template>
        <template #cell-total_consume="{ row }">
          <span>¥{{ row.total_consume }}</span>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.wallet-users-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.wallet-users-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}
</style>
