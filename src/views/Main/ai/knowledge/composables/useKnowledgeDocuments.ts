import { computed, nextTick, ref, shallowRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import type { PageInfo } from '@/types/common'
import {
  AiKnowledgeApi,
  type AiKnowledgeDocumentItem,
} from '@/api/ai/knowledge'
import type { FormDialogExpose, KnowledgeDocumentFormState } from '../types'

interface UseKnowledgeDocumentsOptions {
  selectedBaseId: Ref<number | null>
  selectedDocumentId: Ref<number | null>
  loadChunks: (documentId?: number, nextPage?: PageInfo) => Promise<void>
}

export function useKnowledgeDocuments(options: UseKnowledgeDocumentsOptions) {
  const { selectedBaseId, selectedDocumentId, loadChunks } = options
  const { t } = useI18n()

  const documentLoading = shallowRef(false)
  const documentList = ref<AiKnowledgeDocumentItem[]>([])
  const documentPage = ref<PageInfo>({ current_page: 1, page_size: 10, total: 0 })

  function createDocumentForm(): KnowledgeDocumentFormState {
    return {
      knowledge_base_id: selectedBaseId.value ?? 0,
      title: '',
      source_type: 'manual',
      content: '',
      status: CommonEnum.YES,
    }
  }

  const documentDialogVisible = shallowRef(false)
  const documentDialogMode = shallowRef<'add' | 'edit'>('add')
  const documentForm = ref<KnowledgeDocumentFormState>(createDocumentForm())
  const documentDialogRef = ref<FormDialogExpose | null>(null)

  const documentRules = computed<FormRules>(() => ({
    title: [{ required: true, message: t('aiKnowledge.document.title') + t('common.required'), trigger: 'blur' }],
    content: [{ required: true, message: t('aiKnowledge.document.content') + t('common.required'), trigger: 'blur' }],
  }))

  async function loadDocuments(nextPage?: PageInfo) {
    if (!selectedBaseId.value) return
    if (nextPage) documentPage.value = nextPage
    documentLoading.value = true
    try {
      const result = await AiKnowledgeApi.documents({
        knowledge_base_id: selectedBaseId.value,
        current_page: documentPage.value.current_page,
        page_size: documentPage.value.page_size,
      })
      documentList.value = result.list
      documentPage.value = result.page
    } finally {
      documentLoading.value = false
    }
  }

  function setDocumentDialogRef(el: unknown) {
    documentDialogRef.value = el as FormDialogExpose | null
  }

  function openAddDocument() {
    if (!selectedBaseId.value) return
    documentDialogMode.value = 'add'
    documentForm.value = createDocumentForm()
    documentDialogVisible.value = true
    nextTick(() => documentDialogRef.value?.clearValidate())
  }

  async function openEditDocument(row: AiKnowledgeDocumentItem) {
    if (!selectedBaseId.value) return
    const detail = await AiKnowledgeApi.documentDetail({ id: row.id, knowledge_base_id: selectedBaseId.value })
    documentDialogMode.value = 'edit'
    documentForm.value = {
      id: detail.id,
      knowledge_base_id: detail.knowledge_base_id,
      title: detail.title,
      source_type: detail.source_type,
      content: detail.content ?? '',
      status: detail.status,
    }
    documentDialogVisible.value = true
    nextTick(() => documentDialogRef.value?.clearValidate())
  }

  async function submitDocument() {
    const valid = await documentDialogRef.value?.validate()
    if (!valid) return

    if (documentDialogMode.value === 'add') {
      await AiKnowledgeApi.addDocument(documentForm.value)
    } else if (typeof documentForm.value.id === 'number') {
      await AiKnowledgeApi.editDocument(documentForm.value as KnowledgeDocumentFormState & { id: number })
    }
    ElNotification.success({ message: t('common.success.operation') })
    documentDialogVisible.value = false
    await loadDocuments()
    await loadChunks(selectedDocumentId.value ?? undefined)
  }

  async function deleteDocument(row: AiKnowledgeDocumentItem) {
    if (!selectedBaseId.value) return
    try {
      await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.del'),
        cancelButtonText: t('common.actions.cancel'),
      })
    } catch {
      return
    }

    await AiKnowledgeApi.delDocument({ id: row.id, knowledge_base_id: selectedBaseId.value })
    ElNotification.success({ message: t('common.success.operation') })
    if (selectedDocumentId.value === row.id) selectedDocumentId.value = null
    await loadDocuments()
    await loadChunks()
  }

  async function reindexDocument(row: AiKnowledgeDocumentItem) {
    if (!selectedBaseId.value) return
    await AiKnowledgeApi.reindexDocument({ id: row.id, knowledge_base_id: selectedBaseId.value })
    ElNotification.success({ message: t('aiKnowledge.document.reindexSuccess') })
    await loadDocuments()
    await loadChunks(row.id)
  }

  function viewChunks(row: AiKnowledgeDocumentItem, openChunksTab: () => void) {
    selectedDocumentId.value = row.id
    openChunksTab()
    void loadChunks(row.id)
  }

  return {
    documentLoading,
    documentList,
    documentPage,
    documentDialogVisible,
    documentDialogMode,
    documentForm,
    setDocumentDialogRef,
    documentRules,
    loadDocuments,
    openAddDocument,
    openEditDocument,
    submitDocument,
    deleteDocument,
    reindexDocument,
    viewChunks,
  }
}
