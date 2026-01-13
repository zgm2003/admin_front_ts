import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification, ElMessageBox } from 'element-plus'
import { AiMessageApi } from '@/api/ai/messages'
import type { Message } from './types'

const PAGE_SIZE = 200

export function useMessages() {
  const { t } = useI18n()

  const messages = ref<Message[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const page = ref(1)
  const hasMore = ref(true)
  const scrollRef = ref<any>(null)

  // 滚动到底部
  const scrollToBottom = () => {
    const wrap = scrollRef.value?.wrapRef
    if (wrap) {
      scrollRef.value?.setScrollTop(wrap.scrollHeight)
    }
  }

  // 加载消息
  const loadMessages = async (conversationId: number | null) => {
    if (!conversationId) {
      messages.value = []
      return
    }
    loading.value = true
    page.value = 1
    hasMore.value = true
    try {
      const res = await AiMessageApi.list({
        conversation_id: conversationId,
        page_size: PAGE_SIZE,
        current_page: 1
      })
      const list = res.list || []
      messages.value = list.reverse()
      hasMore.value = list.length >= PAGE_SIZE
      nextTick(() => scrollToBottom())
    } finally {
      loading.value = false
    }
  }

  // 加载更多历史消息
  const loadMore = async (conversationId: number | null) => {
    if (!conversationId || loadingMore.value || !hasMore.value) return

    loadingMore.value = true
    const nextPage = page.value + 1

    try {
      const wrap = scrollRef.value?.wrapRef
      const prevScrollHeight = wrap?.scrollHeight || 0

      const res = await AiMessageApi.list({
        conversation_id: conversationId,
        page_size: PAGE_SIZE,
        current_page: nextPage
      })
      const list = res.list || []

      if (list.length > 0) {
        messages.value = [...list.reverse(), ...messages.value]
        page.value = nextPage
        hasMore.value = list.length >= PAGE_SIZE

        nextTick(() => {
          if (wrap) {
            const newScrollHeight = wrap.scrollHeight
            scrollRef.value?.setScrollTop(newScrollHeight - prevScrollHeight)
          }
        })
      } else {
        hasMore.value = false
      }
    } finally {
      loadingMore.value = false
    }
  }

  // 滚动事件处理
  const handleScroll = (e: { scrollTop: number }, conversationId: number | null) => {
    // 加载中或正在加载更多时不触发
    if (loading.value || loadingMore.value || !hasMore.value) return
    if (e.scrollTop < 50) {
      loadMore(conversationId)
    }
  }

  // 复制消息
  const copy = async (msg: Message) => {
    try {
      await navigator.clipboard.writeText(msg.content)
      ElNotification.success({ message: t('aiChat.copied') })
    } catch {
      ElNotification.error({ message: t('aiChat.copyFailed') })
    }
  }

  // 删除消息
  const remove = async (msg: Message) => {
    try {
      await ElMessageBox.confirm(t('aiChat.confirmDeleteMessage'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.confirm'),
        cancelButtonText: t('common.actions.cancel')
      })
    } catch {
      return false
    }
    await AiMessageApi.del({ id: msg.id })
    ElNotification.success({ message: t('common.success.operation') })
    return true
  }

  // 消息反馈
  const feedback = async (msg: Message, value: number | null) => {
    await AiMessageApi.feedback({ id: msg.id, feedback: value ?? undefined })
    if (!msg.meta_json) msg.meta_json = {}
    if (value === null) {
      delete msg.meta_json.feedback
    } else {
      msg.meta_json.feedback = value
    }
  }

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    scrollRef,
    scrollToBottom,
    loadMessages,
    loadMore,
    handleScroll,
    copy,
    remove,
    feedback
  }
}
