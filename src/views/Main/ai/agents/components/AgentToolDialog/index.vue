<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import { AiAgentApi, type AiAgentItem } from '@/api/ai/agents'
import { AiToolApi, type AiToolItem } from '@/api/ai/tools'

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

const selectedToolIDs = ref<number[]>([])
const activeToolIDs = ref<number[]>([])
const tools = ref<AiToolItem[]>([])
const loading = ref(false)
const saving = ref(false)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const agentName = computed(() => props.agent?.name ?? '-')
const toolSelectOptions = computed(() => tools.value.map((item) => ({ label: `${item.name} (${item.code})`, value: item.id })))

async function loadData() {
  const agentID = props.agent?.id
  if (!agentID) return
  loading.value = true
  try {
    const [toolRes, bindingRes] = await Promise.all([
      AiToolApi.list({ current_page: 1, page_size: 50, status: CommonEnum.YES }),
      AiAgentApi.tools({ agent_id: agentID }),
    ])
    tools.value = toolRes.list
    selectedToolIDs.value = [...bindingRes.tool_ids]
    activeToolIDs.value = [...bindingRes.active_tool_ids]
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
  saving.value = true
  try {
    await AiAgentApi.updateTools({
      agent_id: agentID,
      tool_ids: selectedToolIDs.value,
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
    selectedToolIDs.value = []
    activeToolIDs.value = []
    tools.value = []
    void loadData()
  }
)
</script>

<template>
  <AppDialog
    v-model="visible"
    :width="isMobile ? '94vw' : '680px'"
    height="54vh"
  >
    <template #header>
      {{ t('aiAgents.tools.title') }}
    </template>
    <div
      v-loading="loading"
      class="agent-tool-dialog"
    >
      <div class="agent-tool-dialog__agent">
        <span class="agent-tool-dialog__label">{{ t('aiAgents.tools.agent') }}</span>
        <strong>{{ agentName }}</strong>
      </div>
      <el-form label-width="auto">
        <el-form-item :label="t('aiAgents.tools.tools')">
          <el-select-v2
            v-model="selectedToolIDs"
            :options="toolSelectOptions"
            style="width: 100%"
            multiple
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('aiAgents.tools.selectTools')"
          />
        </el-form-item>
      </el-form>
      <div class="agent-tool-dialog__hint">
        {{ t('aiAgents.tools.activeTools') }}：{{ activeToolIDs.length }}
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
.agent-tool-dialog {
  padding: 4px 0;
}

.agent-tool-dialog__agent {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 14px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.agent-tool-dialog__label {
  color: var(--el-text-color-secondary);
}

.agent-tool-dialog__hint {
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
