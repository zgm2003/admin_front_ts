<template>
  <Transition name="fade-loading">
    <div v-if="visible" class="login-success-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="double-bounce1"></div>
          <div class="double-bounce2"></div>
        </div>
        <div class="loading-text">正在为您准备工作台...</div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>()
</script>
