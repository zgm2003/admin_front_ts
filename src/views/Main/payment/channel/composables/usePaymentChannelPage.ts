import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import {
  PaymentChannelApi,
  type PaymentChannelInitResponse,
  type PaymentChannelListItem,
  type PaymentChannelListParams,
  type PaymentChannelMutationPayload,
} from '@/api/payment/channel'
import { useTable } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'

export type PaymentChannelDialogMode = 'add' | 'edit'

export function usePaymentChannelPage() {
  const dict = shallowRef<PaymentChannelInitResponse['dict']>({
    provider_arr: [],
    common_status_arr: [],
    pay_method_arr: [],
    yes_no_arr: [],
  })
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
    { key: 'merchant_id', label: '商户号' },
    { key: 'is_sandbox', label: '沙箱', width: 90 },
    { key: 'status_text', label: '状态' },
    { key: 'created_at', label: '创建时间' },
    { key: 'actions', label: '操作', width: 220 },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'name', type: 'input', label: '渠道名称', placeholder: '渠道名称', width: 180 },
    { key: 'provider', type: 'select-v2', label: '服务商', placeholder: '服务商', width: 140, options: dict.value.provider_arr },
    { key: 'status', type: 'select-v2', label: '状态', placeholder: '状态', width: 120, options: dict.value.common_status_arr },
  ])
  const dialogVisible = ref(false)
  const dialogMode = ref<PaymentChannelDialogMode>('add')
  const formRef = ref<FormInstance | null>(null)
  const form = ref<PaymentChannelMutationPayload>(defaultForm())

  const rules = computed<FormRules>(() => ({
    code: [{ required: true, message: '请输入渠道编码', trigger: 'blur' }],
    name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
    provider: [{ required: true, message: '请选择服务商', trigger: 'change' }],
    supported_methods: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
    app_id: [{ required: true, message: '请输入AppID', trigger: 'blur' }],
    notify_url: [{ required: true, message: '请输入异步通知地址', trigger: 'blur' }],
    private_key: [{ required: dialogMode.value === 'add', message: '请输入应用私钥', trigger: 'blur' }],
    app_cert_path: [{ required: true, message: '请输入应用公钥证书路径', trigger: 'blur' }],
    alipay_cert_path: [{ required: true, message: '请输入支付宝公钥证书路径', trigger: 'blur' }],
    alipay_root_cert_path: [{ required: true, message: '请输入支付宝根证书路径', trigger: 'blur' }],
  }))

  async function init() {
    const res = await PaymentChannelApi.init()
    dict.value = res.dict
  }

  async function changeStatus(row: PaymentChannelListItem) {
    await PaymentChannelApi.status(row.id, row.status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES)
    ElNotification.success({ message: '操作成功' })
    await table.getList()
  }

  function openAddDialog() {
    dialogMode.value = 'add'
    form.value = defaultForm()
    dialogVisible.value = true
    void nextTick(() => formRef.value?.clearValidate())
  }

  function openEditDialog(row: PaymentChannelListItem) {
    dialogMode.value = 'edit'
    form.value = {
      id: row.id,
      code: row.code,
      name: row.name,
      provider: row.provider,
      supported_methods: [...row.supported_methods],
      app_id: row.app_id,
      merchant_id: row.merchant_id,
      notify_url: row.notify_url,
      return_url: row.return_url,
      private_key: '',
      app_cert_path: row.app_cert_path,
      alipay_cert_path: row.alipay_cert_path,
      alipay_root_cert_path: row.alipay_root_cert_path,
      is_sandbox: row.is_sandbox,
      status: row.status,
      remark: row.remark,
    }
    dialogVisible.value = true
    void nextTick(() => formRef.value?.clearValidate())
  }

  async function confirmSubmit() {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }

    if (dialogMode.value === 'add') {
      await PaymentChannelApi.add(form.value)
    } else {
      await PaymentChannelApi.edit(form.value)
    }
    ElNotification.success({ message: '操作成功' })
    dialogVisible.value = false
    await table.getList()
  }

  async function confirmDel(row: PaymentChannelListItem) {
    try {
      await ElMessageBox.confirm('确认删除该支付渠道？', '提示', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }

    await PaymentChannelApi.del(row.id)
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

  return {
    ...table,
    dict,
    columns,
    searchFields,
    searchForm,
    dialogVisible,
    dialogMode,
    formRef,
    form,
    rules,
    onSearch,
    changeStatus,
    openAddDialog,
    openEditDialog,
    confirmSubmit,
    confirmDel,
  }
}

function defaultForm(): PaymentChannelMutationPayload {
  return {
    code: '',
    name: '',
    provider: 'alipay',
    supported_methods: [],
    app_id: '',
    merchant_id: '',
    notify_url: '',
    return_url: '',
    private_key: '',
    app_cert_path: '',
    alipay_cert_path: '',
    alipay_root_cert_path: '',
    is_sandbox: CommonEnum.NO,
    status: CommonEnum.YES,
    remark: '',
  }
}
