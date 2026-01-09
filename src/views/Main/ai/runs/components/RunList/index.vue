<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {AiRunApi} from '@/api/ai/runs'
import {ElNotification} from 'element-plus'
import {CopyDocument} from '@element-plus/icons-vue'
import ThumbUp from '@/components/Icons/ThumbUp.vue'
import ThumbDown from '@/components/Icons/ThumbDown.vue'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {AppTable} from '@/components/Table'
import {useIsMobile} from '@/hooks/useResponsive'
import {useTable} from '@/hooks/useTable'

const {t} = useI18n()
const isMobile = useIsMobile()
const dict = ref({run_status_arr: [], usernameArr: []} as any)

const searchForm = ref({run_status: '', user_id: '', request_id: '', date_start: '', date_end: ''} as any)

const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList
} = useTable({
  api: AiRunApi,
  searchForm
})

const init = () => {
  AiRunApi.init().then((data: any) => {
    dict.value = data.dict || {}
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
    key: 'user_id',
    type: 'select-v2',
    label: t('aiRuns.filter.user'),
    placeholder: t('aiRuns.filter.user'),
    width: 160,
    options: dict.value.usernameArr
  },
  {
    key: 'request_id',
    type: 'input',
    label: t('aiRuns.filter.request_id'),
    placeholder: t('aiRuns.filter.request_id'),
    width: 220
  },
  {
    key: 'date_start',
    type: 'date',
    label: t('aiRuns.filter.date_start'),
    placeholder: t('aiRuns.filter.date_start'),
    width: 160
  },
  {
    key: 'date_end',
    type: 'date',
    label: t('aiRuns.filter.date_end'),
    placeholder: t('aiRuns.filter.date_end'),
    width: 160
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
  {key: 'actions', label: t('common.actions.action'), fixed:'right'}
])

// 状态标签样式
const getStatusType = (status: number) => {
  switch (status) {
    case 1: return 'warning'
    case 2: return 'success'
    case 3: return 'danger'
    case 4: return 'info'
    default: return 'info'
  }
}

// 详情弹窗
const detailVisible = ref(false)
const detailData = ref<any>(null)
const detailLoading = ref(false)

const showDetail = async (row: any) => {
  detailLoading.value = true
  detailVisible.value = true
  try {
    const data = await AiRunApi.detail({id: row.id})
    detailData.value = data
  } catch (e: any) {
    ElNotification.error({message: e.message || '获取详情失败'})
  } finally {
    detailLoading.value = false
  }
}

const copyRequestId = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElNotification.success({message: t('aiChat.copied'), duration: 1500})
  } catch {
    ElNotification.error({message: '复制失败'})
  }
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
            <el-button :icon="CopyDocument" size="small" text @click.stop="copyRequestId(row.request_id)" />
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
          <el-button type="primary" text size="small" @click="showDetail(row)">{{ t('common.actions.detail') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 详情弹窗 -->
  <el-dialog v-model="detailVisible" :title="t('aiRuns.detail.title')" :width="isMobile ? '94vw' : '800px'">
    <div v-loading="detailLoading">
      <template v-if="detailData">
        <el-descriptions :column="isMobile ? 1 : 2" border>
          <el-descriptions-item label="ID">{{ detailData.id }}</el-descriptions-item>
          <el-descriptions-item label="Request ID">{{ detailData.request_id }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.user')">{{ detailData.username }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.agent')">{{ detailData.agent_name }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.conversation')">{{ detailData.conversation_title }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.status')">
            <el-tag :type="getStatusType(detailData.run_status)" size="small">{{ detailData.run_status_name }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.model')">{{ detailData.model_snapshot }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.promptTokens')">{{ detailData.prompt_tokens ?? '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.completionTokens')">{{ detailData.completion_tokens ?? '-' }}</el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.totalTokens')">{{ detailData.total_tokens ?? '-' }}</el-descriptions-item>
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
                <ThumbUp v-if="detailData.assistant_message.meta_json.feedback === 1" :size="14" style="color: var(--el-color-primary)" />
                <ThumbDown v-else :size="14" style="color: var(--el-color-danger)" />
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
              :type="step.status === 1 ? 'success' : 'danger'"
              :timestamp="step.latency_str"
              placement="top"
            >
              <div class="step-item">
                <div class="step-header">
                  <el-tag :type="step.status === 1 ? 'success' : 'danger'" size="small">{{ step.step_type_name }}</el-tag>
                  <span class="step-status">{{ step.status_name }}</span>
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
  </el-dialog>
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
