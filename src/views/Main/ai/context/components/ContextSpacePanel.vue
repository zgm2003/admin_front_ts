<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { Delete, Edit, Plus, SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { AiContextApi, type AiContextProfile, type AiContextSpace, type AiContextSpaceMutationBody } from '@/api/ai/context'
import { AppTable } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { formatDateTime } from '@/utils/date'
import ContextSpaceDialog from './ContextSpaceDialog.vue'

defineProps<{
  profiles: readonly AiContextProfile[]
  spaces: readonly AiContextSpace[]
  selectedProfileId: number | null
  selectedSpaceId: number | null
  loading: boolean
}>()
const emit = defineEmits<{ selectProfile: [id: number]; selectSpace: [id: number]; changed: [] }>()
const { t } = useI18n()
const dialogVisible = shallowRef(false)
const editing = shallowRef<AiContextSpace | null>(null)
const columns = computed<TableColumn<AiContextSpace>[]>(() => [
  { prop: 'name', label: t('aiContext.fields.name'), minWidth: 280 },
  { prop: 'description', label: t('aiContext.fields.description'), minWidth: 520 },
  { prop: 'status', label: t('aiContext.fields.status'), width: 120 },
  {
    prop: 'updated_at',
    label: t('aiContext.fields.updatedAt'),
    width: 240,
    formatter: (_row, _column, value) => formatDateTime(value),
  },
  { key: 'actions', label: t('common.actions.action'), width: 180, fixed: 'right' },
])

function statusLabel(status: string) {
  if (status === 'enabled') return t('aiContext.status.enabled')
  if (status === 'disabled') return t('aiContext.status.disabled')
  throw new Error(`Unknown Context space status: ${status}`)
}

function open(space: AiContextSpace | null) { editing.value = space; dialogVisible.value = true }
async function submit(body: AiContextSpaceMutationBody) {
  if (editing.value) await AiContextApi.spaces.update(editing.value.id, body)
  else await AiContextApi.spaces.create(body)
  dialogVisible.value = false
  emit('changed')
}
async function toggle(row: AiContextSpace) {
  await AiContextApi.spaces.changeStatus(row.id, row.status === 'enabled' ? 'disabled' : 'enabled')
  emit('changed')
}
async function remove(row: AiContextSpace) {
  await ElMessageBox.confirm(t('aiContext.space.confirmDelete'), t('common.confirmTitle'), { type: 'warning' })
  await AiContextApi.spaces.remove(row.id)
  emit('changed')
  ElNotification.success({ message: t('common.success.delete') })
}
</script>

<template>
  <section class="panel">
    <div class="panel__toolbar">
      <el-select
        :model-value="selectedProfileId"
        class="profile-select"
        :placeholder="t('aiContext.space.selectProfile')"
        @update:model-value="emit('selectProfile', $event)"
      >
        <el-option
          v-for="profile in profiles"
          :key="profile.id"
          :value="profile.id"
          :label="profile.name"
        />
      </el-select>
      <el-button
        type="primary"
        :icon="Plus"
        :disabled="selectedProfileId === null"
        @click="open(null)"
      >
        {{ t('aiContext.space.create') }}
      </el-button>
    </div>
    <AppTable
      :columns="columns"
      :data="[...spaces]"
      :loading="loading"
      row-key="id"
      :fixed-footer="false"
      :show-refresh="false"
      :show-column-setting="false"
      :table-props="{ highlightCurrentRow: true }"
      @row-click="emit('selectSpace', $event.id)"
    >
      <template #cell-status="{ row }">
        <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">
          {{ statusLabel(row.status) }}
        </el-tag>
      </template>
      <template #cell-actions="{ row }">
        <el-button
          text
          :icon="Edit"
          @click.stop="open(row)"
        />
        <el-button
          text
          :icon="SwitchButton"
          @click.stop="toggle(row)"
        />
        <el-button
          text
          type="danger"
          :icon="Delete"
          @click.stop="remove(row)"
        />
      </template>
      <template #empty>
        <el-empty
          data-test="context-spaces-empty"
          :description="t('aiContext.empty.spaces')"
          :image-size="96"
        />
      </template>
    </AppTable>
    <ContextSpaceDialog
      v-if="selectedProfileId !== null"
      v-model="dialogVisible"
      :profile-id="selectedProfileId"
      :space="editing"
      @submit="submit"
    />
  </section>
</template>

<style scoped>
.panel__toolbar { min-height: 44px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.profile-select { width: min(320px, 100%); }
</style>
