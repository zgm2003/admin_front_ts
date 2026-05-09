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
const selectedModelCount = computed(() => form.model_ids.length)

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
  <AppDialog v-model="visible" :width="isMobile ? '94vw' : '760px'" body-padding="0" class="provider-form-dialog">
    <template #header>
      <div class="provider-form-dialog__header">
        <div>
          <div class="provider-form-dialog__title">{{ title }}</div>
          <div class="provider-form-dialog__subtitle">{{ t('aiProviders.dialog.openaiOnly') }}</div>
        </div>
      </div>
    </template>

    <div class="provider-form-dialog__shell">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" :validate-on-rule-change="false" class="provider-form-dialog__form">
        <section class="provider-form-dialog__section">
          <div class="provider-form-dialog__section-head">
            <h3>{{ t('aiProviders.dialog.basicSection') }}</h3>
            <p>{{ t('aiProviders.dialog.basicHint') }}</p>
          </div>

          <el-row :gutter="16">
            <el-col :md="12" :span="24">
              <el-form-item :label="t('aiProviders.form.name')" prop="name" required>
                <el-input v-model="form.name" clearable :placeholder="t('aiProviders.dialog.namePlaceholder')" />
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
          </el-row>
        </section>

        <section class="provider-form-dialog__section">
          <div class="provider-form-dialog__section-head provider-form-dialog__section-head--inline">
            <h3>{{ t('aiProviders.dialog.modelSection') }}</h3>
            <div class="provider-form-dialog__model-count">
              {{ t('aiProviders.dialog.selectedModels', { count: selectedModelCount }) }}
            </div>
          </div>

          <el-row :gutter="16">
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
                  <el-button type="primary" :loading="modelLoading" class="provider-form-dialog__fetch" @click="fetchModels">
                    {{ t('aiProviders.actions.fetchModels') }}
                  </el-button>
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
          </el-row>

          <div v-if="form.model_ids.length > 0" class="provider-form-dialog__display-grid">
            <div class="provider-form-dialog__display-title">{{ t('aiProviders.dialog.displayNames') }}</div>
            <el-row :gutter="12">
              <el-col v-for="modelID in form.model_ids" :key="modelID" :md="12" :span="24">
                <el-form-item :label="modelID">
                  <el-input v-model="form.model_display_names[modelID]" clearable :placeholder="t('aiProviders.form.modelDisplayName')" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </section>
      </el-form>
    </div>

    <template #footer>
      <div class="provider-form-dialog__footer">
        <div class="provider-form-dialog__footer-note">{{ t('aiProviders.dialog.secretNote') }}</div>
        <div class="provider-form-dialog__footer-actions">
          <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
          <el-button type="primary" class="provider-form-dialog__submit" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<style scoped>
.provider-form-dialog :deep(.el-dialog) {
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.16);
}

.provider-form-dialog :deep(.el-dialog__header) {
  margin: 0;
  padding: 0;
}

.provider-form-dialog :deep(.el-dialog__headerbtn) {
  top: 16px;
  right: 16px;
}

.provider-form-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.provider-form-dialog :deep(.el-dialog__footer) {
  padding: 0;
}

.provider-form-dialog__header {
  display: flex;
  align-items: center;
  min-height: 58px;
  padding: 16px 56px 14px 20px;
  background: #fff;
  border-bottom: 1px solid #ebeef5;
}

.provider-form-dialog__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  color: #1f2937;
}

.provider-form-dialog__subtitle {
  margin-top: 3px;
  font-size: 12px;
  color: #909399;
}

.provider-form-dialog__shell {
  padding: 18px 20px 10px;
  background: #fff;
}

.provider-form-dialog__form {
  display: grid;
  gap: 12px;
}

.provider-form-dialog__section {
  padding: 14px 16px 2px;
  background: #fafcff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
}

.provider-form-dialog__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.provider-form-dialog__section-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.provider-form-dialog__section-head p {
  max-width: 420px;
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #909399;
  text-align: right;
}

.provider-form-dialog__section-head--inline {
  align-items: center;
}

.provider-form-dialog__model-count {
  padding: 4px 8px;
  font-size: 12px;
  color: #409eff;
  background: #ecf5ff;
  border: 1px solid #d9ecff;
  border-radius: 999px;
}

.provider-form-dialog__api-key {
  display: flex;
  width: 100%;
  gap: 8px;
}

.provider-form-dialog__api-key :deep(.el-input) {
  flex: 1 1 auto;
}

.provider-form-dialog__fetch {
  min-width: 100px;
  font-weight: 500;
}

.provider-form-dialog__display-grid {
  padding-top: 2px;
}

.provider-form-dialog__display-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

.provider-form-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #ebeef5;
}

.provider-form-dialog__footer-note {
  font-size: 12px;
  color: #909399;
}

.provider-form-dialog__footer-actions {
  display: flex;
  gap: 10px;
}

.provider-form-dialog__submit {
  min-width: 88px;
  font-weight: 500;
}

.provider-form-dialog :deep(.el-form-item) {
  margin-bottom: 13px;
}

.provider-form-dialog :deep(.el-form-item__label) {
  padding-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  color: #606266;
}

.provider-form-dialog :deep(.el-input__wrapper),
.provider-form-dialog :deep(.el-select__wrapper) {
  min-height: 32px;
  border-radius: 6px;
}

.provider-form-dialog :deep(.el-input__wrapper:hover),
.provider-form-dialog :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
}

@media (max-width: 768px) {
  .provider-form-dialog__header {
    padding: 14px 50px 12px 16px;
  }

  .provider-form-dialog__title {
    font-size: 15px;
  }

  .provider-form-dialog__shell {
    padding: 14px 14px 8px;
  }

  .provider-form-dialog__section {
    padding: 12px 12px 0;
  }

  .provider-form-dialog__section-head,
  .provider-form-dialog__footer,
  .provider-form-dialog__api-key {
    flex-direction: column;
    align-items: stretch;
  }

  .provider-form-dialog__section-head p {
    max-width: none;
    text-align: left;
  }
}
</style>
