<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, watch} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRoute, useRouter} from 'vue-router'
import {
  type AiRunDetailResponse,
  type AiRunInitResponse,
  type AiRunItem,
  type AiRunListParams,
  type AiRunListResponse,
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
import {isApiError} from '@/modules/http/error'
import RunDetailDialog from './RunDetailDialog.vue'
import { runStatusTagType } from './presenters'
import {serializeRunListQuery} from '../RunStats/dashboard-presenter'
import {
  createEmptyRunListSearchForm,
  runListParamsFromSearchForm,
  runListRouteFilterKey,
  runListSearchFormFromQuery,
  type RunListSearchForm,
} from './filters'

const {t} = useI18n()
const {copy} = useCopy()
const route = useRoute()
const router = useRouter()
type AiRunTableParams = AiRunListParams & {current_page: number; page_size: number}
const dict = ref<AiRunInitResponse['dict']>({
  status_arr: [],
  platform_arr: [],
  agentArr: [],
  providerArr: [],
  model_arr: [],
  billing_status_arr: [],
  billing_reason_arr: [],
})

const searchForm = ref<RunListSearchForm>(runListSearchFormFromQuery(route.query))

// useTable 会 unref 并展开 searchForm，需要转换 dateRange → date_start/date_end
const apiSearchForm = computed<AiRunListParams>(() => runListParamsFromSearchForm(searchForm.value))

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

function notifyRunListError(error: unknown, operation: 'page init' | 'detail') {
  if (isApiError(error) && error.kind === 'canceled') return
  ElNotification.error({message: requireRunListErrorMessage(error, operation)})
}

const init = async () => {
  try {
    const data = await workflow.loadPageInit({
      date_start: apiSearchForm.value.date_start,
      date_end: apiSearchForm.value.date_end,
    })
    dict.value = data.dict
  } catch (e: unknown) {
    notifyRunListError(e, 'page init')
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
    key: 'model_id',
    type: 'select-v2',
    label: t('aiRuns.filter.model'),
    placeholder: t('aiRuns.filter.model'),
    width: 180,
    options: dict.value.model_arr,
  },
  {
    key: 'agent_id',
    type: 'select-v2',
    label: t('aiRuns.filter.agent'),
    placeholder: t('aiRuns.filter.agent'),
    width: 160,
    options: dict.value.agentArr,
  },
  {
    key: 'provider_id',
    type: 'select-v2',
    label: t('aiRuns.filter.provider'),
    placeholder: t('aiRuns.filter.provider'),
    width: 180,
    options: dict.value.providerArr,
  },
  {
    key: 'billing_status',
    type: 'select-v2',
    label: t('aiRuns.filter.billingStatus'),
    placeholder: t('aiRuns.filter.billingStatus'),
    width: 150,
    options: dict.value.billing_status_arr,
  },
  {
    key: 'billing_reason',
    type: 'select-v2',
    label: t('aiRuns.filter.billingReason'),
    placeholder: t('aiRuns.filter.billingReason'),
    width: 190,
    options: dict.value.billing_reason_arr,
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
    key: 'error_code',
    type: 'input',
    label: t('aiRuns.filter.errorCode'),
    placeholder: t('aiRuns.filter.errorCode'),
    width: 190,
  },
  {
    key: 'tool_code',
    type: 'input',
    label: t('aiRuns.filter.toolCode'),
    placeholder: t('aiRuns.filter.toolCode'),
    width: 190,
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
  {key: 'conversation_title', label: t('aiRuns.table.conversation'), width: 160},
  {key: 'status', label: t('aiRuns.table.status'), width: 100},
  {key: 'model_display_name', label: t('aiRuns.table.model'), width: 140},
  {key: 'billing_status', label: t('aiRuns.table.billingStatus'), width: 120},
  {key: 'billing_reason', label: t('aiRuns.table.billingReason'), width: 190},
  {key: 'error_code', label: t('aiRuns.table.errorCode'), width: 180},
  {key: 'total_tokens', label: t('aiRuns.table.tokens'), width: 100},
  {key: 'duration_text', label: t('aiRuns.table.latency'), width: 100},
  {key: 'error_message', label: t('aiRuns.table.error'), width: 200},
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
    notifyRunListError(e, 'detail')
  } finally {
    detailLoading.value = false
  }
}

async function runSearch() {
  await Promise.all([init(), onSearch()])
}

async function syncURLAndSearch() {
  await router.replace({
    path: route.path,
    query: { tab: 'list', ...serializeRunListQuery(apiSearchForm.value) },
  })
  await runSearch()
}

async function resetAndSearch() {
  searchForm.value = createEmptyRunListSearchForm()
  await syncURLAndSearch()
}

watch(
  () => runListRouteFilterKey(route.query),
  async (nextKey, previousKey) => {
    if (nextKey === previousKey || nextKey === runListRouteFilterKey(serializeRunListQuery(apiSearchForm.value))) return
    searchForm.value = runListSearchFormFromQuery(route.query)
    await runSearch()
  },
)

onMounted(async () => {
  await Promise.all([init(), getList()])
})

onUnmounted(() => workflow.dispose())
</script>

<template>
  <div class="run-list">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="syncURLAndSearch"
      @reset="resetAndSearch"
    />
    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
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
