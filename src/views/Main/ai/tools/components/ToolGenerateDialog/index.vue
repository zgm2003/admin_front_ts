<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  AiToolApi,
  type AiToolGenerateAgentOption,
  type AiToolGeneratedDraft,
} from '@/api/ai/tools'

interface GenerateForm {
  agent_id: number | ''
  requirement: string
  code_hint: string
}

interface Props {
  modelValue: boolean
}

interface Emits {
  'update:modelValue': [value: boolean]
  generated: [draft: AiToolGeneratedDraft]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const isMobile = useIsMobile()
const formRef = ref<FormInstance | null>(null)
const form = ref<GenerateForm>(defaultGenerateForm())
const loading = shallowRef(false)
const loadingAgents = shallowRef(false)
const agentOptions = shallowRef<AiToolGenerateAgentOption[]>([])
const warnings = shallowRef<string[]>([])
const clarifyingQuestions = shallowRef<string[]>([])
const usageText = shallowRef('')

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const rules = computed<FormRules>(() => ({
  agent_id: [{ required: true, message: t('aiTools.generate.agent') + t('common.required'), trigger: 'change' }],
  requirement: [{ required: true, message: t('aiTools.generate.requirement') + t('common.required'), trigger: 'blur' }],
}))

function defaultGenerateForm(): GenerateForm {
  return {
    agent_id: '',
    requirement: '',
    code_hint: '',
  }
}

function resetState() {
  form.value = defaultGenerateForm()
  warnings.value = []
  clarifyingQuestions.value = []
  usageText.value = ''
}

async function loadGenerateInit() {
  loadingAgents.value = true
  try {
    const data = await AiToolApi.generatePageInit()
    agentOptions.value = data.agent_options
    const firstAgent = data.agent_options[0]
    if (form.value.agent_id === '' && firstAgent) {
      form.value.agent_id = firstAgent.value
    }
  } finally {
    loadingAgents.value = false
  }
}

function applyGenerateResponseMessages(responseWarnings: string[], responseQuestions: string[]) {
  warnings.value = responseWarnings
  clarifyingQuestions.value = responseQuestions
}

async function confirmGenerate() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  if (form.value.agent_id === '') return
  loading.value = true
  try {
    const result = await AiToolApi.generateDraft({
      agent_id: form.value.agent_id,
      requirement: form.value.requirement,
      code_hint: form.value.code_hint,
    })
    applyGenerateResponseMessages(result.warnings, result.clarifying_questions)
    if (result.usage) {
      usageText.value = t('aiTools.generate.usage', {
        total: result.usage.total_tokens,
        prompt: result.usage.prompt_tokens,
        completion: result.usage.completion_tokens,
      })
    }
    if (!result.ok) return
    if (!result.draft) {
      ElNotification.error({ message: t('aiTools.generate.emptyDraft') })
      return
    }
    if (result.warnings.length > 0) {
      ElNotification.warning({ message: result.warnings.join('；') })
    }
    emit('generated', result.draft)
    visible.value = false
  } catch (error) {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiTools.generate.failed') })
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    resetState()
    void nextTick(() => formRef.value?.clearValidate())
    loadGenerateInit().catch((error: unknown) => {
      ElNotification.error({ message: error instanceof Error ? error.message : t('aiTools.generate.initFailed') })
    })
  }
)
</script>

<template>
  <AppDialog
    v-model="visible"
    :width="isMobile ? '94vw' : '720px'"
    height="64vh"
    body-padding="16px 18px 6px"
  >
    <template #header>
      {{ t('aiTools.generate.title') }}
    </template>

    <el-form
      ref="formRef"
      class="tool-generate-form"
      :model="form"
      :rules="rules"
      label-position="top"
      :validate-on-rule-change="false"
    >
      <el-form-item
        :label="t('aiTools.generate.agent')"
        prop="agent_id"
        required
      >
        <el-select-v2
          v-model="form.agent_id"
          :options="agentOptions"
          :loading="loadingAgents"
          :placeholder="t('aiTools.generate.agentPlaceholder')"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item
        :label="t('aiTools.generate.requirement')"
        prop="requirement"
        required
      >
        <el-input
          v-model="form.requirement"
          type="textarea"
          :rows="8"
          resize="vertical"
          :placeholder="t('aiTools.generate.requirementPlaceholder')"
          maxlength="4000"
          show-word-limit
        />
      </el-form-item>

      <el-form-item
        :label="t('aiTools.generate.codeHint')"
        prop="code_hint"
      >
        <el-input
          v-model="form.code_hint"
          clearable
          maxlength="64"
          placeholder="admin_user_count"
        />
      </el-form-item>

      <el-alert
        v-if="warnings.length > 0"
        class="tool-generate-alert"
        type="warning"
        :closable="false"
        show-icon
      >
        <ul class="tool-generate-list">
          <li
            v-for="item in warnings"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </el-alert>

      <el-alert
        v-if="clarifyingQuestions.length > 0"
        class="tool-generate-alert"
        type="info"
        :closable="false"
        show-icon
      >
        <template #title>
          {{ t('aiTools.generate.needMoreInfo') }}
        </template>
        <ul class="tool-generate-list">
          <li
            v-for="item in clarifyingQuestions"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </el-alert>

      <el-text
        v-if="usageText"
        class="tool-generate-usage"
        type="info"
      >
        {{ usageText }}
      </el-text>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.actions.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="confirmGenerate"
      >
        {{ t('aiTools.generate.submit') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.tool-generate-form {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-generate-alert {
  margin-top: 4px;
}

.tool-generate-list {
  margin: 0;
  padding-left: 18px;
}

.tool-generate-usage {
  margin-top: 2px;
}
</style>
