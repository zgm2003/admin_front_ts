<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {RefreshRight} from '@element-plus/icons-vue'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import {QueueMonitorApi} from '@/api/devTools/queueMonitor'

const {t} = useI18n()

// 队列列表
const listLoading = ref(false)
const listData = ref<any[]>([])
const autoRefresh = ref(false)
let refreshTimer: any = null

// 失败任务弹窗
const failedVisible = ref(false)
const failedQueue = ref('')
const failedLoading = ref(false)
const failedData = ref<any[]>([])
const failedPage = ref({page_size: 10, current_page: 1, total: 0})

// 表格列配置
const columns = [
  {key: 'label', label: t('queueMonitor.queueName'), minWidth: 150, align: 'left'},
  {key: 'group', label: t('queueMonitor.group'), width: 100},
  {key: 'waiting', label: t('queueMonitor.waiting'), width: 120},
  {key: 'delayed', label: t('queueMonitor.delayed'), width: 120},
  {key: 'failed', label: t('queueMonitor.failed'), width: 120},
  {key: 'actions', label: t('common.actions.action'), width: 240, fixed: 'right'}
]

const failedColumns = [
  {key: 'index', label: '#', width: 60},
  {key: 'attempts', label: t('queueMonitor.attempts'), width: 80},
  {key: 'error', label: t('queueMonitor.error'), minWidth: 200},
  {key: 'data', label: t('queueMonitor.data'), minWidth: 200},
  {key: 'actions', label: t('common.actions.action'), width: 100, fixed: 'right'}
]

// 加载队列列表
const getList = async () => {
  listLoading.value = true
  try {
    listData.value = await QueueMonitorApi.list() || []
  } finally {
    listLoading.value = false
  }
}

// 切换自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(getList, 5000)
    ElMessage.success(t('queueMonitor.autoRefreshOn'))
  } else {
    clearInterval(refreshTimer)
    ElMessage.info(t('queueMonitor.autoRefreshOff'))
  }
}

// 查看失败任务
const handleViewFailed = (row: any) => {
  failedQueue.value = row.name
  failedPage.value.current_page = 1
  failedVisible.value = true
  getFailedList()
}

// 加载失败任务列表
const getFailedList = async () => {
  failedLoading.value = true
  try {
    const res = await QueueMonitorApi.failedList({
      queue: failedQueue.value,
      page_size: failedPage.value.page_size,
      current_page: failedPage.value.current_page
    })
    failedData.value = res.list || []
    failedPage.value.total = res.page?.total || 0
  } finally {
    failedLoading.value = false
  }
}

// 重试任务
const handleRetry = async (row: any) => {
  await ElMessageBox.confirm(t('queueMonitor.retryConfirm'), t('common.confirmTitle'))
  await QueueMonitorApi.retry({queue: failedQueue.value, index: row.index})
  ElMessage.success(t('common.success.operation'))
  getFailedList()
  getList()
}

// 清空等待队列
const handleClear = async (row: any) => {
  if (row.waiting === 0) return ElMessage.warning(t('queueMonitor.noWaitingTasks'))
  await ElMessageBox.confirm(t('queueMonitor.clearConfirm', {count: row.waiting}), t('common.confirmTitle'), {type: 'warning'})
  await QueueMonitorApi.clear({queue: row.name})
  ElMessage.success(t('common.success.operation'))
  getList()
}

// 清空失败队列
const handleClearFailed = async (row: any) => {
  if (row.failed === 0) return ElMessage.warning(t('queueMonitor.noFailedTasks'))
  await ElMessageBox.confirm(t('queueMonitor.clearFailedConfirm', {count: row.failed}), t('common.confirmTitle'), {type: 'warning'})
  await QueueMonitorApi.clearFailed({queue: row.name})
  ElMessage.success(t('common.success.operation'))
  getList()
}

// 分页变化
const onFailedPageChange = (p: any) => {
  failedPage.value = p
  getFailedList()
}

// 状态标签类型
const getStatusType = (count: number) => count === 0 ? 'info' : count > 10 ? 'danger' : 'warning'

onMounted(() => getList())
onUnmounted(() => refreshTimer && clearInterval(refreshTimer))
</script>

<template>
  <div class="box">
    <AppTable :columns="columns" :data="listData" :loading="listLoading" :show-column-setting="false" @refresh="getList">
      <template #toolbar-left>
        <el-button :type="autoRefresh ? 'success' : 'default'" @click="toggleAutoRefresh">
          {{ autoRefresh ? t('queueMonitor.autoRefreshOn') : t('queueMonitor.autoRefresh') }}
        </el-button>
      </template>
      <template #cell-label="{row}">
        <div>{{ row.label }}</div>
        <div class="queue-code">{{ row.name }}</div>
      </template>
      <template #cell-group="{row}">
        <el-tag :type="row.group === 'fast' ? 'success' : 'warning'" size="small">{{ row.group }}</el-tag>
      </template>
      <template #cell-waiting="{row}">
        <el-tag :type="getStatusType(row.waiting)" size="small">{{ row.waiting }}</el-tag>
      </template>
      <template #cell-delayed="{row}">
        <el-tag :type="getStatusType(row.delayed)" size="small">{{ row.delayed }}</el-tag>
      </template>
      <template #cell-failed="{row}">
        <el-tag :type="row.failed > 0 ? 'danger' : 'info'" size="small">{{ row.failed }}</el-tag>
      </template>
      <template #cell-actions="{row}">
        <el-button size="small" type="primary" link @click="handleViewFailed(row)" :disabled="row.failed === 0">{{ t('queueMonitor.viewFailed') }}</el-button>
        <el-button size="small" type="warning" link @click="handleClear(row)" :disabled="row.waiting === 0">{{ t('queueMonitor.clearWaiting') }}</el-button>
        <el-button size="small" type="danger" link @click="handleClearFailed(row)" :disabled="row.failed === 0">{{ t('queueMonitor.clearFailed') }}</el-button>
      </template>
    </AppTable>

    <el-dialog v-model="failedVisible" :title="t('queueMonitor.failedListTitle')" width="800px">
      <AppTable :columns="failedColumns" :data="failedData" :loading="failedLoading" :pagination="failedPage"
                :show-refresh="false" :show-column-setting="false" :fixed-footer="false" @update:pagination="onFailedPageChange">
        <template #cell-data="{row}">
          <el-tooltip :content="JSON.stringify(row.data, null, 2)" placement="top" :show-after="500">
            <span class="data-preview">{{ JSON.stringify(row.data) }}</span>
          </el-tooltip>
        </template>
        <template #cell-actions="{row}">
          <el-button size="small" type="primary" :icon="RefreshRight" @click="handleRetry(row)">{{ t('queueMonitor.retry') }}</el-button>
        </template>
      </AppTable>
    </el-dialog>
  </div>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.queue-code { font-size: 12px; color: var(--el-text-color-secondary); font-family: monospace }
.data-preview { max-width: 200px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap }
</style>
