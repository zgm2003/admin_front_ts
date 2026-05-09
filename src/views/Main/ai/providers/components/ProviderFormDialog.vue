<script setup lang="ts">
import { computed, nextTick, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  AiEngineConnectionApi,
  type AiEngineConnectionInitResponse,
  type AiEngineConnectionMutationParams,
  type AiModelOptionItem,
} from '@/api/ai/engineConnections'
import { type ProviderFormState, useProviderForm } from '../composables/useProviderForm'

const props = defineProps<{
  modelValue: boolean
  mode: 'add' | 'edit'
  dict: AiEngineConnectionInitResponse['dict']
  initial?: Partial<ProviderFormState>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()

const { t } = useI18n()
const isMobile = useIsMobile()
const { form, rules, modelLoading, modelOptions, reset } = useProviderForm(t)
const formRef = shallowRef<FormInstance | null>(null)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const title = computed(() => (props.mode === 'add' ? t('aiProviders.addTitle') : t('aiProviders.editTitle')))

const selectModelOptions = computed(() => modelOptions.value.map((model) => ({
  label: model.display_name || model.model_id,
  value: model.model_id,
})))

const selectedModelOptions = computed(() => form.model_ids.map((modelID) => ({ label: modelID, value: modelID })))

const defaultModelOptions = computed(() => {
  const remoteOptions = selectModelOptions.value.filter((item) => form.model_ids.includes(item.value))
  if (remoteOptions.length > 0) return remoteOptions
  return selectedModelOptions.value
})

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    reset(props.initial)
    void nextTick(() => formRef.value?.clearValidate())
  }
)

watch(
  () => form.model_ids.slice(),
  (ids) => {
    if (!ids.includes(form.default_model_id)) {
      form.default_model_id = ids[0] ?? ''
    }
  }
)

async function fetchModels() {
  if (!form.api_key.trim()) {
    ElNotification.warning({ message: t('aiProviders.form.apiKeyPlaceholder') })
    return
  }
  modelLoading.value = true
  try {
    const result = await AiEngineConnectionApi.previewModels({ driver: form.driver, base_url: form.base_url, api_key: form.api_key })
    modelOptions.value = result.list
    mergeDisplayNames(result.list)
    const firstModel = result.list[0]
    if (form.model_ids.length === 0 && firstModel) {
      form.model_ids = [firstModel.model_id]
      form.default_model_id = firstModel.model_id
    }
    ElNotification.success({ message: t('aiProviders.fetchModelsDone') })
  } finally {
    modelLoading.value = false
  }
}

function mergeDisplayNames(options: AiModelOptionItem[]) {
  for (const option of options) {
    if (!form.model_display_names[option.model_id]) {
      form.model_display_names[option.model_id] = option.display_name || option.model_id
    }
  }
}

function buildPayload(): AiEngineConnectionMutationParams {
  return {
    id: form.id,
    name: form.name,
    driver: form.driver,
    engine_type: form.driver,
    base_url: form.base_url,
    workspace_id: form.workspace_id || null,
    model_ids: form.model_ids,
    default_model_id: form.default_model_id,
    model_display_names: form.model_display_names,
    status: form.status,
    ...(form.api_key ? { api_key: form.api_key } : {}),
  }
}

async function confirmSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  if (props.mode === 'add' && !form.api_key.trim()) {
    ElNotification.warning({ message: t('aiProviders.form.apiKey') + t('common.required') })
    return
  }
  const api = props.mode === 'add' ? AiEngineConnectionApi.add : AiEngineConnectionApi.edit
  await api(buildPayload())
  ElNotification.success({ message: t('common.success.operation') })
  visible.value = false
  emit('submitted')
}
</script>

<template>
  <AppDialog v-model="visible" :width="isMobile ? '94vw' : '760px'" height="72vh">
    <template #header>{{ title }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiProviders.form.name')" prop="name" required>
            <el-input v-model="form.name" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiProviders.form.driver')" prop="driver" required>
            <el-select-v2 v-model="form.driver" :options="dict.engine_type_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiProviders.form.baseUrl')" prop="base_url">
            <el-input v-model="form.base_url" placeholder="https://api.openai.com/v1" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiProviders.form.apiKey')" prop="api_key" :required="mode === 'add'">
            <div class="provider-form-dialog__api-key">
              <el-input
                v-model="form.api_key"
                type="password"
                show-password
                clearable
                :placeholder="mode === 'edit' ? t('aiProviders.form.apiKeyEditPlaceholder') : t('aiProviders.form.apiKeyPlaceholder')"
              />
              <el-button type="primary" :loading="modelLoading" @click="fetchModels">{{ t('aiProviders.actions.fetchModels') }}</el-button>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiProviders.form.modelIds')" prop="model_ids" required>
            <el-select-v2
              v-model="form.model_ids"
              :options="selectModelOptions"
              multiple
              filterable
              allow-create
              clearable
              style="width: 100%"
              :placeholder="t('aiProviders.form.modelIdsPlaceholder')"
            />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiProviders.form.defaultModel')" prop="default_model_id" required>
            <el-select-v2 v-model="form.default_model_id" :options="defaultModelOptions" filterable style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiProviders.form.status')" prop="status" required>
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiProviders.form.workspaceId')" prop="workspace_id">
            <el-input v-model="form.workspace_id" clearable />
          </el-form-item>
        </el-col>
        <el-col v-for="modelID in form.model_ids" :key="modelID" :md="12" :span="24">
          <el-form-item :label="modelID">
            <el-input v-model="form.model_display_names[modelID]" clearable :placeholder="t('aiProviders.form.modelDisplayName')" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.provider-form-dialog__api-key {
  display: flex;
  width: 100%;
  gap: 8px;
}

.provider-form-dialog__api-key :deep(.el-input) {
  flex: 1 1 auto;
}
</style>
