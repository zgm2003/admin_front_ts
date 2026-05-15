import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormRules, UploadRequestOptions } from 'element-plus'
import { CommonEnum } from '@/enums'
import {
  PaymentConfigApi,
  type PaymentCertificateType,
  type PaymentConfigInitResponse,
  type PaymentConfigListItem,
  type PaymentConfigListParams,
  type PaymentConfigMutationPayload,
} from '@/api/payment/config'
import { useTable } from '@/components/Table'
import type { SearchField } from '@/components/Search/types'

export type PaymentConfigDialogMode = 'add' | 'edit'
type CertificateField = 'app_cert_path' | 'platform_cert_path' | 'root_cert_path'
type UploadError = Parameters<UploadRequestOptions['onError']>[0]
export type PaymentConfigFormRef = {
  validate: () => Promise<boolean>
  clearValidate: () => void
}

const certificateFieldMap: { [key in PaymentCertificateType]: CertificateField } = {
  app_cert: 'app_cert_path',
  alipay_cert: 'platform_cert_path',
  alipay_root_cert: 'root_cert_path',
}

export function usePaymentConfigPage() {
  const dict = shallowRef<PaymentConfigInitResponse['dict']>({
    provider_arr: [],
    environment_arr: [],
    common_status_arr: [],
    enabled_method_arr: [],
    certificate_type_arr: [],
  })
  const searchForm = ref<PaymentConfigListParams>({
    current_page: 1,
    page_size: 20,
    name: '',
    provider: '',
    environment: '',
    status: '',
  })
  const table = useTable<PaymentConfigListItem, PaymentConfigListParams>({ api: PaymentConfigApi, searchForm })
  const columns = computed(() => [
    { key: 'provider_text', label: '支付渠道', width: 110 },
    { key: 'name', label: '配置名称', minWidth: 150 },
    { key: 'code', label: '配置编码', minWidth: 150 },
    { key: 'app_id', label: 'AppID', minWidth: 170 },
    { key: 'environment_text', label: '环境', width: 110 },
    { key: 'enabled_methods_text', label: '支付方式', minWidth: 130 },
    { key: 'status_text', label: '状态', width: 90 },
    { key: 'created_at', label: '创建时间', minWidth: 170 },
    { key: 'actions', label: '操作', width: 280, fixed: 'right' },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'name', type: 'input', label: '配置名称', placeholder: '名称/编码/AppID', width: 190 },
    { key: 'provider', type: 'select-v2', label: '支付渠道', placeholder: '支付渠道', width: 130, options: dict.value.provider_arr },
    { key: 'environment', type: 'select-v2', label: '环境', placeholder: '环境', width: 130, options: dict.value.environment_arr },
    { key: 'status', type: 'select-v2', label: '状态', placeholder: '状态', width: 120, options: dict.value.common_status_arr },
  ])
  const dialogVisible = ref(false)
  const dialogMode = shallowRef<PaymentConfigDialogMode>('add')
  const formRef = ref<PaymentConfigFormRef | null>(null)
  const form = ref<PaymentConfigMutationPayload>(defaultForm())
  const uploadLoading = shallowRef<PaymentCertificateType | ''>('')

  const rules = computed<FormRules>(() => ({
    provider: [{ required: true, message: '请选择支付渠道', trigger: 'change' }],
    code: [{ required: true, message: '请输入配置编码', trigger: 'blur' }],
    name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
    app_id: [{ required: true, message: '请输入支付宝AppID', trigger: 'blur' }],
    app_private_key: [{ required: dialogMode.value === 'add', message: '请输入应用私钥', trigger: 'blur' }],
    app_cert_path: [{ required: true, message: '请上传应用公钥证书', trigger: 'change' }],
    platform_cert_path: [{ required: true, message: '请上传支付宝公钥证书', trigger: 'change' }],
    root_cert_path: [{ required: true, message: '请上传支付宝根证书', trigger: 'change' }],
    notify_url: [
      { required: true, message: '请输入异步通知地址', trigger: 'blur' },
      { validator: validateHTTPURL, trigger: 'blur' },
    ],
    return_url: [{ validator: validateOptionalHTTPURL, trigger: 'blur' }],
    environment: [{ required: true, message: '请选择环境', trigger: 'change' }],
    enabled_methods: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  }))

  async function init() {
    const res = await PaymentConfigApi.init()
    dict.value = res.dict
  }

  async function refresh() {
    await table.getList()
  }

  function openAddDialog() {
    dialogMode.value = 'add'
    form.value = defaultForm()
    dialogVisible.value = true
    void nextTick(() => formRef.value?.clearValidate())
  }

  function openEditDialog(row: PaymentConfigListItem) {
    dialogMode.value = 'edit'
    form.value = {
      id: row.id,
      provider: row.provider,
      code: row.code,
      name: row.name,
      app_id: row.app_id,
      app_private_key: '',
      app_cert_path: row.app_cert_path,
      platform_cert_path: row.platform_cert_path,
      root_cert_path: row.root_cert_path,
      notify_url: row.notify_url,
      return_url: row.return_url,
      environment: row.environment,
      enabled_methods: [...row.enabled_methods],
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
      await PaymentConfigApi.add(form.value)
    } else {
      await PaymentConfigApi.edit(form.value)
    }
    ElNotification.success({ message: '操作成功' })
    dialogVisible.value = false
    await table.getList()
  }

  async function changeStatus(row: PaymentConfigListItem) {
    const nextStatus = row.status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES
    await PaymentConfigApi.status(row.id, nextStatus)
    ElNotification.success({ message: '操作成功' })
    await table.getList()
  }

  async function confirmDel(row: PaymentConfigListItem) {
    try {
      await ElMessageBox.confirm('确认删除该支付配置？', '提示', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      })
    } catch {
      return
    }
    await PaymentConfigApi.del(row.id)
    ElNotification.success({ message: '操作成功' })
    await table.getList()
  }

  async function uploadCert(certType: PaymentCertificateType, options: UploadRequestOptions) {
    const configCode = form.value.code.trim()
    if (!configCode) {
      options.onError(uploadAjaxError('请先填写配置编码'))
      return
    }
    uploadLoading.value = certType
    try {
      const payload = new FormData()
      payload.append('config_code', configCode)
      payload.append('cert_type', certType)
      payload.append('file', options.file)
      const result = await PaymentConfigApi.uploadCertificate(payload)
      form.value[certificateFieldMap[certType]] = result.path
      options.onSuccess(result)
      ElNotification.success({ message: '证书上传成功' })
    } catch (error) {
      options.onError(uploadAjaxError(error instanceof Error ? error.message : '证书上传失败'))
    } finally {
      uploadLoading.value = ''
    }
  }

  async function testConfig(row: PaymentConfigListItem) {
    const result = await PaymentConfigApi.test(row.id)
    ElNotification.success({ message: result.message || '支付宝配置测试通过' })
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
    uploadLoading,
    init,
    refresh,
    onSearch,
    openAddDialog,
    openEditDialog,
    confirmSubmit,
    changeStatus,
    confirmDel,
    uploadCert,
    testConfig,
  }
}

function defaultForm(): PaymentConfigMutationPayload {
  return {
    provider: 'alipay',
    code: '',
    name: '',
    app_id: '',
    app_private_key: '',
    app_cert_path: '',
    platform_cert_path: '',
    root_cert_path: '',
    notify_url: '',
    return_url: '',
    environment: 'sandbox',
    enabled_methods: ['web'],
    status: CommonEnum.NO,
    remark: '',
  }
}

function validateHTTPURL(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (value.startsWith('http://') || value.startsWith('https://')) {
    callback()
    return
  }
  callback(new Error('地址必须以 http:// 或 https:// 开头'))
}

function validateOptionalHTTPURL(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (!value || value.startsWith('http://') || value.startsWith('https://')) {
    callback()
    return
  }
  callback(new Error('地址必须以 http:// 或 https:// 开头'))
}

function uploadAjaxError(message: string): UploadError {
  return Object.assign(new Error(message), {
    status: 0,
    method: 'POST',
    url: '',
  }) as UploadError
}

