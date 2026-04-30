<script setup lang="ts">
import { computed } from 'vue'
import { ArrowDown, ArrowUp, Delete, Plus } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { DIcon } from '@/components/DIcon'

defineOptions({
  name: 'HomeQuickEntryManagerDialog',
})

const props = defineProps<{
  modelValue: boolean
  title: string
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
  selectedPermissionId: number | ''
  saving: boolean
  limit: number
  limitReached: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:selectedPermissionId': [value: number | '']
  add: []
  remove: [permissionId: number]
  move: [index: number, delta: -1 | 1]
  save: []
}>()

const selectOptions = computed(() => props.options.map((item) => ({
  label: item.label,
  value: item.permissionId,
})))
</script>

<template>
  <AppDialog
    :model-value="modelValue"
    :title="title"
    width="920px"
    mobile-width="94vw"
    height="70vh"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="manager-layout">
      <section class="manager-section">
        <div class="manager-section__title">{{ $t('home.selectedQuickEntry') }}</div>
        <div v-if="draft.length" class="manager-list">
          <div
            v-for="(item, index) in draft"
            :key="`${item.permissionId}-${item.id ?? 'draft'}`"
            class="manager-row"
          >
            <div class="manager-row__info">
              <div class="manager-row__icon">
                <DIcon :icon="item.icon" :size="18" />
              </div>
              <div class="manager-row__copy">
                <div class="manager-row__title">{{ item.label }}</div>
                <div class="manager-row__path">{{ item.path }}</div>
              </div>
            </div>

            <div class="manager-row__actions">
              <el-button text :icon="ArrowUp" :disabled="index === 0" @click="emit('move', index, -1)" />
              <el-button text :icon="ArrowDown" :disabled="index === draft.length - 1" @click="emit('move', index, 1)" />
              <el-button text type="danger" :icon="Delete" @click="emit('remove', item.permissionId)" />
            </div>
          </div>
        </div>

        <el-empty v-else :description="$t('home.noQuickEntry')" :image-size="64" />
      </section>

      <section class="manager-section">
        <div class="manager-section__title">{{ $t('home.addQuickEntry') }}</div>
        <div class="manager-add">
          <el-select-v2
            :model-value="selectedPermissionId"
            :options="selectOptions"
            :placeholder="$t('common.pleaseSelect')"
            :disabled="limitReached"
            filterable
            style="width: 100%"
            @update:model-value="emit('update:selectedPermissionId', $event)"
          />
          <el-button type="primary" :icon="Plus" :disabled="!selectedPermissionId || limitReached" @click="emit('add')">
            {{ $t('common.actions.add') }}
          </el-button>
          <el-text size="small" type="info">{{ $t('home.quickEntryLimitHint', { count: limit }) }}</el-text>
        </div>
      </section>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">{{ $t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="emit('save')">{{ $t('common.actions.save') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped lang="scss">
.manager-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.9fr);
  gap: 18px;
}

.manager-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 16px;
  background: var(--el-fill-color-extra-light);
  border: 1px solid var(--el-border-color-lighter);
}

.manager-section__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.manager-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.manager-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}

.manager-row__info {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.manager-row__icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.manager-row__copy {
  min-width: 0;
}

.manager-row__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.manager-row__path {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.manager-row__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.manager-add {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 768px) {
  .manager-layout {
    grid-template-columns: 1fr;
  }
}
</style>
