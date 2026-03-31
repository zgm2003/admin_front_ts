<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { useTable } from '@/hooks/useTable'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { UserWalletApi } from '@/api/pay/wallet'
import { UsersListApi } from '@/api/user/users'
import { formatFen } from '@/enums/PayEnum'
import WalletTransactionDialog from './components/WalletTransactionDialog.vue'
import WalletAdjustDialog from './components/WalletAdjustDialog.vue'
import { formatWalletUserDisplay, formatWalletUserLabel } from './helpers'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

// ==================== 下拉字典 ====================
const walletTypeArr = ref<{ label: string; value: number }[]>([])

const init = async () => {
  const data = await UserWalletApi.init()
  walletTypeArr.value = data.dict.wallet_type_arr
}

// ==================== 搜索 ====================
const searchForm = ref({
  user_id: '' as number | '',
})

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('pay_wallet.filter.user'),
    fetchMethod: UsersListApi.list,
    labelField: formatWalletUserLabel,
    valueField: 'id',
    placeholder: t('pay_wallet.filter.user'),
    width: isMobile.value ? 220 : 260,
  },
])

// ==================== 表格 ====================
const {
  loading: listLoading,
  data: listData,
  page,
  getList,
  onSearch,
  onPageChange,
  refresh,
} = useTable({
  api: UserWalletApi,
  searchForm,
})

const columns = computed(() => [
  { key: 'user_name', label: t('pay_wallet.table.user_name'), width: 240 },
  { key: 'balance', label: t('pay_wallet.table.balance'), formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'frozen', label: t('pay_wallet.table.frozen'), formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'total_recharge', label: t('pay_wallet.table.total_recharge'), formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'total_consume', label: t('pay_wallet.table.total_consume'), formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'created_at', label: t('pay_wallet.table.created_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 200 },
])

const txDialogVisible = ref(false)
const activeTransactionUserId = ref<number | ''>('')
const openTransactions = (row: any) => {
  activeTransactionUserId.value = row.user_id
  txDialogVisible.value = true
}

// ==================== 调账 ====================
const adjustVisible = ref(false)
const activeAdjustUserId = ref<number | ''>('')

const openAdjust = (row?: any) => {
  activeAdjustUserId.value = row ? row.user_id : ''
  adjustVisible.value = true
}

const handleAdjustSuccess = () => {
  void getList()
}

onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #cell-user_name="{ row }">
          <span>{{ formatWalletUserDisplay(row) }}</span>
        </template>
        <template #toolbar-left>
          <el-button v-if="userStore.can('pay_wallet_adjust')" type="warning" @click="openAdjust()">
            {{ t('pay_wallet.actions.adjust') }}
          </el-button>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="openTransactions(row)">{{ t('pay_wallet.actions.transactions') }}</el-button>
          <el-button type="warning" text v-if="userStore.can('pay_wallet_adjust')" @click="openAdjust(row)">
            {{ t('pay_wallet.actions.adjust') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <WalletTransactionDialog
    v-model="txDialogVisible"
    :user-id="activeTransactionUserId"
    :wallet-type-options="walletTypeArr"
  />

  <WalletAdjustDialog
    v-model="adjustVisible"
    :user-id="activeAdjustUserId"
    @success="handleAdjustSuccess"
  />
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
