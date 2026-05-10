<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  AiRunApi,
  type AiRunDetailResponse,
  type AiRunInitResponse,
  type AiRunItem,
  type AiRunMessageMeta,
  type AiRunStatus,
} from '@/api/ai/runs'
import {UsersListApi} from '@/api/user/users'
import {ElNotification} from 'element-plus'
import {CopyDocument, Loading, Picture} from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {AppTable} from '@/components/Table'
import {useIsMobile} from '@/hooks/useResponsive'
import {useCopy} from '@/hooks/useCopy'
import { useCrudTable } from '@/hooks/useCrudTable'
import { resolveAiRunsDetailDialogLayout } from './detail-dialog'

const {t} = useI18n()
const isMobile = useIsMobile()
const {copy} = useCopy()
const dict = ref<AiRunInitResponse['dict']>({
  status_arr: [],
  agentArr: [],
  providerArr: [],
})

const searchForm = ref({
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
  const [date_start, date_end] = dateRange
  return {...rest, date_start: date_start ?? '', date_end: date_end ?? ''}
})

const {
  loading: listLoading,
  data: listData,
  page,
  onPageChange,
  refresh,
  getList,
  onSearch,
} = useCrudTable({
  api: AiRunApi,
  searchForm: apiSearchForm
})

const init = () => {
  AiRunApi.init().then((data) => {
    dict.value = data.dict
  })
}

const searchFields = computed<SearchField[]>(() => [
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

// 状态标签样式
const getStatusType = (status: AiRunStatus) => {
  switch (status) {
    case 'running':
      return 'warning'
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'canceled':
      return 'info'
    case 'timeout':
      return 'danger'
    default:
      return 'info'
  }
}

// 详情弹窗
const detailVisible = ref(false)
const detailData = ref<AiRunDetailResponse | null>(null)
const detailLoading = ref(false)
const detailDialogLayout = computed(() => resolveAiRunsDetailDialogLayout(isMobile.value))

const showDetail = async (row: AiRunItem) => {
  detailLoading.value = true
  detailVisible.value = true
  try {
    const data = await AiRunApi.detail({id: row.id})
    detailData.value = data
  } catch (e: unknown) {
    ElNotification.error({message: e instanceof Error ? e.message : t('aiRuns.detail.fetchFailed')})
  } finally {
    detailLoading.value = false
  }
}

const getAttachmentPreviewUrls = (detail: AiRunDetailResponse) =>
  detail.user_message?.meta_json?.attachments?.map((attachment) => attachment.url) ?? []

const hasAssistantMeta = (meta?: AiRunMessageMeta | null) =>
  Boolean(meta?.run_request_id || meta?.provider_request_id)

const isTerminalRun = (status: AiRunStatus) => status !== 'running'

const formatTokens = (value: number) => value ? value.toLocaleString() : '-'

const prettyJSON = (value: unknown) => {
  if (value === null || value === undefined) return '-'
  return JSON.stringify(value, null, 2)
}

const eventTagType = (status: AiRunStatus) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
    case 'timeout':
      return 'danger'
    case 'canceled':
      return 'info'
    case 'running':
      return 'warning'
    default:
      return 'info'
  }
}

const toolCallTagType = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
    case 'timeout':
      return 'danger'
    case 'running':
      return 'warning'
    default:
      return 'info'
  }
}

const knowledgeRetrievalTagType = (status: string) => {
  switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'skipped':
      return 'info'
    default:
      return 'warning'
  }
}

const knowledgeHitTagType = (status: number) => status === 1 ? 'success' : 'info'

onMounted(() => {
  init()
  getList()
})
</script>

<template>
  <div class="run-list">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>
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
            <el-text truncated>{{ row.request_id }}</el-text>
            <el-button :icon="CopyDocument" size="small" text @click.stop="copy(row.request_id)"/>
          </div>
        </template>
        <template #cell-status="{row}">
          <el-tag :type="getStatusType(row.status)" size="small">{{ row.status_name }}</el-tag>
        </template>
        <template #cell-total_tokens="{row}">
          <span v-if="row.total_tokens">{{ row.total_tokens.toLocaleString() }}</span>
          <span v-else>-</span>
        </template>
        <template #cell-error_message="{row}">
          <el-text v-if="row.error_message" type="danger" truncated>{{ row.error_message }}</el-text>
          <span v-else>-</span>
        </template>
        <template #cell-actions="{row}">
          <el-button type="primary" text size="small" @click="showDetail(row)">{{
              t('common.actions.detail')
            }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 详情弹窗 -->
  <AppDialog
      v-model="detailVisible"
      :title="t('aiRuns.detail.title')"
      :width="detailDialogLayout.width"
      :height="detailDialogLayout.height"
  >
      <div v-loading="detailLoading" class="run-detail">
      <template v-if="detailData">
        <el-descriptions :column="isMobile ? 1 : 2" border>
          <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
          <el-descriptions-item label="Request ID">{{ detailData.request_id }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.user')">{{ detailData.username }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.agent')">{{ detailData.agent_name }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.provider')">{{ detailData.provider_name }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.conversation')">{{
              detailData.conversation_title
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.status')">
            <el-tag :type="getStatusType(detailData.status)" size="small">{{ detailData.status_name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.model')">{{ detailData.model_display_name || detailData.model_id }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.promptTokens')">{{
              detailData.prompt_tokens ?? '-'
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.completionTokens')">{{
              detailData.completion_tokens ?? '-'
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.totalTokens')">{{
              detailData.total_tokens ?? '-'
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.latency')">{{ detailData.duration_text }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.startedAt')">{{ detailData.started_at || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.finishedAt')">{{ detailData.finished_at || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.createdAt')">{{ detailData.created_at }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.updatedAt')">{{ detailData.updated_at }}</el-descriptions-item>
        </el-descriptions>

        <!-- 错误信息 -->
        <template v-if="detailData.error_message">
          <el-divider content-position="left">{{ t('aiRuns.detail.error') }}</el-divider>
          <el-alert type="error" :closable="false" show-icon>
            <template #title>{{ detailData.error_message }}</template>
          </el-alert>
        </template>

        <!-- 持久化运行事件 -->
        <template v-if="detailData.events && detailData.events.length > 0">
          <el-divider content-position="left">{{ t('aiRuns.detail.events') }}</el-divider>
          <el-timeline>
            <el-timeline-item
              v-for="event in detailData.events"
              :key="event.id"
              :timestamp="event.created_at"
              placement="top"
            >
              <div class="event-item">
                <div class="event-header">
                  <el-tag size="small" type="info">#{{ event.seq }}</el-tag>
                  <el-tag size="small" :type="eventTagType(detailData.status)">{{ event.event_type_name || event.event_type }}</el-tag>
                  <span class="event-type">{{ event.event_type }}</span>
                  <span class="event-id">ID {{ event.id }}</span>
                  <span v-if="event.elapsed_text && event.elapsed_text !== '-'" class="event-elapsed">+{{ event.elapsed_text }}</span>
                </div>
                <div v-if="event.message" class="event-message">{{ event.message }}</div>
                <div v-if="event.seq === detailData.events.length && isTerminalRun(detailData.status)" class="terminal-run-facts">
                  <span>{{ t('aiRuns.detail.promptTokens') }}: {{ formatTokens(detailData.prompt_tokens) }}</span>
                  <span>{{ t('aiRuns.detail.completionTokens') }}: {{ formatTokens(detailData.completion_tokens) }}</span>
                  <span>{{ t('aiRuns.detail.totalTokens') }}: {{ formatTokens(detailData.total_tokens) }}</span>
                  <span>{{ t('aiRuns.detail.latency') }}: {{ detailData.duration_text }}</span>
                  <span v-if="detailData.error_message" class="terminal-error">{{ t('aiRuns.detail.error') }}: {{ detailData.error_message }}</span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </template>

        <!-- 知识库检索 -->
        <template v-if="detailData.knowledge_retrievals && detailData.knowledge_retrievals.length > 0">
          <el-divider content-position="left">{{ t('aiRuns.detail.knowledgeRetrievals') }}</el-divider>
          <div class="knowledge-retrieval-list">
            <div v-for="retrieval in detailData.knowledge_retrievals" :key="retrieval.id" class="knowledge-retrieval-card">
              <div class="knowledge-retrieval-header">
                <div class="knowledge-retrieval-title">
                  <span>{{ retrieval.query }}</span>
                  <el-tag size="small" :type="knowledgeRetrievalTagType(retrieval.status)">{{ retrieval.status_name || retrieval.status }}</el-tag>
                </div>
                <div class="knowledge-retrieval-meta">
                  <span>{{ retrieval.selected_hits }} / {{ retrieval.total_hits }}</span>
                  <span>{{ retrieval.duration_text }}</span>
                  <span>{{ retrieval.created_at }}</span>
                </div>
              </div>
              <div v-if="retrieval.error_message" class="knowledge-retrieval-error">{{ retrieval.error_message }}</div>
              <el-collapse v-if="retrieval.hits.length > 0">
                <el-collapse-item
                  v-for="hit in retrieval.hits"
                  :key="hit.id"
                  :name="String(hit.id)"
                >
                  <template #title>
                    <div class="knowledge-hit-title">
                      <el-tag size="small" type="info">#{{ hit.rank_no }}</el-tag>
                      <span>{{ hit.knowledge_base_name }}</span>
                      <span>{{ hit.document_title }} / {{ hit.chunk_index }}</span>
                      <span>{{ hit.score.toFixed(4) }}</span>
                      <el-tag size="small" :type="knowledgeHitTagType(hit.status)">{{ hit.status_name }}</el-tag>
                      <span v-if="hit.skip_reason">{{ hit.skip_reason }}</span>
                    </div>
                  </template>
                  <div class="knowledge-hit-content">{{ hit.content_snapshot }}</div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </template>

        <!-- 工具调用 -->
        <template v-if="detailData.tool_calls && detailData.tool_calls.length > 0">
          <el-divider content-position="left">{{ t('aiRuns.detail.toolCalls') }}</el-divider>
          <div class="tool-call-list">
            <div v-for="call in detailData.tool_calls" :key="call.id" class="tool-call-card">
              <div class="tool-call-header">
                <div class="tool-call-title">
                  <span class="tool-call-name">{{ call.tool_name || call.tool_code }}</span>
                  <code>{{ call.tool_code }}</code>
                </div>
                <div class="tool-call-meta">
                  <el-tag size="small" :type="toolCallTagType(call.status)">{{ call.status }}</el-tag>
                  <span v-if="call.duration_ms !== null && call.duration_ms !== undefined">{{ call.duration_ms }}ms</span>
                  <span v-if="call.call_id">Call ID {{ call.call_id }}</span>
                </div>
              </div>
              <div v-if="call.error_message" class="tool-call-error">{{ call.error_message }}</div>
              <el-row :gutter="12">
                <el-col :md="12" :span="24">
                  <div class="tool-call-json">
                    <div class="tool-call-json-title">{{ t('aiRuns.detail.toolArguments') }}</div>
                    <pre>{{ prettyJSON(call.arguments_json) }}</pre>
                  </div>
                </el-col>
                <el-col :md="12" :span="24">
                  <div class="tool-call-json">
                    <div class="tool-call-json-title">{{ t('aiRuns.detail.toolResult') }}</div>
                    <pre>{{ prettyJSON(call.result_json) }}</pre>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </template>

            <!-- 用户消息 -->
            <template v-if="detailData.user_message">
              <el-divider content-position="left">{{ t('aiRuns.detail.userMessage') }}</el-divider>
              <div class="message-box user">
                <div class="message-content">{{ detailData.user_message.content }}</div>
                <!-- 图片附件 -->
                <div v-if="detailData.user_message.meta_json?.attachments?.length" class="message-attachments">
                  <el-image
                    v-for="(attachment, idx) in detailData.user_message.meta_json.attachments"
                    :key="idx"
                    :src="attachment.url"
                    :preview-src-list="getAttachmentPreviewUrls(detailData)"
                    :initial-index="Number(idx)"
                    fit="cover"
                    class="attachment-thumb"
                    lazy
                  >
                    <template #placeholder>
                      <div class="image-placeholder">
                        <el-icon class="is-loading"><Loading /></el-icon>
                      </div>
                    </template>
                    <template #error>
                      <div class="image-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>
                <div class="message-meta">{{ detailData.user_message.created_at }}</div>
              </div>
            </template>

            <!-- AI 回复 -->
            <template v-if="detailData.assistant_message">
              <el-divider content-position="left">{{ t('aiRuns.detail.assistantMessage') }}</el-divider>
              <div class="message-box assistant">
                <div class="message-content">{{ detailData.assistant_message.content }}</div>
                <div class="message-meta">
                  <span>{{ detailData.assistant_message.created_at }}</span>
                </div>
                <div v-if="detailData.assistant_message.meta_json && hasAssistantMeta(detailData.assistant_message.meta_json)" class="meta-json">
                  <div v-if="detailData.assistant_message.meta_json.run_request_id" class="meta-item">
                    <span class="meta-label">Run Request ID:</span>
                    <code>{{ detailData.assistant_message.meta_json.run_request_id }}</code>
                  </div>
                  <div v-if="detailData.assistant_message.meta_json.provider_request_id" class="meta-item">
                    <span class="meta-label">Provider Request ID:</span>
                    <code>{{ detailData.assistant_message.meta_json.provider_request_id }}</code>
                  </div>
                </div>
              </div>
            </template>

      </template>
      </div>
    <template #footer>
      <el-button @click="detailVisible = false">{{ t('common.actions.close') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.run-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto
}

.request-id-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.request-id-cell .el-text {
  flex: 1;
  min-width: 0;
}

.run-detail {
  width: 100%;
}

.message-box {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
}

.message-box.user {
  background: #e8f4ff;
}

.message-box.assistant {
  background: #f5f5f5;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.6;
}

.message-attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.attachment-thumb {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
}

.image-placeholder,
.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
}

.image-placeholder .el-icon {
  font-size: 24px;
}

.image-error .el-icon {
  font-size: 32px;
}

.message-meta {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-json {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #eee;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.meta-item:last-child {
  margin-bottom: 0;
}

.meta-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.meta-json code {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 11px;
  color: #476582;
  background: #fff;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid #e8e8e8;
  word-break: break-all;
}


.event-item {
  padding: 8px 0;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.event-type {
  font-size: 12px;
  color: #666;
}

.event-id,
.event-elapsed {
  font-size: 12px;
  color: #909399;
}

.event-message {
  white-space: pre-wrap;
  word-break: break-word;
  color: #303133;
  margin-bottom: 6px;
}

.terminal-run-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 8px;
  padding: 8px 10px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  font-size: 12px;
  color: #606266;
}

.terminal-error {
  color: var(--el-color-danger);
}

.tool-call-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-call-card {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.tool-call-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.tool-call-title,
.tool-call-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-call-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.tool-call-meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tool-call-error {
  margin-bottom: 10px;
  color: var(--el-color-danger);
  font-size: 13px;
}

.tool-call-json {
  min-height: 100%;
  padding: 10px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.tool-call-json-title {
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tool-call-json pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.45;
}

.knowledge-retrieval-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-retrieval-card {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.knowledge-retrieval-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.knowledge-retrieval-title,
.knowledge-retrieval-meta,
.knowledge-hit-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.knowledge-retrieval-title {
  font-weight: 600;
}

.knowledge-retrieval-meta,
.knowledge-hit-title {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.knowledge-retrieval-error {
  margin-bottom: 8px;
  color: var(--el-color-danger);
}

.knowledge-hit-content {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.55;
}
</style>
