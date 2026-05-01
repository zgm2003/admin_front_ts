<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import type { DictOption } from '@/types/common'
import type { KnowledgeDocumentFormState } from '../types'

const visible = defineModel<boolean>({ required: true })
const form = defineModel<KnowledgeDocumentFormState>('form', { required: true })

const props = defineProps<{
  mode: 'add' | 'edit'
  sourceTypeOptions: DictOption<string>[]
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
  <AppDialog v-model="visible" :width="isMobile ? '94vw' : '760px'">
    <template #header>{{ props.mode === 'add' ? t('aiKnowledge.document.add') : t('aiKnowledge.document.edit') }}</template>
    <el-form ref="formRef" :model="form" :rules="props.rules" label-width="auto">
      <el-row :gutter="12">
        <el-col :md="14" :span="24">
          <el-form-item :label="t('aiKnowledge.document.title')" prop="title" required>
            <el-input v-model="form.title" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="10" :span="24">
          <el-form-item :label="t('aiKnowledge.document.sourceType')">
            <el-select-v2 v-model="form.source_type" :options="props.sourceTypeOptions" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiKnowledge.document.content')" prop="content" required>
            <el-input v-model="form.content" type="textarea" :rows="12" />
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
