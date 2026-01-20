<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Delete, RefreshRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { QueueMonitorApi } from '@/api/devTools/queueMonitor'

const { t } = useI18n()

// 队列列表
const queues = ref<any[]>([])
const loading = ref(false)
const autoRefresh = ref(false)
let refreshTimer: any = null

// 失败任务弹窗
const failedVisible = ref(false)
const failedQueue = ref('')
const failedList = ref<any[]>([])
const failedLoading = ref(false)
const failedPagination = ref({ pageSize: 10, currentPage: 1, total: 0 })

// 加载队列列表
const loadQueues = async () => {
  loading.value = true
  try {
    const res = await QueueMonitorApi.list()
    queues.value = res || []
  } finally {
    loading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  loadQueues()
}

// 切换自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    refreshTimer = setInterval(loadQueues, 5000)
    ElMessage.success(t('queueMonitor.autoRefreshOn'))
  } else {
    clearInterval(refreshTimer)
    ElMessage.info(t('queueMonitor.autoRefreshOff'))
  }
}

// 查看失败任务
const handleViewFailed = async (queue: any) => {
  failedQueue.value = queue.name
  failedVisible.value = true
  loadFailedList()
}

// 加载失败任务列表
const loadFailedList = async () => {
  failedLoading.value = true
  try {
    const res = await QueueMonitorApi.failedList({
      queue: failedQueue.value,
      page_size: failedPagination.value.pageSize,
      current_page: failedPagination.value.currentPage,
    })
    failedList.value = res.list || []
    failedPagination.value.total = res.page?.total || 0
  } finally {
    failedLoading.value = false
  }
}

// 重试任务
const handleRetry = async (item: any) => {
  await ElMessageBox.confirm(t('queueMonitor.retryConfirm'), t('common.tip'))
  await QueueMonitorApi.retry({ queue: failedQueue.value, index: item.index })
  ElMessage.success(t('common.success.operation'))
  loadFailedList()
  loadQueues()
}

// 清空等待队列
const handleClear = async (queue: any) => {
  if (queue.waiting === 0) {
    ElMessage.warning(t('queueMonitor.noWaitingTasks'))
    return
  }
  await ElMessageBox.confirm(t('queueMonitor.clearConfirm', { count: queue.waiting }), t('common.tip'), { type: 'warning' })
  const res = await QueueMonitorApi.clear({ queue: queue.name })
  ElMessage.success(res.msg || t('common.success.operation'))
  loadQueues()
}

// 清空失败队列
const handleClearFailed = async (queue: any) => {
  if (queue.failed === 0) {
    ElMessage.warning(t('queueMonitor.noFailedTasks'))
    return
  }
  await ElMessageBox.confirm(t('queueMonitor.clearFailedConfirm', { count: queue.failed }), t('common.tip'), { type: 'warning' })
  const res = await QueueMonitorApi.clearFailed({ queue: queue.name })
  ElMessage.success(res.msg || t('common.success.operation'))
  loadQueues()
}

// 分页变化
const handlePageChange = (page: number) => {
  failedPagination.value.currentPage = page
  loadFailedList()
}

onMounted(() => {
  loadQueues()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})

// 获取状态标签类型
const getStatusType = (count: number) => {
  if (count === 0) return 'info'
  if (count > 10) return 'danger'
  return 'warning'
}
</script>

<template>
  <div class="queue-monitor">
    <div class="page-header">
      <h2>{{ t('queueMonitor.title') }}</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="handleRefresh" :loading="loading">
          {{ t('common.actions.refresh') }}
        </el-button>
        <el-button :type="autoRefresh ? 'success' : 'default'" @click="toggleAutoRefresh">
          {{ autoRefresh ? t('queueMonitor.autoRefreshOn') : t('queueMonitor.autoRefresh') }}
        </el-button>
      </div>
    </div>

    <el-table :data="queues" v-loading="loading" border stripe>
      <el-table-column prop="label" :label="t('queueMonitor.queueName')" min-width="150">
        <template #default="{ row }">
          <div>{{ row.label }}</div>
          <div class="queue-code">{{ row.name }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="group" :label="t('queueMonitor.group')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.group === 'fast' ? 'success' : 'warning'" size="small">
            {{ row.group }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="waiting" :label="t('queueMonitor.waiting')" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.waiting)" size="small">{{ row.waiting }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="delayed" :label="t('queueMonitor.delayed')" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.delayed)" size="small">{{ row.delayed }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="failed" :label="t('queueMonitor.failed')" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.failed > 0 ? 'danger' : 'info'" size="small">{{ row.failed }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions.title')" width="240" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="handleViewFailed(row)" :disabled="row.failed === 0">
            {{ t('queueMonitor.viewFailed') }}
          </el-button>
          <el-button size="small" type="warning" link @click="handleClear(row)" :disabled="row.waiting === 0">
            {{ t('queueMonitor.clearWaiting') }}
          </el-button>
          <el-button size="small" type="danger" link @click="handleClearFailed(row)" :disabled="row.failed === 0">
            {{ t('queueMonitor.clearFailed') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 失败任务弹窗 -->
    <el-dialog v-model="failedVisible" :title="t('queueMonitor.failedListTitle')" width="800px">
      <el-table :data="failedList" v-loading="failedLoading" border max-height="400">
        <el-table-column prop="index" label="#" width="60" />
        <el-table-column prop="attempts" :label="t('queueMonitor.attempts')" width="80" align="center" />
        <el-table-column prop="error" :label="t('queueMonitor.error')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="data" :label="t('queueMonitor.data')" min-width="200">
          <template #default="{ row }">
            <el-tooltip :content="JSON.stringify(row.data, null, 2)" placement="top" :show-after="500">
              <span class="data-preview">{{ JSON.stringify(row.data) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions.title')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" :icon="RefreshRight" @click="handleRetry(row)">
              {{ t('queueMonitor.retry') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper" v-if="failedPagination.total > failedPagination.pageSize">
        <el-pagination
          layout="prev, pager, next"
          :total="failedPagination.total"
          :page-size="failedPagination.pageSize"
          :current-page="failedPagination.currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.queue-monitor {
  padding: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.page-header h2 {
  margin: 0;
  font-size: 20px;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.queue-code {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: monospace;
}
.data-preview {
  max-width: 200px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
