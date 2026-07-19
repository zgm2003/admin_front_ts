<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  type AiRunDetailResponse,
  type AiRunInitResponse,
  type AiRunItem,
  type AiRunListParams,
  type AiRunListResponse,
  type AiRunPlatform,
  type AiRunStatus,
} from '@/api/ai/runs'
import {UsersListApi} from '@/api/user/users'
import {ElNotification} from 'element-plus'
import {CopyDocument} from '@element-plus/icons-vue'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {AppTable} from '@/components/Table'
import {useCopy} from '@/hooks/useCopy'
import {useAppKernel} from '@/app/injection'
import {createAIRunsWorkflow} from '@/features/ai-runs/workflow'
import {useWorkflowTable} from '@/features/shared/use-workflow-table'
import RunDetailDialog from './RunDetailDialog.vue'
import { runStatusTagType } from './presenters'

const {t} = useI18n()
const {copy} = useCopy()
type AiRunTableParams = AiRunListParams & {current_page: number; page_size: number}
const dict = ref<AiRunInitResponse['dict']>({
  status_arr: [],
  platform_arr: [],
  agentArr: [],
  providerArr: [],
})

const searchForm = ref({
  platform: '' as AiRunPlatform | '',
  status: '' as AiRunStatus | '',
  user_id: '' as number | '',
  request_id: '',
  dateRange: [] as string[],
  agent_id: '' as number | '',
  provider_id: '' as number | '',
})

// useTable 会 unref 并展开 searchForm，需要转换 dateRange → date_start/date_end
const apiSearchForm = computed(() => {
  const {dateRange, ...rest} = searchForm.value
  if (dateRange.length === 0) return rest
  const [date_start, date_end] = dateRange
  return {...rest, date_start, date_end}
})

const workflow = createAIRunsWorkflow({realtime: useAppKernel().realtime})

const {
  loading: listLoading,
  data: listData,
  page,
  onPageChange,
  refresh,
  getList,
  onSearch,
} = useWorkflowTable<AiRunItem, AiRunTableParams, AiRunListResponse>({
  resource: workflow.list,
  page: workflow.page,
  searchForm: apiSearchForm
})

function requireRunListErrorMessage(error: unknown, operation: 'page init' | 'detail'): string {
  if (!(error instanceof Error) || error.message.trim() === '') {
    throw new Error(`AI run ${operation} failed with non-Error reason`)
  }

  return error.message
}

const init = async () => {
  try {
    const data = await workflow.loadPageInit()
    dict.value = data.dict
  } catch (e: unknown) {
    ElNotification.error({message: requireRunListErrorMessage(e, 'page init')})
  }
}

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'platform',
    type: 'select-v2',
    label: t('aiRuns.filter.platform'),
    placeholder: t('aiRuns.filter.platform'),
    width: 120,
    options: dict.value.platform_arr,
    clearable: true
  },
  {
    key: 'status',
    type: 'select-v2',
    label: t('aiRuns.filter.status'),
    placeholder: t('aiRuns.filter.status'),
    width: 140,
    options: dict.value.status_arr
  },
  {
    key: 'agent_id',
    type: 'select-v2',
    label: t('aiRuns.filter.agent'),
    placeholder: t('aiRuns.filter.agent'),
    width: 160,
    options: dict.value.agentArr,
    clearable: true
  },
  {
    key: 'provider_id',
    type: 'select-v2',
    label: t('aiRuns.filter.provider'),
    placeholder: t('aiRuns.filter.provider'),
    width: 180,
    options: dict.value.providerArr,
    clearable: true
  },
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('aiRuns.filter.user'),
    fetchMethod: UsersListApi.list,
    labelField: 'username',
    valueField: 'id',
    placeholder: t('aiRuns.filter.user'),
    width: 180
  },
  {
    key: 'request_id',
    type: 'input',
    label: t('aiRuns.filter.request_id'),
    placeholder: t('aiRuns.filter.request_id'),
    width: 220
  },
  {
    key: 'dateRange',
    type: 'date-range',
    label: t('aiRuns.filter.dateRange'),
  }
])

const columns = computed(() => [
  {key: 'request_id', label: t('aiRuns.table.request_id'), width: 240},
  {key: 'platform', label: t('aiRuns.table.platform'), width: 100},
  {key: 'agent_name', label: t('aiRuns.table.agent'), width: 140},
  {key: 'provider_name', label: t('aiRuns.table.provider'), width: 150},
  {key: 'conversation_title', label: t('aiRuns.table.conversation'), width: 160, overflowTooltip: true},
  {key: 'status', label: t('aiRuns.table.status'), width: 100},
  {key: 'model_display_name', label: t('aiRuns.table.model'), width: 140},
  {key: 'total_tokens', label: t('aiRuns.table.tokens'), width: 100},
  {key: 'duration_text', label: t('aiRuns.table.latency'), width: 100},
  {key: 'error_message', label: t('aiRuns.table.error'), width: 200, overflowTooltip: true},
  {key: 'created_at', label: t('aiRuns.table.created_at'), width: 160},
  {key: 'actions', label: t('common.actions.action'), fixed: 'right'}
])

// 详情弹窗
const detailVisible = ref(false)
const detailData = ref<AiRunDetailResponse | null>(null)
const detailLoading = ref(false)

const showDetail = async (row: AiRunItem) => {
  detailLoading.value = true
  detailVisible.value = true
  try {
    const data = await workflow.loadDetail(row.id)
    detailData.value = data
  } catch (e: unknown) {
    ElNotification.error({message: requireRunListErrorMessage(e, 'detail')})
  } finally {
    detailLoading.value = false
  }
}

onMounted(() => {
  init()
  getList()
})

onUnmounted(() => workflow.dispose())
</script>

<template>
  <div class="run-list">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
      >
        <template #cell-request_id="{row}">
          <div class="request-id-cell">
            <el-text truncated>
              {{ row.request_id }}
            </el-text>
            <el-button
              :icon="CopyDocument"
              size="small"
              text
              @click.stop="copy(row.request_id)"
            />
          </div>
        </template>
        <template #cell-platform="{row}">
          <el-tag
            size="small"
            type="info"
          >
            {{ row.platform }}
          </el-tag>
        </template>
        <template #cell-status="{row}">
          <el-tag
            :type="runStatusTagType(row.status)"
            size="small"
          >
            {{ row.status_name }}
          </el-tag>
        </template>
        <template #cell-total_tokens="{row}">
          <span>{{ row.total_tokens.toLocaleString() }}</span>
        </template>
        <template #cell-error_message="{row}">
          <el-text
            v-if="row.error_message"
            type="danger"
            truncated
          >
            {{ row.error_message }}
          </el-text>
          <span v-else>-</span>
        </template>
        <template #cell-actions="{row}">
          <el-button
            type="primary"
            text
            size="small"
            @click="showDetail(row)"
          >
            {{
              t('common.actions.detail')
            }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <RunDetailDialog
    v-model="detailVisible"
    :detail-data="detailData"
    :loading="detailLoading"
  />
</template>

<style scoped src="./styles.css"></style>
