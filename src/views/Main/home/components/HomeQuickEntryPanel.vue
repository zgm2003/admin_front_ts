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
          <div :class="['card-count-badge', { 'card-count-badge--full': limitReached }]">
            {{ entries.length }}/{{ limit }}
          </div>
        </div>
        <div class="card-subtitle">
          {{ $t('home.quickEntrySubtitle') }}
        </div>
      </div>
      <el-button
        class="card-action"
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
        <span
          class="quick-entry-item__arrow"
          aria-hidden="true"
        >↗</span>
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
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 24px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 252, 255, 0.94) 58%, rgba(236, 247, 255, 0.88) 100%);
  box-shadow:
    0 22px 48px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  padding: 20px;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  right: -64px;
  top: -78px;
  width: 180px;
  height: 180px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.17) 0%, transparent 72%);
  pointer-events: none;
}

.card-head {
  position: relative;
  z-index: 1;
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
  gap: 9px;
}

.card-title {
  font-size: 19px;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--shell-text-strong);
}

.card-count-badge {
  flex-shrink: 0;
  min-width: 42px;
  height: 26px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.05);
  color: var(--shell-text-soft);
  font-size: 12px;
  font-weight: 900;
  line-height: 26px;
  text-align: center;
}

.card-count-badge--full {
  background: color-mix(in srgb, var(--el-color-warning) 16%, white);
  color: var(--el-color-warning);
}

.card-subtitle {
  margin-top: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--shell-text-soft);
}

.card-action {
  flex-shrink: 0;
}

.quick-entry-list {
  position: relative;
  z-index: 1;
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: start;
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  grid-auto-rows: minmax(112px, auto);
}

.quick-entry-list::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

.quick-entry-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 112px;
  overflow: hidden;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(247, 251, 255, 0.9));
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.04);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  &::after {
    content: '';
    position: absolute;
    inset: auto 12px 12px 12px;
    height: 1px;
    background: linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 36%, transparent), transparent);
  }

  &:hover {
    transform: translateY(-2px);
    border-color: color-mix(in srgb, var(--el-color-primary) 28%, rgba(148, 163, 184, 0.2));
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 18px 34px rgba(15, 23, 42, 0.07);
  }
}

.quick-entry-item__icon {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  background:
    linear-gradient(145deg, color-mix(in srgb, var(--el-color-primary) 16%, white), rgba(255, 255, 255, 0.85));
  color: color-mix(in srgb, var(--el-color-primary) 82%, #0f172a);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 10px 20px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.quick-entry-item__body {
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.quick-entry-item__title {
  font-size: 14px;
  font-weight: 900;
  color: var(--shell-text-strong);
}

.quick-entry-item__path {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--shell-text-soft);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

.quick-entry-item__arrow {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.04);
  color: var(--shell-text-soft);
  font-size: 12px;
  font-weight: 900;
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
