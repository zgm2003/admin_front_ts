<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElButton, ElTag, ElText } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { CommonEnum } from '@/enums'
import { OperationLogApi } from '@/api/system/operationLog'
import { UsersListApi } from '@/api/user/users'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import type { OperationLogItem, OperationLogListParams } from '@/types/operationLog'
import {
  formatOperationLogPayload,
  summarizeOperationLogPayload,
  type OperationLogPayloadKind,
} from './utils/payload'

interface UserLookupOption {
  id: number | string
  username?: string
  email?: string
}

type OperationLogSearchForm = Omit<OperationLogListParams, 'current_page' | 'page_size'>

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

const searchForm = ref<OperationLogSearchForm>({
  user_id: '',
  action: '',
  date: [],
})
const detailVisible = shallowRef(false)
const detailRow = shallowRef<OperationLogItem | null>(null)

const { loading, data, page, onPageChange, onSearch, refresh, confirmDel } = useCrudTable({
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
  { key: 'actions', label: t('common.actions.action'), width: canDelete.value ? 150 : 90, fixed: 'right' },
])

const detailTitle = computed(() => {
  if (!detailRow.value) return t('operationLog.table.params')
  return `${t('operationLog.table.params')} #${detailRow.value.id}`
})

function summarizePayload(raw: string | null | undefined, kind: OperationLogPayloadKind): string {
  return summarizeOperationLogPayload(raw, kind, {
    empty: '-',
    payloadNone: t('operationLog.entry.payloadNone'),
    items: (count) => t('operationLog.entry.items', { count }),
  })
}

function openDetail(row: OperationLogItem) {
  detailRow.value = row
  detailVisible.value = true
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
          <ElTag
            :type="row.is_success === CommonEnum.YES ? 'success' : 'danger'"
            size="small"
          >
            {{ row.is_success === CommonEnum.YES ? t('common.success.operation') : t('common.fail.operation') }}
          </ElTag>
        </template>

        <template #cell-request_data="{ row }">
          <ElText
            truncated
            class="payload-text"
          >
            {{ summarizePayload(row.request_data, 'request') }}
          </ElText>
        </template>

        <template #cell-response_data="{ row }">
          <ElText
            truncated
            class="payload-text"
          >
            {{ summarizePayload(row.response_data, 'response') }}
          </ElText>
        </template>

        <template #cell-actions="{ row }">
          <ElButton
            type="primary"
            text
            @click="openDetail(row)"
          >
            {{ t('common.actions.detail') }}
          </ElButton>
          <ElButton
            v-if="canDelete"
            type="danger"
            text
            @click="confirmDel(row)"
          >
            {{ t('common.actions.del') }}
          </ElButton>
        </template>
      </AppTable>
    </div>

    <AppDialog
      v-model="detailVisible"
      :title="detailTitle"
      :width="isMobile ? '94vw' : '960px'"
      height="70vh"
      body-padding="16px"
    >
      <template v-if="detailRow">
        <div class="payload-detail">
          <section class="payload-panel">
            <div class="payload-panel__title">
              {{ t('operationLog.table.request_data') }}
            </div>
            <pre class="payload-panel__body">{{ formatOperationLogPayload(detailRow.request_data, 'request') || '-' }}</pre>
          </section>

          <section class="payload-panel">
            <div class="payload-panel__title">
              {{ t('operationLog.table.response_data') }}
            </div>
            <pre class="payload-panel__body">{{ formatOperationLogPayload(detailRow.response_data, 'response') || '-' }}</pre>
          </section>
        </div>
      </template>
    </AppDialog>
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

.payload-detail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.payload-panel {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
}

.payload-panel__title {
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.payload-panel__body {
  min-height: 360px;
  max-height: 58vh;
  margin: 0;
  overflow: auto;
  padding: 12px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-family: Consolas, 'JetBrains Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 768px) {
  .payload-detail {
    grid-template-columns: 1fr;
  }
}
</style>
