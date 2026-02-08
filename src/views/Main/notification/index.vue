<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import { NotificationApi, type NotificationItem, type NotificationInitResponse } from '@/api/system/notification'
import { CommonEnum, NotificationLevelEnum, NotificationTypeColorMap } from '@/enums'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { useTable } from '@/hooks/useTable'
import { DIcon } from '@/components/DIcon'

const { t } = useI18n()
const router = useRouter()

interface DictState {
  notification_type_arr: { value: number; label: string }[]
  notification_level_arr: { value: number; label: string }[]
  notification_read_status_arr: { value: number; label: string }[]
}
const dict = ref<DictState>({ notification_type_arr: [], notification_level_arr: [], notification_read_status_arr: [] })

interface SearchForm {
  keyword: string
  type: number | string
  level: number | string
  is_read: number | string
}
const searchForm = ref<SearchForm>({ keyword: '', type: '', level: '', is_read: '' })

const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList,
  onSelectionChange,
  selectedIds,
  confirmDel,
  batchDel
} = useTable<NotificationItem>({ api: NotificationApi, searchForm })

const isUnread = (row: NotificationItem) => row.is_read === CommonEnum.NO

const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', type: 'input', label: t('notification.page.keyword'), placeholder: t('notification.page.keyword'), width: 180 },
  { key: 'type', type: 'select-v2', label: t('notification.page.type'), placeholder: t('notification.page.type'), width: 130, options: dict.value.notification_type_arr },
  { key: 'level', type: 'select-v2', label: t('notification.page.level'), placeholder: t('notification.page.level'), width: 130, options: dict.value.notification_level_arr },
  { key: 'is_read', type: 'select-v2', label: t('notification.page.readStatus'), placeholder: t('notification.page.readStatus'), width: 130, options: dict.value.notification_read_status_arr }
])

const columns = computed(() => [
  { key: 'title', label: t('notificationTask.title') },
  { key: 'content', label: t('notificationTask.content'), overflowTooltip: true },
  { key: 'type', label: t('notification.page.type'), width: 100 },
  { key: 'level', label: t('notification.page.level'), width: 100 },
  { key: 'is_read', label: t('notification.page.readStatus'), width: 100 },
  { key: 'created_at', label: t('common.createdAt'), width: 170 },
  { key: 'actions', label: t('common.actions.action'), width: 200 }
])

const getTypeColor = (type: number) => NotificationTypeColorMap[type] || 'info'

const handleMarkRead = async (row: NotificationItem) => {
  if (!isUnread(row)) return
  await NotificationApi.read({ id: row.id })
  row.is_read = CommonEnum.YES
  ElNotification.success({ message: t('common.success.operation') })
}

const handleBatchRead = async () => {
  if (!selectedIds.value.length) return ElNotification.warning({ message: t('common.selectAtLeastOne') })
  try {
    await ElMessageBox.confirm(t('notification.page.confirmBatchRead'), t('common.confirmTitle'), { type: 'info' })
    await NotificationApi.read({ id: selectedIds.value })
    ElNotification.success({ message: t('common.success.operation') })
    getList()
  } catch {}
}

onMounted(() => {
  NotificationApi.init().then((data) => {
    const res = data as unknown as NotificationInitResponse
    dict.value = res.dict || dict.value
  })
  getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        selectable
        @refresh="refresh"
        @update:pagination="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-button type="primary" @click="handleBatchRead">
            <DIcon icon="Check" :size="14" />
            {{ t('notification.page.batchRead') }}
          </el-button>
          <el-button type="danger" @click="batchDel">{{ t('notification.page.batchDelete') }}</el-button>
        </template>

        <template #cell-title="{ row }">
          <div class="cell-title" :class="{ unread: isUnread(row) }">
            <span v-if="isUnread(row)" class="unread-dot" />
            <span>{{ row.title }}</span>
          </div>
        </template>

        <template #cell-type="{ row }">
          <el-tag :type="getTypeColor(row.type)" size="small">{{ row.type_text }}</el-tag>
        </template>

        <template #cell-level="{ row }">
          <el-tag :type="row.level === NotificationLevelEnum.URGENT ? 'danger' : 'info'" size="small">{{ row.level_text }}</el-tag>
        </template>

        <template #cell-is_read="{ row }">
          <el-tag :type="isUnread(row) ? 'warning' : 'success'" size="small">
            {{ isUnread(row) ? t('notification.page.unread') : t('notification.page.read') }}
          </el-tag>
        </template>

        <template #cell-actions="{ row }">
          <el-button v-if="isUnread(row)" type="primary" text @click="handleMarkRead(row)">{{ t('notification.page.markRead') }}</el-button>
          <el-button v-if="row.link" type="success" text @click="router.push(row.link)">{{ t('common.actions.detail') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.table { flex: 1 1 auto; min-height: 0; overflow: auto }
.cell-title { display: flex; align-items: center; gap: 8px }
.cell-title.unread { font-weight: 600 }
.unread-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--el-color-primary); flex-shrink: 0 }
</style>
