import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
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
  const { t } = useI18n()
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
    { key: 'provider_text', label: t('paymentConfig.columns.provider'), width: 110 },
    { key: 'name', label: t('paymentConfig.columns.name'), minWidth: 150 },
    { key: 'code', label: t('paymentConfig.columns.code'), minWidth: 150 },
    { key: 'app_id', label: 'AppID', minWidth: 170 },
    { key: 'environment_text', label: t('paymentConfig.columns.environment'), width: 110 },
    { key: 'enabled_methods_text', label: t('paymentConfig.columns.enabledMethods'), minWidth: 130 },
    { key: 'sort', label: t('paymentConfig.columns.sort'), width: 90 },
    { key: 'status_text', label: t('paymentConfig.columns.status'), width: 90 },
    { key: 'created_at', label: t('paymentConfig.columns.createdAt'), minWidth: 170 },
    { key: 'updated_at', label: t('paymentConfig.columns.updatedAt'), minWidth: 170 },
    { key: 'actions', label: t('paymentConfig.columns.actions'), width: 280, fixed: 'right' },
  ])
  const searchFields = computed<SearchField[]>(() => [
    { key: 'name', type: 'input', label: t('paymentConfig.filters.name'), placeholder: t('paymentConfig.filters.namePlaceholder'), width: 190 },
    { key: 'provider', type: 'select-v2', label: t('paymentConfig.filters.provider'), placeholder: t('paymentConfig.filters.provider'), width: 130, options: dict.value.provider_arr },
    { key: 'environment', type: 'select-v2', label: t('paymentConfig.filters.environment'), placeholder: t('paymentConfig.filters.environment'), width: 130, options: dict.value.environment_arr },
    { key: 'status', type: 'select-v2', label: t('paymentConfig.filters.status'), placeholder: t('paymentConfig.filters.status'), width: 120, options: dict.value.common_status_arr },
  ])
  const dialogVisible = ref(false)
  const dialogMode = shallowRef<PaymentConfigDialogMode>('add')
  const formRef = ref<PaymentConfigFormRef | null>(null)
  const form = ref<PaymentConfigMutationPayload>(defaultForm())
  const uploadLoading = shallowRef<PaymentCertificateType | ''>('')
  const editingPrivateKeyHint = shallowRef('')

  const rules = computed<FormRules>(() => ({
    provider: [{ required: true, message: t('paymentConfig.validation.providerRequired'), trigger: 'change' }],
    code: [{ required: true, message: t('paymentConfig.validation.codeRequired'), trigger: 'blur' }],
    name: [{ required: true, message: t('paymentConfig.validation.nameRequired'), trigger: 'blur' }],
    app_id: [{ required: true, message: t('paymentConfig.validation.appIdRequired'), trigger: 'blur' }],
    app_private_key: [{ required: dialogMode.value === 'add', message: t('paymentConfig.validation.privateKeyRequired'), trigger: 'blur' }],
    app_cert_path: [{ required: true, message: t('paymentConfig.validation.appCertRequired'), trigger: 'change' }],
    platform_cert_path: [{ required: true, message: t('paymentConfig.validation.alipayCertRequired'), trigger: 'change' }],
    root_cert_path: [{ required: true, message: t('paymentConfig.validation.rootCertRequired'), trigger: 'change' }],
    notify_url: [
      { required: true, message: t('paymentConfig.validation.notifyURLRequired'), trigger: 'blur' },
      { validator: validateHTTPURL(t('paymentConfig.validation.httpURL')), trigger: 'blur' },
    ],
    environment: [{ required: true, message: t('paymentConfig.validation.environmentRequired'), trigger: 'change' }],
    enabled_methods: [{ required: true, message: t('paymentConfig.validation.enabledMethodsRequired'), trigger: 'change' }],
    sort: [{ required: true, message: t('paymentConfig.validation.sortRequired'), trigger: 'blur' }],
    status: [{ required: true, message: t('paymentConfig.validation.statusRequired'), trigger: 'change' }],
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
    editingPrivateKeyHint.value = ''
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
      environment: row.environment,
      enabled_methods: [...row.enabled_methods],
      sort: row.sort,
      status: row.status,
      remark: row.remark,
    }
    editingPrivateKeyHint.value = row.private_key_hint
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
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    await table.getList()
  }

  async function changeStatus(row: PaymentConfigListItem) {
    const nextStatus = row.status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES
    await PaymentConfigApi.status(row.id, nextStatus)
    ElNotification.success({ message: t('common.success.operation') })
    await table.getList()
  }

  async function confirmDel(row: PaymentConfigListItem) {
    try {
      await ElMessageBox.confirm(t('paymentConfig.messages.deleteConfirm'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.del'),
        cancelButtonText: t('common.actions.cancel'),
      })
    } catch {
      return
    }
    await PaymentConfigApi.del(row.id)
    ElNotification.success({ message: t('common.success.operation') })
    await table.getList()
  }

  async function uploadCert(certType: PaymentCertificateType, options: UploadRequestOptions) {
    const configCode = form.value.code.trim()
    if (!configCode) {
      options.onError(uploadAjaxError(t('paymentConfig.messages.codeRequiredBeforeUpload')))
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
      ElNotification.success({ message: t('paymentConfig.messages.certificateUploadSuccess') })
    } catch (error) {
      options.onError(uploadAjaxError(error instanceof Error ? error.message : t('paymentConfig.messages.certificateUploadFailed')))
    } finally {
      uploadLoading.value = ''
    }
  }

  async function testConfig(row: PaymentConfigListItem) {
    const result = await PaymentConfigApi.test(row.id)
    ElNotification.success({ message: result.message || t('paymentConfig.messages.alipayTestPassed') })
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
    editingPrivateKeyHint,
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
    environment: 'sandbox',
    enabled_methods: ['web'],
    sort: 100,
    status: CommonEnum.NO,
    remark: '',
  }
}

function validateHTTPURL(message: string) {
  return (_rule: unknown, value: string, callback: (error?: Error) => void) => {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      callback()
      return
    }
    callback(new Error(message))
  }
}

function uploadAjaxError(message: string): UploadError {
  return Object.assign(new Error(message), {
    status: 0,
    method: 'POST',
    url: '',
  }) as UploadError
}

