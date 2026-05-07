import { computed, onMounted, ref, shallowRef, type Ref } from 'vue'
import type { SearchField } from '@/components/Search/types'
import { useTable } from '@/components/Table'
import { PayTransactionApi, type PayTransactionDetailResponse, type PayTransactionItem } from '@/api/pay/transaction'
import { UsersListApi } from '@/api/user/users'
import { formatFen } from '@/enums/PayEnum'
import {
  formatPayTransactionUserDisplay,
  formatPayTransactionUserLabel,
  getTransactionStatusTagType,
  toPayTransactionListQuery,
  type PayTransactionTableParams,
} from '../helpers'

type Translate = (key: string) => string

type PayTransactionSearchForm = {
  order_no: string
  transaction_no: string
  user_id: number | ''
  channel: number | ''
  status: number | ''
  date: string[]
}

function formatObjectJSON(value: Record<string, unknown> | undefined) {
  if (!value || Object.keys(value).length === 0) {
    return ''
  }

  return JSON.stringify(value, null, 2)
}

const payTransactionTableApi = {
  list: (params: PayTransactionTableParams) => PayTransactionApi.list(toPayTransactionListQuery(params)),
}

export function usePayTransactionPage(params: {
  isMobile: Ref<boolean>
  t: Translate
}) {
  const { isMobile, t } = params

  const channelArr = shallowRef<{ label: string; value: number }[]>([])
  const txnStatusArr = shallowRef<{ label: string; value: number }[]>([])

  const searchForm = ref<PayTransactionSearchForm>({
    order_no: '',
    transaction_no: '',
    user_id: '',
    channel: '',
    status: '',
    date: [],
  })

  const {
    loading: listLoading,
    data: listData,
    page,
    getList,
    onPageChange,
    refresh,
    resetPage,
  } = useTable<PayTransactionItem, PayTransactionTableParams>({
    api: payTransactionTableApi,
    searchForm,
  })

  const detailVisible = shallowRef(false)
  const detailData = shallowRef<PayTransactionDetailResponse | null>(null)

  const searchFields = computed<SearchField[]>(() => [
    { key: 'order_no', type: 'input', label: t('pay_transaction.table.order_no'), placeholder: t('pay_transaction.filter.order_no'), width: 180 },
    { key: 'transaction_no', type: 'input', label: t('pay_transaction.table.transaction_no'), placeholder: t('pay_transaction.filter.transaction_no'), width: 180 },
    {
      key: 'user_id',
      type: 'remote-select',
      label: t('pay_transaction.filter.user'),
      fetchMethod: UsersListApi.list,
      labelField: formatPayTransactionUserLabel,
      valueField: 'id',
      placeholder: t('pay_transaction.filter.user'),
      width: isMobile.value ? 220 : 260,
    },
    { key: 'channel', type: 'select-v2', label: t('pay_transaction.table.channel'), options: channelArr.value, width: 130 },
    { key: 'status', type: 'select-v2', label: t('pay_transaction.table.status'), options: txnStatusArr.value, width: 130 },
    { key: 'date', type: 'date-range', label: t('pay_transaction.filter.date'), placeholder: t('pay_transaction.filter.date'), width: isMobile.value ? 220 : 240 },
  ])

  const columns = computed(() => [
    { key: 'transaction_no', label: t('pay_transaction.table.transaction_no'), width: 220 },
    { key: 'order_no', label: t('pay_transaction.table.order_no'), width: 220 },
    { key: 'user_name', label: t('pay_transaction.table.user_name'), width: 240 },
    { key: 'attempt_no', label: t('pay_transaction.table.attempt_no') },
    { key: 'channel_text', label: t('pay_transaction.table.channel') },
    { key: 'pay_method_text', label: t('pay_transaction.table.pay_method') },
    { key: 'amount', label: t('pay_transaction.table.amount'), width: 120, formatter: (_row: unknown, _column: unknown, value: number) => `¥${formatFen(value)}` },
    { key: 'trade_no', label: t('pay_transaction.table.trade_no'), width: 200 },
    { key: 'status_text', label: t('pay_transaction.table.status'), width: 140 },
    { key: 'paid_at', label: t('pay_transaction.table.paid_at'), width: 180 },
    { key: 'actions', label: t('common.actions.action'), width: 100 },
  ])

  const channelRespJSON = computed(() => formatObjectJSON(detailData.value?.transaction.channel_resp))
  const rawNotifyJSON = computed(() => formatObjectJSON(detailData.value?.transaction.raw_notify))
  const hasChannelResp = computed(() => channelRespJSON.value.length > 0)
  const hasRawNotify = computed(() => rawNotifyJSON.value.length > 0)

  async function init() {
    const data = await PayTransactionApi.init()
    channelArr.value = data.dict.channel_arr
    txnStatusArr.value = data.dict.txn_status_arr
  }

  function onSearch() {
    resetPage()
    void getList()
  }

  async function showDetail(row: PayTransactionItem) {
    detailData.value = await PayTransactionApi.detail({ id: row.id })
    detailVisible.value = true
  }

  onMounted(() => {
    void init()
    void getList()
  })

  return {
    channelRespJSON,
    columns,
    detailData,
    detailVisible,
    formatPayTransactionUserDisplay,
    getList,
    getTransactionStatusTagType,
    hasChannelResp,
    hasRawNotify,
    listData,
    listLoading,
    onPageChange,
    onSearch,
    page,
    rawNotifyJSON,
    refresh,
    searchFields,
    searchForm,
    showDetail,
  }
}
