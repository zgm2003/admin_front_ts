import { shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { AiConversationApi } from '@/api/ai/conversations'
import type { Conversation } from './types'

const PAGE_SIZE = 30

export function useConversations() {
  const { t } = useI18n()
  const conversations = shallowRef<Conversation[]>([])
  const loading = shallowRef(false)
  const loadingMore = shallowRef(false)
  const hasMore = shallowRef(false)
  const nextId = shallowRef(0)
  const currentAgentId = shallowRef<number | null>(null)

  async function loadConversations(agentId: number | null) {
    currentAgentId.value = agentId
    conversations.value = []
    nextId.value = 0
    hasMore.value = false

    if (!agentId) return

    loading.value = true
    try {
      const response = await AiConversationApi.list({ agent_id: agentId, limit: PAGE_SIZE })
      conversations.value = response.list
      nextId.value = response.next_id
      hasMore.value = response.has_more
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!currentAgentId.value || !hasMore.value || loadingMore.value) return

    loadingMore.value = true
    try {
      const response = await AiConversationApi.list({
        agent_id: currentAgentId.value,
        before_id: nextId.value || undefined,
        limit: PAGE_SIZE,
      })
      conversations.value = [...conversations.value, ...response.list]
      nextId.value = response.next_id
      hasMore.value = response.has_more
    } finally {
      loadingMore.value = false
    }
  }

  async function create(agentId: number, title = '') {
    const response = await AiConversationApi.add({ agent_id: agentId, title })
    await loadConversations(agentId)
    return response.id
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

    await AiConversationApi.del({ id })
    conversations.value = conversations.value.filter((conversation) => conversation.id !== id)
    ElNotification.success({ message: t('common.success.operation') })
    return true
  }

  function upsertConversation(conversation: Conversation) {
    const next = conversations.value.filter((item) => item.id !== conversation.id)
    conversations.value = [conversation, ...next]
  }

  function touchConversation(id: number, patch: Partial<Pick<Conversation, 'title' | 'last_message_at' | 'updated_at'>>) {
    const old = conversations.value.find((item) => item.id === id)
    if (!old) return
    upsertConversation({ ...old, ...patch })
  }

  return {
    conversations,
    loading,
    loadingMore,
    hasMore,
    currentAgentId,
    loadConversations,
    loadMore,
    create,
    remove,
    upsertConversation,
    touchConversation,
  }
}
