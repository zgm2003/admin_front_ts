<script setup lang="ts">
import { shallowRef } from 'vue'
import { Delete, Plus, Refresh, Upload } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import {
  AiContextApi,
  type AiContextDocument,
  type AiContextDocumentVersion,
  type AiContextDocumentVersionCreateBody,
  type AiContextSpace,
} from '@/api/ai/context'
import ContextVersionDialog from './ContextVersionDialog.vue'

const props = defineProps<{
  space: AiContextSpace | null
  documents: readonly AiContextDocument[]
  versions: readonly AiContextDocumentVersion[]
  selectedDocumentId: number | null
  loading: boolean
  versionsLoading: boolean
}>()
const emit = defineEmits<{ select: [id: number]; changed: []; versionCreated: [] }>()
const { t } = useI18n()
const dialogVisible = shallowRef(false)
const createDocument = shallowRef(true)

function statusLabel(status: string) {
  switch (status) {
    case 'enabled': return t('aiContext.status.enabled')
    case 'disabled': return t('aiContext.status.disabled')
    case 'queued': return t('aiContext.status.queued')
    case 'processing': return t('aiContext.status.processing')
    case 'ready': return t('aiContext.status.ready')
    case 'failed': return t('aiContext.status.failed')
    default: throw new Error(`Unknown Context document state: ${status}`)
  }
}

function open(isDocument: boolean) { createDocument.value = isDocument; dialogVisible.value = true }
async function submit(payload: { title?: string; body: AiContextDocumentVersionCreateBody }) {
  if (createDocument.value) {
    if (!props.space || !payload.title) throw new Error('Context document requires a selected space and title')
    await AiContextApi.documents.create(props.space.id, { ...payload.body, title: payload.title })
    emit('changed')
  } else {
    if (props.selectedDocumentId === null) throw new Error('Context document must be selected')
    await AiContextApi.documents.createVersion(props.selectedDocumentId, payload.body)
    emit('versionCreated')
  }
  dialogVisible.value = false
}
async function reindex(row: AiContextDocument) { await AiContextApi.documents.reindex(row.id); emit('changed') }
async function toggle(row: AiContextDocument) { await AiContextApi.documents.changeStatus(row.id, row.status === 'enabled' ? 'disabled' : 'enabled'); emit('changed') }
async function remove(row: AiContextDocument) {
  await ElMessageBox.confirm(t('aiContext.document.confirmDelete'), t('common.confirmTitle'), { type: 'warning' })
  await AiContextApi.documents.remove(row.id)
  emit('changed')
}
</script>

<template>
  <section class="documents">
    <div class="documents__toolbar">
      <div><strong>{{ space?.name }}</strong><span v-if="space">{{ t('aiContext.document.spaceSummary', { count: documents.length }) }}</span></div>
      <el-button
        type="primary"
        :icon="Plus"
        :disabled="!space"
        @click="open(true)"
      >
        {{ t('aiContext.document.create') }}
      </el-button>
    </div>
    <div class="documents__split">
      <div class="documents__list">
        <el-table
          v-loading="loading"
          :data="[...documents]"
          row-key="id"
          highlight-current-row
          @current-change="$event && emit('select', $event.id)"
        >
          <el-table-column
            prop="title"
            :label="t('aiContext.fields.title')"
            min-width="180"
            show-overflow-tooltip
          />
          <el-table-column
            :label="t('aiContext.fields.status')"
            width="100"
          >
            <template #default="{ row }">
              <el-tag :type="row.status === 'enabled' ? 'success' : 'info'">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            :label="t('aiContext.version.state')"
            width="112"
          >
            <template #default="{ row }">
              <el-tag
                effect="plain"
                :type="row.version.state === 'failed' ? 'danger' : row.version.state === 'ready' ? 'success' : 'warning'"
              >
                {{ statusLabel(row.version.state) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column
            fixed="right"
            width="142"
          >
            <template #default="{ row }">
              <el-button
                text
                :icon="Refresh"
                @click.stop="reindex(row)"
              />
              <el-button
                text
                @click.stop="toggle(row)"
              >
                {{ row.status === 'enabled' ? t('common.status.disable') : t('common.status.enable') }}
              </el-button>
              <el-button
                text
                type="danger"
                :icon="Delete"
                @click.stop="remove(row)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
      <aside class="versions">
        <div class="versions__header">
          <strong>{{ t('aiContext.version.history') }}</strong><el-button
            text
            :icon="Upload"
            :disabled="selectedDocumentId === null"
            @click="open(false)"
          >
            {{ t('aiContext.version.create') }}
          </el-button>
        </div>
        <el-scrollbar
          v-loading="versionsLoading"
          height="460px"
        >
          <button
            v-for="version in versions"
            :key="version.id"
            class="version-row"
            type="button"
          >
            <span><strong>V{{ version.id }}</strong><el-tag
              size="small"
              effect="plain"
            >{{ statusLabel(version.state) }}</el-tag></span>
            <span :title="version.source_filename">{{ version.source_filename }}</span>
            <small>{{ version.parser_name }} {{ version.parser_version }}</small>
          </button>
          <el-empty
            v-if="!versionsLoading && versions.length === 0"
            :description="t('aiContext.empty.versions')"
            :image-size="60"
          />
        </el-scrollbar>
      </aside>
    </div>
    <ContextVersionDialog
      v-model="dialogVisible"
      :create-document="createDocument"
      @submit="submit"
    />
  </section>
</template>

<style scoped>
.documents__toolbar, .versions__header { min-height: 44px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.documents__toolbar div { display: flex; align-items: baseline; gap: 10px; }
.documents__toolbar span { color: var(--el-text-color-secondary); font-size: 12px; }
.documents__split { display: grid; grid-template-columns: minmax(0, 1fr) 300px; border-top: 1px solid var(--el-border-color-lighter); }
.documents__list { min-width: 0; padding-right: 16px; }
.versions { padding-left: 16px; border-left: 1px solid var(--el-border-color-lighter); }
.version-row { width: 100%; display: flex; flex-direction: column; gap: 5px; padding: 10px 4px; border: 0; border-bottom: 1px solid var(--el-border-color-extra-light); background: transparent; color: inherit; text-align: left; }
.version-row > span { min-width: 0; display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.version-row small { color: var(--el-text-color-secondary); }
@media (max-width: 900px) { .documents__split { grid-template-columns: 1fr; } .documents__list { padding-right: 0; } .versions { padding: 12px 0 0; border: 0; } }
</style>
