import { computed, nextTick, ref } from 'vue'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  PayChannelApi,
  type PayChannelInitResponse,
  type PayChannelListItem,
  type PayChannelListParams,
  type PayChannelMutationPayload,
} from '@/api/pay/channel'
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum } from '@/enums'
import type { DictOption } from '@/types/common'
import type {
  PayChannelDialogMode,
  PayChannelEditableRow,
  PayChannelForm,
  PayChannelSearchForm,
} from '../types'

type Translate = (key: string) => string

export function createDefaultPayChannelForm(): PayChannelForm {
  return {
    id: 0,
    name: '',
    channel: 1,
    supported_methods: [],
    mch_id: '',
    app_id: '',
    notify_url: '',
    app_private_key: '',
    app_private_key_hint: '',
    public_cert_path: '',
    platform_cert_path: '',
    root_cert_path: '',
    sort: 0,
    is_sandbox: CommonEnum.NO,
    status: CommonEnum.YES,
    remark: '',
  }
}

export function filterPayChannelMethods(
  selected: string[] = [],
  options: Array<DictOption<string>> = [],
) {
  const allowedSet = new Set(options.map((item) => item.value))
  return selected.filter((method) => allowedSet.has(method))
}

export function buildPayChannelNotifyUrl(
  channel: number,
  domain = 'https://www.zgm2003.cn',
) {
  if (channel === 1) {
    return `${domain}/api/pay/notify/wechat`
  }

  if (channel === 2) {
    return `${domain}/api/pay/notify/alipay`
  }

  return ''
}

export function usePayChannelPage(params: {
  t: Translate
}) {
  const { t } = params

  const channelArr = ref<PayChannelInitResponse['dict']['channel_arr']>([])
  const statusArr = ref<PayChannelInitResponse['dict']['common_status_arr']>([])
  const payMethodArr = ref<PayChannelInitResponse['dict']['pay_method_arr']>([])

  const searchForm = ref<PayChannelSearchForm>({
    name: '',
    channel: '',
    status: '',
  })

  const {
    loading: listLoading,
    data: listData,
    page,
    onSearch,
    onPageChange,
    refresh,
    getList,
    onSelectionChange,
    confirmDel,
    batchDel,
    toggleStatus,
  } = useCrudTable<PayChannelListItem, PayChannelListParams>({
    api: PayChannelApi,
    searchForm,
  })

  const dialogVisible = ref(false)
  const dialogMode = ref<PayChannelDialogMode>('add')
  const formRef = ref<FormInstance | null>(null)
  const sectionBasic = ref(true)
  const sectionCert = ref(false)
  const sectionCallback = ref(false)
  const form = ref<PayChannelForm>(createDefaultPayChannelForm())

  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('pay_channel.table.name') + t('common.required'), trigger: 'blur' }],
    channel: [{ required: true, message: t('pay_channel.table.channel') + t('common.required'), trigger: 'change' }],
    supported_methods: [{ required: true, message: t('pay_channel.form.supported_methods') + t('common.required'), trigger: 'change' }],
    mch_id: [{ required: true, message: t('pay_channel.table.mch_id') + t('common.required'), trigger: 'blur' }],
  }))

  const availablePayMethodOptions = computed(() => payMethodArr.value)

  async function init() {
    const data = await PayChannelApi.init()
    channelArr.value = data.dict.channel_arr
    statusArr.value = data.dict.common_status_arr
    payMethodArr.value = data.dict.pay_method_arr
  }

  function resetSections() {
    sectionBasic.value = true
    sectionCert.value = false
    sectionCallback.value = false
  }

  function syncSupportedMethods(selected: string[] = []) {
    form.value.supported_methods = filterPayChannelMethods(selected, payMethodArr.value)
  }

  function onChannelChange() {
    form.value.notify_url = buildPayChannelNotifyUrl(form.value.channel)
    form.value.supported_methods = []
  }

  function openAddDialog() {
    dialogMode.value = 'add'
    form.value = createDefaultPayChannelForm()
    resetSections()
    dialogVisible.value = true
    nextTick(() => {
      void formRef.value?.clearValidate()
    })
  }

  function openEditDialog(row: PayChannelEditableRow) {
    dialogMode.value = 'edit'
    form.value = {
      id: row.id,
      name: row.name,
      channel: row.channel,
      supported_methods: Array.isArray(row.supported_methods) ? row.supported_methods : [],
      mch_id: row.mch_id,
      app_id: row.app_id ?? '',
      notify_url: row.notify_url ?? '',
      app_private_key: '',
      app_private_key_hint: row.app_private_key_hint ?? '',
      public_cert_path: row.public_cert_path ?? '',
      platform_cert_path: row.platform_cert_path ?? '',
      root_cert_path: row.root_cert_path ?? '',
      sort: row.sort ?? 0,
      is_sandbox: row.is_sandbox,
      status: row.status,
      remark: row.remark ?? '',
    }
    syncSupportedMethods(form.value.supported_methods)
    resetSections()
    dialogVisible.value = true
    nextTick(() => {
      void formRef.value?.clearValidate()
    })
  }

  async function confirmSubmit() {
    try {
      await formRef.value?.validate()
    } catch {
      return
    }

    const payload: PayChannelMutationPayload = { ...form.value }
    if (!payload.app_private_key) {
      delete payload.app_private_key
    }
    if (!payload.app_private_key_hint) {
      delete payload.app_private_key_hint
    }

    const api = dialogMode.value === 'add' ? PayChannelApi.add : PayChannelApi.edit
    await api(payload)
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    await getList()
  }

  return {
    channelArr,
    statusArr,
    payMethodArr,
    searchForm,
    listLoading,
    listData,
    page,
    onSearch,
    onPageChange,
    refresh,
    getList,
    onSelectionChange,
    confirmDel,
    batchDel,
    toggleStatus,
    dialogVisible,
    dialogMode,
    formRef,
    form,
    sectionBasic,
    sectionCert,
    sectionCallback,
    rules,
    availablePayMethodOptions,
    init,
    onChannelChange,
    openAddDialog,
    openEditDialog,
    confirmSubmit,
  }
}
