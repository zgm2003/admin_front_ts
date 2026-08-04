<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AiContextProfile, AiContextProfileCreateBody } from '@/api/ai/context'

const props = defineProps<{ profile: AiContextProfile | null }>()
const visible = defineModel<boolean>({ required: true })
const emit = defineEmits<{
  submit: [body: AiContextProfileCreateBody | { name: string }]
}>()
const { t } = useI18n()

const form = reactive<AiContextProfileCreateBody>({
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
})

watch(visible, (open) => {
  if (!open) return
  form.name = props.profile?.name ?? ''
})

function submit() {
  const name = form.name.trim()
  if (!name) return
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
          maxlength="100"
        />
      </el-form-item>
      <template v-if="!profile">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.embeddingModelID')"
              required
            >
              <el-input-number
                v-model="form.embedding_provider_model_id"
                :min="1"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.dimensions')"
              required
            >
              <el-input-number
                v-model="form.embedding_dimensions"
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
              <el-input v-model="form.embedding_token_counter_id" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item
              :label="t('aiContext.profile.distance')"
              required
            >
              <el-select v-model="form.dense_distance">
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
              <el-input v-model="form.dense_min_score" />
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
        :disabled="!form.name.trim()"
        @click="submit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
:deep(.el-input-number), :deep(.el-select) { width: 100%; }
</style>
