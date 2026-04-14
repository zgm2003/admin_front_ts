<script setup lang="ts">
import HomeQuickEntryManagerDialog from './HomeQuickEntryManagerDialog.vue'
import { DIcon } from '@/components/DIcon'

defineEmits<{
  navigate: [path: string]
  manage: []
  'update:modelValue': [value: boolean]
  'update:selectedPermissionId': [value: number | '']
  add: []
  remove: [permissionId: number]
  move: [index: number, delta: -1 | 1]
  save: []
}>()

defineProps<{
  entries: Array<{
    id: number | null
    permissionId: number
    label: string
    path: string
    icon?: string
  }>
  modelValue: boolean
  draft: Array<{
    id: number | null
    permissionId: number
    label: string
    path: string
    icon?: string
  }>
  options: Array<{
    permissionId: number
    label: string
    path: string
    icon?: string
  }>
  limit: number
  limitReached: boolean
  selectedPermissionId: number | ''
  saving: boolean
}>()
</script>

<template>
  <section class="dashboard-card quick-entry-card">
    <div class="card-head">
      <div>
        <div class="card-title">{{ $t('home.quickEntryTitle') }}</div>
        <div class="card-subtitle">{{ $t('home.quickEntrySubtitle') }}</div>
      </div>
      <el-button text type="primary" @click="$emit('manage')">{{ $t('home.manageQuickEntry') }}</el-button>
    </div>

    <div v-if="entries.length" class="quick-entry-list">
      <button
        v-for="item in entries"
        :key="`${item.permissionId}-${item.id ?? 'draft'}`"
        type="button"
        class="quick-entry-item"
        @click="$emit('navigate', item.path)"
      >
        <div class="quick-entry-item__icon">
          <DIcon :icon="item.icon" :size="20" />
        </div>
        <div class="quick-entry-item__body">
          <span class="quick-entry-item__title">{{ item.label }}</span>
          <span class="quick-entry-item__path">{{ item.path }}</span>
        </div>
      </button>
    </div>

    <el-empty v-else :description="$t('home.noQuickEntry')" :image-size="72" />
  </section>

  <HomeQuickEntryManagerDialog
    :model-value="modelValue"
    :title="$t('home.quickEntryManageTitle')"
    :draft="draft"
    :options="options"
    :limit="limit"
    :limit-reached="limitReached"
    :selected-permission-id="selectedPermissionId"
    :saving="saving"
    @update:model-value="$emit('update:modelValue', $event)"
    @update:selected-permission-id="$emit('update:selectedPermissionId', $event)"
    @add="$emit('add')"
    @remove="$emit('remove', $event)"
    @move="(index, delta) => $emit('move', index, delta)"
    @save="$emit('save')"
  />
</template>

<style scoped lang="scss">
.dashboard-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--el-border-color-light);
  border-radius: 18px;
  background: var(--el-bg-color);
  padding: 18px 18px 16px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.card-subtitle {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.quick-entry-list {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: stretch;
  overflow: auto;
  grid-auto-rows: minmax(0, 1fr);
}

.quick-entry-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  min-height: 88px;
  padding: 10px;
  border-radius: 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background-color 180ms ease;

  &:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
  }
}

.quick-entry-item__icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-entry-item__body {
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.quick-entry-item__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.quick-entry-item__path {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

@media (max-width: 768px) {
  .dashboard-card {
    padding: 14px;
  }

  .quick-entry-list {
    grid-template-columns: 1fr;
  }
}
</style>
