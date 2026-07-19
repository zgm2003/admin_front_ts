<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { useAppKernel } from '@/app/injection'
import { normalizeNotificationLink } from '@/lib/navigation/notification-link'
import { getNativeBridge } from '@/adapters/native'

const router = useRouter()
const kernel = useAppKernel()
const native = getNativeBridge()

function navigateTo(link: string) {
  if (!link) {
    return
  }

  const normalizedLink = normalizeNotificationLink(link)

  if (normalizedLink.startsWith('http')) {
    native.window.openExternal(normalizedLink)
    return
  }

  void router.push(normalizedLink)
}

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = kernel.realtime.subscribe('notification.created.v1', async ({ data }) => {
    if (await native.notifications.shouldUseNative()) {
      await native.notifications.send(data.title, data.content)
    }

    const notification = ElNotification({
      title: data.title,
      message: data.content,
      type: data.notification_type,
      duration: 5000,
      onClick: () => {
        notification.close()
        navigateTo(data.link)
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
