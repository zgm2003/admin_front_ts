<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import {
  MailApi,
  type MailCommonStatus,
  type MailPageInitResponse,
  type MailTemplateFormState,
  type MailTemplateItem,
  type MailTemplatePayload,
  type MailTemplateSampleVariableRow,
  type MailTemplateScene,
} from '@/api/system/mail'

const { t } = useI18n()
const userStore = useUserStore()
const loading = shallowRef(false)
const submitting = shallowRef(false)
const dialogVisible = shallowRef(false)
const dialogMode = shallowRef<'create' | 'edit'>('create')
const formRef = ref<FormInstance | null>(null)
const templates = ref<MailTemplateItem[]>([])
const dict = ref<MailPageInitResponse['dict']>({
  common_status_arr: [],
  mail_scene_arr: [],
  mail_log_scene_arr: [],
  mail_log_status_arr: [],
  default_region: 'ap-guangzhou',
  default_endpoint: 'ses.tencentcloudapi.com',
})

const form = reactive<MailTemplateFormState>({
  id: null,
  scene: '',
  name: '',
  subject: '',
  tencent_template_id: null,
  variables_text: '',
  sample_variables: [],
  status: CommonEnum.YES,
})

const rules = computed<FormRules<MailTemplateFormState>>(() => ({
  scene: [{ required: true, message: t('mail.template.rules.scene'), trigger: 'change' }],
  name: [{ required: true, message: t('mail.template.rules.name'), trigger: 'blur' }],
  subject: [{ required: true, message: t('mail.template.rules.subject'), trigger: 'blur' }],
  tencent_template_id: [{ required: true, message: t('mail.template.rules.tencentTemplateId'), trigger: 'blur' }],
  variables_text: [{ required: true, message: t('mail.template.rules.variables'), trigger: 'blur' }],
  status: [{ required: true, message: t('mail.template.rules.status'), trigger: 'change' }],
}))

const dialogTitle = computed(() => dialogMode.value === 'create' ? t('mail.template.createTitle') : t('mail.template.editTitle'))
const columns = computed(() => [
  { key: 'id', label: 'ID', width: 90 },
  { key: 'scene', label: t('mail.template.scene'), minWidth: 150 },
  { key: 'name', label: t('mail.template.name'), minWidth: 160 },
  { key: 'subject', label: t('mail.template.subject'), minWidth: 200 },
  { key: 'tencent_template_id', label: t('mail.template.tencentTemplateId'), width: 180 },
  { key: 'variables', label: t('mail.template.variables'), minWidth: 220, overflowTooltip: false },
  { key: 'status', label: t('mail.template.status'), width: 110 },
  { key: 'updated_at', label: t('mail.common.updatedAt'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 260, fixed: 'right', overflowTooltip: false },
])

function statusLabel(status: MailCommonStatus) {
  return dict.value.common_status_arr.find((item) => item.value === status)?.label || String(status)
}

function sceneLabel(scene: MailTemplateScene) {
  return dict.value.mail_scene_arr.find((item) => item.value === scene)?.label || scene
}

function resetForm() {
  form.id = null
  form.scene = ''
  form.name = ''
  form.subject = ''
  form.tencent_template_id = null
  form.variables_text = ''
  form.sample_variables = []
  form.status = CommonEnum.YES
}

async function load() {
  loading.value = true
  try {
    const [initData, listData] = await Promise.all([MailApi.pageInit(), MailApi.templates()])
    dict.value = initData.dict
    templates.value = listData.list
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
  requestAnimationFrame(() => formRef.value?.clearValidate())
}

function openEdit(row: MailTemplateItem) {
  dialogMode.value = 'edit'
  form.id = row.id
  form.scene = row.scene
  form.name = row.name
  form.subject = row.subject
  form.tencent_template_id = row.tencent_template_id
  form.variables_text = row.variables.join('\n')
  form.sample_variables = toSampleRows(row.variables, row.sample_variables)
  form.status = row.status
  dialogVisible.value = true
  requestAnimationFrame(() => formRef.value?.clearValidate())
}

function normalizeVariables(value: string): string[] {
  const variables = value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
  return Array.from(new Set(variables)).sort()
}

function toSampleRows(variables: string[], sampleVariables: Record<string, string>): MailTemplateSampleVariableRow[] {
  const rows: MailTemplateSampleVariableRow[] = []
  const seen = new Set<string>()

  for (const key of variables) {
    rows.push({ key, value: sampleVariables[key] ?? '' })
    seen.add(key)
  }
  for (const [key, value] of Object.entries(sampleVariables).sort(([left], [right]) => left.localeCompare(right))) {
    if (!seen.has(key)) {
      rows.push({ key, value })
    }
  }
  return rows
}

function addSampleVariable() {
  form.sample_variables.push({ key: '', value: '' })
}

function removeSampleVariable(index: number) {
  form.sample_variables.splice(index, 1)
}

function fillMissingSampleVariables() {
  const variables = normalizeVariables(form.variables_text)
  const existingKeys = new Set(form.sample_variables.map((row) => row.key.trim()).filter((key) => key.length > 0))

  for (const key of variables) {
    if (!existingKeys.has(key)) {
      form.sample_variables.push({ key, value: '' })
      existingKeys.add(key)
    }
  }
}

function buildSampleVariables(rows: MailTemplateSampleVariableRow[]): Record<string, string> {
  if (rows.length === 0) {
    throw new Error(t('mail.template.rules.sampleVariables'))
  }

  const values: Record<string, string> = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (!key) {
      throw new Error(t('mail.template.rules.sampleVariableKey'))
    }
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      throw new Error(t('mail.template.rules.sampleVariableDuplicate', { name: key }))
    }
    values[key] = row.value
  }

  return values
}

function buildPayload(): MailTemplatePayload {
  if (!form.scene) {
    throw new Error(t('mail.template.rules.scene'))
  }
  if (!form.tencent_template_id || !Number.isInteger(form.tencent_template_id) || form.tencent_template_id <= 0) {
    throw new Error(t('mail.template.rules.tencentTemplateId'))
  }
  const variables = normalizeVariables(form.variables_text)
  if (variables.length === 0) {
    throw new Error(t('mail.template.rules.variables'))
  }
  const sampleVariables = buildSampleVariables(form.sample_variables)
  const missing = variables.filter((key) => !(key in sampleVariables))
  if (missing.length > 0) {
    throw new Error(t('mail.template.rules.sampleMissing', { name: missing.join(', ') }))
  }
  return {
    scene: form.scene,
    name: form.name.trim(),
    subject: form.subject.trim(),
    tencent_template_id: form.tencent_template_id,
    variables,
    sample_variables: sampleVariables,
    status: form.status,
  }
}

async function submit() {
  if (!formRef.value) {
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  let payload: MailTemplatePayload
  try {
    payload = buildPayload()
  } catch (error) {
    ElNotification.error({ message: error instanceof Error ? error.message : t('common.fail.operation') })
    return
  }

  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await MailApi.addTemplate(payload)
    } else if (form.id !== null) {
      await MailApi.editTemplate(form.id, payload)
    }
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

async function changeStatus(row: MailTemplateItem, status: MailCommonStatus) {
  await MailApi.changeTemplateStatus(row.id, status)
  ElNotification.success({ message: t('common.success.operation') })
  await load()
}

async function deleteTemplate(row: MailTemplateItem) {
  await ElMessageBox.confirm(t('mail.template.deleteConfirm'), t('common.confirmTitle'), { type: 'warning' })
  await MailApi.deleteTemplate(row.id)
  ElNotification.success({ message: t('common.success.operation') })
  await load()
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mail-template">
    <AppTable
      :columns="columns"
      :data="templates"
      :loading="loading"
      row-key="id"
      :fixed-footer="false"
      @refresh="load"
    >
      <template #toolbar-left>
        <el-button v-if="userStore.can('system_mail_templateAdd')" type="success" @click="openCreate">
          {{ t('common.actions.add') }}
        </el-button>
      </template>

      <template #cell-scene="{ row }">
        {{ sceneLabel(row.scene) }}
      </template>

      <template #cell-variables="{ row }">
        <el-space wrap class="mail-template__variables">
          <el-tag v-for="item in row.variables" :key="item" size="small">{{ item }}</el-tag>
        </el-space>
      </template>

      <template #cell-status="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
          {{ statusLabel(row.status) }}
        </el-tag>
      </template>

      <template #cell-actions="{ row }">
        <el-button v-if="userStore.can('system_mail_templateEdit')" type="primary" text @click="openEdit(row)">
          {{ t('common.actions.edit') }}
        </el-button>
        <el-button v-if="row.status === CommonEnum.NO && userStore.can('system_mail_templateStatus')" type="warning" text @click="changeStatus(row, CommonEnum.YES)">
          {{ t('common.actions.enable') }}
        </el-button>
        <el-button v-if="row.status === CommonEnum.YES && userStore.can('system_mail_templateStatus')" type="warning" text @click="changeStatus(row, CommonEnum.NO)">
          {{ t('common.actions.disable') }}
        </el-button>
        <el-button v-if="userStore.can('system_mail_templateDel')" type="danger" text @click="deleteTemplate(row)">
          {{ t('common.actions.del') }}
        </el-button>
      </template>
    </AppTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="160px">
        <el-form-item :label="t('mail.template.scene')" prop="scene">
          <el-select v-model="form.scene" class="mail-template__select" :disabled="dialogMode === 'edit'">
            <el-option v-for="item in dict.mail_scene_arr" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('mail.template.name')" prop="name">
          <el-input v-model="form.name" clearable />
        </el-form-item>
        <el-form-item :label="t('mail.template.subject')" prop="subject">
          <el-input v-model="form.subject" clearable />
        </el-form-item>
        <el-form-item :label="t('mail.template.tencentTemplateId')" prop="tencent_template_id">
          <el-input-number v-model="form.tencent_template_id" :min="1" :precision="0" class="mail-template__number" />
        </el-form-item>
        <el-form-item :label="t('mail.template.variables')" prop="variables_text">
          <el-input v-model="form.variables_text" type="textarea" :rows="4" :placeholder="t('mail.template.variablesPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('mail.template.sampleVariables')">
          <div class="mail-template__samples">
            <div v-for="(row, index) in form.sample_variables" :key="index" class="mail-template__sample-row">
              <el-input v-model="row.key" :placeholder="t('mail.template.sampleVariableKey')" />
              <el-input v-model="row.value" :placeholder="t('mail.template.sampleVariableValue')" />
              <el-button type="danger" text @click="removeSampleVariable(index)">
                {{ t('common.actions.del') }}
              </el-button>
            </div>
            <div class="mail-template__sample-actions">
              <el-button @click="fillMissingSampleVariables">{{ t('mail.template.fillSampleVariables') }}</el-button>
              <el-button type="primary" plain @click="addSampleVariable">{{ t('mail.template.addSampleVariable') }}</el-button>
            </div>
            <div class="mail-template__sample-tip">{{ t('mail.template.sampleVariablesTip') }}</div>
          </div>
        </el-form-item>
        <el-form-item :label="t('mail.template.status')" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio v-for="item in dict.common_status_arr" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">{{ t('common.actions.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.mail-template__variables {
  width: 100%;
  justify-content: center;
}

.mail-template__select,
.mail-template__number {
  width: 100%;
}

.mail-template__samples {
  width: 100%;
}

.mail-template__sample-row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(220px, 2fr) auto;
  gap: 8px;
  margin-bottom: 8px;
}

.mail-template__sample-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.mail-template__sample-tip {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
