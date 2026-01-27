<script setup lang="ts">
import { ElButton } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const props = defineProps<{ refreshLoading?: boolean; showRefresh?: boolean }>()
const emit = defineEmits(['refresh'])
</script>

<template>
  <div class="table-actions">
    <slot />
    <ElButton v-if="props.showRefresh !== false" :loading="props.refreshLoading" type="primary" @click="emit('refresh')" :icon="Refresh">刷新</ElButton>
  </div>
</template>

<style scoped>
.table-actions{display:flex;gap:8px;align-items:center}
</style>
