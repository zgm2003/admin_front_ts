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
  <AppDialog
    v-model="visible"
    :width="isMobile ? '94vw' : '940px'"
    height="68vh"
    body-padding="16px 18px"
    top="4vh"
  >
    <template #header>
      {{ t('aiAgents.knowledge.title') }}
    </template>
    <div
      v-loading="loading"
      class="agent-knowledge-dialog"
    >
      <div class="agent-knowledge-dialog__summary">
        <div class="agent-knowledge-dialog__agent">
          <span class="agent-knowledge-dialog__label">{{ t('aiAgents.knowledge.agent') }}</span>
          <strong>{{ agentName }}</strong>
        </div>
        <el-button
          type="primary"
          @click="addBinding"
        >
          {{ t('aiAgents.knowledge.addBinding') }}
        </el-button>
      </div>

      <el-empty
        v-if="bindings.length === 0"
        class="agent-knowledge-dialog__empty"
        :description="t('aiAgents.knowledge.empty')"
      />
      <div
        v-else
        class="agent-knowledge-dialog__rows"
      >
        <div
          v-for="(binding, index) in bindings"
          :key="`${binding.knowledge_base_id}-${index}`"
          class="agent-knowledge-dialog__row"
        >
          <label class="agent-knowledge-dialog__field agent-knowledge-dialog__field--base">
            <span>{{ t('aiAgents.knowledge.base') }}</span>
            <el-select-v2
              v-model="binding.knowledge_base_id"
              :options="optionsForRow(index)"
              :placeholder="t('aiAgents.knowledge.selectBase')"
              class="agent-knowledge-dialog__base"
              filterable
              :teleported="true"
              @change="applyBaseDefaults(index)"
            />
          </label>

          <label class="agent-knowledge-dialog__field">
            <span>{{ t('aiAgents.knowledge.topK') }}</span>
            <el-input-number
              v-model="binding.top_k"
              class="agent-knowledge-dialog__number"
              :min="1"
              :max="20"
              controls-position="right"
            />
          </label>

          <label class="agent-knowledge-dialog__field">
            <span>{{ t('aiAgents.knowledge.minScore') }}</span>
            <el-input-number
              v-model="binding.min_score"
              class="agent-knowledge-dialog__number"
              :min="0"
              :max="100"
              :step="0.01"
              controls-position="right"
            />
          </label>

          <label class="agent-knowledge-dialog__field">
            <span>{{ t('aiAgents.knowledge.contextChars') }}</span>
            <el-input-number
              v-model="binding.max_context_chars"
              class="agent-knowledge-dialog__number"
              :min="1000"
              :max="30000"
              :step="500"
              controls-position="right"
            />
          </label>

          <label class="agent-knowledge-dialog__field agent-knowledge-dialog__field--status">
            <span>{{ t('aiAgents.knowledge.status') }}</span>
            <el-switch
              v-model="binding.status"
              :active-value="CommonEnum.YES"
              :inactive-value="CommonEnum.NO"
            />
          </label>

          <div class="agent-knowledge-dialog__actions">
            <span>{{ t('common.actions.action') }}</span>
            <el-button
              type="danger"
              text
              @click="removeBinding(index)"
            >
              {{ t('common.actions.del') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.actions.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :loading="saving"
        @click="confirmSubmit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.agent-knowledge-dialog {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.agent-knowledge-dialog__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-lighter);
}

.agent-knowledge-dialog__agent {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.agent-knowledge-dialog__agent strong {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agent-knowledge-dialog__label {
  flex: 0 0 auto;
  color: var(--el-text-color-secondary);
}

.agent-knowledge-dialog__empty {
  flex: 1;
  min-height: 220px;
  border: 1px dashed var(--el-border-color);
  border-radius: 12px;
  background: var(--el-fill-color-blank);
}

.agent-knowledge-dialog__rows {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 2px;
}

.agent-knowledge-dialog__row {
  display: grid;
  grid-template-columns: minmax(240px, 1.4fr) 112px 128px 150px 94px 64px;
  gap: 10px;
  align-items: end;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
  box-shadow: 0 8px 20px rgb(15 23 42 / 4%);
}

.agent-knowledge-dialog__field,
.agent-knowledge-dialog__actions {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.agent-knowledge-dialog__field > span,
.agent-knowledge-dialog__actions > span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1;
}

.agent-knowledge-dialog__base {
  width: 100%;
}

.agent-knowledge-dialog__number {
  width: 100%;
}

.agent-knowledge-dialog__number :deep(.el-input__inner) {
  text-align: left;
}

.agent-knowledge-dialog__field--status {
  justify-items: start;
}

.agent-knowledge-dialog__actions {
  justify-items: end;
}

@media (max-width: 900px) {
  .agent-knowledge-dialog__summary {
    align-items: stretch;
    flex-direction: column;
  }

  .agent-knowledge-dialog__row {
    grid-template-columns: 1fr;
  }

  .agent-knowledge-dialog__actions {
    justify-items: start;
  }
}
</style>
