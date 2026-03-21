<template>
  <Transition name="fade-loading">
    <div v-if="visible" class="login-success-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="double-bounce1"></div>
          <div class="double-bounce2"></div>
        </div>
        <div class="loading-text">{{ t('loginPage.loading.preparing') }}</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{ visible: boolean }>()
</script>
