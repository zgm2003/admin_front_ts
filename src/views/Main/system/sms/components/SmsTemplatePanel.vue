<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import {
  SmsApi,
  type SmsCommonStatus,
  type SmsTemplateFormState,
  type SmsTemplateItem,
  type SmsTemplatePayload,
  type SmsTemplateSampleVariableRow,
  type SmsTemplateScene,
} from '@/api/system/sms'
import { createDefaultSmsDict, normalizeSmsDict } from '../smsDict'

const { t } = useI18n()
const userStore = useUserStore()
const loading = shallowRef(false)
const submitting = shallowRef(false)
const dialogVisible = shallowRef(false)
const dialogMode = shallowRef<'create' | 'edit'>('create')
const formRef = ref<FormInstance | null>(null)
const templates = ref<SmsTemplateItem[]>([])
const dict = ref(createDefaultSmsDict())
const verifyCodeTemplateVariables = ['code', 'ttl_minutes']
const verifyCodeSampleVariables: Record<string, string> = { code: '123456', ttl_minutes: '5' }

const form = reactive<SmsTemplateFormState>({
  id: null,
  scene: '',
  name: '',
  tencent_template_id: '',
  variables_text: '',
  sample_variables: [],
  status: CommonEnum.YES,
})

const rules = computed<FormRules<SmsTemplateFormState>>(() => ({
  scene: [{ required: true, message: t('sms.template.rules.scene'), trigger: 'change' }],
  name: [{ required: true, message: t('sms.template.rules.name'), trigger: 'blur' }],
  tencent_template_id: [{ required: true, message: t('sms.template.rules.tencentTemplateId'), trigger: 'blur' }],
  variables_text: [{ required: true, message: t('sms.template.rules.variables'), trigger: 'blur' }],
  status: [{ required: true, message: t('sms.template.rules.status'), trigger: 'change' }],
}))

const dialogTitle = computed(() => dialogMode.value === 'create' ? t('sms.template.createTitle') : t('sms.template.editTitle'))
const templatePage = computed(() => ({
  current_page: 1,
  page_size: 20,
  total: templates.value.length,
}))
const columns = computed(() => [
  { key: 'id', label: 'ID', width: 90 },
  { key: 'scene', label: t('sms.template.scene'), minWidth: 150 },
  { key: 'name', label: t('sms.template.name'), minWidth: 160 },
  { key: 'tencent_template_id', label: t('sms.template.tencentTemplateId'), width: 180 },
  { key: 'variables', label: t('sms.template.variables'), minWidth: 220, overflowTooltip: false },
  { key: 'status', label: t('sms.template.status'), width: 110 },
  { key: 'updated_at', label: t('sms.common.updatedAt'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 260, fixed: 'right', overflowTooltip: false },
])

function statusLabel(status: SmsCommonStatus) {
  return dict.value.common_status_arr.find((item) => item.value === status)?.label || String(status)
}

function sceneLabel(scene: SmsTemplateScene) {
  return dict.value.sms_scene_arr.find((item) => item.value === scene)?.label || scene
}

function resetForm() {
  form.id = null
  form.scene = ''
  form.name = ''
  form.tencent_template_id = ''
  form.variables_text = ''
  form.sample_variables = []
  form.status = CommonEnum.YES
}

async function load() {
  loading.value = true
  try {
    const [initData, listData] = await Promise.all([SmsApi.pageInit(), SmsApi.templates()])
    dict.value = normalizeSmsDict(initData.dict)
    templates.value = listData.list
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialogMode.value = 'create'
  resetForm()
  form.variables_text = verifyCodeTemplateVariables.join('\n')
  form.sample_variables = toSampleRows(verifyCodeTemplateVariables, verifyCodeSampleVariables)
  dialogVisible.value = true
  requestAnimationFrame(() => formRef.value?.clearValidate())
}

function openEdit(row: SmsTemplateItem) {
  dialogMode.value = 'edit'
  form.id = row.id
  form.scene = row.scene
  form.name = row.name
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

function toSampleRows(variables: string[], sampleVariables: Record<string, string>): SmsTemplateSampleVariableRow[] {
  const rows: SmsTemplateSampleVariableRow[] = []
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

function buildSampleVariables(rows: SmsTemplateSampleVariableRow[]): Record<string, string> {
  if (rows.length === 0) {
    throw new Error(t('sms.template.rules.sampleVariables'))
  }

  const values: Record<string, string> = {}
  for (const row of rows) {
    const key = row.key.trim()
    if (!key) {
      throw new Error(t('sms.template.rules.sampleVariableKey'))
    }
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      throw new Error(t('sms.template.rules.sampleVariableDuplicate', { name: key }))
    }
    values[key] = row.value
  }

  return values
}

function buildPayload(): SmsTemplatePayload {
  if (!form.scene) {
    throw new Error(t('sms.template.rules.scene'))
  }
  const templateID = form.tencent_template_id.trim()
  if (!templateID || !/^\d+$/.test(templateID)) {
    throw new Error(t('sms.template.rules.tencentTemplateId'))
  }
  const variables = normalizeVariables(form.variables_text)
  if (variables.length === 0) {
    throw new Error(t('sms.template.rules.variables'))
  }
  if (variables.length !== 2 || variables[0] !== 'code' || variables[1] !== 'ttl_minutes') {
    throw new Error(t('sms.template.rules.verifyCodeVariables'))
  }
  const sampleVariables = buildSampleVariables(form.sample_variables)
  const sampleKeys = Object.keys(sampleVariables).sort()
  if (sampleKeys.length !== 2 || sampleKeys[0] !== 'code' || sampleKeys[1] !== 'ttl_minutes') {
    throw new Error(t('sms.template.rules.verifyCodeSampleVariables'))
  }
  const missing = variables.filter((key) => !(key in sampleVariables))
  if (missing.length > 0) {
    throw new Error(t('sms.template.rules.sampleMissing', { name: missing.join(', ') }))
  }
  return {
    scene: form.scene,
    name: form.name.trim(),
    tencent_template_id: templateID,
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

  let payload: SmsTemplatePayload
  try {
    payload = buildPayload()
  } catch (error) {
    ElNotification.error({ message: error instanceof Error ? error.message : t('common.fail.operation') })
    return
  }

  submitting.value = true
  try {
    if (dialogMode.value === 'create') {
      await SmsApi.createTemplate(payload)
    } else if (form.id !== null) {
      await SmsApi.updateTemplate(form.id, payload)
    }
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}

async function changeStatus(row: SmsTemplateItem, status: SmsCommonStatus) {
  await SmsApi.updateTemplateStatus(row.id, status)
  ElNotification.success({ message: t('common.success.operation') })
  await load()
}

async function deleteTemplate(row: SmsTemplateItem) {
  await ElMessageBox.confirm(t('sms.template.deleteConfirm'), t('common.confirmTitle'), { type: 'warning' })
  await SmsApi.deleteTemplate(row.id)
  ElNotification.success({ message: t('common.success.operation') })
  await load()
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="sms-template">
    <div class="sms-template__table">
      <AppTable
        :columns="columns"
        :data="templates"
        :loading="loading"
        :pagination="templatePage"
        row-key="id"
        @refresh="load"
      >
        <template #toolbar-left>
          <el-button
            v-if="userStore.can('system_sms_templateAdd')"
            type="success"
            @click="openCreate"
          >
            {{ t('common.actions.add') }}
          </el-button>
        </template>

        <template #cell-scene="{ row }">
          {{ sceneLabel(row.scene) }}
        </template>

        <template #cell-variables="{ row }">
          <el-space
            wrap
            class="sms-template__variables"
          >
            <el-tag
              v-for="item in row.variables"
              :key="item"
              size="small"
            >
              {{ item }}
            </el-tag>
          </el-space>
        </template>

        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>

        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('system_sms_templateEdit')"
            type="primary"
            text
            @click="openEdit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.NO && userStore.can('system_sms_templateStatus')"
            type="warning"
            text
            @click="changeStatus(row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="row.status === CommonEnum.YES && userStore.can('system_sms_templateStatus')"
            type="warning"
            text
            @click="changeStatus(row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button
            v-if="userStore.can('system_sms_templateDel')"
            type="danger"
            text
            @click="deleteTemplate(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>

    <AppDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="160px"
      >
        <el-form-item
          :label="t('sms.template.scene')"
          prop="scene"
        >
          <el-select
            v-model="form.scene"
            class="sms-template__select"
            :disabled="dialogMode === 'edit'"
          >
            <el-option
              v-for="item in dict.sms_scene_arr"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          :label="t('sms.template.name')"
          prop="name"
        >
          <el-input
            v-model="form.name"
            clearable
          />
        </el-form-item>
        <el-form-item
          :label="t('sms.template.tencentTemplateId')"
          prop="tencent_template_id"
        >
          <el-input
            v-model="form.tencent_template_id"
            clearable
          />
        </el-form-item>
        <el-form-item
          :label="t('sms.template.variables')"
          prop="variables_text"
        >
          <el-input
            v-model="form.variables_text"
            type="textarea"
            :rows="4"
            :placeholder="t('sms.template.variablesPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="t('sms.template.sampleVariables')">
          <div class="sms-template__samples">
            <div
              v-for="(row, index) in form.sample_variables"
              :key="index"
              class="sms-template__sample-row"
            >
              <el-input
                v-model="row.key"
                :placeholder="t('sms.template.sampleVariableKey')"
              />
              <el-input
                v-model="row.value"
                :placeholder="t('sms.template.sampleVariableValue')"
              />
              <el-button
                type="danger"
                text
                @click="removeSampleVariable(index)"
              >
                {{ t('common.actions.del') }}
              </el-button>
            </div>
            <div class="sms-template__sample-actions">
              <el-button @click="fillMissingSampleVariables">
                {{ t('sms.template.fillSampleVariables') }}
              </el-button>
              <el-button
                type="primary"
                plain
                @click="addSampleVariable"
              >
                {{ t('sms.template.addSampleVariable') }}
              </el-button>
            </div>
            <div class="sms-template__sample-tip">
              {{ t('sms.template.sampleVariablesTip') }}
            </div>
          </div>
        </el-form-item>
        <el-form-item
          :label="t('sms.template.status')"
          prop="status"
        >
          <el-radio-group v-model="form.status">
            <el-radio
              v-for="item in dict.common_status_arr"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ t('common.actions.cancel') }}
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submit"
        >
          {{ t('common.actions.confirm') }}
        </el-button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped>
.sms-template {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.sms-template__table {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.sms-template__variables {
  width: 100%;
  justify-content: center;
}

.sms-template__select {
  width: 100%;
}

.sms-template__samples {
  width: 100%;
}

.sms-template__sample-row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(220px, 2fr) auto;
  gap: 8px;
  margin-bottom: 8px;
}

.sms-template__sample-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.sms-template__sample-tip {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}
</style>
