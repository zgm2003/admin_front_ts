<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppTable } from '@/components/Table'
import { useCopy } from '@/hooks/useCopy'
import type { PageInfo } from '@/types/common'
import {
  CineApi,
  type CineInitResponse,
  type CineListParams,
  type CineMutationParams,
  type CineProjectItem,
  type CineStatusCountItem,
} from '@/api/ai/cine'
import CineProjectForm from './components/CineProjectForm.vue'
import CineDetailDrawer from './components/CineDetailDrawer.vue'

const CINE_STATUS = {
  DRAFT: 1,
  DRAFT_GENERATING: 2,
  REVIEW: 3,
  STORYBOARD_GENERATING: 4,
  COMPLETED: 5,
  FAILED: 6,
} as const

type CineRowActionKey =
  | 'reviewDraft'
  | 'viewProgress'
  | 'viewResult'
  | 'viewFailure'
  | 'copyFailure'
  | 'generateDraft'
  | 'regenerateDraft'
  | 'generateStoryboard'
  | 'regenerateStoryboard'
  | 'edit'
  | 'delete'

interface CineRowAction {
  key: CineRowActionKey
  labelKey: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  loading?: boolean
  disabled?: boolean
}

interface CineSearchForm extends CineListParams {
  title: string
  status: number | ''
}

const { t } = useI18n()
const { copy } = useCopy()

const dict = ref<CineInitResponse['dict']>({
  cine_status_arr: [],
  cine_agent_list: [],
})
const statusCounts = ref<CineStatusCountItem[]>([])
const listData = ref<CineProjectItem[]>([])
const listLoading = ref(false)
const formVisible = ref(false)
const formLoading = ref(false)
const editingProject = ref<CineProjectItem | null>(null)
const detailVisible = ref(false)
const detailProject = ref<CineProjectItem | null>(null)
const storyboardLoadingId = ref<number | null>(null)

const searchForm = reactive<CineSearchForm>({
  title: '',
  status: '',
})

const page = ref<PageInfo>({
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total: 0,
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'title', type: 'input', label: t('cine.filter.title'), placeholder: t('cine.filter.titlePlaceholder'), width: 220 },
])

const columns = computed(() => [
  { key: 'title', label: t('cine.table.title'), minWidth: 220, overflowTooltip: true },
  { key: 'duration_seconds', label: t('cine.table.duration'), width: 110 },
  { key: 'status', label: t('cine.table.status'), width: 130 },
  { key: 'created_at', label: t('common.createdAt'), width: 170 },
  { key: 'actions', label: t('common.actions.action'), width: 280, fixed: 'right' },
])

const defaultAgentId = computed(() => dict.value.cine_agent_list[0]?.value)

function getStatusTagType(status: number) {
  if (status === CINE_STATUS.DRAFT_GENERATING || status === CINE_STATUS.STORYBOARD_GENERATING) return 'warning'
  if (status === CINE_STATUS.REVIEW || status === CINE_STATUS.COMPLETED) return 'success'
  if (status === CINE_STATUS.FAILED) return 'danger'
  return 'info'
}

function hasStoryboardPlan(row: CineProjectItem) {
  return Array.isArray(row.shotlist_json) && row.shotlist_json.length > 0
}

function canGenerateStoryboard(row: CineProjectItem) {
  return row.status === CINE_STATUS.REVIEW || row.status === CINE_STATUS.COMPLETED || (row.status === CINE_STATUS.FAILED && hasStoryboardPlan(row))
}

function getRowActions(row: CineProjectItem): CineRowAction[] {
  switch (row.status) {
    case CINE_STATUS.DRAFT:
      return [
        { key: 'generateDraft', labelKey: 'cine.actions.generateDraft', type: 'success' },
        { key: 'edit', labelKey: 'common.actions.edit', type: 'primary' },
        { key: 'delete', labelKey: 'common.actions.del', type: 'danger' },
      ]
    case CINE_STATUS.DRAFT_GENERATING:
      return [
        { key: 'viewProgress', labelKey: 'cine.actions.viewProgress', type: 'primary' },
      ]
    case CINE_STATUS.REVIEW:
      return [
        { key: 'reviewDraft', labelKey: 'cine.actions.reviewDraft', type: 'primary' },
        { key: 'generateStoryboard', labelKey: 'cine.actions.generateStoryboard', type: 'warning', loading: storyboardLoadingId.value === row.id, disabled: storyboardLoadingId.value !== null && storyboardLoadingId.value !== row.id },
        { key: 'edit', labelKey: 'common.actions.edit', type: 'primary' },
        { key: 'delete', labelKey: 'common.actions.del', type: 'danger' },
      ]
    case CINE_STATUS.STORYBOARD_GENERATING:
      return [
        { key: 'viewProgress', labelKey: 'cine.actions.viewProgress', type: 'primary' },
      ]
    case CINE_STATUS.COMPLETED:
      return [
        { key: 'viewResult', labelKey: 'cine.actions.viewResult', type: 'primary' },
        { key: 'regenerateDraft', labelKey: 'cine.actions.regenerateDraft', type: 'success' },
        { key: 'regenerateStoryboard', labelKey: 'cine.actions.regenerateStoryboard', type: 'warning', loading: storyboardLoadingId.value === row.id, disabled: storyboardLoadingId.value !== null && storyboardLoadingId.value !== row.id },
        { key: 'delete', labelKey: 'common.actions.del', type: 'danger' },
      ]
    case CINE_STATUS.FAILED: {
      const actions: CineRowAction[] = [
        { key: 'viewFailure', labelKey: 'cine.actions.viewFailure', type: 'primary' },
        { key: 'copyFailure', labelKey: 'cine.actions.copyFailure', type: 'info', disabled: !row.status_msg },
        { key: 'regenerateDraft', labelKey: 'cine.actions.regenerateDraft', type: 'success' },
      ]
      if (canGenerateStoryboard(row)) {
        actions.push({ key: 'regenerateStoryboard', labelKey: 'cine.actions.regenerateStoryboard', type: 'warning', loading: storyboardLoadingId.value === row.id, disabled: storyboardLoadingId.value !== null && storyboardLoadingId.value !== row.id })
      }
      actions.push(
        { key: 'edit', labelKey: 'common.actions.edit', type: 'primary' },
        { key: 'delete', labelKey: 'common.actions.del', type: 'danger' },
      )
      return actions
    }
    default:
      return [
        { key: 'viewResult', labelKey: 'common.actions.detail', type: 'primary' },
      ]
  }
}

async function init() {
  const data = await CineApi.init()
  dict.value = data.dict
}

async function loadStatusCount() {
  statusCounts.value = await CineApi.statusCount({ title: searchForm.title })
}

async function loadList() {
  listLoading.value = true
  try {
    const res = await CineApi.list({
      current_page: page.value.current_page,
      page_size: page.value.page_size,
      title: searchForm.title,
      status: searchForm.status,
    })
    listData.value = res.list
    page.value = res.page
  } finally {
    listLoading.value = false
  }
}

async function refreshAll() {
  await Promise.all([loadStatusCount(), loadList()])
}

async function handleSearch() {
  page.value.current_page = 1
  await refreshAll()
}

async function handlePageChange(nextPage: PageInfo) {
  page.value = { ...page.value, ...nextPage }
  await loadList()
}

function openCreate() {
  editingProject.value = null
  formVisible.value = true
}

function openEdit(row: CineProjectItem) {
  editingProject.value = row
  formVisible.value = true
}

async function saveProject(payload: CineMutationParams) {
  formLoading.value = true
  try {
    if (payload.id) {
      await CineApi.edit({ ...payload, id: payload.id })
    } else {
      await CineApi.add(payload)
    }
    ElNotification.success({ message: t('common.success.operation') })
    formVisible.value = false
    await refreshAll()
  } finally {
    formLoading.value = false
  }
}

async function generate(row: CineProjectItem) {
  const agentId = row.agent_id || defaultAgentId.value
  if (!agentId) {
    ElNotification.warning({ message: t('cine.messages.noAgent') })
    return
  }

  await CineApi.generate({ id: row.id, agent_id: agentId })
  ElNotification.success({ message: t('cine.messages.generateSubmitted') })
  await refreshAll()
}

async function generateStoryboard(row: CineProjectItem) {
  storyboardLoadingId.value = row.id
  try {
    await CineApi.generateStoryboard({ id: row.id })
    ElNotification.success({ message: t('cine.messages.storyboardSubmitted') })
    await refreshAll()
    if (detailVisible.value && detailProject.value?.id === row.id) {
      detailProject.value = await CineApi.detail({ id: row.id })
    }
  } finally {
    storyboardLoadingId.value = null
  }
}

async function handleRowAction(action: CineRowAction, row: CineProjectItem) {
  if (action.disabled) return

  switch (action.key) {
    case 'reviewDraft':
    case 'viewProgress':
    case 'viewResult':
    case 'viewFailure':
      await showDetail(row)
      break
    case 'copyFailure':
      if (row.status_msg) {
        await copy(row.status_msg)
      }
      break
    case 'generateDraft':
    case 'regenerateDraft':
      await generate(row)
      break
    case 'generateStoryboard':
    case 'regenerateStoryboard':
      await generateStoryboard(row)
      break
    case 'edit':
      openEdit(row)
      break
    case 'delete':
      await removeProject(row)
      break
  }
}

async function showDetail(row: CineProjectItem) {
  detailProject.value = await CineApi.detail({ id: row.id })
  detailVisible.value = true
}

async function removeProject(row: CineProjectItem) {
  await ElMessageBox.confirm(t('cine.messages.deleteConfirm'), t('common.confirmTitle'), { type: 'warning' })
  await CineApi.del({ id: row.id })
  ElNotification.success({ message: t('common.success.delete') })
  await refreshAll()
}

onMounted(async () => {
  await init()
  await refreshAll()
})
</script>

<template>
  <div class="box">
    <el-tabs
      v-model="searchForm.status"
      class="status-tabs"
      @tab-change="handleSearch"
    >
      <el-tab-pane
        v-for="item in statusCounts"
        :key="item.value"
        :name="item.value"
      >
        <template #label>
          {{ item.label }} <span class="tab-count">{{ item.num }}</span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="handleSearch"
      @reset="handleSearch"
    />

    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        :show-index="true"
        @refresh="refreshAll"
        @update:pagination="handlePageChange"
      >
        <template #toolbar-left>
          <el-button
            type="primary"
            @click="openCreate"
          >
            {{ t('cine.actions.createProject') }}
          </el-button>
        </template>

        <template #cell-title="{ row }">
          <div class="title-cell">
            <strong>{{ row.title }}</strong>
            <span>{{ row.style || '-' }}</span>
          </div>
        </template>

        <template #cell-duration_seconds="{ row }">
          <span>{{ row.duration_seconds }}s · {{ row.aspect_ratio }}</span>
        </template>

        <template #cell-status="{ row }">
          <el-tag
            :type="getStatusTagType(row.status)"
            size="small"
          >
            {{ row.status_name }}
          </el-tag>
          <el-tooltip
            v-if="row.status_msg"
            :content="row.status_msg"
            placement="top"
          >
            <span class="status-warn">!</span>
          </el-tooltip>
        </template>

        <template #cell-actions="{ row }">
          <div class="action-cell">
            <el-button
              v-for="action in getRowActions(row)"
              :key="action.key"
              :type="action.type"
              text
              size="small"
              :loading="action.loading"
              :disabled="action.disabled"
              @click="handleRowAction(action, row)"
            >
              {{ t(action.labelKey) }}
            </el-button>
          </div>
        </template>
      </AppTable>
    </div>

    <CineProjectForm
      v-model:visible="formVisible"
      :loading="formLoading"
      :agent-options="dict.cine_agent_list"
      :project="editingProject"
      @submit="saveProject"
    />

    <CineDetailDrawer
      v-model:visible="detailVisible"
      :project="detailProject"
      :storyboard-loading="storyboardLoadingId === detailProject?.id"
      @generate-storyboard="generateStoryboard"
    />
  </div>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100%; }
.table { flex: 1 1 auto; min-height: 0; overflow: auto; }
.status-tabs { margin-bottom: 4px; }
.tab-count { display: inline-flex; min-width: 22px; height: 20px; padding: 0 6px; margin-left: 6px; align-items: center; justify-content: center; border-radius: 999px; background: var(--el-fill-color-light); color: var(--el-text-color-secondary); font-size: 12px; }
.title-cell { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.title-cell strong { color: var(--el-text-color-primary); }
.title-cell span { color: var(--el-text-color-secondary); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.status-warn { display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; margin-left: 6px; border-radius: 50%; color: #fff; background: var(--el-color-danger); font-size: 12px; cursor: help; }
.action-cell { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 8px; }
.action-cell :deep(.el-button + .el-button) { margin-left: 0; }
</style>
