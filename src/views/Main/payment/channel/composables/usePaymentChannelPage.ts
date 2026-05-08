import { computed, onMounted, ref } from 'vue'
import { ElNotification } from 'element-plus'
import {
  PaymentChannelApi,
  type PaymentChannelInitResponse,
  type PaymentChannelListItem,
  type PaymentChannelListParams,
} from '@/api/payment/channel'
import { useTable } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'

export function usePaymentChannelPage() {
  const providerArr = ref<PaymentChannelInitResponse['dict']['provider_arr']>([])
  const statusArr = ref<PaymentChannelInitResponse['dict']['common_status_arr']>([])
  const searchForm = ref<PaymentChannelListParams>({
    current_page: 1,
    page_size: 20,
    name: '',
    provider: '',
    status: '',
  })
  const table = useTable<PaymentChannelListItem, PaymentChannelListParams>({ api: PaymentChannelApi, searchForm })
  const columns = computed(() => [
    { key: 'name', label: '渠道名称' },
    { key: 'provider_text', label: '服务商' },
    { key: 'supported_methods_text', label: '支付方式' },
    { key: 'app_id', label: 'AppID' },
    { key: 'status_text', label: '状态' },
    { key: 'created_at', label: '创建时间' },
    { key: 'actions', label: '操作', width: 180 },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'name', type: 'input', label: '渠道名称', placeholder: '渠道名称', width: 180 },
    { key: 'provider', type: 'select-v2', label: '服务商', placeholder: '服务商', width: 140, options: providerArr.value },
    { key: 'status', type: 'select-v2', label: '状态', placeholder: '状态', width: 120, options: statusArr.value },
  ])

  async function init() {
    const res = await PaymentChannelApi.init()
    providerArr.value = res.dict.provider_arr
    statusArr.value = res.dict.common_status_arr
  }

  async function changeStatus(row: PaymentChannelListItem) {
    await PaymentChannelApi.status(row.id, row.status === 1 ? 2 : 1)
    ElNotification.success({ message: '操作成功' })
    await table.getList()
  }

  function onSearch() {
    table.resetPage()
    void table.getList()
  }

  onMounted(() => {
    void init()
    void table.getList()
  })

  return { ...table, columns, searchFields, searchForm, onSearch, changeStatus }
}
