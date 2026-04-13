import { computed, nextTick, onMounted, ref, type Ref } from 'vue'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { SearchField } from '@/components/Search/types'
import { useTable } from '@/components/Table'
import type { RequestPayload } from '@/types/common'
import {
  OrderApi,
  type OrderDetailResponse,
  type OrderInitResponse,
  type OrderListItem,
  type OrderListParams,
  type OrderStatusCountResponse,
} from '@/api/pay/order'
import { UsersListApi } from '@/api/user/users'
import type { UserListItem } from '@/types/user'
import { BizStatus, PayStatus } from '@/enums'

type Translate = (key: string) => string
type OrderPageListParams = OrderListParams & RequestPayload & {
  current_page: number
  page_size: number
}

interface OrderUserDisplayRow {
  user_id?: number
  user_name?: string
  user_email?: string
}

export function formatOrderUserLabel(item: Pick<UserListItem, 'username' | 'email'>) {
  return `${item.username} (${item.email})`
}

export function formatOrderUserDisplay(row: OrderUserDisplayRow) {
  if (row.user_name) {
    return row.user_email ? `${row.user_name} (${row.user_email})` : row.user_name
  }

  return row.user_id ? `#${row.user_id}` : '--'
}

export function getPayStatusTagType(val: number) {
  if (val === PayStatus.PAID) return 'success'
  if (val === PayStatus.CLOSED) return 'info'
  if (val === PayStatus.EXCEPTION) return 'danger'
  return 'warning'
}

export function getBizStatusTagType(val: number) {
  if (val === BizStatus.SUCCESS) return 'success'
  if (val === BizStatus.FAILED) return 'danger'
  if (val === BizStatus.MANUAL) return 'warning'
  if (val === BizStatus.EXECUTING) return 'primary'
  return 'info'
}

export function usePayOrderPage(params: {
  isMobile: Ref<boolean>
  t: Translate
}) {
  const { isMobile, t } = params

  const orderTypeArr = ref<OrderInitResponse['dict']['order_type_arr']>([])
  const payStatusArr = ref<OrderInitResponse['dict']['pay_status_arr']>([])
  const statusCounts = ref<OrderStatusCountResponse['counts']>({})
  const activeStatusTab = ref('all')

  const searchForm = ref<{
    order_no: string
    user_id: number | ''
    order_type: number | ''
    pay_status: number | ''
  }>({
    order_no: '',
    user_id: '',
    order_type: '',
    pay_status: '',
  })

  const {
    loading: listLoading,
    data: listData,
    page,
    onPageChange,
    refresh,
    getList,
    resetPage,
  } = useTable<OrderListItem, OrderPageListParams>({
    api: OrderApi,
    searchForm,
  })

  const detailVisible = ref(false)
  const detailData = ref<OrderDetailResponse | null>(null)

  const closeFormRef = ref<FormInstance | null>(null)
  const closeVisible = ref(false)
  const closeForm = ref({ id: 0, reason: '' })

  const remarkFormRef = ref<FormInstance | null>(null)
  const remarkVisible = ref(false)
  const remarkForm = ref({ id: 0, admin_remark: '' })

  const searchFields = computed<SearchField[]>(() => [
    { key: 'order_no', type: 'input', label: t('pay_order.table.order_no'), placeholder: t('pay_order.filter.order_no'), width: 180 },
    {
      key: 'user_id',
      type: 'remote-select',
      label: t('pay_order.filter.user'),
      fetchMethod: UsersListApi.list,
      labelField: formatOrderUserLabel,
      valueField: 'id',
      placeholder: t('pay_order.filter.user'),
      width: isMobile.value ? 220 : 260,
    },
    { key: 'order_type', type: 'select-v2', label: t('pay_order.table.order_type'), options: orderTypeArr.value, width: 130 },
    { key: 'pay_status', type: 'select-v2', label: t('pay_order.table.pay_status'), options: payStatusArr.value, width: 130 },
  ])

  const statusTabs = computed(() => [
    {
      label: t('pay_order.tabs.all'),
      value: 'all',
    },
    ...payStatusArr.value.map((item) => ({
      label: `${item.label} (${statusCounts.value[item.value]?.count ?? 0})`,
      value: String(item.value),
    })),
  ])

  const columns = computed(() => [
    { key: 'order_no', label: t('pay_order.table.order_no'), width: 220 },
    { key: 'user_name', label: t('pay_order.table.user_name'), width: 240 },
    { key: 'user_id', label: t('pay_order.table.user_id'), width: 110 },
    { key: 'order_type_text', label: t('pay_order.table.order_type') },
    { key: 'title', label: t('pay_order.table.title') },
    { key: 'pay_amount', label: t('pay_order.table.pay_amount'), width: 120 },
    { key: 'pay_status_text', label: t('pay_order.table.pay_status'), width: 150 },
    { key: 'biz_status_text', label: t('pay_order.table.biz_status'), width: 150 },
    { key: 'pay_time', label: t('pay_order.table.pay_time'), width: 180 },
    { key: 'created_at', label: t('pay_order.table.created_at'), width: 180 },
    { key: 'actions', label: t('common.actions.action'), width: 220 },
  ])

  const closeRules = computed<FormRules>(() => ({
    reason: [
      { required: true, message: t('pay_order.table.close_reason') + t('common.required'), trigger: 'blur' },
      { max: 100, message: t('pay_order.table.close_reason') + '，最大长度100', trigger: 'blur' },
    ],
  }))

  async function init() {
    const data = await OrderApi.init()
    orderTypeArr.value = data.dict.order_type_arr
    payStatusArr.value = data.dict.pay_status_arr
  }

  async function loadStatusCount() {
    const res = await OrderApi.statusCount()
    statusCounts.value = res.counts
  }

  function onSearch() {
    resetPage()
    void getList()
  }

  function onTabChange(status: string | number) {
    const nextStatus = String(status)
    activeStatusTab.value = nextStatus
    searchForm.value.pay_status = nextStatus === 'all' ? '' : Number(nextStatus)
    void onSearch()
  }

  async function showDetail(row: OrderListItem) {
    detailData.value = await OrderApi.detail({ id: row.id })
    detailVisible.value = true
  }

  function openClose(row: OrderListItem) {
    closeForm.value = { id: row.id, reason: '' }
    closeVisible.value = true
    nextTick(() => {
      void closeFormRef.value?.clearValidate()
    })
  }

  async function confirmClose() {
    try {
      await closeFormRef.value?.validate()
    } catch {
      return
    }

    await OrderApi.close({ id: closeForm.value.id, reason: closeForm.value.reason })
    ElNotification.success({ message: t('common.success.operation') })
    closeVisible.value = false
    await loadStatusCount()
    await getList()
  }

  function openRemark(row: OrderListItem) {
    remarkForm.value = { id: row.id, admin_remark: row.admin_remark ?? '' }
    remarkVisible.value = true
    nextTick(() => {
      void remarkFormRef.value?.clearValidate()
    })
  }

  async function confirmRemark() {
    try {
      await remarkFormRef.value?.validate()
    } catch {
      return
    }

    await OrderApi.remark({ id: remarkForm.value.id, remark: remarkForm.value.admin_remark })
    ElNotification.success({ message: t('common.success.operation') })
    remarkVisible.value = false
    await getList()
  }

  function isCloseDisabled(row: OrderListItem) {
    return row.pay_status !== PayStatus.PENDING && row.pay_status !== PayStatus.PAYING
  }

  onMounted(() => {
    void init()
    void loadStatusCount()
    void getList()
  })

  return {
    activeStatusTab,
    closeForm,
    closeFormRef,
    closeRules,
    closeVisible,
    columns,
    confirmClose,
    confirmRemark,
    detailData,
    detailVisible,
    formatOrderUserDisplay,
    getBizStatusTagType,
    getList,
    getPayStatusTagType,
    isCloseDisabled,
    listData,
    listLoading,
    onPageChange,
    onSearch,
    onTabChange,
    openClose,
    openRemark,
    page,
    refresh,
    remarkForm,
    remarkFormRef,
    remarkVisible,
    searchFields,
    searchForm,
    showDetail,
    statusTabs,
  }
}
