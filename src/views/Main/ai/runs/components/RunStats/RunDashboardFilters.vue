<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiRunDashboardParams, AiRunInitResponse } from '@/api/ai/runs'
import { UsersListApi } from '@/api/user/users'
import { Search } from '@/components/Search'
import type { SearchField, SearchFormModel } from '@/components/Search/types'

interface DashboardFilterForm extends SearchFormModel {
  dateRange: string[]
  platform: AiRunDashboardParams['platform']
  model_id: string
  agent_id: number | ''
  provider_id: number | ''
  user_id: number | ''
}

const props = defineProps<{
  modelValue: AiRunDashboardParams
  dict: AiRunInitResponse['dict']
  loading: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: AiRunDashboardParams]
  query: [value: AiRunDashboardParams]
  reset: []
}>()
const { t } = useI18n()

const form = ref<DashboardFilterForm>(formFromParams(props.modelValue))
watch(() => props.modelValue, (value) => {
  form.value = formFromParams(value)
}, { deep: true })

const fields = computed<SearchField<DashboardFilterForm>[]>(() => [
  {
    key: 'dateRange',
    type: 'date-range',
    label: t('aiRuns.dashboard.filters.dateRange'),
    disabled: props.loading,
    width: 260,
  },
  {
    key: 'platform',
    type: 'select-v2',
    label: t('aiRuns.dashboard.filters.platform'),
    placeholder: t('aiRuns.dashboard.filters.allPlatforms'),
    disabled: props.loading,
    options: props.dict.platform_arr,
    width: 130,
  },
  {
    key: 'model_id',
    type: 'select-v2',
    label: t('aiRuns.dashboard.filters.model'),
    placeholder: t('aiRuns.dashboard.filters.allModels'),
    disabled: props.loading,
    options: props.dict.model_arr,
    width: 190,
  },
  {
    key: 'provider_id',
    type: 'select-v2',
    label: t('aiRuns.dashboard.filters.provider'),
    placeholder: t('aiRuns.dashboard.filters.allProviders'),
    disabled: props.loading,
    options: props.dict.providerArr,
    width: 180,
  },
  {
    key: 'agent_id',
    type: 'select-v2',
    label: t('aiRuns.dashboard.filters.agent'),
    placeholder: t('aiRuns.dashboard.filters.allAgents'),
    disabled: props.loading,
    options: props.dict.agentArr,
    width: 170,
  },
  {
    key: 'user_id',
    type: 'remote-select',
    label: t('aiRuns.dashboard.filters.user'),
    placeholder: t('aiRuns.dashboard.filters.allUsers'),
    disabled: props.loading,
    fetchMethod: UsersListApi.list,
    labelField: 'username',
    valueField: 'id',
    width: 180,
  },
])

function updateModel(value: SearchFormModel): AiRunDashboardParams {
  const params = paramsFromForm(value as DashboardFilterForm)
  form.value = formFromParams(params)
  emit('update:modelValue', params)
  return params
}

function handleQuery(value: SearchFormModel) {
  emit('query', updateModel(value))
}

function handleReset(value: SearchFormModel) {
  updateModel(value)
  emit('reset')
}

function formFromParams(params: AiRunDashboardParams): DashboardFilterForm {
  return {
    dateRange: params.date_start && params.date_end
      ? [params.date_start, params.date_end]
      : [],
    platform: params.platform ?? '',
    model_id: params.model_id ?? '',
    agent_id: params.agent_id ?? '',
    provider_id: params.provider_id ?? '',
    user_id: params.user_id ?? '',
  }
}

function paramsFromForm(value: DashboardFilterForm): AiRunDashboardParams {
  const [date_start, date_end] = value.dateRange
  return {
    date_start,
    date_end,
    platform: value.platform ?? '',
    model_id: value.model_id ?? '',
    agent_id: value.agent_id ?? '',
    provider_id: value.provider_id ?? '',
    user_id: value.user_id ?? '',
  }
}
</script>

<template>
  <section class="dashboard-filters">
    <Search
      v-model="form"
      :fields="fields"
      :collapse-count="2"
      @query="handleQuery"
      @reset="handleReset"
    />
  </section>
</template>
