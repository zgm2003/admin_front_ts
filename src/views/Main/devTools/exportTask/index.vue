<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {Close} from '@element-plus/icons-vue'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {useTable} from '@/hooks/useTable'
import {ExportTaskApi} from '@/api/devTools/exportTask'
import {downloadFile} from '@/utils/download'

const {t} = useI18n()
const statusArr = ref<any[]>([])
const searchForm = ref({status: '', title: '', file_name: ''})

const loadStatusCount = () => {
  ExportTaskApi.statusCount({title: searchForm.value.title, file_name: searchForm.value.file_name}).then((data: any) => {
    statusArr.value = data
    searchForm.value.status = data[0].value
    getList()
  }).catch(() => {})
}

const refreshStatusCount = () => {
  ExportTaskApi.statusCount({title: searchForm.value.title, file_name: searchForm.value.file_name}).then((data: any) => {
    statusArr.value = data
  }).catch(() => {})
}

const handleSearch = () => {
  getList()
  refreshStatusCount()
}

const {
  loading: listLoading,
  data: listData,
  page,
  selectedIds,
  onPageChange,
  refresh,
  getList,
  onSelectionChange,
  confirmDel,
  batchDel
} = useTable({api: ExportTaskApi, searchForm})

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

const handleDownload = (row: any) => {
  if (!row.file_url) return ElMessage.warning(t('exportTask.noFile'))
  downloadFile(row.file_url, row.file_name)
}

const handleChangeStatus = () => {
  getList()
  refreshStatusCount()
}

const getStatusType = (status: number): 'warning' | 'success' | 'danger' | 'info' => {
  return {1: 'warning', 2: 'success', 3: 'danger'}[status] as any || 'info'
}

onMounted(() => {
  loadStatusCount()
})
</script>

<template>
  <div class="box">
    <el-tabs v-model="searchForm.status" @tab-change="handleChangeStatus">
      <el-tab-pane v-for="item in statusArr" :key="item.value" :name="item.value">
        <template #label>{{ item.label }} ({{ item.num }})</template>
      </el-tab-pane>
    </el-tabs>

    <Search v-model="searchForm" :fields="searchFields" @query="handleSearch" @reset="handleSearch" />
    
    <AppTable :columns="columns" :data="listData" :loading="listLoading" :pagination="page" selectable
              @update:pagination="onPageChange" @selection-change="onSelectionChange" @refresh="refresh">
      <template #toolbar-left>
        <el-button type="danger" :disabled="selectedIds.length === 0" @click="batchDel">
          {{ t('common.actions.batchDelete') }}
        </el-button>
      </template>
      
      <template #cell-title="{row}">
        <span>{{ row.title }}</span>
        <el-tooltip v-if="row.error_msg" :content="row.error_msg" placement="top">
          <el-icon color="var(--el-color-danger)" style="margin-left: 4px; cursor: help"><Close /></el-icon>
        </el-tooltip>
      </template>
      
      <template #cell-file_name="{row}">
        <span v-if="row.file_name">{{ row.file_name }}</span>
        <span v-else class="text-secondary">-</span>
      </template>
      
      <template #cell-row_count="{row}">
        <span v-if="row.row_count !== null">{{ row.row_count.toLocaleString() }}</span>
        <span v-else class="text-secondary">-</span>
      </template>
      
      <template #cell-status="{row}">
        <el-tag :type="getStatusType(row.status)" size="small">{{ row.status_text }}</el-tag>
      </template>
      
      <template #cell-actions="{row}">
        <el-button type="primary" text @click="handleDownload(row)" :disabled="row.status !== 2">{{ t('exportTask.download') }}</el-button>
        <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
      </template>
    </AppTable>
  </div>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.text-secondary { color: var(--el-text-color-secondary) }
</style>
