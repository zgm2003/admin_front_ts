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
      <div class="card-title-group">
        <div class="card-title-row">
          <div class="card-title">
            {{ $t('home.quickEntryTitle') }}
          </div>
          <div class="card-count-badge">
            {{ entries.length }}/{{ limit }}
          </div>
        </div>
        <div class="card-subtitle">
          {{ $t('home.quickEntrySubtitle') }}
        </div>
      </div>
      <el-button
        text
        type="primary"
        @click="$emit('manage')"
      >
        {{ $t('home.manageQuickEntry') }}
      </el-button>
    </div>

    <div
      v-if="entries.length"
      class="quick-entry-list"
    >
      <button
        v-for="item in entries"
        :key="`${item.permissionId}-${item.id ?? 'draft'}`"
        type="button"
        class="quick-entry-item"
        @click="$emit('navigate', item.path)"
      >
        <div class="quick-entry-item__icon">
          <DIcon
            :icon="item.icon"
            :size="20"
          />
        </div>
        <div class="quick-entry-item__body">
          <span class="quick-entry-item__title">{{ item.label }}</span>
          <span class="quick-entry-item__path">{{ item.path }}</span>
        </div>
      </button>
    </div>

    <el-empty
      v-else
      :description="$t('home.noQuickEntry')"
      :image-size="72"
    />
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
  border: 1px solid var(--shell-line);
  border-radius: 18px;
  background: var(--shell-panel-strong);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.04);
  padding: 18px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.card-title-group {
  min-width: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--shell-text-strong);
}

.card-count-badge {
  flex-shrink: 0;
  min-width: 42px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.04);
  color: var(--shell-text-soft);
  font-size: 12px;
  font-weight: 700;
  line-height: 24px;
  text-align: center;
}

.card-subtitle {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--shell-text-soft);
}

.quick-entry-list {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: start;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.quick-entry-list::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.quick-entry-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--shell-line);
  background: color-mix(in srgb, var(--shell-panel) 65%, var(--shell-panel-strong));
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--app-motion-fast) var(--app-ease-standard),
    background-color var(--app-motion-fast) var(--app-ease-standard);

  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 26%, var(--shell-line));
    background: var(--shell-panel-strong);
  }
}

.quick-entry-item__icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
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
  color: var(--shell-text-strong);
}

.quick-entry-item__path {
  margin-top: 4px;
  font-size: 11px;
  color: var(--shell-text-soft);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .dashboard-card {
    padding: 14px;
  }

  .card-head {
    flex-direction: column;
    gap: 10px;
  }

  .quick-entry-list {
    grid-template-columns: 1fr;
  }
}
</style>
