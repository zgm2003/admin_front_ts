import { computed, nextTick, onMounted, ref, shallowRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { SearchField } from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import { AiPromptApi, type AiCommonStatus, type AiPromptInitResponse, type AiPromptItem, type AiPromptMutationParams } from '@/api/ai/prompts'

interface PromptTableParams {
  current_page: number
  page_size: number
  keyword?: string
  category?: string
  status?: AiCommonStatus | ''
}

interface PromptSearchForm {
  keyword: string
  category: string
  status: AiCommonStatus | ''
}

interface PromptForm {
  id?: number
  slug: string
  category: string
  title: string
  cover_url: string
  prompt: string
  preview: string
  tags_json: string
  source_url: string
  status: AiCommonStatus
}

export function usePromptAdminPage(formRef: Readonly<Ref<FormInstance | null>>) {
  const { t } = useI18n()
  const isMobile = useIsMobile()

  const dict = shallowRef<AiPromptInitResponse>({
    common_status_arr: [],
  })

  const searchForm = ref<PromptSearchForm>({
    keyword: '',
    category: '',
    status: '',
  })

  const {
    loading: listLoading,
    data: listData,
    page,
    onSearch,
    onPageChange,
    onSelectionChange,
    refresh,
    getList,
    confirmDel,
    batchDel,
    toggleStatus,
  } = useCrudTable<AiPromptItem, PromptTableParams, AiCommonStatus>({
    api: AiPromptApi,
    searchForm,
  })

  const dialogVisible = shallowRef(false)
  const dialogMode = shallowRef<'add' | 'edit'>('add')
  const form = ref<PromptForm>(defaultForm())

  const searchFields = computed<SearchField[]>(() => [
    { key: 'keyword', type: 'input', label: t('aiPrompts.filter.keyword'), placeholder: t('aiPrompts.filter.keyword'), width: 180 },
    { key: 'category', type: 'input', label: t('aiPrompts.filter.category'), placeholder: t('aiPrompts.filter.category'), width: 160 },
    { key: 'status', type: 'select-v2', label: t('aiPrompts.filter.status'), placeholder: t('aiPrompts.filter.status'), width: 120, options: dict.value.common_status_arr },
  ])

  const columns = computed(() => [
    { key: 'cover_url', label: t('aiPrompts.table.cover'), width: 90 },
    { key: 'title', label: t('aiPrompts.table.title'), minWidth: 180, overflowTooltip: true },
    { key: 'slug', label: t('aiPrompts.table.slug'), minWidth: 160, overflowTooltip: true },
    { key: 'category', label: t('aiPrompts.table.category'), width: 140, overflowTooltip: true },
    { key: 'preview', label: t('aiPrompts.table.preview'), minWidth: 220, overflowTooltip: true },
    { key: 'status', label: t('aiPrompts.table.status'), width: 100 },
    { key: 'updated_at', label: t('aiPrompts.table.updatedAt'), width: 170 },
    { key: 'actions', label: t('common.actions.action'), width: 260 },
  ])

  const rules = computed<FormRules>(() => ({
    slug: [{ required: true, message: t('aiPrompts.form.slug') + t('common.required'), trigger: 'blur' }],
    title: [{ required: true, message: t('aiPrompts.form.title') + t('common.required'), trigger: 'blur' }],
    prompt: [{ required: true, message: t('aiPrompts.form.prompt') + t('common.required'), trigger: 'blur' }],
    status: [{ required: true, message: t('aiPrompts.form.status') + t('common.required'), trigger: 'change' }],
  }))

  function defaultForm(): PromptForm {
    return {
      slug: '',
      category: '',
      title: '',
      cover_url: '',
      prompt: '',
      preview: '',
      tags_json: '',
      source_url: '',
      status: CommonEnum.YES,
    }
  }

  async function init() {
    dict.value = await AiPromptApi.pageInit()
  }

  function statusText(status: AiCommonStatus): string {
    const option = dict.value.common_status_arr.find((item) => item.value === status)
    if (!option) throw new Error(`AI prompt status ${status} missing from page-init`)
    return option.label
  }

  function isKnownStatus(status: unknown): status is AiCommonStatus {
    return dict.value.common_status_arr.some((item) => item.value === status)
  }

  function statusTagType(status: AiCommonStatus): 'success' | 'danger' {
    return status === CommonEnum.YES ? 'success' : 'danger'
  }

  function add() {
    dialogMode.value = 'add'
    form.value = defaultForm()
    dialogVisible.value = true
    void nextTick(() => formRef.value?.clearValidate())
  }

  function edit(row: AiPromptItem) {
    dialogMode.value = 'edit'
    form.value = {
      id: row.id,
      slug: row.slug,
      category: row.category,
      title: row.title,
      cover_url: row.cover_url,
      prompt: row.prompt,
      preview: row.preview,
      tags_json: row.tags_json,
      source_url: row.source_url,
      status: row.status,
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
    const payload: AiPromptMutationParams = {
      id: form.value.id,
      slug: form.value.slug,
      category: form.value.category,
      title: form.value.title,
      cover_url: form.value.cover_url,
      prompt: form.value.prompt,
      preview: form.value.preview,
      tags_json: form.value.tags_json,
      source_url: form.value.source_url,
      status: form.value.status,
    }
    const api = dialogMode.value === 'add' ? AiPromptApi.create : AiPromptApi.update
    await api(payload)
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    await getList()
  }

  onMounted(async () => {
    await init()
    await getList()
  })

  return {
    t, isMobile, dict, searchForm, searchFields, columns,
    listLoading, listData, page, onSearch, onPageChange, onSelectionChange,
    refresh, confirmDel, batchDel, toggleStatus,
    dialogVisible, dialogMode, form, rules,
    statusText, isKnownStatus, statusTagType, add, edit, confirmSubmit,
  }
}
