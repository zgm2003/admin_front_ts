<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiRunDetailResponse, AiRunStatus } from '@/api/ai/runs'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import { resolveAiRunsDetailDialogLayout } from './detail-dialog'
import {
  formatRunTokens,
  knowledgeHitTagType,
  knowledgeRetrievalTagType,
  prettyRunJson,
  runStatusTagType,
  toolCallTagType,
} from './presenters'

defineProps<{
  detailData: AiRunDetailResponse | null
  loading: boolean
}>()
const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()
const isMobile = useIsMobile()
const detailDialogLayout = computed(() => resolveAiRunsDetailDialogLayout(isMobile.value))
const isTerminalRun = (status: AiRunStatus) => status !== 'running'
</script>

<template>
  <AppDialog
    v-model="visible"
    :title="t('aiRuns.detail.title')"
    :width="detailDialogLayout.width"
    :height="detailDialogLayout.height"
  >
    <div
      v-loading="loading"
      class="run-detail"
    >
      <template v-if="detailData">
        <el-descriptions
          :column="isMobile ? 1 : 2"
          border
        >
          <el-descriptions-item label="ID">
            {{ detailData.id }}
          </el-descriptions-item>
          <el-descriptions-item label="Request ID">
            {{ detailData.request_id }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.platform')">
            {{ detailData.platform }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.user')">
            {{ detailData.username }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.agent')">
            {{ detailData.agent_name }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.provider')">
            {{ detailData.provider_name }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.conversation')">
            {{
              detailData.conversation_title
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.status')">
            <el-tag
              :type="runStatusTagType(detailData.status)"
              size="small"
            >
              {{ detailData.status_name }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.model')">
            {{ detailData.model_display_name }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.promptTokens')">
            {{
              detailData.prompt_tokens
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.completionTokens')">
            {{
              detailData.completion_tokens
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.totalTokens')">
            {{
              detailData.total_tokens
            }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.latency')">
            {{ detailData.duration_text }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.startedAt')">
            {{ detailData.started_at }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.finishedAt')">
            {{ detailData.finished_at }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.createdAt')">
            {{ detailData.created_at }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.updatedAt')">
            {{ detailData.updated_at }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">
          {{ t('aiRuns.detail.inputSnapshot') }}
        </el-divider>
        <div class="input-snapshot">
          {{ detailData.input_snapshot }}
        </div>

        <!-- 错误信息 -->
        <template v-if="detailData.error_message">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.error') }}
          </el-divider>
          <el-alert
            type="error"
            :closable="false"
            show-icon
          >
            <template #title>
              {{ detailData.error_message }}
            </template>
          </el-alert>
        </template>

        <!-- 持久化运行事件 -->
        <template v-if="detailData.events && detailData.events.length > 0">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.events') }}
          </el-divider>
          <el-timeline>
            <el-timeline-item
              v-for="event in detailData.events"
              :key="event.id"
              :timestamp="event.created_at"
              placement="top"
            >
              <div class="event-item">
                <div class="event-header">
                  <el-tag
                    size="small"
                    type="info"
                  >
                    #{{ event.seq }}
                  </el-tag>
                  <el-tag
                    size="small"
                    :type="runStatusTagType(detailData.status)"
                  >
                    {{ event.event_type_name || event.event_type }}
                  </el-tag>
                  <span class="event-type">{{ event.event_type }}</span>
                  <span class="event-id">ID {{ event.id }}</span>
                  <span
                    v-if="event.elapsed_text && event.elapsed_text !== '-'"
                    class="event-elapsed"
                  >+{{ event.elapsed_text }}</span>
                </div>
                <div
                  v-if="event.message"
                  class="event-message"
                >
                  {{ event.message }}
                </div>
                <div
                  v-if="event.seq === detailData.events.length && isTerminalRun(detailData.status)"
                  class="terminal-run-facts"
                >
                  <span>{{ t('aiRuns.detail.promptTokens') }}: {{ formatRunTokens(detailData.prompt_tokens) }}</span>
                  <span>{{ t('aiRuns.detail.completionTokens') }}: {{ formatRunTokens(detailData.completion_tokens) }}</span>
                  <span>{{ t('aiRuns.detail.totalTokens') }}: {{ formatRunTokens(detailData.total_tokens) }}</span>
                  <span>{{ t('aiRuns.detail.latency') }}: {{ detailData.duration_text }}</span>
                  <span
                    v-if="detailData.error_message"
                    class="terminal-error"
                  >{{ t('aiRuns.detail.error') }}: {{ detailData.error_message }}</span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </template>

        <!-- 知识库检索 -->
        <template v-if="detailData.knowledge_retrievals && detailData.knowledge_retrievals.length > 0">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.knowledgeRetrievals') }}
          </el-divider>
          <div class="knowledge-retrieval-list">
            <div
              v-for="retrieval in detailData.knowledge_retrievals"
              :key="retrieval.id"
              class="knowledge-retrieval-card"
            >
              <div class="knowledge-retrieval-header">
                <div class="knowledge-retrieval-title">
                  <span>{{ retrieval.query }}</span>
                  <el-tag
                    size="small"
                    :type="knowledgeRetrievalTagType(retrieval.status)"
                  >
                    {{ retrieval.status_name || retrieval.status }}
                  </el-tag>
                </div>
                <div class="knowledge-retrieval-meta">
                  <span>{{ retrieval.selected_hits }} / {{ retrieval.total_hits }}</span>
                  <span>{{ retrieval.duration_text }}</span>
                  <span>{{ retrieval.created_at }}</span>
                </div>
              </div>
              <div
                v-if="retrieval.error_message"
                class="knowledge-retrieval-error"
              >
                {{ retrieval.error_message }}
              </div>
              <el-collapse v-if="retrieval.hits.length > 0">
                <el-collapse-item
                  v-for="hit in retrieval.hits"
                  :key="hit.id"
                  :name="String(hit.id)"
                >
                  <template #title>
                    <div class="knowledge-hit-title">
                      <el-tag
                        size="small"
                        type="info"
                      >
                        #{{ hit.rank_no }}
                      </el-tag>
                      <span>{{ hit.knowledge_base_name }}</span>
                      <span>{{ hit.document_title }} / {{ hit.chunk_index }}</span>
                      <span>{{ hit.score.toFixed(4) }}</span>
                      <el-tag
                        size="small"
                        :type="knowledgeHitTagType(hit.status)"
                      >
                        {{ hit.status_name }}
                      </el-tag>
                      <span v-if="hit.skip_reason">{{ hit.skip_reason }}</span>
                    </div>
                  </template>
                  <div class="knowledge-hit-content">
                    {{ hit.content_snapshot }}
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </template>

        <!-- 工具调用 -->
        <template v-if="detailData.tool_calls && detailData.tool_calls.length > 0">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.toolCalls') }}
          </el-divider>
          <div class="tool-call-list">
            <div
              v-for="call in detailData.tool_calls"
              :key="call.id"
              class="tool-call-card"
            >
              <div class="tool-call-header">
                <div class="tool-call-title">
                  <span class="tool-call-name">{{ call.tool_name || call.tool_code }}</span>
                  <code>{{ call.tool_code }}</code>
                </div>
                <div class="tool-call-meta">
                  <el-tag
                    size="small"
                    :type="toolCallTagType(call.status)"
                  >
                    {{ call.status }}
                  </el-tag>
                  <span v-if="call.duration_ms !== null && call.duration_ms !== undefined">{{ call.duration_ms }}ms</span>
                  <span v-if="call.call_id">Call ID {{ call.call_id }}</span>
                </div>
              </div>
              <div
                v-if="call.error_message"
                class="tool-call-error"
              >
                {{ call.error_message }}
              </div>
              <el-row :gutter="12">
                <el-col
                  :md="12"
                  :span="24"
                >
                  <div class="tool-call-json">
                    <div class="tool-call-json-title">
                      {{ t('aiRuns.detail.toolArguments') }}
                    </div>
                    <pre>{{ prettyRunJson(call.arguments_json) }}</pre>
                  </div>
                </el-col>
                <el-col
                  :md="12"
                  :span="24"
                >
                  <div class="tool-call-json">
                    <div class="tool-call-json-title">
                      {{ t('aiRuns.detail.toolResult') }}
                    </div>
                    <pre>{{ prettyRunJson(call.result_json) }}</pre>
                  </div>
                </el-col>
              </el-row>
            </div>
          </div>
        </template>

        <!-- 用户消息 -->
        <template v-if="detailData.user_message">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.userMessage') }}
          </el-divider>
          <div class="message-box user">
            <div class="message-content">
              {{ detailData.user_message.content }}
            </div>
            <div class="message-meta">
              {{ detailData.user_message.created_at }}
            </div>
          </div>
        </template>

        <!-- AI 回复 -->
        <template v-if="detailData.assistant_message">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.assistantMessage') }}
          </el-divider>
          <div class="message-box assistant">
            <div class="message-content">
              {{ detailData.assistant_message.content }}
            </div>
            <div class="message-meta">
              <span>{{ detailData.assistant_message.created_at }}</span>
            </div>
          </div>
        </template>
      </template>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.actions.close') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped src="./run-detail-dialog.css"></style>
