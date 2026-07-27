<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiRunDetailResponse, AiRunStatus } from '@/api/ai/runs'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  formatRunAmount,
  groupRunUsageItems,
  resolveAiRunsDetailDialogLayout,
  runBillingStatusTagType,
  runBillingSummary,
} from './detail-dialog'
import {
  formatRunTokens,
  knowledgeHitTagType,
  knowledgeRetrievalTagType,
  prettyRunJson,
  runStatusTagType,
  toolCallTagType,
} from './presenters'

const props = defineProps<{
  detailData: AiRunDetailResponse | null
  loading: boolean
}>()
const visible = defineModel<boolean>({ required: true })
const { t } = useI18n()
const isMobile = useIsMobile()
const detailDialogLayout = computed(() => resolveAiRunsDetailDialogLayout(isMobile.value))
const usageGroups = computed(() => groupRunUsageItems(props.detailData?.usage_items ?? []))
const isFailedSettled = computed(() => {
  if (!props.detailData) return false
  const billing = runBillingSummary(props.detailData)
  return billing.runStatus === 'failed' && billing.billingStatus === 'settled'
})
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
          Billing settlement
        </el-divider>
        <el-alert
          v-if="isFailedSettled"
          class="billing-settled-failure"
          title="The run failed, but completed provider usage was settled."
          type="warning"
          :closable="false"
          show-icon
        />
        <el-descriptions
          :column="isMobile ? 1 : 2"
          border
          class="billing-summary"
        >
          <el-descriptions-item label="Billing status">
            <el-tag
              :type="runBillingStatusTagType(detailData.billing_status)"
              size="small"
            >
              {{ detailData.billing_status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Settlement reason">
            <code>{{ detailData.billing_reason }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="Held amount">
            {{ formatRunAmount(detailData.held_amount) }}
          </el-descriptions-item>
          <el-descriptions-item label="Actual amount">
            <strong>{{ formatRunAmount(detailData.actual_amount) }}</strong>
          </el-descriptions-item>
        </el-descriptions>

        <template v-if="detailData.pricing">
          <el-divider content-position="left">
            Closed pricing snapshot
          </el-divider>
          <el-descriptions
            :column="isMobile ? 1 : 2"
            border
          >
            <el-descriptions-item label="Catalog vendor">
              {{ detailData.pricing.catalog_vendor }}
            </el-descriptions-item>
            <el-descriptions-item label="Transport engine">
              {{ detailData.pricing.transport_engine }}
            </el-descriptions-item>
            <el-descriptions-item label="Model">
              {{ detailData.pricing.model_id }}
            </el-descriptions-item>
            <el-descriptions-item label="Resolved alias">
              {{ detailData.pricing.resolved_alias }}
            </el-descriptions-item>
            <el-descriptions-item label="Catalog version">
              {{ detailData.pricing.version }}
            </el-descriptions-item>
            <el-descriptions-item label="Billing multiplier">
              {{ detailData.pricing.billing_multiplier }}
            </el-descriptions-item>
            <el-descriptions-item label="Max output tokens">
              {{ detailData.pricing.max_output_tokens }}
            </el-descriptions-item>
          </el-descriptions>
          <el-table
            :data="detailData.pricing.rates"
            size="small"
            class="billing-table"
          >
            <el-table-column
              prop="category"
              label="Category"
            />
            <el-table-column
              prop="tier_key"
              label="Tier"
            />
            <el-table-column label="Price">
              <template #default="{ row }">
                {{ formatRunAmount(row.price) }}
              </template>
            </el-table-column>
            <el-table-column label="Unit">
              <template #default="{ row }">
                {{ row.unit }} / {{ row.unit_scale }}
              </template>
            </el-table-column>
          </el-table>
        </template>
        <template v-else>
          <el-divider content-position="left">
            Closed pricing snapshot
          </el-divider>
          <el-text type="info">
            pricing: null
          </el-text>
        </template>

        <template v-if="usageGroups.length > 0">
          <el-divider content-position="left">
            Billed usage
          </el-divider>
          <section class="usage-groups">
            <article
              v-for="group in usageGroups"
              :key="group.category"
              class="usage-group"
            >
              <h4>{{ group.category }}</h4>
              <el-table
                :data="group.items"
                size="small"
              >
                <el-table-column
                  prop="attempt_no"
                  label="Attempt"
                  width="82"
                />
                <el-table-column
                  prop="category"
                  label="Category"
                  min-width="110"
                />
                <el-table-column
                  prop="quantity"
                  label="Quantity"
                  min-width="96"
                />
                <el-table-column
                  prop="tier_key"
                  label="Tier"
                  min-width="90"
                />
                <el-table-column label="Unit" min-width="120">
                  <template #default="{ row }">
                    {{ row.unit }} / {{ row.unit_scale }}
                  </template>
                </el-table-column>
                <el-table-column label="Unit price" min-width="132">
                  <template #default="{ row }">
                    {{ formatRunAmount(row.unit_price) }}
                  </template>
                </el-table-column>
                <el-table-column label="Amount" min-width="132">
                  <template #default="{ row }">
                    {{ formatRunAmount(row.amount) }}
                  </template>
                </el-table-column>
                <el-table-column label="Billable" width="88">
                  <template #default="{ row }">
                    <el-tag :type="row.billable ? 'success' : 'info'" size="small">
                      {{ row.billable ? 'yes' : 'no' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </article>
          </section>
        </template>

        <template v-if="detailData.provider_attempts.length > 0">
          <el-divider content-position="left">
            Provider attempts
          </el-divider>
          <el-table
            :data="detailData.provider_attempts"
            size="small"
            class="billing-table"
          >
            <el-table-column
              prop="attempt_no"
              label="Attempt"
              width="90"
            />
            <el-table-column
              prop="state"
              label="State"
              width="140"
            />
            <el-table-column
              prop="usage_status"
              label="Usage"
              width="120"
            />
            <el-table-column
              prop="provider_request_id"
              label="Provider request ID"
              min-width="220"
            >
              <template #default="{ row }">
                {{ row.provider_request_id ?? '-' }}
              </template>
            </el-table-column>
          </el-table>
        </template>

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

<style scoped>
.billing-settled-failure {
  margin-bottom: 12px;
}

.billing-summary strong {
  color: var(--el-color-primary);
}

.billing-table {
  margin-top: 10px;
}

.usage-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-group {
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.usage-group h4 {
  margin: 0 0 8px;
  color: var(--el-text-color-primary);
  text-transform: capitalize;
}
</style>
