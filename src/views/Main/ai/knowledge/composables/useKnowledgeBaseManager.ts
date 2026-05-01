import { computed, nextTick, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormRules } from 'element-plus'
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum } from '@/enums'
import {
  AiKnowledgeApi,
  type AiKnowledgeBaseItem,
  type AiKnowledgeBaseListParams,
  type AiKnowledgeBaseMutationParams,
} from '@/api/ai/knowledge'
import type { FormDialogExpose, KnowledgeBaseFormState } from '../types'

function createBaseForm(): KnowledgeBaseFormState {
  return {
    name: '',
    description: '',
    visibility: 'private',
    permission_json: {},
    chunk_size: 800,
    chunk_overlap: 120,
    top_k: 5,
    score_threshold: 0,
    status: CommonEnum.YES,
  }
}

export function useKnowledgeBaseManager() {
  const { t } = useI18n()
  const searchForm = ref<AiKnowledgeBaseListParams>({
    name: '',
    visibility: '',
    status: '',
  })

  const {
    loading: baseLoading,
    data: baseList,
    page: basePage,
    getList: getBaseList,
    onSearch,
    onPageChange,
    refresh,
    confirmDel,
    toggleStatus,
  } = useCrudTable<AiKnowledgeBaseItem>({
    api: AiKnowledgeApi,
    searchForm,
  })

  const selectedBaseId = shallowRef<number | null>(null)
  const selectedBase = computed(() => baseList.value.find((item) => item.id === selectedBaseId.value) ?? null)

  const baseDialogVisible = shallowRef(false)
  const baseDialogMode = shallowRef<'add' | 'edit'>('add')
  const baseForm = ref<KnowledgeBaseFormState>(createBaseForm())
  const baseDialogRef = ref<FormDialogExpose | null>(null)

  const baseRules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('aiKnowledge.form.name') + t('common.required'), trigger: 'blur' }],
    visibility: [{ required: true, message: t('aiKnowledge.form.visibility') + t('common.required'), trigger: 'change' }],
    chunk_size: [{ required: true, message: t('aiKnowledge.form.chunkSize') + t('common.required'), trigger: 'blur' }],
    chunk_overlap: [{ required: true, message: t('aiKnowledge.form.chunkOverlap') + t('common.required'), trigger: 'blur' }],
  }))

  function setSelectedBase(id: number | null) {
    selectedBaseId.value = id
  }

  function setBaseDialogRef(el: unknown) {
    baseDialogRef.value = el as FormDialogExpose | null
  }

  function openAddBase() {
    baseDialogMode.value = 'add'
    baseForm.value = createBaseForm()
    baseDialogVisible.value = true
    nextTick(() => baseDialogRef.value?.clearValidate())
  }

  function openEditBase(row: AiKnowledgeBaseItem) {
    baseDialogMode.value = 'edit'
    baseForm.value = {
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      visibility: row.visibility || 'private',
      permission_json: row.permission_json ?? {},
      chunk_size: row.chunk_size,
      chunk_overlap: row.chunk_overlap,
      top_k: row.top_k,
      score_threshold: row.score_threshold,
      status: row.status,
    }
    baseDialogVisible.value = true
    nextTick(() => baseDialogRef.value?.clearValidate())
  }

  async function submitBase(): Promise<number | undefined> {
    const valid = await baseDialogRef.value?.validate()
    if (!valid) return undefined

    if (baseForm.value.chunk_overlap >= baseForm.value.chunk_size) {
      ElNotification.warning({ message: t('aiKnowledge.form.chunkOverlapInvalid') })
      return undefined
    }

    const payload: AiKnowledgeBaseMutationParams = {
      ...baseForm.value,
      description: baseForm.value.description || null,
    }
    let selectId = baseForm.value.id
    if (baseDialogMode.value === 'add') {
      const result = await AiKnowledgeApi.add(payload)
      selectId = result.id
    } else {
      await AiKnowledgeApi.edit(payload)
    }
    ElNotification.success({ message: t('common.success.operation') })
    baseDialogVisible.value = false

    return selectId
  }

  return {
    searchForm,
    baseLoading,
    baseList,
    basePage,
    selectedBaseId,
    selectedBase,
    baseDialogVisible,
    baseDialogMode,
    baseForm,
    setBaseDialogRef,
    baseRules,
    getBaseList,
    onSearch,
    onPageChange,
    refresh,
    confirmDel,
    toggleStatus,
    setSelectedBase,
    openAddBase,
    openEditBase,
    submitBase,
  }
}
