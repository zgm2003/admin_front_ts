<script setup lang="ts">
import { computed } from 'vue'

interface ErrorDetailItem {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
  code: string | number
  title: string
  description: string
  details?: ErrorDetailItem[]
}>(), {
  details: () => [],
})

const hasDetails = computed(() => props.details.length > 0)
</script>

<template>
  <section class="error-state-panel">
    <div class="error-state-panel__code">{{ props.code }}</div>
    <h1 class="error-state-panel__title">{{ props.title }}</h1>
    <p class="error-state-panel__description">{{ props.description }}</p>

    <ul v-if="hasDetails" class="error-state-panel__details">
      <li v-for="item in props.details" :key="item.label" class="error-state-panel__detail">
        <span class="error-state-panel__detail-label">{{ item.label }}</span>
        <span class="error-state-panel__detail-value">{{ item.value }}</span>
      </li>
    </ul>

    <div class="error-state-panel__actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<style scoped lang="scss">
.error-state-panel {
  width: min(100%, 560px);
  padding: 32px 28px;
  text-align: center;
  background: var(--shell-panel-strong);
  border: 1px solid var(--shell-line);
  border-radius: 18px;
  box-shadow: var(--shell-shadow-soft);
}

.error-state-panel__code {
  margin-bottom: 16px;
  font-size: clamp(56px, 12vw, 112px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.08em;
  color: var(--el-color-primary);
}

.error-state-panel__title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.error-state-panel__description {
  margin: 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.error-state-panel__details {
  display: grid;
  gap: 10px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.error-state-panel__detail {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  line-height: 1.6;
}

.error-state-panel__detail-label {
  color: var(--el-text-color-secondary);
}

.error-state-panel__detail-value {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  color: var(--el-text-color-primary);
}

.error-state-panel__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
}

:deep(.el-button) {
  min-width: 120px;
}

:deep(.el-icon) {
  margin-right: 6px;
}

@media (max-width: 480px) {
  .error-state-panel {
    padding: 24px 18px;
    border-radius: 16px;
  }

  .error-state-panel__title {
    font-size: 20px;
  }

  .error-state-panel__actions {
    flex-direction: column;
  }

  :deep(.el-button) {
    width: 100%;
  }
}
</style>
