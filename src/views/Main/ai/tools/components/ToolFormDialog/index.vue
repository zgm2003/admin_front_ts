<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import {
  AiToolApi,
  type AiToolInitResponse,
  type AiToolItem,
  type AiToolMutationParams,
  type AiToolRiskLevel,
  type JsonObject,
} from '@/api/ai/tools'

interface ToolForm {
  id?: number
  name: string
  code: string
  description: string
  parameters_text: string
  result_schema_text: string
  risk_level: AiToolRiskLevel
  timeout_ms: number
  status: number
}

interface Props {
  modelValue: boolean
  mode: 'add' | 'edit'
  row: AiToolItem | null
  dict: AiToolInitResponse['dict']
}

interface Emits {
  'update:modelValue': [value: boolean]
  saved: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()
const isMobile = useIsMobile()
const formRef = ref<FormInstance | null>(null)
const form = ref<ToolForm>(defaultForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const title = computed(() => props.mode === 'add' ? t('aiTools.addTitle') : t('aiTools.editTitle'))

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiTools.form.name') + t('common.required'), trigger: 'blur' }],
  code: [{ required: true, message: t('aiTools.form.code') + t('common.required'), trigger: 'blur' }],
  parameters_text: [{ required: true, message: t('aiTools.form.parametersJson') + t('common.required'), trigger: 'blur' }],
  result_schema_text: [{ required: true, message: t('aiTools.form.resultSchemaJson') + t('common.required'), trigger: 'blur' }],
  risk_level: [{ required: true, message: t('aiTools.form.riskLevel') + t('common.required'), trigger: 'change' }],
  timeout_ms: [{ required: true, type: 'number', min: 100, max: 30000, message: t('aiTools.form.timeoutRange'), trigger: 'blur' }],
  status: [{ required: true, message: t('aiTools.form.status') + t('common.required'), trigger: 'change' }],
}))

function defaultForm(): ToolForm {
  return {
    name: '',
    code: '',
    description: '',
    parameters_text: '',
    result_schema_text: '',
    risk_level: 'low',
    timeout_ms: 3000,
    status: CommonEnum.YES,
  }
}

function jsonText(value: JsonObject): string {
  return JSON.stringify(value, null, 2)
}

function parseJSONObject(text: string, label: string): JsonObject {
  const parsed: unknown = JSON.parse(text)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label}${t('aiTools.form.invalidJson')}`)
  }
  return parsed as JsonObject
}

function resetForm() {
  if (props.mode === 'edit' && props.row) {
    form.value = {
      id: props.row.id,
      name: props.row.name,
      code: props.row.code,
      description: props.row.description,
      parameters_text: jsonText(props.row.parameters_json),
      result_schema_text: jsonText(props.row.result_schema_json),
      risk_level: props.row.risk_level,
      timeout_ms: props.row.timeout_ms,
      status: props.row.status,
    }
    return
  }
  form.value = defaultForm()
}

async function confirmSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  let parameters: JsonObject
  let resultSchema: JsonObject
  try {
    parameters = parseJSONObject(form.value.parameters_text, t('aiTools.form.parametersJson'))
    resultSchema = parseJSONObject(form.value.result_schema_text, t('aiTools.form.resultSchemaJson'))
  } catch (error) {
    ElNotification.error({ message: error instanceof Error ? error.message : t('aiTools.form.invalidJson') })
    return
  }
  const payload: AiToolMutationParams = {
    id: form.value.id,
    name: form.value.name,
    code: form.value.code,
    description: form.value.description,
    parameters_json: parameters,
    result_schema_json: resultSchema,
    risk_level: form.value.risk_level,
    timeout_ms: form.value.timeout_ms,
    status: form.value.status,
  }
  const api = props.mode === 'add' ? AiToolApi.add : AiToolApi.edit
  await api(payload)
  ElNotification.success({ message: t('common.success.operation') })
  visible.value = false
  emit('saved')
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    resetForm()
    void nextTick(() => formRef.value?.clearValidate())
  }
)
</script>

<template>
  <AppDialog v-model="visible" :width="isMobile ? '94vw' : '900px'" height="76vh" body-padding="16px 18px 6px">
    <template #header>{{ title }}</template>
    <el-form
      ref="formRef"
      class="tool-form"
      :model="form"
      :rules="rules"
      label-position="top"
      :validate-on-rule-change="false"
    >
      <section class="tool-form-section">
        <div class="tool-form-section__title">{{ t('aiTools.form.basicInfo') }}</div>
        <el-row :gutter="14">
          <el-col :md="9" :span="24">
            <el-form-item :label="t('aiTools.form.name')" prop="name" required>
              <el-input v-model="form.name" clearable />
            </el-form-item>
          </el-col>
          <el-col :md="9" :span="24">
            <el-form-item :label="t('aiTools.form.code')" prop="code" required>
              <el-input v-model="form.code" placeholder="admin_user_count" clearable />
            </el-form-item>
          </el-col>
          <el-col :md="6" :span="24">
            <el-form-item :label="t('aiTools.form.status')" prop="status" required>
              <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="t('aiTools.form.description')">
              <el-input v-model="form.description" type="textarea" :rows="2" resize="none" />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="tool-form-section">
        <div class="tool-form-section__title">{{ t('aiTools.form.runtimeConfig') }}</div>
        <el-row :gutter="14">
          <el-col :md="12" :span="24">
            <el-form-item :label="t('aiTools.form.riskLevel')" prop="risk_level" required>
              <el-select-v2 v-model="form.risk_level" :options="dict.risk_level_arr" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :span="24">
            <el-form-item :label="t('aiTools.form.timeout')" prop="timeout_ms" required>
              <el-input-number v-model="form.timeout_ms" :min="100" :max="30000" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </section>

      <section class="tool-form-section">
        <div class="tool-form-section__title">{{ t('aiTools.form.schemaConfig') }}</div>
        <el-row :gutter="14">
          <el-col :md="12" :span="24">
            <el-form-item :label="t('aiTools.form.parametersJson')" prop="parameters_text" required>
              <el-input v-model="form.parameters_text" class="json-input" type="textarea" :rows="10" resize="vertical" spellcheck="false" />
            </el-form-item>
          </el-col>
          <el-col :md="12" :span="24">
            <el-form-item :label="t('aiTools.form.resultSchemaJson')" prop="result_schema_text" required>
              <el-input v-model="form.result_schema_text" class="json-input" type="textarea" :rows="10" resize="vertical" spellcheck="false" />
            </el-form-item>
          </el-col>
        </el-row>
      </section>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.tool-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tool-form-section {
  padding: 14px 14px 2px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-fill-color-blank);
}

.tool-form-section__title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.json-input :deep(.el-textarea__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 12px;
  line-height: 1.55;
}
</style>
