<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import {
  AiKnowledgeApi,
  type AiKnowledgeBaseItem,
  type AiKnowledgeBaseMutationParams,
  type AiKnowledgeInitResponse,
} from '@/api/ai/knowledge'

interface BaseForm {
  id?: number
  name: string
  code: string
  description: string
  chunk_size_chars: number
  chunk_overlap_chars: number
  default_top_k: number
  default_min_score: number
  default_max_context_chars: number
  status: number
}

interface Props {
  modelValue: boolean
  mode: 'add' | 'edit'
  row: AiKnowledgeBaseItem | null
  dict: AiKnowledgeInitResponse['dict']
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
const saving = ref(false)
const form = ref<BaseForm>(defaultForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const title = computed(() => props.mode === 'add' ? t('aiKnowledge.addTitle') : t('aiKnowledge.editTitle'))

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('aiKnowledge.form.name') + t('common.required'), trigger: 'blur' }],
  code: [{ required: true, message: t('aiKnowledge.form.code') + t('common.required'), trigger: 'blur' }],
  chunk_size_chars: [{ required: true, type: 'number', min: 300, max: 8000, message: t('aiKnowledge.form.chunkSizeRange'), trigger: 'blur' }],
  default_top_k: [{ required: true, type: 'number', min: 1, max: 20, message: t('aiKnowledge.form.topKRange'), trigger: 'blur' }],
  default_min_score: [{ required: true, type: 'number', min: 0, max: 100, message: t('aiKnowledge.form.minScoreRange'), trigger: 'blur' }],
  default_max_context_chars: [{ required: true, type: 'number', min: 1000, max: 30000, message: t('aiKnowledge.form.contextRange'), trigger: 'blur' }],
  status: [{ required: true, message: t('aiKnowledge.form.status') + t('common.required'), trigger: 'change' }],
}))

function defaultForm(): BaseForm {
  return {
    name: '',
    code: '',
    description: '',
    chunk_size_chars: 1200,
    chunk_overlap_chars: 120,
    default_top_k: 5,
    default_min_score: 0.1,
    default_max_context_chars: 6000,
    status: CommonEnum.YES,
  }
}

function formFromRow(row: AiKnowledgeBaseItem): BaseForm {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    chunk_size_chars: row.chunk_size_chars,
    chunk_overlap_chars: row.chunk_overlap_chars,
    default_top_k: row.default_top_k,
    default_min_score: row.default_min_score,
    default_max_context_chars: row.default_max_context_chars,
    status: row.status,
  }
}

function mutationPayload(): AiKnowledgeBaseMutationParams {
  return {
    id: form.value.id,
    name: form.value.name,
    code: form.value.code,
    description: form.value.description,
    chunk_size_chars: form.value.chunk_size_chars,
    chunk_overlap_chars: form.value.chunk_overlap_chars,
    default_top_k: form.value.default_top_k,
    default_min_score: form.value.default_min_score,
    default_max_context_chars: form.value.default_max_context_chars,
    status: form.value.status,
  }
}

async function submit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  if (form.value.chunk_overlap_chars >= form.value.chunk_size_chars) {
    ElNotification.error({ message: t('aiKnowledge.form.overlapLessThanSize') })
    return
  }
  saving.value = true
  try {
    const api = props.mode === 'add' ? AiKnowledgeApi.create : AiKnowledgeApi.update
    await api(mutationPayload())
    ElNotification.success({ message: t('common.success.operation') })
    visible.value = false
    emit('saved')
  } finally {
    saving.value = false
  }
}

watch(
  () => [props.modelValue, props.row?.id, props.mode] as const,
  ([open]) => {
    if (!open) return
    form.value = props.mode === 'edit' && props.row ? formFromRow(props.row) : defaultForm()
    void nextTick(() => formRef.value?.clearValidate())
  }
)
</script>

<template>
  <AppDialog
    v-model="visible"
    :width="isMobile ? '94vw' : '760px'"
    height="62vh"
  >
    <template #header>
      {{ title }}
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      :validate-on-rule-change="false"
    >
      <el-row :gutter="12">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiKnowledge.form.name')"
            prop="name"
            required
          >
            <el-input
              v-model="form.name"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiKnowledge.form.code')"
            prop="code"
            required
          >
            <el-input
              v-model="form.code"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiKnowledge.form.description')"
            prop="description"
          >
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiKnowledge.form.chunkSize')"
            prop="chunk_size_chars"
            required
          >
            <el-input-number
              v-model="form.chunk_size_chars"
              :min="300"
              :max="8000"
              :step="100"
              controls-position="right"
              class="knowledge-base-form__number"
              :controls="false"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiKnowledge.form.chunkOverlap')"
            prop="chunk_overlap_chars"
          >
            <el-input-number
              v-model="form.chunk_overlap_chars"
              :min="0"
              :max="1000"
              :step="20"
              controls-position="right"
              class="knowledge-base-form__number"
              :controls="false"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="8"
          :span="24"
        >
          <el-form-item
            :label="t('aiKnowledge.form.defaultTopK')"
            prop="default_top_k"
            required
          >
            <el-input-number
              v-model="form.default_top_k"
              :min="1"
              :max="20"
              controls-position="right"
              class="knowledge-base-form__number"
              :controls="false"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="8"
          :span="24"
        >
          <el-form-item
            :label="t('aiKnowledge.form.defaultMinScore')"
            prop="default_min_score"
            required
          >
            <el-input-number
              v-model="form.default_min_score"
              :min="0"
              :max="100"
              :step="0.01"
              controls-position="right"
              class="knowledge-base-form__number"
              :controls="false"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="8"
          :span="24"
        >
          <el-form-item
            :label="t('aiKnowledge.form.defaultContext')"
            prop="default_max_context_chars"
            required
          >
            <el-input-number
              v-model="form.default_max_context_chars"
              :min="1000"
              :max="30000"
              :step="500"
              controls-position="right"
              class="knowledge-base-form__number"
              :controls="false"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiKnowledge.form.status')"
            prop="status"
            required
          >
            <el-select-v2
              v-model="form.status"
              :options="props.dict.common_status_arr"
              class="knowledge-base-form__select"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.actions.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :loading="saving"
        @click="submit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.knowledge-base-form__number,
.knowledge-base-form__select {
  width: 100%;
}
</style>
