<script setup lang="ts">
import { computed } from 'vue'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useUserStore } from '@/store/user'
import type { PageState } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'
import type { PaymentRechargeListItem } from '@/api/payment/recharges'
import type { PaymentRechargeSearchForm } from '../composables/usePaymentRechargePage'

const props = defineProps<{
  columns: unknown[]
  data: PaymentRechargeListItem[]
  loading: boolean
  page: PageState
  searchFields: SearchField[]
  canPay: (row: PaymentRechargeListItem) => boolean
  canSync: (row: PaymentRechargeListItem) => boolean
  canClose: (row: PaymentRechargeListItem) => boolean
}>()

const searchForm = defineModel<PaymentRechargeSearchForm>('searchForm', { required: true })
const emit = defineEmits<{
  search: []
  refresh: []
  pageChange: [page: PageState]
  pay: [row: PaymentRechargeListItem]
  sync: [row: PaymentRechargeListItem]
  close: [row: PaymentRechargeListItem]
}>()

const userStore = useUserStore()
const tableProps = computed(() => ({ height: '100%' }))

function tagType(status: PaymentRechargeListItem['status']) {
  if (status === 'credited' || status === 'paid') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'closed') return 'info'
  return 'warning'
}
</script>

<template>
  <section class="recharge-records-table">
    <Search
      v-model="searchForm"
      :fields="props.searchFields"
      :collapse-count="2"
      @query="emit('search')"
      @reset="emit('search')"
    />
    <AppTable
      :columns="props.columns"
      :data="props.data"
      :loading="props.loading"
      :pagination="props.page"
      :table-props="tableProps"
      row-key="id"
      @refresh="emit('refresh')"
      @update:pagination="emit('pageChange', $event)"
    >
      <template #cell-status_text="{ row }">
        <el-tag :type="tagType(row.status)" effect="light">{{ row.status_text }}</el-tag>
      </template>
      <template #cell-actions="{ row }">
        <div class="recharge-records-table__actions">
          <el-button
            v-if="userStore.can('payment_recharge_pay') && props.canPay(row)"
            type="primary"
            text
            @click="emit('pay', row)"
          >
            继续支付
          </el-button>
          <el-button
            v-if="userStore.can('payment_recharge_sync') && props.canSync(row)"
            type="warning"
            text
            @click="emit('sync', row)"
          >
            同步
          </el-button>
          <el-button
            v-if="userStore.can('payment_recharge_close') && props.canClose(row)"
            type="danger"
            text
            @click="emit('close', row)"
          >
            关闭
          </el-button>
        </div>
      </template>
    </AppTable>
  </section>
</template>

<style scoped>
.recharge-records-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.recharge-records-table__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  white-space: nowrap;
}
</style>
