import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import {
  MailApi,
  type MailCommonStatus,
  type MailTemplateFormState,
  type MailTemplateItem,
  type MailTemplatePayload,
  type MailTemplateSampleVariableRow,
  type MailTemplateScene,
} from '@/api/system/mail'
import { createDefaultMailDict, normalizeMailDict } from '../mailDict'

export function useMailTemplatePanel() {
  const { t } = useI18n()
  const loading = shallowRef(false)
  const submitting = shallowRef(false)
  const dialogVisible = shallowRef(false)
  const dialogMode = shallowRef<'create' | 'edit'>('create')
  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }
  const templates = ref<MailTemplateItem[]>([])
  const dict = ref(createDefaultMailDict())
  const verifyCodeTemplateVariables = ['code', 'ttl_minutes']
  const verifyCodeSampleVariables: Record<string, string> = { code: '123456', ttl_minutes: '5' }

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
  const templatePage = computed(() => ({
    current_page: 1,
    page_size: 20,
    total: templates.value.length,
  }))
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
      dict.value = normalizeMailDict(initData.dict)
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
    if (variables.length !== 2 || variables[0] !== 'code' || variables[1] !== 'ttl_minutes') {
      throw new Error(t('mail.template.rules.verifyCodeVariables'))
    }
    const sampleVariables = buildSampleVariables(form.sample_variables)
    const sampleKeys = Object.keys(sampleVariables).sort()
    if (sampleKeys.length !== 2 || sampleKeys[0] !== 'code' || sampleKeys[1] !== 'ttl_minutes') {
      throw new Error(t('mail.template.rules.verifyCodeSampleVariables'))
    }
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

  return {
    addSampleVariable, changeStatus, columns, deleteTemplate, dialogMode,
    dialogTitle, dialogVisible, dict, fillMissingSampleVariables, form,
    load, loading, openCreate, openEdit, removeSampleVariable,
    rules, sceneLabel, statusLabel, submit, submitting,
    t, templatePage, templates, setFormRef,
  }
}
