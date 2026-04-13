<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {
  AiRunApi,
  type AiRunDetailResponse,
  type AiRunInitResponse,
  type AiRunItem,
  type AiRunStepItem,
} from '@/api/ai/runs'
import {UsersListApi} from '@/api/user/users'
import {ElNotification} from 'element-plus'
import {CopyDocument, Loading, Picture} from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import {DIcon} from '@/components/DIcon'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {AppTable} from '@/components/Table'
import {useIsMobile} from '@/hooks/useResponsive'
import {useCopy} from '@/hooks/useCopy'
import { CommonEnum } from '@/enums'
import { useCrudTable } from '@/hooks/useCrudTable'
import { resolveAiRunsDetailDialogLayout } from './detail-dialog'

const {t} = useI18n()
const isMobile = useIsMobile()
const {copy} = useCopy()
const dict = ref<AiRunInitResponse['dict']>({
  run_status_arr: [],
  agentArr: [],
})

const searchForm = ref({
  run_status: '' as number | '',
  user_id: '' as number | '',
  request_id: '',
  dateRange: [] as string[],
  agent_id: '' as number | '',
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
    key: 'run_status',
    type: 'select-v2',
    label: t('aiRuns.filter.status'),
    placeholder: t('aiRuns.filter.status'),
    width: 140,
    options: dict.value.run_status_arr
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
  {key: 'agent_name', label: t('aiRuns.table.agent'), width: 120},
  {key: 'conversation_title', label: t('aiRuns.table.conversation'), width: 160, overflowTooltip: true},
  {key: 'run_status', label: t('aiRuns.table.status'), width: 100},
  {key: 'model_snapshot', label: t('aiRuns.table.model'), width: 140},
  {key: 'total_tokens', label: t('aiRuns.table.tokens'), width: 100},
  {key: 'latency_str', label: t('aiRuns.table.latency'), width: 100},
  {key: 'error_msg', label: t('aiRuns.table.error'), width: 200, overflowTooltip: true},
  {key: 'created_at', label: t('aiRuns.table.created_at'), width: 160},
  {key: 'actions', label: t('common.actions.action'), fixed: 'right'}
])

// 状态标签样式
const getStatusType = (status: number) => {
  switch (status) {
    case 1:
      return 'warning'
    case 2:
      return 'success'
    case 3:
      return 'danger'
    case 4:
      return 'info'
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

interface StepTokenPayload {
  prompt_tokens?: number | null
  completion_tokens?: number | null
  total_tokens?: number | null
}

const getStepTokenPayload = (step: AiRunStepItem): StepTokenPayload | null => {
  if (!step.payload_json || typeof step.payload_json !== 'object') {
    return null
  }

  const payload = step.payload_json as StepTokenPayload
  if (payload.prompt_tokens == null && payload.completion_tokens == null && payload.total_tokens == null) {
    return null
  }

  return payload
}

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
        <template #cell-run_status="{row}">
          <el-tag :type="getStatusType(row.run_status)" size="small">{{ row.run_status_name }}</el-tag>
        </template>
        <template #cell-total_tokens="{row}">
          <span v-if="row.total_tokens">{{ row.total_tokens.toLocaleString() }}</span>
          <span v-else>-</span>
        </template>
        <template #cell-error_msg="{row}">
          <el-text v-if="row.error_msg" type="danger" truncated>{{ row.error_msg }}</el-text>
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
      :top="detailDialogLayout.top"
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
          <el-descriptions-item :label="t('aiRuns.detail.conversation')">{{
              detailData.conversation_title
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.status')">
            <el-tag :type="getStatusType(detailData.run_status)" size="small">{{ detailData.run_status_name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.model')">{{ detailData.model_snapshot }}</el-descriptions-item>
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
          <el-descriptions-item :label="t('aiRuns.detail.latency')">{{ detailData.latency_str }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.createdAt')">{{ detailData.created_at }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.updatedAt')">{{ detailData.updated_at }}</el-descriptions-item>
        </el-descriptions>

        <!-- 错误信息 -->
        <template v-if="detailData.error_msg">
          <el-divider content-position="left">{{ t('aiRuns.detail.error') }}</el-divider>
          <el-alert type="error" :closable="false" show-icon>
            <template #title>{{ detailData.error_msg }}</template>
          </el-alert>
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
                  <span v-if="detailData.assistant_message.meta_json?.feedback" class="feedback-badge">
                    <DIcon v-if="detailData.assistant_message.meta_json.feedback === CommonEnum.YES" 
                          icon="mdi:thumb-up" :size="14" style="color: var(--el-color-primary)"/>
                    <DIcon v-else icon="mdi:thumb-down" :size="14" style="color: var(--el-color-danger)"/>
                  </span>
                </div>
                <div v-if="detailData.assistant_message.meta_json" class="meta-json">
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

            <!-- 执行步骤 -->
            <template v-if="detailData.steps && detailData.steps.length > 0">
              <el-divider content-position="left">{{ t('aiRuns.detail.executionSteps') }}</el-divider>
              <el-timeline>
                <el-timeline-item
                    v-for="step in detailData.steps"
                    :key="step.id"
                    :type="step.status === CommonEnum.YES ? 'success' : 'danger'"
                    :timestamp="step.latency_str"
                    placement="top"
                >
                  <div class="step-item">
                    <div class="step-header">
                      <el-tag :type="step.status === CommonEnum.YES ? 'success' : 'danger'" size="small">{{
                          step.step_type_name
                        }}
                      </el-tag>
                      <span class="step-status">{{ step.status_name }}</span>
                      <el-tag v-if="step.agent_name" type="info" size="small" effect="plain">{{ step.agent_name }}</el-tag>
                      <el-tag v-if="step.model_snapshot" type="warning" size="small" effect="plain">{{ step.model_snapshot }}</el-tag>
                    </div>
                    <div v-if="getStepTokenPayload(step)" class="step-tokens">
                      <span v-if="getStepTokenPayload(step)?.prompt_tokens != null">Prompt: {{ getStepTokenPayload(step)?.prompt_tokens?.toLocaleString() }}</span>
                      <span v-if="getStepTokenPayload(step)?.completion_tokens != null">Completion: {{ getStepTokenPayload(step)?.completion_tokens?.toLocaleString() }}</span>
                      <span v-if="getStepTokenPayload(step)?.total_tokens != null">Total: {{ getStepTokenPayload(step)?.total_tokens?.toLocaleString() }}</span>
                    </div>
                    <div v-if="step.error_msg" class="step-error">{{ step.error_msg }}</div>
                    <div v-if="step.payload_json" class="step-payload">
                      <code>{{ JSON.stringify(step.payload_json, null, 2) }}</code>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
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

.feedback-badge {
  display: inline-flex;
  align-items: center;
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

.step-item {
  padding: 8px 0;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.step-status {
  font-size: 12px;
  color: #666;
}

.step-tokens {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #909399;
  margin-bottom: 6px;
}

.step-error {
  color: #f56c6c;
  font-size: 12px;
  margin-bottom: 6px;
}

.step-payload {
  background: #f8f8f8;
  border-radius: 4px;
  padding: 8px;
  overflow-x: auto;
}

.step-payload code {
  font-family: 'SF Mono', Monaco, Consolas, monospace;
  font-size: 11px;
  color: #476582;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
