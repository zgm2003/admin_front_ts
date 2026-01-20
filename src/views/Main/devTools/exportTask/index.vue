<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {Close} from '@element-plus/icons-vue'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import {useTable} from '@/hooks/useTable'
import {ExportTaskApi} from '@/api/devTools/exportTask'

const {t} = useI18n()
const statusArr = ref<any[]>([])
const statusFilter = ref<string | number>('')
const searchForm = ref({status: ''})

const init = () => {
  ExportTaskApi.init().then((data: any) => {
    statusArr.value = data.dict.statusArr
  }).catch(() => {})
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
  window.open(row.file_url, '_blank')
}

const handleStatusFilter = () => {
  searchForm.value.status = statusFilter.value as string
  getList()
}

const getStatusType = (status: number): 'warning' | 'success' | 'danger' | 'info' => {
  return {1: 'warning', 2: 'success', 3: 'danger'}[status] as any || 'info'
}

onMounted(() => {
  init()
  getList()
})
</script>

<template>
  <div class="box">
    <AppTable :columns="columns" :data="listData" :loading="listLoading" :pagination="page" selectable
              @update:pagination="onPageChange" @selection-change="onSelectionChange" @refresh="refresh">
      <template #toolbar-left>
        <el-select-v2 v-model="statusFilter" :options="statusArr" clearable :placeholder="t('exportTask.allStatus')" style="width: 120px" @change="handleStatusFilter" />
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
