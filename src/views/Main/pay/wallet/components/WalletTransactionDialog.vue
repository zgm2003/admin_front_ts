<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { UserWalletApi } from '@/api/pay/wallet'
import { UsersListApi } from '@/api/user/users'
import { WalletType, formatFen } from '@/enums'
import { formatWalletBizActionDisplay, formatWalletUserDisplay, formatWalletUserLabel } from '../helpers'
import { useCrudTable } from '@/hooks/useCrudTable'

const props = withDefaults(defineProps<{
  modelValue: boolean
  userId?: number | ''
  walletTypeOptions?: Array<{ label: string; value: number }>
}>(), {
  userId: '',
  walletTypeOptions: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()
const isMobile = useIsMobile()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const txSearchForm = ref({
  user_id: '' as number | '',
  type: '' as number | '',
})

const txSearchFields = computed<SearchField[]>(() => [
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
  {
    key: 'type',
    type: 'select-v2',
    label: t('pay_wallet.txn.table.type'),
    options: props.walletTypeOptions,
    width: 160,
  },
])

const walletTransactionTableApi = {
  list: (params: Record<string, unknown>) => UserWalletApi.transactions(params),
}

const {
  loading,
  data,
  page,
  onPageChange,
  refresh,
  onSearch,
} = useCrudTable({
  api: walletTransactionTableApi,
  searchForm: txSearchForm,
})

const typeLabels = computed(() => ({
  recharge: t('pay_wallet.txn.bizAction.recharge'),
  consume: t('pay_wallet.txn.bizAction.consume'),
  adjust: t('pay_wallet.txn.bizAction.adjust'),
}))

const columns = computed(() => [
  { key: 'user_name', label: t('pay_wallet.table.user_name'), width: 220 },
  { key: 'biz_action_no', label: t('pay_wallet.txn.table.biz_action_no'), minWidth: 280 },
  { key: 'type_text', label: t('pay_wallet.txn.table.type'), width: 140 },
  { key: 'available_delta', label: t('pay_wallet.txn.table.available_delta'), width: 140, formatter: (_r: any, _c: any, v: number) => `${v >= 0 ? '+' : ''}¥${formatFen(Math.abs(v))}` },
  { key: 'frozen_delta', label: t('pay_wallet.txn.table.frozen_delta'), width: 140, formatter: (_r: any, _c: any, v: number) => `${v >= 0 ? '+' : ''}¥${formatFen(Math.abs(v))}` },
  { key: 'balance_before', label: t('pay_wallet.txn.table.balance_before'), width: 140, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'balance_after', label: t('pay_wallet.txn.table.balance_after'), width: 140, formatter: (_r: any, _c: any, v: number) => `¥${formatFen(v)}` },
  { key: 'order_no', label: t('pay_wallet.txn.table.order_no'), width: 200 },
  { key: 'title', label: t('pay_wallet.txn.table.title'), minWidth: 180 },
  { key: 'created_at', label: t('pay_wallet.txn.table.created_at'), width: 180 },
])

const walletTypeTag = (val: number) => {
  if (val === WalletType.RECHARGE) return 'success'
  if (val === WalletType.CONSUME) return 'warning'
  if (val === WalletType.ADJUST) return 'info'
  return undefined
}

const syncDefaultUser = () => {
  txSearchForm.value.user_id = props.userId ?? ''
}

const handleReset = () => {
  syncDefaultUser()
  txSearchForm.value.type = ''
  onSearch()
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      return
    }

    syncDefaultUser()
    txSearchForm.value.type = ''
    onSearch()
  },
)

watch(
  () => props.userId,
  () => {
    if (!props.modelValue) {
      return
    }

    syncDefaultUser()
    onSearch()
  },
)
</script>

<template>
  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '1280px'" :title="t('pay_wallet.txn.title')">
    <Search
      v-model="txSearchForm"
      :fields="txSearchFields"
      :collapse-count="2"
      @query="onSearch"
      @reset="handleReset"
    />
    <div class="tx-table">
      <AppTable
        :columns="columns"
        :data="data"
        :loading="loading"
        row-key="id"
        :pagination="page"
        :show-index="true"
        :fixed-footer="false"
        :show-column-setting="false"
        :table-props="{ maxHeight: 480, size: 'small' }"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #cell-user_name="{ row }">
          <span>{{ formatWalletUserDisplay(row) }}</span>
        </template>
        <template #cell-biz_action_no="{ row }">
          <span class="tx-biz-action" :title="row.biz_action_no || ''">
            {{ formatWalletBizActionDisplay(row, typeLabels) }}
          </span>
        </template>
        <template #cell-type_text="{ row }">
          <el-tag :type="walletTypeTag(row.type)" size="small">{{ row.type_text }}</el-tag>
        </template>
        <template #cell-available_delta="{ row }">
          <span :style="{ color: row.available_delta >= 0 ? '#67c23a' : '#f56c6c' }">
            {{ row.available_delta >= 0 ? '+' : '' }}¥{{ formatFen(Math.abs(row.available_delta)) }}
          </span>
        </template>
        <template #cell-frozen_delta="{ row }">
          <span :style="{ color: row.frozen_delta >= 0 ? '#67c23a' : '#f56c6c' }">
            {{ row.frozen_delta >= 0 ? '+' : '' }}¥{{ formatFen(Math.abs(row.frozen_delta)) }}
          </span>
        </template>
      </AppTable>
    </div>
  </AppDialog>
</template>

<style scoped>
.tx-table {
  margin-top: 12px;
}

.tx-biz-action {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
}
</style>
