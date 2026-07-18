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
  type AiKnowledgeDocumentDetail,
  type AiKnowledgeDocumentMutationParams,
  type AiKnowledgeInitResponse,
  type AiKnowledgeSourceType,
} from '@/api/ai/knowledge'

interface DocumentForm {
  id?: number
  title: string
  source_type: AiKnowledgeSourceType
  source_ref: string
  content: string
  status: number
}

interface Props {
  modelValue: boolean
  mode: 'add' | 'edit'
  knowledgeBase: AiKnowledgeBaseItem | null
  row: AiKnowledgeDocumentDetail | null
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
const form = ref<DocumentForm>(defaultForm())

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const title = computed(() => props.mode === 'add' ? t('aiKnowledge.document.add') : t('aiKnowledge.document.edit'))

const rules = computed<FormRules>(() => ({
  title: [{ required: true, message: t('aiKnowledge.document.title') + t('common.required'), trigger: 'blur' }],
  source_type: [{ required: true, message: t('aiKnowledge.document.sourceType') + t('common.required'), trigger: 'change' }],
  content: [{ required: true, message: t('aiKnowledge.document.content') + t('common.required'), trigger: 'blur' }],
  status: [{ required: true, message: t('aiKnowledge.form.status') + t('common.required'), trigger: 'change' }],
}))

function defaultForm(): DocumentForm {
  return {
    title: '',
    source_type: 'text',
    source_ref: '',
    content: '',
    status: CommonEnum.YES,
  }
}

function formFromRow(row: AiKnowledgeDocumentDetail): DocumentForm {
  return {
    id: row.id,
    title: row.title,
    source_type: row.source_type,
    source_ref: row.source_ref,
    content: row.content,
    status: row.status,
  }
}

function mutationPayload(): AiKnowledgeDocumentMutationParams {
  return {
    id: form.value.id,
    knowledge_base_id: props.knowledgeBase?.id,
    title: form.value.title,
    source_type: form.value.source_type,
    source_ref: form.value.source_ref,
    content: form.value.content,
    status: form.value.status,
  }
}

async function submit() {
  if (!formRef.value || !props.knowledgeBase) {
    ElNotification.warning({ message: t('aiKnowledge.document.selectBase') })
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    const api = props.mode === 'add' ? AiKnowledgeApi.createDocument : AiKnowledgeApi.updateDocument
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
    :width="isMobile ? '94vw' : '780px'"
    height="64vh"
  >
    <template #header>
      {{ title }}
    </template>
    <el-alert
      v-if="knowledgeBase"
      type="info"
      :closable="false"
      class="knowledge-document-form__base"
    >
      <template #title>
        {{ t('aiKnowledge.document.currentBase') }}：{{ knowledgeBase.name }}
      </template>
    </el-alert>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      :validate-on-rule-change="false"
    >
      <el-form-item
        :label="t('aiKnowledge.document.title')"
        prop="title"
        required
      >
        <el-input
          v-model="form.title"
          clearable
        />
      </el-form-item>
      <el-form-item
        :label="t('aiKnowledge.document.sourceType')"
        prop="source_type"
        required
      >
        <el-select-v2
          v-model="form.source_type"
          :options="props.dict.source_type_arr"
          class="knowledge-document-form__select"
        />
      </el-form-item>
      <el-form-item
        :label="t('aiKnowledge.document.sourceRef')"
        prop="source_ref"
      >
        <el-input
          v-model="form.source_ref"
          clearable
        />
      </el-form-item>
      <el-form-item
        :label="t('aiKnowledge.document.content')"
        prop="content"
        required
      >
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="12"
        />
      </el-form-item>
      <el-form-item
        :label="t('aiKnowledge.form.status')"
        prop="status"
        required
      >
        <el-select-v2
          v-model="form.status"
          :options="props.dict.common_status_arr"
          class="knowledge-document-form__select"
        />
      </el-form-item>
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
.knowledge-document-form__base {
  margin-bottom: 12px;
}

.knowledge-document-form__select {
  width: 100%;
}
</style>
