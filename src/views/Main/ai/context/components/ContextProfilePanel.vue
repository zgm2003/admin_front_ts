<script setup lang="ts">
import { shallowRef } from 'vue'
import { Edit, Plus, SwitchButton } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { AiContextApi, type AiContextProfile, type AiContextProfileCreateBody } from '@/api/ai/context'
import ContextProfileDialog from './ContextProfileDialog.vue'

defineProps<{ profiles: readonly AiContextProfile[]; selectedId: number | null; loading: boolean }>()
const emit = defineEmits<{ select: [id: number]; changed: [] }>()
const { t } = useI18n()
const dialogVisible = shallowRef(false)
const editing = shallowRef<AiContextProfile | null>(null)

function statusLabel(status: string) {
  if (status === 'enabled') return t('aiContext.status.enabled')
  if (status === 'retired') return t('aiContext.status.retired')
  throw new Error(`Unknown Context profile status: ${status}`)
}

function indexLabel(status: string) {
  switch (status) {
    case 'provisioning': return t('aiContext.status.provisioning')
    case 'ready': return t('aiContext.status.ready')
    case 'rebuilding': return t('aiContext.status.rebuilding')
    case 'failed': return t('aiContext.status.failed')
    default: throw new Error(`Unknown Context profile index state: ${status}`)
  }
}

function open(profile: AiContextProfile | null) {
  editing.value = profile
  dialogVisible.value = true
}

async function submit(body: AiContextProfileCreateBody | { name: string }) {
  if (editing.value) await AiContextApi.profiles.update(editing.value.id, body as { name: string })
  else await AiContextApi.profiles.create(body as AiContextProfileCreateBody)
  dialogVisible.value = false
  ElNotification.success({ message: t('common.success.operation') })
  emit('changed')
}

async function toggle(profile: AiContextProfile) {
  await AiContextApi.profiles.changeStatus(profile.id, profile.status === 'enabled' ? 'retired' : 'enabled')
  emit('changed')
}
</script>

<template>
  <section class="panel">
    <div class="panel__toolbar">
      <span>{{ t('aiContext.profile.description') }}</span>
      <el-button
        type="primary"
        :icon="Plus"
        @click="open(null)"
      >
        {{ t('aiContext.profile.create') }}
      </el-button>
    </div>
    <el-table
      v-loading="loading"
      :data="[...profiles]"
      row-key="id"
      highlight-current-row
      @current-change="$event && emit('select', $event.id)"
    >
      <el-table-column
        prop="name"
        :label="t('aiContext.fields.name')"
        min-width="170"
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
        :label="t('aiContext.profile.indexState')"
        width="130"
      >
        <template #default="{ row }">
          <el-tag
            effect="plain"
            :type="row.index_state === 'failed' ? 'danger' : row.index_state === 'ready' ? 'success' : 'warning'"
          >
            {{ indexLabel(row.index_state) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="active_index_generation"
        :label="t('aiContext.profile.generation')"
        width="110"
      />
      <el-table-column
        prop="embedding_dimensions"
        :label="t('aiContext.profile.dimensions')"
        width="110"
      />
      <el-table-column
        prop="embedding_token_counter_id"
        :label="t('aiContext.profile.tokenCounter')"
        min-width="140"
      />
      <el-table-column
        fixed="right"
        :label="t('common.actions.action')"
        width="126"
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
        </template>
      </el-table-column>
    </el-table>
    <ContextProfileDialog
      v-model="dialogVisible"
      :profile="editing"
      @submit="submit"
    />
  </section>
</template>

<style scoped>
.panel__toolbar { min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--el-text-color-secondary); font-size: 13px; }
</style>
