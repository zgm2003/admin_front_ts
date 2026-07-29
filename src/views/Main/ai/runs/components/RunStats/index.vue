<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  AiRunDashboardParams,
  AiRunInitResponse,
  AiRunListParams,
} from '@/api/ai/runs'
import { useAppKernel } from '@/app/injection'
import { createAIRunsWorkflow } from '@/features/ai-runs/workflow'
import RunDashboardFilters from './RunDashboardFilters.vue'
import RunDashboardSummary from './RunDashboardSummary.vue'
import RunDashboardTrend from './RunDashboardTrend.vue'
import RunDashboardDiagnostics from './RunDashboardDiagnostics.vue'
import RunDashboardBreakdowns from './RunDashboardBreakdowns.vue'
import {
  buildRunListDrilldown,
  defaultDashboardDates,
  type DashboardDrilldownTarget,
} from './dashboard-presenter'

const emit = defineEmits<{ drilldown: [params: AiRunListParams] }>()
const { t } = useI18n()
const workflow = createAIRunsWorkflow({ realtime: useAppKernel().realtime })
const [defaultStart, defaultEnd] = defaultDashboardDates(new Date())
const filters = ref<AiRunDashboardParams>(defaultFilters())
const snapshotFilters = ref<AiRunDashboardParams>({ ...filters.value })
const dict = ref<AiRunInitResponse['dict']>(emptyDict())
let loadedDictionaryKey = ''
let dictionaryRequest = 0

const resourceState = computed(() => workflow.dashboard.state.value)
const dashboard = computed(() => (
  workflow.lastDashboard.value ?? resourceState.value.data[0] ?? null
))
const firstLoading = computed(() => !dashboard.value
  && (resourceState.value.kind === 'idle' || resourceState.value.kind === 'loading'))
const firstError = computed(() => !dashboard.value
  && (resourceState.value.kind === 'error' || resourceState.value.kind === 'missing'))
const stale = computed(() => Boolean(dashboard.value)
  && (resourceState.value.kind === 'error' || resourceState.value.kind === 'missing'))
const refreshing = computed(() => Boolean(dashboard.value)
  && (resourceState.value.kind === 'loading' || resourceState.value.kind === 'refreshing'))
const empty = computed(() => dashboard.value?.summary.total_runs === 0)
const errorMessage = computed(() => {
  const state = resourceState.value
  return state.kind === 'error' || state.kind === 'missing'
    ? state.error.message
    : ''
})

async function ensureDictionary(params: AiRunDashboardParams) {
  const key = `${params.date_start ?? ''}\u0000${params.date_end ?? ''}`
  if (key === loadedDictionaryKey) return
  const request = ++dictionaryRequest
  const result = await workflow.loadPageInit({
    date_start: params.date_start,
    date_end: params.date_end,
  })
  if (request !== dictionaryRequest) return
  dict.value = result.dict
  loadedDictionaryKey = key
}

async function load(params: AiRunDashboardParams) {
  filters.value = { ...params }
  await Promise.allSettled([
    ensureDictionary(params),
    loadDashboardSnapshot(params),
  ])
}

async function loadDashboardSnapshot(params: AiRunDashboardParams) {
  const result = await workflow.loadDashboard(params)
  if (workflow.lastDashboard.value === result) {
    snapshotFilters.value = { ...params }
  }
}

function handleQuery(params: AiRunDashboardParams) {
  void load(params)
}

function handleReset() {
  void load(defaultFilters())
}

function handleDrilldown(target: DashboardDrilldownTarget) {
  if (!dashboard.value) return
  emit('drilldown', buildRunListDrilldown(
    snapshotFilters.value,
    dashboard.value.generated_at,
    target,
  ))
}

async function retry() {
  try {
    await workflow.dashboard.retry()
  } catch {
    // The resource state owns the visible error.
  }
}

function defaultFilters(): AiRunDashboardParams {
  return {
    date_start: defaultStart,
    date_end: defaultEnd,
    platform: '',
    model_id: '',
    agent_id: '',
    provider_id: '',
    user_id: '',
  }
}

function emptyDict(): AiRunInitResponse['dict'] {
  return {
    status_arr: [],
    platform_arr: [],
    agentArr: [],
    providerArr: [],
    model_arr: [],
    billing_status_arr: [],
    billing_reason_arr: [],
  }
}

onMounted(() => {
  void load(filters.value)
})
onUnmounted(() => workflow.dispose())
</script>

<template>
  <div class="run-dashboard">
    <RunDashboardFilters
      v-model="filters"
      :dict="dict"
      :loading="refreshing"
      @query="handleQuery"
      @reset="handleReset"
    />

    <div
      v-if="firstLoading"
      class="dashboard-initial-state"
      data-dashboard-state="loading"
    >
      <el-skeleton
        :rows="8"
        animated
      />
    </div>

    <div
      v-else-if="firstError"
      class="dashboard-initial-state"
      data-dashboard-state="error"
    >
      <el-result
        icon="error"
        :title="t('aiRuns.dashboard.states.loadFailed')"
        :sub-title="errorMessage"
      >
        <template #extra>
          <el-button
            type="primary"
            data-action="retry"
            @click="retry"
          >
            {{ t('aiRuns.dashboard.states.retry') }}
          </el-button>
        </template>
      </el-result>
    </div>

    <template v-else-if="dashboard">
      <div class="dashboard-freshness">
        <span>{{ t('aiRuns.dashboard.states.generatedAt') }}: {{ dashboard.generated_at }}</span>
        <span v-if="refreshing">{{ t('aiRuns.dashboard.states.refreshing') }}</span>
      </div>
      <el-alert
        v-if="stale"
        type="warning"
        :closable="false"
        :title="t('aiRuns.dashboard.states.stale')"
        :description="errorMessage"
        data-dashboard-state="stale"
      />

      <RunDashboardSummary
        :summary="dashboard.summary"
        :performance="dashboard.performance"
        :billing="dashboard.billing"
        :anomalies="dashboard.anomalies"
        @drilldown="handleDrilldown"
      />

      <div
        v-if="empty"
        class="dashboard-empty"
        data-dashboard-state="empty"
      >
        <el-empty :description="t('aiRuns.dashboard.states.empty')" />
      </div>
      <template v-else>
        <RunDashboardTrend :trend="dashboard.trend" />
        <RunDashboardDiagnostics
          :anomalies="dashboard.anomalies"
          @drilldown="handleDrilldown"
        />
        <RunDashboardBreakdowns
          :breakdowns="dashboard.breakdowns"
          :loading="refreshing"
          @drilldown="handleDrilldown"
        />
      </template>
    </template>
  </div>
</template>

<style scoped src="./styles.css"></style>
