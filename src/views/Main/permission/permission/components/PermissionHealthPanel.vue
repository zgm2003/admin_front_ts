<script setup lang="ts">
import { computed } from 'vue'
import type { PermissionHealthWarning } from '../composables/usePermissionDefinitionPage'

const props = defineProps<{
  warnings: PermissionHealthWarning[]
  title: string
}>()

const hasWarnings = computed(() => props.warnings.length > 0)
</script>

<template>
  <div v-if="hasWarnings" class="permission-health-panel">
    <div class="permission-health-panel__title">{{ title }}</div>
    <el-alert
      v-for="warning in props.warnings"
      :key="warning.key"
      :title="warning.label"
      :type="warning.type"
      show-icon
      :closable="false"
    />
  </div>
</template>

<style scoped>
.permission-health-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.permission-health-panel__title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
</style>
