<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { onWsMessage } from '@/hooks/useWebSocket'
import { sendNativeNotification, shouldUseNative } from '@/platform/tauri'

interface NotificationWsPayload {
  [key: string]: unknown
  title?: string
  content?: string
  link?: string
  level?: string
  notification_type?: 'success' | 'warning' | 'info' | 'error'
}

const { t } = useI18n()
const router = useRouter()

function navigateTo(link?: string) {
  if (!link) {
    return
  }

  if (link.startsWith('http')) {
    window.open(link, '_blank')
    return
  }

  void router.push(link)
}

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = onWsMessage<NotificationWsPayload>('notification', async ({ data }) => {
    if (data.level !== 'urgent') {
      return
    }

    const title = typeof data.title === 'string' ? data.title : t('notification.title')
    const content = typeof data.content === 'string' ? data.content : ''
    const link = typeof data.link === 'string' ? data.link : undefined

    if (await shouldUseNative()) {
      await sendNativeNotification(title, content)
    }

    const notification = ElNotification({
      title,
      message: content,
      type: data.notification_type || 'info',
      duration: 5000,
      onClick: () => {
        notification.close()
        navigateTo(link)
      },
    })
  })
})

onUnmounted(() => {
  unsubscribe?.()
})
</script>

<template>
  <div v-if="false" />
</template>
