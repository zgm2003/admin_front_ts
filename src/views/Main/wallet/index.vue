<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import Recharge from './components/Recharge/index.vue'

const userStore = useUserStore()

const userId = computed(() => String(userStore.user_id || ''))
</script>

<template>
  <div class="wallet-page">
    <div class="wallet-page__body">
      <Recharge :user-id="userId" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.wallet-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.wallet-page__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
