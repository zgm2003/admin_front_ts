<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiRunDetailResponse, AiRunInitResponse, AiRunStatus } from '@/api/ai/runs'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import RunInputSnapshot from './RunInputSnapshot.vue'
import RunLatencyBreakdown from './RunLatencyBreakdown.vue'
import {
  formatRunAmount,
  groupRunUsageItems,
  resolveAiRunsDetailDialogLayout,
  runBillingStatusTagType,
  runBillingSummary,
} from './detail-dialog'
import {
  formatRunTokens,
  prettyRunJson,
  runDictionaryLabel,
  runStatusTagType,
  toolCallTagType,
} from './presenters'
import RunContextPlan from './RunContextPlan.vue'

const props = defineProps<{
  detailData: AiRunDetailResponse | null
  loading: boolean
  billingStatusOptions: AiRunInitResponse['dict']['billing_status_arr']
  billingReasonOptions: AiRunInitResponse['dict']['billing_reason_arr']
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
    width="1040px"
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
          <el-descriptions-item :label="t('aiRuns.detail.userFeedback')">
            <el-tag
              :type="detailData.liked ? 'success' : 'info'"
              size="small"
            >
              {{ detailData.liked ? t('aiRuns.feedback.liked') : t('aiRuns.feedback.unliked') }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item
            v-if="detailData.liked_at"
            :label="t('aiRuns.detail.likedAt')"
          >
            {{ detailData.liked_at }}
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
          {{ t('aiRuns.detail.latencyBreakdown') }}
        </el-divider>
        <RunLatencyBreakdown
          :latency="detailData.latency"
          :request-summary="detailData.request_summary"
        />

        <el-divider content-position="left">
          {{ t('aiRuns.detail.billingSettlement') }}
        </el-divider>
        <el-alert
          v-if="isFailedSettled"
          class="billing-settled-failure"
          :title="t('aiRuns.detail.failedSettled')"
          type="warning"
          :closable="false"
          show-icon
        />
        <el-descriptions
          :column="isMobile ? 1 : 2"
          border
          class="billing-summary"
        >
          <el-descriptions-item :label="t('aiRuns.detail.billingStatus')">
            <el-tag
              :title="detailData.billing_status"
              :type="runBillingStatusTagType(detailData.billing_status)"
              size="small"
            >
              {{ runDictionaryLabel(billingStatusOptions, detailData.billing_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.settlementReason')">
            <span :title="detailData.billing_reason">
              {{ runDictionaryLabel(billingReasonOptions, detailData.billing_reason) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.heldAmount')">
            {{ formatRunAmount(detailData.held_amount) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('aiRuns.detail.actualAmount')">
            <strong>{{ formatRunAmount(detailData.actual_amount) }}</strong>
          </el-descriptions-item>
        </el-descriptions>

        <template v-if="detailData.pricing">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.pricingSnapshot') }}
          </el-divider>
          <el-descriptions
            :column="isMobile ? 1 : 2"
            border
          >
            <el-descriptions-item :label="t('aiRuns.detail.catalogVendor')">
              {{ detailData.pricing.catalog_vendor }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('aiRuns.detail.transportEngine')">
              {{ detailData.pricing.transport_engine }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('aiRuns.detail.model')">
              {{ detailData.pricing.model_id }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('aiRuns.detail.resolvedAlias')">
              {{ detailData.pricing.resolved_alias }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('aiRuns.detail.catalogVersion')">
              {{ detailData.pricing.version }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('aiRuns.detail.billingMultiplier')">
              {{ detailData.pricing.billing_multiplier }}
            </el-descriptions-item>
            <el-descriptions-item :label="t('aiRuns.detail.maxOutputTokens')">
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
              :label="t('aiRuns.detail.category')"
            />
            <el-table-column
              prop="tier_key"
              :label="t('aiRuns.detail.tier')"
            />
            <el-table-column :label="t('aiRuns.detail.price')">
              <template #default="{ row }">
                {{ formatRunAmount(row.price) }}
              </template>
            </el-table-column>
            <el-table-column :label="t('aiRuns.detail.unit')">
              <template #default="{ row }">
                {{ row.unit }} / {{ row.unit_scale }}
              </template>
            </el-table-column>
          </el-table>
        </template>
        <template v-else>
          <el-divider content-position="left">
            {{ t('aiRuns.detail.pricingSnapshot') }}
          </el-divider>
          <el-text type="info">
            {{ t('aiRuns.detail.pricingUnavailable') }}
          </el-text>
        </template>

        <template v-if="usageGroups.length > 0">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.billedUsage') }}
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
                  :label="t('aiRuns.detail.attempt')"
                  width="82"
                />
                <el-table-column
                  prop="category"
                  :label="t('aiRuns.detail.category')"
                  min-width="110"
                />
                <el-table-column
                  prop="quantity"
                  :label="t('aiRuns.detail.quantity')"
                  min-width="96"
                />
                <el-table-column
                  prop="tier_key"
                  :label="t('aiRuns.detail.tier')"
                  min-width="90"
                />
                <el-table-column :label="t('aiRuns.detail.unit')" min-width="120">
                  <template #default="{ row }">
                    {{ row.unit }} / {{ row.unit_scale }}
                  </template>
                </el-table-column>
                <el-table-column :label="t('aiRuns.detail.unitPrice')" min-width="132">
                  <template #default="{ row }">
                    {{ formatRunAmount(row.unit_price) }}
                  </template>
                </el-table-column>
                <el-table-column :label="t('aiRuns.detail.amount')" min-width="132">
                  <template #default="{ row }">
                    {{ formatRunAmount(row.amount) }}
                  </template>
                </el-table-column>
                <el-table-column :label="t('aiRuns.detail.billable')" width="88">
                  <template #default="{ row }">
                    <el-tag :type="row.billable ? 'success' : 'info'" size="small">
                      {{ row.billable ? t('aiRuns.detail.yes') : t('aiRuns.detail.no') }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </article>
          </section>
        </template>

        <template v-if="detailData.provider_attempts.length > 0">
          <el-divider content-position="left">
            {{ t('aiRuns.detail.providerAttempts') }}
          </el-divider>
          <el-table
            :data="detailData.provider_attempts"
            size="small"
            class="billing-table"
          >
            <el-table-column
              prop="attempt_no"
              :label="t('aiRuns.detail.attempt')"
              width="90"
            />
            <el-table-column
              prop="state"
              :label="t('aiRuns.detail.attemptState')"
              width="140"
            />
            <el-table-column
              prop="usage_status"
              :label="t('aiRuns.detail.usageStatus')"
              width="120"
            />
            <el-table-column
              prop="provider_request_id"
              :label="t('aiRuns.detail.providerRequestId')"
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
        <RunInputSnapshot
          :run-id="detailData.id"
          :snapshot="detailData.input_snapshot"
        />

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

        <RunContextPlan v-if="detailData.context_plan" :plan="detailData.context_plan" />

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
