<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/hooks/useResponsive'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import {
  PayTransactionApi,
  type PayTransactionDetailResponse,
  type PayTransactionItem,
} from '@/api/pay/transaction'
import { UsersListApi } from '@/api/user/users'
import { TxnStatus } from '@/enums'
import { formatFen } from '@/enums/PayEnum'
import type { UserListItem } from '@/types/user'
import { useCrudTable } from '@/hooks/useCrudTable'

const { t } = useI18n()
const isMobile = useIsMobile()

// ==================== 下拉字典 ====================
const channelArr = ref<{ label: string; value: number }[]>([])
const txnStatusArr = ref<{ label: string; value: number }[]>([])

const init = async () => {
  const data = await PayTransactionApi.init()
  channelArr.value = data.dict.channel_arr
  txnStatusArr.value = data.dict.txn_status_arr
}

// ==================== 搜索 ====================
const searchForm = ref({
  order_no: '',
  transaction_no: '',
  user_id: '' as number | '',
  channel: '' as number | '',
  status: '' as number | '',
})

const formatUserLabel = (item: UserListItem) => `${item.username} (${item.email})`
const formatUserDisplay = (row: { user_id?: number; user_name?: string; user_email?: string }) => {
  if (row.user_name) {
    return row.user_email ? `${row.user_name} (${row.user_email})` : row.user_name
  }

  return row.user_id ? `#${row.user_id}` : '--'
}

const searchFields = computed<SearchField[]>(() => [
  { key: 'order_no', type: 'input', label: t('pay_transaction.table.order_no'), placeholder: t('pay_transaction.filter.order_no'), width: 180 },
  { key: 'transaction_no', type: 'input', label: t('pay_transaction.table.transaction_no'), placeholder: t('pay_transaction.filter.transaction_no'), width: 180 },
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('pay_transaction.filter.user'),
    fetchMethod: UsersListApi.list,
    labelField: formatUserLabel,
    valueField: 'id',
    placeholder: t('pay_transaction.filter.user'),
    width: isMobile.value ? 220 : 260,
  },
  { key: 'channel', type: 'select-v2', label: t('pay_transaction.table.channel'), options: channelArr.value, width: 130 },
  { key: 'status', type: 'select-v2', label: t('pay_transaction.table.status'), options: txnStatusArr.value, width: 130 },
])

// ==================== 表格 ====================
const {
  loading: listLoading,
  data: listData,
  page,
  getList,
  onPageChange,
  refresh,
  onSearch,
} = useCrudTable({
  api: PayTransactionApi,
  searchForm,
})

const columns = computed(() => [
  { key: 'transaction_no', label: t('pay_transaction.table.transaction_no'), width: 220 },
  { key: 'order_no', label: t('pay_transaction.table.order_no'), width: 220 },
  { key: 'user_name', label: t('pay_transaction.table.user_name'), width: 240 },
  { key: 'attempt_no', label: t('pay_transaction.table.attempt_no') },
  { key: 'channel_text', label: t('pay_transaction.table.channel') },
  { key: 'pay_method', label: t('pay_transaction.table.pay_method') },
  { key: 'amount', label: t('pay_transaction.table.amount'), width: 120, formatter: (_r: unknown, _c: unknown, v: number) => `¥${formatFen(v)}` },
  { key: 'trade_no', label: t('pay_transaction.table.trade_no'), width: 200 },
  { key: 'status_text', label: t('pay_transaction.table.status'), width: 140 },
  { key: 'paid_at', label: t('pay_transaction.table.paid_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 100 },
])

// ==================== 详情 ====================
const detailVisible = ref(false)
const detailData = ref<PayTransactionDetailResponse | null>(null)

const showDetail = async (row: PayTransactionItem) => {
  const res = await PayTransactionApi.detail({ id: row.id })
  detailData.value = res
  detailVisible.value = true
}

// ==================== 状态标签颜色 ====================
const statusType = (val: number) => {
  if (val === TxnStatus.SUCCESS) return 'success'
  if (val === TxnStatus.FAILED) return 'danger'
  if (val === TxnStatus.WAITING) return 'warning'
  if (val === TxnStatus.CLOSED) return 'info'
  return undefined
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
          <span>{{ formatUserDisplay(row) }}</span>
        </template>
        <template #cell-status_text="{ row }">
          <el-tag :type="statusType(row.status)">{{ row.status_text }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 详情弹窗 -->
  <AppDialog v-model="detailVisible" :width="isMobile ? '94vw' : '800px'">
    <template #header>{{ t('pay_transaction.detail.title') }}</template>
    <el-descriptions v-if="detailData" :column="2" border>
      <el-descriptions-item :label="t('pay_transaction.table.transaction_no')">{{ detailData.transaction.transaction_no }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.attempt_no')">{{ detailData.transaction.attempt_no }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.order_no')">{{ detailData.transaction.order_no }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.user_name')">{{ detailData.order ? formatUserDisplay(detailData.order) : '--' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.channel')">{{ detailData.channel?.name ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.pay_method')">{{ detailData.transaction.pay_method ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.amount')">¥{{ formatFen(detailData.transaction.amount) }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.trade_no')">{{ detailData.transaction.trade_no ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.trade_status')">{{ detailData.transaction.trade_status ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.status')">
        <el-tag :type="statusType(detailData.transaction.status)">{{ detailData.transaction.status_text }}</el-tag>
      </el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.paid_at')">{{ detailData.transaction.paid_at ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.closed_at')">{{ detailData.transaction.closed_at ?? '-' }}</el-descriptions-item>
      <el-descriptions-item :label="t('pay_transaction.table.created_at')">{{ detailData.transaction.created_at }}</el-descriptions-item>

      <el-descriptions-item :label="t('pay_transaction.table.order')" :span="2">
        <template v-if="detailData.order">
          {{ detailData.order.order_no }} | ¥{{ formatFen(detailData.order.pay_amount) }} |
          <el-tag size="small">{{ detailData.order.pay_status === 3 ? '已支付' : '未支付' }}</el-tag>
        </template>
        <template v-else>-</template>
      </el-descriptions-item>

      <el-descriptions-item v-if="detailData.transaction.channel_resp && Object.keys(detailData.transaction.channel_resp).length" :label="t('pay_transaction.detail.channel_resp')" :span="2">
        <el-input type="textarea" :rows="4" :model-value="JSON.stringify(detailData.transaction.channel_resp, null, 2)" readonly />
      </el-descriptions-item>
      <el-descriptions-item v-if="detailData.transaction.raw_notify && Object.keys(detailData.transaction.raw_notify).length" :label="t('pay_transaction.detail.raw_notify')" :span="2">
        <el-input type="textarea" :rows="4" :model-value="JSON.stringify(detailData.transaction.raw_notify, null, 2)" readonly />
      </el-descriptions-item>
    </el-descriptions>
  </AppDialog>
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
