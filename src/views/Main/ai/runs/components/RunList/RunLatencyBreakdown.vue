<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiRunLatencyBreakdown, AiRunRequestSummary } from '@/api/ai/runs'
import { formatRunLatency } from './presenters'

const props = defineProps<{
  latency: AiRunLatencyBreakdown
  requestSummary: AiRunRequestSummary
}>()
const { t } = useI18n()

const stages = computed(() => [
  { key: 'accept', label: t('aiRuns.detail.acceptLatency'), value: props.latency.accept_ms },
  { key: 'queue', label: t('aiRuns.detail.queueLatency'), value: props.latency.queue_ms },
  { key: 'prepare', label: t('aiRuns.detail.prepareLatency'), value: props.latency.prepare_ms },
  { key: 'ttft', label: t('aiRuns.detail.ttftLatency'), value: props.latency.ttft_ms },
  { key: 'provider-total', label: t('aiRuns.detail.providerTotalLatency'), value: props.latency.provider_total_ms },
  { key: 'settlement', label: t('aiRuns.detail.settlementLatency'), value: props.latency.settlement_ms },
  { key: 'end-to-end', label: t('aiRuns.detail.endToEndLatency'), value: props.latency.end_to_end_ms },
])

const claimSource = computed(() => props.latency.claim_source
  ? t(`aiRuns.detail.claimSources.${props.latency.claim_source}`)
  : '-')
</script>

<template>
  <section class="run-latency-breakdown">
    <div class="latency-stage-grid">
      <div
        v-for="stage in stages"
        :key="stage.key"
        class="latency-stage"
        :data-latency-stage="stage.key"
      >
        <span class="latency-label">{{ stage.label }}</span>
        <strong data-test="latency-value">{{ formatRunLatency(stage.value) }}</strong>
      </div>
    </div>
    <div class="latency-claim-source">
      <span>{{ t('aiRuns.detail.claimSource') }}</span>
      <el-tag
        size="small"
        type="info"
      >
        {{ claimSource }}
      </el-tag>
    </div>
    <dl
      class="request-summary"
      data-test="request-summary"
    >
      <div>
        <dt>{{ t('aiRuns.detail.providerAttemptCount') }}</dt>
        <dd>{{ requestSummary.provider_attempt_count }}</dd>
      </div>
      <div>
        <dt>{{ t('aiRuns.detail.toolCallCount') }}</dt>
        <dd>{{ requestSummary.tool_call_count }}</dd>
      </div>
      <div>
        <dt>{{ t('aiRuns.detail.preparedRequestBytes') }}</dt>
        <dd>{{ requestSummary.prepared_request_bytes.toLocaleString() }}</dd>
      </div>
      <div>
        <dt>{{ t('aiRuns.detail.messageCount') }}</dt>
        <dd>{{ requestSummary.message_count ?? '-' }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.run-latency-breakdown {
  border-block: 1px solid var(--el-border-color-lighter);
}

.latency-stage-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(104px, 1fr));
  overflow-x: auto;
}

.latency-stage {
  min-width: 0;
  padding: 12px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.latency-stage:last-child {
  border-right: 0;
}

.latency-label,
.latency-claim-source > span,
.request-summary dt {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.latency-stage strong {
  display: block;
  margin-top: 5px;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
}

.latency-claim-source {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.request-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  border-top: 1px solid var(--el-border-color-lighter);
}

.request-summary > div {
  padding: 10px 12px;
  border-right: 1px solid var(--el-border-color-lighter);
}

.request-summary > div:last-child {
  border-right: 0;
}

.request-summary dd {
  margin: 4px 0 0;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .request-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .request-summary > div:nth-child(2) {
    border-right: 0;
  }

  .request-summary > div:nth-child(-n + 2) {
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
</style>
