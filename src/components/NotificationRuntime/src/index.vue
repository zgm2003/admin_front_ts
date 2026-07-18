<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { useAppKernel } from '@/app/injection'
import { normalizeNotificationLink } from '@/lib/navigation/notification-link'
import { sendNativeNotification, shouldUseNative } from '@/platform/tauri'

const router = useRouter()
const kernel = useAppKernel()

function navigateTo(link: string) {
  if (!link) {
    return
  }

  const normalizedLink = normalizeNotificationLink(link)

  if (normalizedLink.startsWith('http')) {
    window.open(normalizedLink, '_blank')
    return
  }

  void router.push(normalizedLink)
}

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = kernel.realtime.subscribe('notification.created.v1', async ({ data }) => {
    if (await shouldUseNative()) {
      await sendNativeNotification(data.title, data.content)
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
