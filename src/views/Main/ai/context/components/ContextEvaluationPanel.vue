<script setup lang="ts">
import { onMounted, ref, shallowRef } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { AiAgentApi, type AiAgentOption } from '@/api/ai/agents'
import type { AiContextEvaluation } from '@/api/ai/context'

defineProps<{ result: AiContextEvaluation | null; loading: boolean }>()
const emit = defineEmits<{ run: [payload: { agentID: number; query: string }] }>()
const { t } = useI18n()
const agents = ref<AiAgentOption[]>([])
const agentID = shallowRef<number | null>(null)
const query = shallowRef('')

function outcomeLabel(outcome: string) {
  switch (outcome) {
    case 'skipped': return t('aiContext.outcome.skipped')
    case 'no_hit': return t('aiContext.outcome.noHit')
    case 'hit': return t('aiContext.outcome.hit')
    case 'failed': return t('aiContext.outcome.failed')
    default: throw new Error(`Unknown Context evaluation outcome: ${outcome}`)
  }
}

onMounted(async () => {
  agents.value = (await AiAgentApi.options()).list
})
</script>

<template>
  <section class="evaluation">
    <form
      class="evaluation__form"
      @submit.prevent="agentID && query.trim() && emit('run', { agentID, query: query.trim() })"
    >
      <el-select
        v-model="agentID"
        filterable
        :placeholder="t('aiContext.evaluation.selectAgent')"
      >
        <el-option
          v-for="agent in agents"
          :key="agent.id"
          :label="agent.name"
          :value="agent.id"
        />
      </el-select>
      <el-input
        v-model="query"
        :placeholder="t('aiContext.evaluation.query')"
        maxlength="20000"
        clearable
      />
      <el-button
        native-type="submit"
        type="primary"
        :icon="Search"
        :loading="loading"
        :disabled="agentID === null || !query.trim()"
      >
        {{ t('aiContext.evaluation.run') }}
      </el-button>
    </form>

    <template v-if="result">
      <div class="evaluation__summary">
        <div><span>{{ t('aiContext.evaluation.outcome') }}</span><strong>{{ outcomeLabel(result.retrieval_outcome) }}</strong></div>
        <div><span>{{ t('aiContext.evaluation.inputBudget') }}</span><strong>{{ result.budget.known_input_budget.toLocaleString() }}</strong></div>
        <div><span>{{ t('aiContext.evaluation.selected') }}</span><strong>{{ result.selected.length }}</strong></div>
        <div><span>{{ t('aiContext.evaluation.excluded') }}</span><strong>{{ result.excluded.length }}</strong></div>
      </div>
      <el-table
        :data="[...result.selected, ...result.excluded]"
        row-key="ordinal"
      >
        <el-table-column
          prop="ordinal"
          label="#"
          width="64"
        />
        <el-table-column
          prop="source_type"
          :label="t('aiContext.evaluation.sourceType')"
          width="150"
        />
        <el-table-column
          prop="source_ref"
          :label="t('aiContext.evaluation.source')"
          min-width="210"
          show-overflow-tooltip
        />
        <el-table-column
          prop="citation_key"
          :label="t('aiContext.evaluation.citation')"
          width="100"
        />
        <el-table-column
          prop="token_upper_bound"
          :label="t('aiContext.evaluation.tokens')"
          width="100"
        />
        <el-table-column
          :label="t('aiContext.evaluation.decision')"
          width="110"
        >
          <template #default="{ row }">
            <el-tag :type="row.decision === 'selected' ? 'success' : 'info'">
              {{ row.decision === 'selected' ? t('aiContext.evaluation.selected') : t('aiContext.evaluation.excluded') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="exclusion_reason"
          :label="t('aiContext.evaluation.reason')"
          min-width="180"
        />
      </el-table>
    </template>
    <el-empty
      v-else-if="!loading"
      :description="t('aiContext.empty.evaluation')"
    />
  </section>
</template>

<style scoped>
.evaluation__form { display: grid; grid-template-columns: 260px minmax(220px, 1fr) auto; gap: 10px; padding: 10px 0 18px; }
.evaluation__summary { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); border-block: 1px solid var(--el-border-color-lighter); }
.evaluation__summary div { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border-right: 1px solid var(--el-border-color-lighter); }
.evaluation__summary div:last-child { border-right: 0; }
.evaluation__summary span { color: var(--el-text-color-secondary); font-size: 12px; }
.evaluation__summary strong { font-size: 18px; font-variant-numeric: tabular-nums; }
@media (max-width: 760px) { .evaluation__form { grid-template-columns: 1fr; } .evaluation__summary { grid-template-columns: repeat(2, 1fr); } }
</style>
