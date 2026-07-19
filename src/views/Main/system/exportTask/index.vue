<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, watch} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Close} from '@element-plus/icons-vue'
import {useI18n} from 'vue-i18n'
import {useRoute} from 'vue-router'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {
  type ExportTaskItem,
  type ExportTaskListParams,
  type ExportTaskListResponse,
  type ExportTaskStatusItem,
} from '@/api/system/exportTask'
import {createExportsWorkflow} from '@/features/exports/workflow'
import {useWorkflowTable} from '@/features/shared/use-workflow-table'
import {downloadFile} from '@/lib/browser/download'

const {t} = useI18n()
const route = useRoute()
type ExportTaskTableParams = ExportTaskListParams & {current_page: number; page_size: number}
const searchForm = ref({status: '' as 1 | 2 | 3 | '', title: '', file_name: ''})

const workflow = createExportsWorkflow({
  async confirmDelete() {
    try {
      await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.del'),
        cancelButtonText: t('common.actions.cancel'),
      })
      return true
    } catch {
      return false
    }
  },
})
const statusArr = computed<ExportTaskStatusItem[]>(() => workflow.statusCounts.value)
const {
  loading: listLoading,
  data: listData,
  page,
  selectedIds,
  onPageChange,
  getList,
  onSearch,
  refresh,
  onSelectionChange,
  clearSelection,
} = useWorkflowTable<ExportTaskItem, ExportTaskTableParams, ExportTaskListResponse>({
  resource: workflow.list,
  page: workflow.page,
  searchForm,
})

const parseStatusQuery = (raw: unknown): number | null => {
  if (raw === undefined || raw === null) return null
  const val = String(raw).trim().toLowerCase()
  if (val === '1' || val === 'pending' || val === 'processing') return 1
  if (val === '2' || val === 'success' || val === 'completed' || val === 'done') return 2
  if (val === '3' || val === 'failed' || val === 'fail' || val === 'error') return 3
  return null
}

const applyStatusFromQuery = (options: ExportTaskStatusItem[]) => {
  const target = parseStatusQuery(route.query.status)
  if (!target) return false
  const hit = options.find(item => Number(item.value) === target)
  if (!hit) return false
  searchForm.value.status = hit.value
  return true
}

const loadStatusCount = async () => {
  const data = await workflow.loadStatusCounts({title: searchForm.value.title, file_name: searchForm.value.file_name})
  if (!applyStatusFromQuery(data)) {
    searchForm.value.status = data[0]?.value ?? ''
  }
  await getList()
}

const refreshStatusCount = async () => {
  await workflow.loadStatusCounts({title: searchForm.value.title, file_name: searchForm.value.file_name})
}

const handleSearch = async () => {
  await onSearch()
  await refreshStatusCount()
}

const handleRefresh = async () => {
  await refresh()
  await refreshStatusCount()
}

const confirmDel = async (row: ExportTaskItem) => {
  const result = await workflow.deleteOne.mutate({id: row.id})
  if (result.kind === 'canceled') return
  ElMessage.success(t('common.success.operation'))
  await refreshStatusCount()
}

const batchDel = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning(t('common.selectAtLeastOne'))
    return
  }
  const result = await workflow.deleteBatch.mutate({ids: [...selectedIds.value]})
  if (result.kind === 'canceled') return
  clearSelection()
  ElMessage.success(t('common.success.operation'))
  await refreshStatusCount()
}

const searchFields = computed<SearchField[]>(() => [
  {key: 'title', type: 'input', label: t('exportTask.title'), placeholder: t('exportTask.title'), width: 180},
  {key: 'file_name', type: 'input', label: t('exportTask.fileName'), placeholder: t('exportTask.fileName'), width: 180}
])

const columns = [
  {key: 'id', label: 'ID'},
  {key: 'title', label: t('exportTask.title')},
  {key: 'file_name', label: t('exportTask.fileName')},
  {key: 'file_size_text', label: t('exportTask.fileSize')},
  {key: 'row_count', label: t('exportTask.rowCount')},
  {key: 'status', label: t('exportTask.status')},
  {key: 'expire_at', label: t('exportTask.expireAt')},
  {key: 'created_at', label: t('common.createdAt')},
  {key: 'actions', label: t('common.actions.action'), width: 180}
]

const handleChangeStatus = async () => {
  await getList()
  await refreshStatusCount()
}

const getStatusType = (status: number): 'warning' | 'success' | 'danger' | 'info' => {
  return ({1: 'warning', 2: 'success', 3: 'danger'} as const)[status as 1 | 2 | 3] || 'info'
}

onMounted(() => {
  void loadStatusCount()
})

onUnmounted(() => workflow.dispose())

watch(() => route.query.status, () => {
  if (statusArr.value.length === 0) return
  if (applyStatusFromQuery(statusArr.value)) {
    void getList()
  }
})
</script>

<template>
  <div class="box">
    <el-tabs
      v-model="searchForm.status"
      @tab-change="handleChangeStatus"
    >
      <el-tab-pane
        v-for="item in statusArr"
        :key="item.value"
        :name="item.value"
      >
        <template #label>
          {{ item.label }} ({{ item.num }})
        </template>
      </el-tab-pane>
    </el-tabs>

    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="handleSearch"
      @reset="handleSearch"
    />
    
    <AppTable
      :columns="columns"
      :data="listData"
      :loading="listLoading"
      :pagination="page"
      selectable
      @update:pagination="onPageChange"
      @selection-change="onSelectionChange"
      @refresh="handleRefresh"
    >
      <template #toolbar-left>
        <el-button
          type="danger"
          :disabled="selectedIds.length === 0"
          @click="batchDel"
        >
          {{ t('common.actions.batchDelete') }}
        </el-button>
      </template>
      
      <template #cell-title="{row}">
        <span>{{ row.title }}</span>
        <el-tooltip
          v-if="row.error_msg"
          :content="row.error_msg"
          placement="top"
        >
          <el-icon
            color="var(--el-color-danger)"
            style="margin-left: 4px; cursor: help"
          >
            <Close />
          </el-icon>
        </el-tooltip>
      </template>
      
      <template #cell-file_name="{row}">
        <span v-if="row.file_name">{{ row.file_name }}</span>
        <span
          v-else
          class="text-secondary"
        >-</span>
      </template>
      
      <template #cell-row_count="{row}">
        <span v-if="row.row_count !== null">{{ row.row_count.toLocaleString() }}</span>
        <span
          v-else
          class="text-secondary"
        >-</span>
      </template>
      
      <template #cell-status="{row}">
        <el-tag
          :type="getStatusType(row.status)"
          size="small"
        >
          {{ row.status_text }}
        </el-tag>
      </template>
      
      <template #cell-actions="{row}">
        <el-button
          type="primary"
          text
          :disabled="row.status !== 2"
          @click="row.file_url ? downloadFile(row.file_url, row.file_name) : ElMessage.warning(t('exportTask.noFile'))"
        >
          {{ t('exportTask.download') }}
        </el-button>
        <el-button
          type="danger"
          text
          @click="confirmDel(row)"
        >
          {{ t('common.actions.del') }}
        </el-button>
      </template>
    </AppTable>
  </div>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.text-secondary { color: var(--el-text-color-secondary) }
</style>
