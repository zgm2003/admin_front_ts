<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiRunContextPlan } from '@/api/ai/runs'
import { AppTable } from '@/components/Table'
import type { TableColumn } from '@/components/Table'
import { contextDecisionTagType, contextOutcomeTagType, contextScore } from './context-plan'

type ContextPlanItem = AiRunContextPlan['items'][number]

defineProps<{ plan: AiRunContextPlan }>()
const { t } = useI18n()
const columns = computed<TableColumn<ContextPlanItem>[]>(() => [
  { prop: 'ordinal', label: '#', width: 58 },
  { prop: 'decision', label: t('aiRuns.contextPlan.decision'), width: 110 },
  { prop: 'kind', label: t('aiRuns.contextPlan.kind'), width: 190 },
  { prop: 'title', label: t('aiRuns.contextPlan.titleColumn'), minWidth: 240, overflowTooltip: true },
  { prop: 'citation_key', label: t('aiRuns.contextPlan.citation'), width: 100 },
  { key: 'score', label: t('aiRuns.contextPlan.score'), width: 130 },
  { prop: 'token_upper_bound', label: t('aiRuns.contextPlan.tokens'), width: 110 },
  { prop: 'exclusion_reason', label: t('aiRuns.contextPlan.exclusion'), minWidth: 220, overflowTooltip: true },
])
</script>

<template>
  <section class="context-plan">
    <el-divider content-position="left">
      {{ t('aiRuns.contextPlan.title') }}
    </el-divider>
    <div class="context-plan__summary">
      <div>
        <span>{{ t('aiRuns.contextPlan.outcome') }}</span><el-tag :type="contextOutcomeTagType(plan.retrieval_outcome)">
          {{ t(`aiRuns.contextPlan.outcomes.${plan.retrieval_outcome}`) }}
        </el-tag>
      </div>
      <div><span>{{ t('aiRuns.contextPlan.state') }}</span><strong>{{ t(`aiRuns.contextPlan.states.${plan.state}`) }}</strong></div>
      <div><span>{{ t('aiRuns.contextPlan.budget') }}</span><strong>{{ plan.budget.known_input_budget.toLocaleString() }} / {{ plan.budget.context_window_tokens.toLocaleString() }}</strong></div>
      <div><span>{{ t('aiRuns.contextPlan.proof') }}</span><strong>{{ t(`aiRuns.contextPlan.proofs.${plan.budget.proof}`) }}</strong></div>
    </div>
    <el-alert
      v-if="plan.error"
      :title="`${plan.error.stage} · ${plan.error.code}`"
      :description="plan.state === 'failed'
        ? (plan.error.message ?? t('aiRuns.contextPlan.unknownError'))
        : t('aiRuns.contextPlan.degradedDiagnostic')"
      :type="plan.state === 'failed' ? 'error' : 'warning'"
      :closable="false"
    />
    <AppTable
      :columns="columns"
      :data="plan.items"
      row-key="ordinal"
      :fixed-footer="false"
      :show-refresh="false"
      :show-column-setting="false"
      :table-props="{ size: 'small' }"
    >
      <template #cell-decision="{ row }">
        <el-tag
          size="small"
          :type="contextDecisionTagType(row.decision)"
        >
          {{ t(`aiRuns.contextPlan.decisions.${row.decision}`) }}
        </el-tag>
      </template>
      <template #cell-score="{ row }">
        {{ contextScore(row.rerank_score ?? row.fusion_score) }}
      </template>
    </AppTable>
  </section>
</template>

<style scoped>
.context-plan__summary { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); border-bottom: 1px solid var(--el-border-color-lighter); }
.context-plan__summary div { display: flex; flex-direction: column; gap: 5px; padding: 12px; border-right: 1px solid var(--el-border-color-lighter); }
.context-plan__summary span { color: var(--el-text-color-secondary); font-size: 12px; }
@media (max-width: 760px) { .context-plan__summary { grid-template-columns: repeat(2, 1fr); } }
</style>
