<script setup lang="ts">
import { computed, nextTick, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import {
  AiProviderApi,
  type AiProviderInitResponse,
} from '@/api/ai/providers'
import {
  buildProviderMutationParams,
  mergeProviderModelCandidates,
  type ProviderFormState,
  useProviderForm,
} from '../composables/useProviderForm'
import ProviderModelEditor from './ProviderModelEditor.vue'

const props = defineProps<{
  modelValue: boolean
  mode: 'add' | 'edit'
  dict: AiProviderInitResponse['dict']
  initial?: Partial<ProviderFormState>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submitted: []
}>()

const { t } = useI18n()
const isMobile = useIsMobile()
const { form, rules, modelLoading, reset } = useProviderForm(t)
const formRef = shallowRef<FormInstance | null>(null)

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const title = computed(() => (props.mode === 'add' ? t('aiProviders.addTitle') : t('aiProviders.editTitle')))
const selectedModelCount = computed(() => form.models.length)

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return
    reset(props.initial)
    void nextTick(() => formRef.value?.clearValidate())
  }
)

async function fetchModels() {
  if (props.mode === 'add' && !form.api_key.trim()) {
    ElNotification.warning({ message: t('aiProviders.form.apiKeyPlaceholder') })
    return
  }
  modelLoading.value = true
  try {
    const result = props.mode === 'edit' && !form.api_key.trim() && form.id
      ? await AiProviderApi.previewStoredModels({ id: form.id })
      : await AiProviderApi.previewModels({ engine_type: form.driver, base_url: form.base_url, api_key: form.api_key })
    form.models = mergeProviderModelCandidates(form.models, result.list)
    ElNotification.success({ message: t('aiProviders.fetchModelsDone') })
  } finally {
    modelLoading.value = false
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
  const api = props.mode === 'add' ? AiProviderApi.create : AiProviderApi.update
  await api(buildProviderMutationParams(form))
  ElNotification.success({ message: t('common.success.operation') })
  visible.value = false
  emit('submitted')
}
</script>

<template>
  <AppDialog
    v-model="visible"
    width="min(1040px, 94vw)"
    :height="isMobile ? 'calc(88vh - 118px)' : 'calc(min(82vh, 720px) - 118px)'"
    body-padding="0"
    header-padding="0"
    footer-padding="0"
    class="provider-form-dialog"
  >
    <template #header>
      <div class="provider-form-dialog__header">
        <div>
          <div class="provider-form-dialog__title">
            {{ title }}
          </div>
          <div class="provider-form-dialog__subtitle">
            {{ t('aiProviders.dialog.openaiOnly') }}
          </div>
        </div>
      </div>
    </template>

    <div class="provider-form-dialog__shell">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        :validate-on-rule-change="false"
        class="provider-form-dialog__form"
      >
        <section class="provider-form-dialog__section">
          <div class="provider-form-dialog__section-head">
            <h3>{{ t('aiProviders.dialog.basicSection') }}</h3>
            <p>{{ t('aiProviders.dialog.basicHint') }}</p>
          </div>

          <el-row :gutter="16">
            <el-col
              :md="12"
              :span="24"
            >
              <el-form-item
                :label="t('aiProviders.form.name')"
                prop="name"
                required
              >
                <el-input
                  v-model="form.name"
                  clearable
                  :placeholder="t('aiProviders.dialog.namePlaceholder')"
                />
              </el-form-item>
            </el-col>
            <el-col
              :md="12"
              :span="24"
            >
              <el-form-item
                :label="t('aiProviders.form.apiProtocol')"
                prop="api_protocol"
                required
              >
                <el-segmented
                  v-model="form.api_protocol"
                  :options="dict.api_protocol_arr"
                  block
                />
                <div class="provider-form-dialog__field-hint">
                  {{ t('aiProviders.form.apiProtocolHint') }}
                </div>
              </el-form-item>
            </el-col>
            <el-col
              :md="12"
              :span="24"
            >
              <el-form-item
                :label="t('aiProviders.form.driver')"
                prop="driver"
                required
              >
                <el-select-v2
                  v-model="form.driver"
                  :options="dict.engine_type_arr"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item
                :label="t('aiProviders.form.baseUrl')"
                prop="base_url"
              >
                <el-input
                  v-model="form.base_url"
                  placeholder="https://api.openai.com/v1"
                  clearable
                />
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
              <el-form-item
                :label="t('aiProviders.form.apiKey')"
                prop="api_key"
                :required="mode === 'add'"
              >
                <div class="provider-form-dialog__api-key">
                  <el-input
                    v-model="form.api_key"
                    class="provider-form-dialog__api-key-input"
                    type="password"
                    show-password
                    clearable
                    :placeholder="mode === 'edit' ? t('aiProviders.form.apiKeyEditPlaceholder') : t('aiProviders.form.apiKeyPlaceholder')"
                  />
                  <el-button
                    type="primary"
                    :loading="modelLoading"
                    class="provider-form-dialog__fetch"
                    @click="fetchModels"
                  >
                    {{ t('aiProviders.actions.fetchModels') }}
                  </el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item
                :label="t('aiProviders.form.models')"
                prop="models"
                required
              >
                <ProviderModelEditor v-model="form.models" />
              </el-form-item>
            </el-col>
            <el-col
              :md="12"
              :span="24"
            >
              <el-form-item
                :label="t('aiProviders.form.status')"
                prop="status"
                required
              >
                <el-select-v2
                  v-model="form.status"
                  :options="dict.common_status_arr"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

        </section>
      </el-form>
    </div>

    <template #footer>
      <div class="provider-form-dialog__footer">
        <div class="provider-form-dialog__footer-note">
          {{ t('aiProviders.dialog.secretNote') }}
        </div>
        <div class="provider-form-dialog__footer-actions">
          <el-button @click="visible = false">
            {{ t('common.actions.cancel') }}
          </el-button>
          <el-button
            type="primary"
            class="provider-form-dialog__submit"
            @click="confirmSubmit"
          >
            {{ t('common.actions.confirm') }}
          </el-button>
        </div>
      </div>
    </template>
  </AppDialog>
</template>

<style scoped src="./ProviderFormDialog.styles.css"></style>
