<script setup lang="ts">
import {computed, onMounted, ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {useTable} from '@/hooks/useTable'
import {UserSessionApi, UsersListApi} from '@/api/user/users'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {ElMessageBox, ElNotification} from 'element-plus'
import {useUserStore} from '@/store/user'

const {t} = useI18n()
const userStore = useUserStore()

// 字典数据
const platformArr = ref<any[]>([])

// 统计数据
const stats = ref({total_active: 0, platform_distribution: {admin: 0, app: 0}})
const statsLoading = ref(false)

const init = async () => {
  try {
    const data = await UsersListApi.init()
    platformArr.value = data.dict.platformArr || []
  } catch {}
}

const loadStats = async () => {
  statsLoading.value = true
  try {
    stats.value = await UserSessionApi.stats()
  } finally {
    statsLoading.value = false
  }
}

// 筛选表单
const searchForm = ref({username: '', platform: '', status: ''})

// 状态选项
const statusOptions = [
  {value: 'active', label: t('userSession.status.active')},
  {value: 'expired', label: t('userSession.status.expired')},
  {value: 'revoked', label: t('userSession.status.revoked')}
]

const searchFields = computed<SearchField[]>(() => [
  {key: 'status', type: 'select-v2', label: t('userSession.filter.status'), options: statusOptions, placeholder: t('userSession.filter.status'), width: 120},
  {key: 'platform', type: 'select-v2', label: t('userSession.filter.platform'), options: platformArr.value, placeholder: t('userSession.filter.platform'), width: 120},
  {key: 'username', type: 'input', label: t('userSession.filter.username'), placeholder: t('userSession.filter.username'), width: 150}
])

// 表格
const {
  loading: listLoading,
  data: listData,
  page,
  selectedIds,
  onSearch,
  onPageChange,
  refresh,
  getList,
  onSelectionChange
} = useTable({
  api: {list: UserSessionApi.list},
  searchForm
})

// 状态标签类型
const getStatusType = (status: string) => {
  if (status === 'active') return 'success'
  if (status === 'expired') return 'warning'
  return 'danger'
}

// 单个踢下线
const confirmKick = async (row: any) => {
  try {
    await ElMessageBox.confirm(t('userSession.confirmKick'), t('common.confirmTitle'), {type: 'warning', confirmButtonText: t('common.actions.kick'), cancelButtonText: t('common.actions.cancel')})
  } catch { return }
  
  try {
    await UserSessionApi.kick({id: row.id})
    ElNotification.success({message: t('common.success.operation')})
    getList()
    loadStats()
  } catch {}
}

// 批量踢下线
const batchKick = async () => {
  if (selectedIds.value.length === 0) {
    ElNotification.error({message: t('common.selectAtLeastOne')})
    return
  }
  try {
    await ElMessageBox.confirm(t('userSession.confirmBatchKick', {count: selectedIds.value.length}), t('common.confirmTitle'), {type: 'warning', confirmButtonText: t('common.actions.kick'), cancelButtonText: t('common.actions.cancel')})
  } catch { return }
  
  try {
    await UserSessionApi.batchKick({ids: selectedIds.value})
    ElNotification.success({message: t('common.success.operation')})
    getList()
    loadStats()
  } catch {}
}

onMounted(() => {
  init()
  loadStats()
  getList()
})
</script>

<template>
  <div class="session-list">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card shadow="never" class="stat-card">
        <div class="stat-value">{{ stats.total_active }}</div>
        <div class="stat-label">{{ t('userSession.stats.totalActive') }}</div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-value">{{ stats.platform_distribution.admin }}</div>
        <div class="stat-label">{{ t('userSession.stats.adminOnline') }}</div>
      </el-card>
      <el-card shadow="never" class="stat-card">
        <div class="stat-value">{{ stats.platform_distribution.app }}</div>
        <div class="stat-label">{{ t('userSession.stats.appOnline') }}</div>
      </el-card>
    </div>

    <!-- 搜索栏 -->
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" :collapseCount="1"/>

    <!-- 表格 -->
    <div class="table">
      <AppTable
        :columns="[
          { key: 'username', label: t('userSession.table.username') },
          { key: 'platform', label: t('userSession.table.platform'), width: 120 },
          { key: 'device_id', label: t('userSession.table.device_id'), overflowTooltip: true },
          { key: 'ip', label: t('userSession.table.ip'), width: 120 },
          { key: 'last_seen_at', label: t('userSession.table.last_seen_at'), width: 170 },
          { key: 'status', label: t('userSession.table.status'), width: 80 },
          { key: 'actions', label: t('common.actions.action'), width: 100}
        ]"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        selectable
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-button type="danger" @click="batchKick" v-if="userStore.can('user_userManager_kick')">{{ t('userSession.batchKick') }}</el-button>
        </template>
        <template #cell-platform="{ row }">
          <el-tag :type="row.platform === 'admin' ? 'primary' : 'success'" size="small">{{ row.platform_name }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">{{ t(`userSession.status.${row.status}`) }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="warning" text v-if="userStore.can('user_userManager_kick') && row.status === 'active'" @click="confirmKick(row)">{{ t('common.actions.kick') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.session-list { display: flex; flex-direction: column; height: 100%; gap: 12px; }
.stats-cards { display: flex; gap: 12px; flex-wrap: wrap; flex-shrink: 0; }
.stat-card { flex: 1; min-width: 80px; text-align: center; }
.stat-card :deep(.el-card__body) { padding: 12px 8px; }
.stat-value { font-size: 24px; font-weight: 600; color: var(--el-color-primary); }
.stat-label { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }
.table { flex: 1 1 auto; min-height: 200px; overflow: auto; }

@media (max-width: 768px) {
  .session-list { gap: 8px; }
  .stats-cards { gap: 8px; }
  .stat-card { min-width: 60px; }
  .stat-card :deep(.el-card__body) { padding: 8px 4px; }
  .stat-value { font-size: 20px; }
  .stat-label { font-size: 11px; }
}
</style>
