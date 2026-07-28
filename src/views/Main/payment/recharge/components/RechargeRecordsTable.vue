<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useUserStore } from '@/store/user'
import type { PageState, TableColumn } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'
import type { PaymentRechargeListItem } from '@/api/payment/recharges'
import type { PaymentRechargeSearchForm } from '../composables/usePaymentRechargePage'

const props = defineProps<{
  columns: TableColumn[]
  data: PaymentRechargeListItem[]
  loading: boolean
  page: PageState
  searchFields: SearchField[]
  canPay: (row: PaymentRechargeListItem) => boolean
}>()

const searchForm = defineModel<PaymentRechargeSearchForm>('searchForm', { required: true })
const emit = defineEmits<{
  search: []
  refresh: []
  pageChange: [page: PageState]
  pay: [row: PaymentRechargeListItem]
}>()

const userStore = useUserStore()
const { t } = useI18n()

function tagType(status: PaymentRechargeListItem['status']) {
  if (status === 'credited') return 'success'
  if (status === 'paid') return 'warning'
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
      @refresh="emit('refresh')"
      @update:pagination="emit('pageChange', $event)"
    >
      <template #cell-status_text="{ row }">
        <el-tag
          :type="tagType(row.status)"
          effect="light"
        >
          {{ row.status_text }}
        </el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button
          v-if="userStore.can('payment_recharge_pay') && props.canPay(row)"
          type="primary"
          text
          @click="emit('pay', row)"
        >
          {{ t('paymentRecharge.actions.continuePay') }}
        </el-button>
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
</style>
