<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { CommonEnum } from '@/enums'
import {
  AiAgentApi,
  type AiAgentItem,
  type AiAgentKnowledgeBaseOption,
  type AiAgentKnowledgeBindingItem,
} from '@/api/ai/agents'

interface Props {
  modelValue: boolean
  agent: AiAgentItem | null
}

interface Emits {
  'update:modelValue': [value: boolean]
  saved: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()

const loading = ref(false)
const saving = ref(false)
const bindings = ref<AiAgentKnowledgeBindingItem[]>([])
const baseOptions = ref<AiAgentKnowledgeBaseOption[]>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const agentName = computed(() => props.agent?.name ?? '-')
const selectOptions = computed(() => baseOptions.value.map((item) => ({ label: item.label, value: item.value })))

function emptyBinding(option?: AiAgentKnowledgeBaseOption): AiAgentKnowledgeBindingItem {
  return {
    knowledge_base_id: option?.value ?? 0,
    knowledge_base_name: option?.label ?? '',
    top_k: option?.default_top_k ?? 5,
    min_score: option?.default_min_score ?? 0.1,
    max_context_chars: option?.default_max_context_chars ?? 6000,
    status: CommonEnum.YES,
  }
}

function selectedBaseIDs(currentIndex: number) {
  return new Set(bindings.value.filter((_, index) => index !== currentIndex).map((item) => item.knowledge_base_id))
}

function optionsForRow(index: number) {
  const selected = selectedBaseIDs(index)
  return selectOptions.value.filter((item) => !selected.has(item.value) || item.value === bindings.value[index]?.knowledge_base_id)
}

function applyBaseDefaults(index: number) {
  const binding = bindings.value[index]
  const option = baseOptions.value.find((item) => item.value === binding?.knowledge_base_id)
  if (!binding || !option) return
  binding.knowledge_base_name = option.label
  binding.top_k = option.default_top_k
  binding.min_score = option.default_min_score
  binding.max_context_chars = option.default_max_context_chars
}

function addBinding() {
  const selected = selectedBaseIDs(-1)
  const option = baseOptions.value.find((item) => !selected.has(item.value))
  bindings.value.push(emptyBinding(option))
}

function removeBinding(index: number) {
  bindings.value.splice(index, 1)
}

async function loadData() {
  const agentID = props.agent?.id
  if (!agentID) return
  loading.value = true
  try {
    const data = await AiAgentApi.knowledgeBases({ agent_id: agentID })
    baseOptions.value = data.base_options
    bindings.value = data.bindings.map((item) => ({ ...item }))
  } finally {
    loading.value = false
  }
}

async function confirmSubmit() {
  const agentID = props.agent?.id
  if (!agentID) {
    ElNotification.error({ message: t('aiAgents.tools.selectAgent') })
    return
  }
  if (!userStore.can('ai_agent_binding_add')) {
    ElNotification.error({ message: t('aiAgents.knowledge.saveNoPermission') })
    return
  }
  const invalid = bindings.value.some((item) => item.knowledge_base_id <= 0)
  if (invalid) {
    ElNotification.warning({ message: t('aiAgents.knowledge.selectBase') })
    return
  }
  saving.value = true
  try {
    await AiAgentApi.updateKnowledgeBases({
      agent_id: agentID,
      bindings: bindings.value,
    })
    ElNotification.success({ message: t('common.success.operation') })
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

watch(
  () => [props.modelValue, props.agent?.id] as const,
  ([open]) => {
    if (!open) return
    bindings.value = []
    baseOptions.value = []
    void loadData()
  }
)
</script>

<template>
  <AppDialog v-model="visible" :width="isMobile ? '94vw' : '760px'" height="60vh">
    <template #header>{{ t('aiAgents.knowledge.title') }}</template>
    <div v-loading="loading" class="agent-knowledge-dialog">
      <div class="agent-knowledge-dialog__agent">
        <span class="agent-knowledge-dialog__label">{{ t('aiAgents.knowledge.agent') }}</span>
        <strong>{{ agentName }}</strong>
      </div>
      <div class="agent-knowledge-dialog__toolbar">
        <el-button type="primary" @click="addBinding">{{ t('aiAgents.knowledge.addBinding') }}</el-button>
      </div>
      <el-empty v-if="bindings.length === 0" :description="t('aiAgents.knowledge.empty')" />
      <div v-else class="agent-knowledge-dialog__rows">
        <div v-for="(binding, index) in bindings" :key="`${binding.knowledge_base_id}-${index}`" class="agent-knowledge-dialog__row">
          <el-select-v2
            v-model="binding.knowledge_base_id"
            :options="optionsForRow(index)"
            :placeholder="t('aiAgents.knowledge.selectBase')"
            class="agent-knowledge-dialog__base"
            @change="applyBaseDefaults(index)"
          />
          <el-input-number v-model="binding.top_k" :min="1" :max="20" controls-position="right" />
          <el-input-number v-model="binding.min_score" :min="0" :max="100" :step="0.01" controls-position="right" />
          <el-input-number v-model="binding.max_context_chars" :min="1000" :max="30000" :step="500" controls-position="right" />
          <el-switch v-model="binding.status" :active-value="CommonEnum.YES" :inactive-value="CommonEnum.NO" />
          <el-button type="danger" text @click="removeBinding(index)">{{ t('common.actions.del') }}</el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.agent-knowledge-dialog {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.agent-knowledge-dialog__agent {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.agent-knowledge-dialog__label {
  color: var(--el-text-color-secondary);
}

.agent-knowledge-dialog__toolbar {
  display: flex;
  justify-content: flex-end;
}

.agent-knowledge-dialog__rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.agent-knowledge-dialog__row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 92px 110px 130px 72px 60px;
  gap: 8px;
  align-items: center;
}

.agent-knowledge-dialog__base {
  width: 100%;
}

@media (max-width: 900px) {
  .agent-knowledge-dialog__row {
    grid-template-columns: 1fr;
  }
}
</style>
