import { ref, shallowRef, type Ref } from 'vue'
import type { PageInfo } from '@/types/common'
import {
  AiKnowledgeApi,
  type AiKnowledgeChunkItem,
} from '@/api/ai/knowledge'

export function useKnowledgeChunks(selectedBaseId: Ref<number | null>) {
  const selectedDocumentId = shallowRef<number | null>(null)
  const chunkLoading = shallowRef(false)
  const chunkList = ref<AiKnowledgeChunkItem[]>([])
  const chunkPage = ref<PageInfo>({ current_page: 1, page_size: 10, total: 0 })

  async function loadChunks(documentId?: number, nextPage?: PageInfo) {
    if (!selectedBaseId.value) return
    if (nextPage) chunkPage.value = nextPage
    chunkLoading.value = true
    try {
      const result = await AiKnowledgeApi.chunks({
        knowledge_base_id: selectedBaseId.value,
        document_id: documentId ?? selectedDocumentId.value ?? undefined,
        current_page: chunkPage.value.current_page,
        page_size: chunkPage.value.page_size,
      })
      chunkList.value = result.list
      chunkPage.value = result.page
    } finally {
      chunkLoading.value = false
    }
  }

  function resetSelectedDocument() {
    selectedDocumentId.value = null
  }

  function showAllChunks() {
    resetSelectedDocument()
    void loadChunks()
  }

  return {
    selectedDocumentId,
    chunkLoading,
    chunkList,
    chunkPage,
    loadChunks,
    resetSelectedDocument,
    showAllChunks,
  }
}
