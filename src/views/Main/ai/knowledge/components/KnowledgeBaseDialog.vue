<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import type { AiKnowledgeInitResponse } from '@/api/ai/knowledge'
import type { KnowledgeBaseFormState } from '../types'

const visible = defineModel<boolean>({ required: true })
const form = defineModel<KnowledgeBaseFormState>('form', { required: true })

const props = defineProps<{
  mode: 'add' | 'edit'
  dict: AiKnowledgeInitResponse['dict']
  rules: FormRules
}>()

const emit = defineEmits<{
  (e: 'submit'): void
}>()

const { t } = useI18n()
const isMobile = useIsMobile()
const formRef = ref<FormInstance | null>(null)

function clearValidate() {
  formRef.value?.clearValidate()
}

function validate() {
  return formRef.value?.validate()
}

defineExpose({ clearValidate, validate })
</script>

<template>
  <AppDialog v-model="visible" :width="isMobile ? '94vw' : '720px'">
    <template #header>{{ props.mode === 'add' ? t('aiKnowledge.addTitle') : t('aiKnowledge.editTitle') }}</template>
    <el-form ref="formRef" :model="form" :rules="props.rules" label-width="auto">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.name')" prop="name" required>
            <el-input v-model="form.name" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.visibility')" prop="visibility" required>
            <el-select-v2 v-model="form.visibility" :options="props.dict.ai_knowledge_visibility_arr" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.chunkSize')" prop="chunk_size" required>
            <el-input-number v-model="form.chunk_size" :min="100" :max="4000" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.chunkOverlap')" prop="chunk_overlap" required>
            <el-input-number v-model="form.chunk_overlap" :min="0" :max="1000" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.topK')">
            <el-input-number v-model="form.top_k" :min="1" :max="20" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.scoreThreshold')">
            <el-input-number v-model="form.score_threshold" :min="0" :max="100" :step="0.5" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiKnowledge.form.status')">
            <el-select-v2 v-model="form.status" :options="props.dict.common_status_arr" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiKnowledge.form.description')">
            <el-input v-model="form.description" type="textarea" :rows="2" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="emit('submit')">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>
</template>
