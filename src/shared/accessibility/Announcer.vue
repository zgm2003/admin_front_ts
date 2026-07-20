<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { subscribeToAnnouncements } from './announcer'

const politeMessage = ref('')
const assertiveMessage = ref('')
let unsubscribe: (() => void) | undefined

onMounted(() => {
  unsubscribe = subscribeToAnnouncements((announcement) => {
    const target = announcement.priority === 'assertive' ? assertiveMessage : politeMessage
    target.value = ''
    void nextTick(() => {
      target.value = announcement.message
    })
  })
})

onUnmounted(() => unsubscribe?.())
</script>

<template>
  <div
    class="sr-only"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {{ politeMessage }}
  </div>
  <div
    class="sr-only"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    {{ assertiveMessage }}
  </div>
</template>
