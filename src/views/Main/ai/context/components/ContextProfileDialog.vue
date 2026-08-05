<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  AiContextPageInit,
  AiContextProfile,
  AiContextProfileCreateBody,
} from '@/api/ai/context'

type ContextModelOption = AiContextPageInit['embedding_model_options'][number]

const props = defineProps<{
  profile: AiContextProfile | null
  embeddingModelOptions: readonly ContextModelOption[]
  memoryModelOptions: readonly ContextModelOption[]
  rerankerModelOptions: readonly ContextModelOption[]
}>()
const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  submit: [body: AiContextProfileCreateBody | { name: string }]
}>()
const { t } = useI18n()

function defaultForm(): AiContextProfileCreateBody {
  return {
    name: '',
    embedding_provider_model_id: 0,
    embedding_dimensions: 1536,
    embedding_max_input_tokens: 8191,
    embedding_token_counter_id: 'utf8_bytes_v1',
    dense_distance: 'cosine',
    dense_min_score: '0.200000',
    memory_provider_model_id: null,
    reranker_provider_model_id: null,
    reranker_min_score: null,
  }
}

const form = reactive<AiContextProfileCreateBody>(defaultForm())
const canSubmit = computed(() => Boolean(form.name.trim())
  && (props.profile !== null || form.embedding_provider_model_id > 0))

watch(visible, (open) => {
  if (!open) return
  Object.assign(form, defaultForm(), { name: props.profile?.name ?? '' })
})

function submit() {
  const name = form.name.trim()
  if (!canSubmit.value) return
  emit('submit', props.profile ? { name } : { ...form, name })
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="profile ? t('aiContext.profile.rename') : t('aiContext.profile.create')"
    width="560px"
  >
    <el-form label-position="top">
      <el-form-item
        :label="t('aiContext.fields.name')"
        required
      >
        <el-input
          v-model="form.name"
          data-test="context-profile-name"
          maxlength="100"
        />
      </el-form-item>
      <template v-if="!profile">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.embeddingModel')"
              required
            >
              <el-select
                v-model="form.embedding_provider_model_id"
                class="profile-field"
                data-test="embedding-model-select"
                filterable
              >
                <el-option
                  v-for="option in embeddingModelOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.dimensions')"
              required
            >
              <el-input-number
                v-model="form.embedding_dimensions"
                class="profile-field"
                :min="1"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.maxInputTokens')"
              required
            >
              <el-input-number
                v-model="form.embedding_max_input_tokens"
                class="profile-field"
                :min="1"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.tokenCounter')"
              required
            >
              <el-input
                v-model="form.embedding_token_counter_id"
                class="profile-field"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.distance')"
              required
            >
              <el-select
                v-model="form.dense_distance"
                class="profile-field"
              >
                <el-option
                  label="Cosine"
                  value="cosine"
                /><el-option
                  label="Dot"
                  value="dot"
                /><el-option
                  label="Euclid"
                  value="euclid"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.minScore')"
              required
            >
              <el-input
                v-model="form.dense_min_score"
                class="profile-field"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item :label="t('aiContext.profile.memoryModel')">
              <el-select
                v-model="form.memory_provider_model_id"
                class="profile-field"
                data-test="memory-model-select"
                :clearable="true"
                filterable
              >
                <el-option
                  v-for="option in memoryModelOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="t('aiContext.profile.rerankerModel')">
              <el-select
                v-model="form.reranker_provider_model_id"
                class="profile-field"
                data-test="reranker-model-select"
                :clearable="true"
                filterable
              >
                <el-option
                  v-for="option in rerankerModelOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.actions.cancel') }}
      </el-button>
      <el-button
        type="primary"
        data-test="context-profile-submit"
        :disabled="!canSubmit"
        @click="submit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.profile-field { width: 100%; }
</style>
