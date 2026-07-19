import { ref, computed, onMounted, nextTick } from 'vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'
import {ElNotification} from 'element-plus'
import type {SearchField} from '@/components/Search/types'
import {
  UploadDriverApi,
  type UploadDriverAddPayload,
  type UploadDriverEditPayload,
  type UploadDriverFormState,
  type UploadDriverInitResponse,
  type UploadDriverItem,
  type UploadDriverType,
} from '@/api/system/uploadConfig'
import type {FormInstance, FormRules} from 'element-plus'
import { useCrudTable } from '@/hooks/useCrudTable'

export function useUploadDriverPage() {
  const {t} = useI18n()
  const isMobile = useIsMobile()
  const searchForm = ref({driver: ''})

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
    batchDel
  } = useCrudTable({
    api: UploadDriverApi,
    searchForm
  })

  const dict = ref<UploadDriverInitResponse['dict']>({
    upload_driver_arr: [],
  })

  const searchFields = computed<SearchField[]>(() => [
    {
      key: 'driver',
      type: 'select-v2',
      label: t('upload.driver.filter.driver'),
      placeholder: t('upload.driver.filter.driver'),
      width: 200,
      options: dict.value.upload_driver_arr
    },
  ])

  const columns = computed(() => [
    {key: 'driver_show', label: t('upload.driver.table.driver')},
    {key: 'secret_id_hint', label: t('upload.driver.table.secret_id')},
    {key: 'secret_key_hint', label: t('upload.driver.table.secret_key')},
    {key: 'bucket', label: t('upload.driver.table.bucket')},
    {key: 'region', label: t('upload.driver.table.region')},
    {key: 'created_at', label: t('upload.driver.table.created_at')},
    {key: 'updated_at', label: t('upload.driver.table.updated_at')},
    {key: 'actions', label: t('common.actions.action'), width: 220}
  ])

  const init = () => {
    UploadDriverApi.pageInit()
        .then((data) => {
          dict.value = data.dict
        })
        .catch(() => {
        })
  }


  const dialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')

  const form = ref<UploadDriverFormState>({
    id: '',
    driver: 'cos',
    secret_id: '',
    secret_key: '',
    bucket: '',
    region: '',
    appid: '',
    endpoint: '',
    bucket_domain: ''
  })

  const requiredMsg = (label: string) => `${label} ${t('common.required')}`

  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }

  const rules = computed<FormRules>(() => ({
    driver: [{required: true, message: requiredMsg(t('upload.driver.form.driver')), trigger: 'blur'}],
    secret_id: [
      {
        validator: (_rule, _value, callback) => {
          // 新增时必填，编辑时留空不改
          if (dialogMode.value === 'add' && !form.value.secret_id) callback(new Error(requiredMsg(t('upload.driver.form.secret_id'))))
          else callback()
        },
        trigger: 'blur'
      }
    ],
    secret_key: [
      {
        validator: (_rule, _value, callback) => {
          if (dialogMode.value === 'add' && !form.value.secret_key) callback(new Error(requiredMsg(t('upload.driver.form.secret_key'))))
          else callback()
        },
        trigger: 'blur'
      }
    ],
    bucket: [{required: true, message: requiredMsg(t('upload.driver.form.bucket')), trigger: 'blur'}],
    region: [{required: true, message: requiredMsg(t('upload.driver.form.region')), trigger: 'blur'}],
    appid: [
      {
        validator: (_rule, _value, callback) => {
          if (form.value.driver === 'cos' && !form.value.appid) callback(new Error(requiredMsg(t('upload.driver.form.appid'))))
          else callback()
        },
        trigger: 'blur'
      }
    ]
  }))

  // 单一 rules 即可，区分模式通过 dialogMode 控制提交行为

  const add = () => {
    dialogMode.value = 'add'
    form.value = {
      id: '',
      driver: 'cos',
      secret_id: '',
      secret_key: '',
      bucket: '',
      region: '',
      appid: '',
      endpoint: '',
      bucket_domain: ''
    }
    dialogVisible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  const edit = (row: UploadDriverItem) => {
    dialogMode.value = 'edit'
    form.value = {
      id: row.id,
      driver: row.driver,
      secret_id: '',  // 编辑时留空，后端不返回明文
      secret_key: '', // 编辑时留空，后端不返回明文
      bucket: row.bucket,
      region: row.region,
      appid: row.appid ?? '',
      endpoint: row.endpoint ?? '',
      bucket_domain: row.bucket_domain ?? ''
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
      ? UploadDriverApi.create(buildAddPayload(form.value))
      : UploadDriverApi.update(buildEditPayload(form.value))

    request.then(() => {
      ElNotification.success({message: t('common.success.operation')})
      dialogVisible.value = false
      getList()
    })
  }

  const requireDriverType = (value: UploadDriverFormState['driver']): UploadDriverType => {
    if (value !== 'cos') {
      throw new Error(t('upload.driver.form.cos_only'))
    }
    return value
  }

  const buildAddPayload = (state: UploadDriverFormState): UploadDriverAddPayload => ({
    driver: requireDriverType(state.driver),
    secret_id: state.secret_id,
    secret_key: state.secret_key,
    bucket: state.bucket,
    region: state.region,
    appid: state.appid,
    endpoint: state.endpoint,
    bucket_domain: state.bucket_domain,
  })

  const buildEditPayload = (state: UploadDriverFormState): UploadDriverEditPayload => {
    if (state.id === '') {
      throw new Error('upload driver id is required')
    }

    const payload: UploadDriverEditPayload = {
      id: state.id,
      driver: requireDriverType(state.driver),
      bucket: state.bucket,
      region: state.region,
      appid: state.appid,
      endpoint: state.endpoint,
      bucket_domain: state.bucket_domain,
    }

    if (state.secret_id.trim()) {
      payload.secret_id = state.secret_id.trim()
    }
    if (state.secret_key.trim()) {
      payload.secret_key = state.secret_key.trim()
    }

    return payload
  }

  onMounted(() => {
    init()
    getList()
  })

  return {
    add, batchDel, columns, confirmDel, confirmSubmit,
    dialogMode, dialogVisible, dict, edit, form,
    isMobile, listData, listLoading, onPageChange, onSearch,
    onSelectionChange, page, refresh, rules, searchFields,
    searchForm, t, setFormRef,
  }
}
