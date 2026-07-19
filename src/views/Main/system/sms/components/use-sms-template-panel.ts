import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
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

export function useSmsTemplatePanel() {
  const { t } = useI18n()
  const loading = shallowRef(false)
  const submitting = shallowRef(false)
  const dialogVisible = shallowRef(false)
  const dialogMode = shallowRef<'create' | 'edit'>('create')
  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }
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
      templates.value = listData
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

  return {
    addSampleVariable, changeStatus, columns, deleteTemplate, dialogMode,
    dialogTitle, dialogVisible, dict, fillMissingSampleVariables, form,
    load, loading, openCreate, openEdit, removeSampleVariable,
    rules, sceneLabel, statusLabel, submit, submitting,
    t, templatePage, templates, setFormRef,
  }
}
