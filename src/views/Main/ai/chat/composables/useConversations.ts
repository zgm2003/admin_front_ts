import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification, ElMessageBox } from 'element-plus'
import { AiConversationApi } from '@/api/ai/conversations'
import { isToday } from '@/utils/date'
import type { Conversation } from './types'

const PAGE_SIZE = 50

/**
 * 从降序列表中找到第一个今日会话（即 last_message_at 最新的今日会话）
 */
export function findTodayConversation(
  conversations: Conversation[]
): Conversation | null {
  return conversations.find(
    c => c.last_message_at && isToday(c.last_message_at)
  ) ?? null
}

export function useConversations() {
  const { t } = useI18n()

  const conversations = ref<Conversation[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const loadingMore = ref(false)
  const page = ref(1)
  const hasMore = ref(true)
  const showArchived = ref(false)
  const currentAgentId = ref<number | null>(null)

  // 加载会话列表（支持按 agent_id 过滤）
  const loadConversations = async (options?: { agent_id?: number }) => {
    loading.value = true
    page.value = 1
    hasMore.value = true
    
    // 更新当前过滤的 agent_id
    if (options?.agent_id !== undefined) {
      currentAgentId.value = options.agent_id
    }
    
    try {
      const res = await AiConversationApi.list({
        page_size: PAGE_SIZE,
        current_page: 1,
        status: showArchived.value ? 2 : 1,
        agent_id: currentAgentId.value || undefined
      })
      const list = res.list || []
      conversations.value = list
      hasMore.value = list.length >= PAGE_SIZE
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  // 加载更多
  const loadMore = async () => {
    if (loadingMore.value || !hasMore.value) return

    loadingMore.value = true
    const nextPage = page.value + 1

    try {
      const res = await AiConversationApi.list({
        page_size: PAGE_SIZE,
        current_page: nextPage,
        status: showArchived.value ? 2 : 1,
        agent_id: currentAgentId.value || undefined
      })
      const list = res.list || []

      if (list.length > 0) {
        conversations.value = [...conversations.value, ...list]
        page.value = nextPage
        hasMore.value = list.length >= PAGE_SIZE
      } else {
        hasMore.value = false
      }
    } finally {
      loadingMore.value = false
    }
  }

  // 重命名
  const rename = async (id: number, title: string) => {
    if (!title.trim()) {
      ElNotification.warning({ message: t('aiChat.newTitle') + t('common.required') })
      return false
    }
    await AiConversationApi.edit({ id, title })
    ElNotification.success({ message: t('common.success.operation') })
    await loadConversations()
    return true
  }

  // 删除
  const remove = async (id: number) => {
    try {
      await ElMessageBox.confirm(t('aiChat.confirmDelete'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.confirm'),
        cancelButtonText: t('common.actions.cancel')
      })
    } catch {
      return false
    }
    await AiConversationApi.del({ id })
    ElNotification.success({ message: t('common.success.operation') })
    await loadConversations()
    return true
  }

  // 归档/取消归档
  const archive = async (id: number) => {
    const newStatus = showArchived.value ? 1 : 2
    await AiConversationApi.status({ id, status: newStatus })
    ElNotification.success({ message: showArchived.value ? t('aiChat.unarchived') : t('aiChat.archived') })
    await loadConversations()
  }

  // 切换归档视图
  const toggleArchived = (archived: boolean) => {
    if (showArchived.value === archived) return
    showArchived.value = archived
    loadConversations()
  }

  // 获取会话详情
  const getDetail = async (id: number) => {
    return await AiConversationApi.detail({ id })
  }

  // 获取最近的会话（用于自动选择）
  const getMostRecent = () => {
    if (conversations.value.length === 0) return null
    return conversations.value[0] // 已按 last_message_at 降序排列
  }

  return {
    conversations,
    loaded,
    loading,
    loadingMore,
    hasMore,
    showArchived,
    currentAgentId,
    loadConversations,
    loadMore,
    rename,
    remove,
    archive,
    toggleArchived,
    getDetail,
    getMostRecent
  }
}
