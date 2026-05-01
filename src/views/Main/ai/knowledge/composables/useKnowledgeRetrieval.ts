import { ref, shallowRef, type ComputedRef, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import {
  AiKnowledgeApi,
  type AiKnowledgeBaseItem,
  type AiKnowledgeRetrievalChunk,
} from '@/api/ai/knowledge'

interface UseKnowledgeRetrievalOptions {
  selectedBaseId: Ref<number | null>
  selectedBase: ComputedRef<AiKnowledgeBaseItem | null>
}

export function useKnowledgeRetrieval(options: UseKnowledgeRetrievalOptions) {
  const { selectedBaseId, selectedBase } = options
  const { t } = useI18n()

  const retrievalQuery = shallowRef('')
  const retrievalLoading = shallowRef(false)
  const retrievalChunks = ref<AiKnowledgeRetrievalChunk[]>([])
  const contextPrompt = shallowRef('')

  async function runRetrievalTest() {
    if (!selectedBaseId.value || !retrievalQuery.value.trim()) {
      ElNotification.warning({ message: t('aiKnowledge.retrieval.queryRequired') })
      return
    }

    retrievalLoading.value = true
    try {
      const result = await AiKnowledgeApi.retrievalTest({
        knowledge_base_id: selectedBaseId.value,
        query: retrievalQuery.value,
        top_k: selectedBase.value?.top_k ?? 5,
      })
      retrievalChunks.value = result.chunks
      contextPrompt.value = result.context_prompt
    } finally {
      retrievalLoading.value = false
    }
  }

  return {
    retrievalQuery,
    retrievalLoading,
    retrievalChunks,
    contextPrompt,
    runRetrievalTest,
  }
}
