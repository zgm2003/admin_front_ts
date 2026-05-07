import { computed, onMounted, ref, shallowRef, type Ref } from 'vue'
import type { SearchField } from '@/components/Search/types'
import { useTable } from '@/components/Table'
import { PayNotifyLogApi, type PayNotifyLogDetailResponse, type PayNotifyLogItem } from '@/api/pay/notify'
import { formatObjectJSON, toPayNotifyLogListQuery, type PayNotifyLogTableParams } from '../helpers'

type Translate = (key: string) => string

type PayNotifyLogSearchForm = {
  transaction_no: string
  channel: number | ''
  notify_type: number | ''
  process_status: number | ''
  date: string[]
}

const payNotifyLogTableApi = {
  list: (params: PayNotifyLogTableParams) => PayNotifyLogApi.list(toPayNotifyLogListQuery(params)),
}

export function usePayNotifyLogPage(params: {
  isMobile: Ref<boolean>
  t: Translate
}) {
  const { isMobile, t } = params

  const channelArr = shallowRef<{ label: string; value: number }[]>([])
  const notifyTypeArr = shallowRef<{ label: string; value: number }[]>([])
  const processStatusArr = shallowRef<{ label: string; value: number }[]>([])

  const searchForm = ref<PayNotifyLogSearchForm>({
    transaction_no: '',
    channel: '',
    notify_type: '',
    process_status: '',
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
  } = useTable<PayNotifyLogItem, PayNotifyLogTableParams>({
    api: payNotifyLogTableApi,
    searchForm,
  })

  const detailVisible = shallowRef(false)
  const detailData = shallowRef<PayNotifyLogDetailResponse | null>(null)

  const searchFields = computed<SearchField[]>(() => [
    { key: 'transaction_no', type: 'input', label: t('pay_notify.table.transaction_no'), placeholder: t('pay_notify.table.transaction_no'), width: 200 },
    { key: 'channel', type: 'select-v2', label: t('pay_notify.table.channel'), options: channelArr.value, width: 140 },
    { key: 'notify_type', type: 'select-v2', label: t('pay_notify.table.notify_type'), options: notifyTypeArr.value, width: 140 },
    { key: 'process_status', type: 'select-v2', label: t('pay_notify.table.process_status'), options: processStatusArr.value, width: 160 },
    { key: 'date', type: 'date-range', label: t('pay_notify.table.created_at'), placeholder: t('pay_notify.table.created_at'), width: isMobile.value ? 220 : 240 },
  ])

  const columns = computed(() => [
    { key: 'transaction_no', label: t('pay_notify.table.transaction_no'), width: 220 },
    { key: 'trade_no', label: t('pay_notify.table.trade_no'), width: 220 },
    { key: 'channel_text', label: t('pay_notify.table.channel'), width: 120 },
    { key: 'notify_type_text', label: t('pay_notify.table.notify_type'), width: 120 },
    { key: 'process_status_text', label: t('pay_notify.table.process_status'), width: 140 },
    { key: 'process_msg', label: t('pay_notify.table.process_msg'), minWidth: 240 },
    { key: 'ip', label: t('pay_notify.table.ip'), width: 160 },
    { key: 'created_at', label: t('pay_notify.table.created_at'), width: 180 },
    { key: 'actions', label: t('common.actions.action'), width: 100 },
  ])

  const headersJSON = computed(() => formatObjectJSON(detailData.value?.log.headers))
  const rawDataJSON = computed(() => formatObjectJSON(detailData.value?.log.raw_data))

  async function init() {
    const data = await PayNotifyLogApi.init()
    channelArr.value = data.dict.channel_arr
    notifyTypeArr.value = data.dict.notify_type_arr
    processStatusArr.value = data.dict.notify_process_status_arr
  }

  function onSearch() {
    resetPage()
    void getList()
  }

  async function showDetail(row: PayNotifyLogItem) {
    detailData.value = await PayNotifyLogApi.detail({ id: row.id })
    detailVisible.value = true
  }

  onMounted(() => {
    void init()
    void getList()
  })

  return {
    columns,
    detailData,
    detailVisible,
    headersJSON,
    listData,
    listLoading,
    onPageChange,
    onSearch,
    page,
    rawDataJSON,
    refresh,
    searchFields,
    searchForm,
    showDetail,
  }
}
