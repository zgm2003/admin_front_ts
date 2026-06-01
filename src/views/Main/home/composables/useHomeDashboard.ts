import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CommonEnum } from '@/enums'
import { NotificationApi, type NotificationItem } from '@/api/system/notification'
import { onWsMessage } from '@/lib/realtime'
import { resolveHomeNavigationAction } from './helpers'

export function useHomeDashboard() {
  const router = useRouter()

  const notificationsLoading = ref(false)
  const notifications = ref<NotificationItem[]>([])
  const unreadCount = ref(0)

  async function loadNotificationSnapshot() {
    notificationsLoading.value = true
    try {
      const [countResult, listResult] = await Promise.allSettled([
        NotificationApi.unreadCount(),
        NotificationApi.list({ current_page: 1, page_size: 5 }),
      ])

      if (countResult.status === 'fulfilled') {
        unreadCount.value = countResult.value.count
      }

      if (listResult.status === 'fulfilled') {
        notifications.value = listResult.value.list
      }
    } finally {
      notificationsLoading.value = false
    }
  }

  async function loadHomeData() {
    await loadNotificationSnapshot()
  }

  function goTo(path: string) {
    const action = resolveHomeNavigationAction(path)
    if (action.type === 'none') {
      return
    }

    const target = action.value
    if (target === undefined || target === '') {
      return
    }

    if (action.type === 'external') {
      window.open(target, '_blank', 'noopener,noreferrer')
      return
    }

    void router.push(target)
  }

  function goToNotifications() {
    router.push('/notification')
  }

  async function openNotification(item: NotificationItem) {
    if (item.is_read === CommonEnum.NO) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
      notifications.value = notifications.value.map((current) =>
        current.id === item.id
          ? { ...current, is_read: CommonEnum.YES }
          : current,
      )

      void NotificationApi.read({ id: item.id }).catch(() => {
        void loadNotificationSnapshot()
      })
    }

    const target = item.link.trim() === '' ? '/notification' : item.link
    goTo(target)
  }

  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    unsubscribe = onWsMessage('notification.created.v1', () => {
      void loadNotificationSnapshot()
    })
  })

  onUnmounted(() => {
    unsubscribe?.()
  })

  return {
    notificationsLoading,
    notifications,
    unreadCount,
    loadHomeData,
    goTo,
    goToNotifications,
    openNotification,
  }
}
