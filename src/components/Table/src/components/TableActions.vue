<script setup lang="ts">
import { ElButton } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ refreshLoading?: boolean; showRefresh?: boolean }>()
const emit = defineEmits<{ refresh: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="table-actions">
    <slot />
    <ElButton
      v-if="props.showRefresh !== false"
      :loading="props.refreshLoading"
      type="primary"
      :icon="Refresh"
      @click="emit('refresh')"
    >
      {{ t('common.actions.refresh') }}
    </ElButton>
  </div>
</template>

<style scoped>
.table-actions{display:flex;gap:8px;align-items:center}
</style>
