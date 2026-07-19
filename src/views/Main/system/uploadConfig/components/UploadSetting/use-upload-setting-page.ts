import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'
import {ElNotification} from 'element-plus'
import type {SearchField} from '@/components/Search/types'
import {
  UploadSettingApi,
  type UploadCommonStatus,
  type UploadSettingAddPayload,
  type UploadSettingEditPayload,
  type UploadSettingFormState,
  type UploadSettingInitResponse,
  type UploadSettingItem,
} from '@/api/system/uploadConfig'
import type {FormInstance, FormRules} from 'element-plus'
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum } from '@/enums'

export function useUploadSettingPage() {
  const {t} = useI18n()
  const isMobile = useIsMobile()
  const searchForm = ref({remark: '', status: '', driver_id: '', rule_id: ''})
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
    toggleStatus
  } = useCrudTable({
    api: UploadSettingApi,
    searchForm
  })
  const dict = ref<UploadSettingInitResponse['dict']>({
    upload_driver_list: [],
    upload_rule_list: [],
    common_status_arr: [],
  })

  const searchFields = computed<SearchField[]>(() => [
    {
      key: 'driver_id',
      type: 'select-v2',
      label: t('upload.setting.table.driver'),
      placeholder: t('upload.setting.table.driver'),
      width: 200,
      options: dict.value.upload_driver_list
    },
    {
      key: 'rule_id',
      type: 'select-v2',
      label: t('upload.setting.table.rule'),
      placeholder: t('upload.setting.table.rule'),
      width: 200,
      options: dict.value.upload_rule_list
    },
    {
      key: 'remark',
      type: 'input',
      label: t('upload.setting.filter.remark'),
      placeholder: t('upload.setting.filter.remark'),
      width: 200
    },
    {
      key: 'status',
      type: 'select-v2',
      label: t('upload.setting.filter.status'),
      placeholder: t('upload.setting.filter.status'),
      width: 200,
      options: dict.value.common_status_arr
    },
  ])

  const columns = computed(() => [
    {key: 'driver_name', label: t('upload.setting.table.driver')},
    {key: 'rule_name', label: t('upload.setting.table.rule')},
    {key: 'remark', label: t('upload.setting.table.remark'), width: 200, overflowTooltip: true},
    {key: 'status', label: t('upload.setting.table.status'), width: 100},
    {key: 'created_at', label: t('upload.setting.table.created_at')},
    {key: 'updated_at', label: t('upload.setting.table.updated_at')},
    {key: 'actions', label: t('common.actions.action'), width: 280}
  ])

  const init = () => {
    UploadSettingApi.pageInit().then((data) => {
      dict.value = data.dict
    })
  }

  const dialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')

  const form = ref<UploadSettingFormState>({
    id: '',
    driver_id: '',
    rule_id: '',
    status: 1,
    remark: ''
  })

  const requiredMsg = (label: string) => `${label} ${t('common.required')}`

  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }

  const rules = computed<FormRules>(() => ({
    driver_id: [{required: true, message: requiredMsg(t('upload.setting.form.driver')), trigger: 'blur'}],
    rule_id: [{required: true, message: requiredMsg(t('upload.setting.form.rule')), trigger: 'blur'}],
    status: [{required: true, message: requiredMsg(t('upload.setting.form.status')), trigger: 'blur'}]
  }))

  const add = () => {
    dialogMode.value = 'add'
    form.value = {
      id: '',
      driver_id: '',
      rule_id: '',
      status: 2,
      remark: ''
    }
    dialogVisible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  const edit = (row: UploadSettingItem) => {
    dialogMode.value = 'edit'
    form.value = {
      id: row.id,
      driver_id: row.driver_id,
      rule_id: row.rule_id,
      status: row.status,
      remark: row.remark ?? ''
    }
    dialogVisible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }
  const confirmSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value?.validate()
    } catch {
      return
    }

    const request = dialogMode.value === 'add'
      ? UploadSettingApi.create(buildAddPayload(form.value))
      : UploadSettingApi.update(buildEditPayload(form.value))

    request.then(() => {
      ElNotification.success({message: t('common.success.operation')})
      dialogVisible.value = false
      getList()
    })
  }

  const requireNumber = (value: number | '', field: string): number => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new Error(`${field} is required`)
    }
    return value
  }

  const requireStatus = (value: number): UploadCommonStatus => {
    if (value !== CommonEnum.YES && value !== CommonEnum.NO) {
      throw new Error('upload setting status is invalid')
    }
    return value
  }

  const buildAddPayload = (state: UploadSettingFormState): UploadSettingAddPayload => ({
    driver_id: requireNumber(state.driver_id, 'driver_id'),
    rule_id: requireNumber(state.rule_id, 'rule_id'),
    status: requireStatus(state.status),
    remark: state.remark,
  })

  const buildEditPayload = (state: UploadSettingFormState): UploadSettingEditPayload => ({
    id: requireNumber(state.id, 'id'),
    ...buildAddPayload(state),
  })

  onMounted(() => {
    init()
    getList()
  })

  return {
    add, batchDel, columns, confirmDel, confirmSubmit,
    dialogMode, dialogVisible, dict, edit, form,
    isMobile, listData, listLoading, onPageChange, onSearch,
    onSelectionChange, page, refresh, rules, searchFields,
    searchForm, t, toggleStatus, setFormRef,
  }
}
