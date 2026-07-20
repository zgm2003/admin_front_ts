<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

function focusMainContent(event: MouseEvent) {
  event.preventDefault()
  document.getElementById('main-content')?.focus()
}
</script>

<template>
  <a
    class="skip-link"
    href="#main-content"
    @click="focusMainContent"
  >
    {{ t('accessibility.skipToMain') }}
  </a>
</template>
