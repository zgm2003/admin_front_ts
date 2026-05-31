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
  { key: 'balance_text', label: t('wallet.balance'), width: 130 },
  { key: 'total_recharge_text', label: t('wallet.totalRecharge'), width: 130 },
  { key: 'total_consume_text', label: t('wallet.totalConsume'), width: 130 },
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
      />
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
