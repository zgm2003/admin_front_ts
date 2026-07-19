import { shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { createAIChatWorkflow } from '@/features/ai-chat/workflow'
import type { Conversation } from './types'

type AIChatWorkflow = ReturnType<typeof createAIChatWorkflow>

export function useConversations(workflow: AIChatWorkflow) {
  const { t } = useI18n()
  const conversations = shallowRef<Conversation[]>([])
  const loading = shallowRef(false)
  const loadingMore = shallowRef(false)
  const hasMore = shallowRef(false)
  const loaded = shallowRef(false)
  const searchKeyword = shallowRef('')
  const searched = shallowRef(false)
  const currentAgentId = shallowRef<number | null>(null)

  function filterConversations(list: readonly Conversation[]) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    if (!keyword) return [...list]
    return list.filter((item) => item.title.toLowerCase().includes(keyword))
  }

  watch(
    () => workflow.conversations.state.value.data,
    (items) => {
      conversations.value = filterConversations(items)
      hasMore.value = workflow.conversationCursor.value.has_more
    },
    { flush: 'sync' },
  )

  async function loadConversations(agentId: number | null) {
    currentAgentId.value = agentId
    conversations.value = []
    hasMore.value = false
    loaded.value = false
    searched.value = false
    if (!agentId) {
      workflow.conversations.reset()
      return
    }

    loading.value = true
    try {
      await workflow.loadConversations(agentId)
      if (currentAgentId.value !== agentId) return
      if (searchKeyword.value.trim()) searched.value = true
      else loaded.value = true
    } finally {
      if (currentAgentId.value === agentId) loading.value = false
    }
  }

  async function loadMore() {
    if (!currentAgentId.value || !hasMore.value || loadingMore.value) return
    if (searchKeyword.value.trim()) return

    loadingMore.value = true
    try {
      await workflow.loadMoreConversations()
    } finally {
      loadingMore.value = false
    }
  }

  async function create(agentId: number, title = '') {
    const result = await workflow.createConversation.mutate({ agent_id: agentId, title })
    if (result.kind === 'canceled') throw new Error('AI conversation creation was canceled')
    return result.data.id
  }

  async function remove(id: number) {
    try {
      await ElMessageBox.confirm(t('aiChat.confirmDelete'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.confirm'),
        cancelButtonText: t('common.actions.cancel'),
      })
    } catch {
      return false
    }

    const result = await workflow.deleteConversation.mutate({ id })
    if (result.kind === 'canceled') return false
    ElNotification.success({ message: t('common.success.operation') })
    return true
  }

  function upsertConversation(conversation: Conversation) {
    const next = conversations.value.filter((item) => item.id !== conversation.id)
    conversations.value = [conversation, ...next]
  }

  function touchConversation(
    id: number,
    patch: Partial<Pick<Conversation, 'title' | 'last_message_at' | 'updated_at'>>,
  ) {
    const old = conversations.value.find((item) => item.id === id)
    if (!old) return
    upsertConversation({ ...old, ...patch })
  }

  async function rename(id: number, title: string) {
    const normalized = title.trim()
    if (!normalized) return false
    const result = await workflow.updateConversation.mutate({ id, title: normalized })
    if (result.kind === 'canceled') return false
    ElNotification.success({ message: t('common.success.operation') })
    return true
  }

  async function search(keyword: string) {
    searchKeyword.value = keyword
    conversations.value = filterConversations(workflow.conversations.state.value.data)
    searched.value = keyword.trim().length > 0
  }

  return {
    conversations,
    loaded,
    searched,
    loading,
    loadingMore,
    hasMore,
    currentAgentId,
    loadConversations,
    loadMore,
    create,
    remove,
    rename,
    search,
    upsertConversation,
    touchConversation,
  }
}
