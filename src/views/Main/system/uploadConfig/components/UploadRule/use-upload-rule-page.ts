import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  UploadRuleApi,
  type UploadRuleAddPayload,
  type UploadRuleEditPayload,
  type UploadRuleForm,
  type UploadRuleInitResponse,
  type UploadRuleItem,
} from '@/api/system/uploadConfig'
import {useIsMobile} from '@/hooks/useResponsive'
import {ElNotification} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { SearchField } from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'

export function useUploadRulePage() {
  const {t} = useI18n()
  const isMobile = useIsMobile()
  const dict = ref<UploadRuleInitResponse['dict']>({
    upload_image_ext_arr: [],
    upload_file_ext_arr: [],
  })

  const searchForm = ref({title: ''})

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
    api: UploadRuleApi,
    searchForm
  })

  const dialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')

  type UploadRuleFormState = UploadRuleForm & {
    id: number | string
  }

  const form = ref<UploadRuleFormState>({
    id: '',
    title: '',
    max_size_mb: 5,
    image_exts: [],
    file_exts: []
  })

  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }
  const rules = computed<FormRules>(() => ({
    title: [{ required: true, message: t('upload.rule.form.title') + t('common.required'), trigger: 'blur' }],
    max_size_mb: [
      { required: true, message: t('upload.rule.form.max_size_mb') + t('common.required'), trigger: 'change' },
      {
        validator: (_rule, value, callback) => {
          const v = Number(value)
          if (!Number.isFinite(v) || v < 1 || v > 10240) callback(new Error(t('upload.rule.form.max_size_mb') + t('common.required')))
          else callback()
        },
        trigger: 'change'
      }
    ],
    image_exts: [
      {
        validator: (_rule, _value, callback) => {
          if (form.value.image_exts.length === 0 && form.value.file_exts.length === 0) callback(new Error('Image Exts / File Exts 至少选择一项'))
          else callback()
        },
        trigger: 'change'
      }
    ],
    file_exts: [
      {
        validator: (_rule, _value, callback) => {
          if (form.value.image_exts.length === 0 && form.value.file_exts.length === 0) callback(new Error('Image Exts / File Exts 至少选择一项'))
          else callback()
        },
        trigger: 'change'
      }
    ]
  }))

  const init = () => {
    UploadRuleApi.pageInit()
        .then((data) => {
          dict.value = data.dict
        })
        .catch(() => {
        })
  }

  const searchFields = computed<SearchField[]>(() => [
    {
      key: 'title',
      type: 'input',
      label: t('upload.rule.filter.title'),
      placeholder: t('upload.rule.filter.title'),
      width: 200
    },
    // 已移除 status，后续由独立配置生效
  ])

  const columns = computed(() => [
    {key: 'title', label: t('upload.rule.table.title')},
    {key: 'max_size_mb', label: t('upload.rule.table.max_size_mb')},
    {key: 'image_exts', label: 'Image Exts'},
    {key: 'file_exts', label: 'File Exts'},
    {key: 'created_at', label: t('upload.rule.table.created_at')},
    {key: 'updated_at', label: t('upload.rule.table.updated_at')},
    {key: 'actions', label: t('common.actions.action'), width: 220}
  ])

  const tagWrapStyle = 'display:flex;flex-wrap:wrap;gap:6px;'

  const add = () => {
    dialogMode.value = 'add'
    form.value = {id: '', title: '', max_size_mb: 5, image_exts: [], file_exts: []}
    dialogVisible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  const edit = (row: UploadRuleItem) => {
    dialogMode.value = 'edit'
    form.value = {
      id: row.id,
      title: row.title,
      max_size_mb: row.max_size_mb,
      image_exts: row.image_exts,
      file_exts: row.file_exts
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
      ? UploadRuleApi.create(buildAddPayload(form.value))
      : UploadRuleApi.update(buildEditPayload(form.value))

    request.then(() => {
      ElNotification.success({message: t('common.success.operation')});
      dialogVisible.value = false;
      getList()
    })
  }

  const buildAddPayload = (state: UploadRuleForm): UploadRuleAddPayload => ({
    title: state.title,
    max_size_mb: state.max_size_mb,
    image_exts: state.image_exts,
    file_exts: state.file_exts,
  })

  const buildEditPayload = (state: UploadRuleFormState): UploadRuleEditPayload => {
    if (state.id === '') {
      throw new Error('upload rule id is required')
    }

    return {
      id: Number(state.id),
      title: state.title,
      max_size_mb: state.max_size_mb,
      image_exts: state.image_exts,
      file_exts: state.file_exts,
    }
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
    searchForm, t, tagWrapStyle, setFormRef,
  }
}
