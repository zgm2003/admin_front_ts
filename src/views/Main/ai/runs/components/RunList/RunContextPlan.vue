<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { AiRunContextPlan } from '@/api/ai/runs'
import { contextDecisionTagType, contextOutcomeTagType, contextScore } from './context-plan'

defineProps<{ plan: AiRunContextPlan }>()
const { t } = useI18n()
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
      :title="plan.error.code"
      :description="plan.error.message ?? t('aiRuns.contextPlan.unknownError')"
      type="error"
      :closable="false"
    />
    <el-table
      :data="plan.items"
      row-key="ordinal"
      size="small"
    >
      <el-table-column
        prop="ordinal"
        label="#"
        width="58"
      />
      <el-table-column
        :label="t('aiRuns.contextPlan.decision')"
        width="100"
      >
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="contextDecisionTagType(row.decision)"
          >
            {{ t(`aiRuns.contextPlan.decisions.${row.decision}`) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        prop="kind"
        :label="t('aiRuns.contextPlan.kind')"
        width="170"
      />
      <el-table-column
        prop="title"
        :label="t('aiRuns.contextPlan.titleColumn')"
        min-width="180"
        show-overflow-tooltip
      />
      <el-table-column
        prop="citation_key"
        :label="t('aiRuns.contextPlan.citation')"
        width="90"
      />
      <el-table-column
        :label="t('aiRuns.contextPlan.score')"
        width="120"
      >
        <template #default="{ row }">
          {{ contextScore(row.rerank_score ?? row.fusion_score) }}
        </template>
      </el-table-column>
      <el-table-column
        prop="token_upper_bound"
        :label="t('aiRuns.contextPlan.tokens')"
        width="90"
      />
      <el-table-column
        prop="exclusion_reason"
        :label="t('aiRuns.contextPlan.exclusion')"
        min-width="170"
      />
    </el-table>
  </section>
</template>

<style scoped>
.context-plan__summary { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); border-bottom: 1px solid var(--el-border-color-lighter); }
.context-plan__summary div { display: flex; flex-direction: column; gap: 5px; padding: 12px; border-right: 1px solid var(--el-border-color-lighter); }
.context-plan__summary span { color: var(--el-text-color-secondary); font-size: 12px; }
@media (max-width: 760px) { .context-plan__summary { grid-template-columns: repeat(2, 1fr); } }
</style>
