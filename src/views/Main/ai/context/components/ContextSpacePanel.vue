<script setup lang="ts">
import { shallowRef } from 'vue'
import { Delete, Edit, Plus, SwitchButton } from '@element-plus/icons-vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { AiContextApi, type AiContextProfile, type AiContextSpace, type AiContextSpaceMutationBody } from '@/api/ai/context'
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
    <el-table
      v-loading="loading"
      :data="[...spaces]"
      row-key="id"
      highlight-current-row
      @current-change="$event && emit('selectSpace', $event.id)"
    >
      <el-table-column
        prop="name"
        :label="t('aiContext.fields.name')"
        min-width="180"
      />
      <el-table-column
        prop="description"
        :label="t('aiContext.fields.description')"
        min-width="240"
        show-overflow-tooltip
      />
      <el-table-column
        :label="t('aiContext.fields.status')"
        width="110"
      >
        <template #default="{ row }">
          <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="updated_at"
        :label="t('aiContext.fields.updatedAt')"
        width="190"
      />
      <el-table-column
        fixed="right"
        :label="t('common.actions.action')"
        width="160"
      >
        <template #default="{ row }">
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
      </el-table-column>
    </el-table>
    <el-empty
      v-if="!loading && spaces.length === 0"
      :description="t('aiContext.empty.spaces')"
    />
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
