<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElTag, ElText } from 'element-plus'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { CommonEnum } from '@/enums'
import { OperationLogApi } from '@/api/system/operationLog'
import { UsersListApi } from '@/api/user/users'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'

interface UserLookupOption {
  id: number | string
  username?: string
  email?: string
}

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

const searchForm = ref({
  user_id: '',
  action: '',
  date: [] as string[],
})

const {
  loading,
  data,
  page,
  onPageChange,
  onSearch,
  refresh,
  confirmDel,
} = useCrudTable({
  api: OperationLogApi,
  searchForm,
  immediate: true,
})

const canDelete = computed(() => userStore.can('devTools_operationLog_del'))

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('operationLog.filter.userName'),
    fetchMethod: UsersListApi.list,
    labelField: (item: UserLookupOption) => `${item.username} (${item.email})`,
    valueField: 'id',
    placeholder: t('operationLog.filter.userName'),
    width: isMobile.value ? 200 : 220,
  },
  {
    key: 'action',
    type: 'input',
    label: t('operationLog.filter.action'),
    placeholder: t('operationLog.filter.action'),
    width: isMobile.value ? 180 : 220,
  },
  {
    key: 'date',
    type: 'date-range',
    label: t('operationLog.filter.date'),
    placeholder: t('operationLog.filter.date'),
    width: isMobile.value ? 260 : 300,
  },
])

const columns = computed(() => [
  { key: 'user_name', label: t('operationLog.table.user_name'), width: 140 },
  { key: 'user_email', label: t('operationLog.table.user_email'), minWidth: 180 },
  { key: 'action', label: t('operationLog.table.action'), minWidth: 180 },
  { key: 'is_success', label: t('operationLog.table.is_success'), width: 110 },
  { key: 'request_data', label: t('operationLog.table.request_data'), minWidth: 180, overflowTooltip: false },
  { key: 'response_data', label: t('operationLog.table.response_data'), minWidth: 180, overflowTooltip: false },
  { key: 'created_at', label: t('operationLog.table.created_at'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 100, fixed: 'right', hidden: !canDelete.value },
])

const summarizePayload = (raw: string | null | undefined): string => {
  if (!raw) return '-'

  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return t('operationLog.entry.items', { count: parsed.length })
    if (parsed && typeof parsed === 'object') {
      const keys = Object.keys(parsed)
      return keys.length ? keys.slice(0, 4).join(', ') : t('operationLog.entry.payloadNone')
    }
    return String(parsed)
  } catch {
    return raw
  }
}
</script>

<template>
  <div class="box">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      :collapse-count="isMobile ? 2 : 3"
      @query="onSearch"
      @reset="onSearch"
    />

    <div class="table">
      <AppTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="page"
        row-key="id"
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #cell-is_success="{ row }">
          <ElTag :type="row.is_success === CommonEnum.YES ? 'success' : 'danger'" size="small">
            {{ row.is_success === CommonEnum.YES ? t('common.success.operation') : t('common.fail.operation') }}
          </ElTag>
        </template>

        <template #cell-request_data="{ row }">
          <ElText truncated class="payload-text">{{ summarizePayload(row.request_data) }}</ElText>
        </template>

        <template #cell-response_data="{ row }">
          <ElText truncated class="payload-text">{{ summarizePayload(row.response_data) }}</ElText>
        </template>

        <template #cell-actions="{ row }">
          <ElButton v-if="canDelete" type="danger" text @click="confirmDel(row)">
            {{ t('common.actions.del') }}
          </ElButton>
        </template>
      </AppTable>
    </div>
  </div>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.payload-text {
  max-width: 100%;
}
</style>
