import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import {
  MailApi,
  type MailConfigFormState,
  type MailConfigItem,
  type MailTemplateScene,
} from '@/api/system/mail'
import { createDefaultMailDict, normalizeMailDict } from '../mailDict'

export function useMailConfigPanel() {
  const { t } = useI18n()
  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }
  const loading = shallowRef(false)
  const saving = shallowRef(false)
  const testing = shallowRef(false)
  const config = ref<MailConfigItem | null>(null)
  const dict = ref(createDefaultMailDict())

  const form = reactive<MailConfigFormState>({
    secret_id: '',
    secret_key: '',
    region: 'ap-guangzhou',
    endpoint: 'ses.tencentcloudapi.com',
    from_email: '',
    from_name: '',
    reply_to: '',
    status: CommonEnum.YES,
    verify_code_ttl_minutes: 5,
  })

  const testForm = reactive({
    to_email: '',
    template_scene: '' as MailTemplateScene | '',
  })

  const isConfigured = computed(() => config.value?.configured === true)

  const rules = computed<FormRules<MailConfigFormState>>(() => ({
    secret_id: isConfigured.value ? [] : [{ required: true, message: t('mail.config.rules.secretId'), trigger: 'blur' }],
    secret_key: isConfigured.value ? [] : [{ required: true, message: t('mail.config.rules.secretKey'), trigger: 'blur' }],
    region: [{ required: true, message: t('mail.config.rules.region'), trigger: 'blur' }],
    endpoint: [{ required: true, message: t('mail.config.rules.endpoint'), trigger: 'blur' }],
    from_email: [{ required: true, type: 'email', message: t('mail.config.rules.fromEmail'), trigger: 'blur' }],
    reply_to: [{ type: 'email', message: t('mail.config.rules.replyTo'), trigger: 'blur' }],
    status: [{ required: true, message: t('mail.config.rules.status'), trigger: 'change' }],
    verify_code_ttl_minutes: [
      { required: true, message: t('mail.config.rules.verifyCodeTTL'), trigger: 'blur' },
      { type: 'number', min: 1, max: 60, message: t('mail.config.rules.verifyCodeTTLRange'), trigger: 'blur' },
    ],
  }))

  function applyConfig(row: MailConfigItem) {
    config.value = row
    form.secret_id = ''
    form.secret_key = ''
    form.region = row.region || dict.value.default_region
    form.endpoint = row.endpoint || dict.value.default_endpoint
    form.from_email = row.from_email
    form.from_name = row.from_name
    form.reply_to = row.reply_to
    form.status = row.configured ? row.status : CommonEnum.YES
    form.verify_code_ttl_minutes = row.verify_code_ttl_minutes || dict.value.default_ttl_minutes
  }

  async function load() {
    loading.value = true
    try {
      const [initData, configData] = await Promise.all([MailApi.pageInit(), MailApi.config()])
      dict.value = normalizeMailDict(initData.dict)
      applyConfig(configData)
      if (!testForm.template_scene && dict.value.mail_scene_arr[0]) {
        testForm.template_scene = dict.value.mail_scene_arr[0].value
      }
    } finally {
      loading.value = false
    }
  }

  async function save() {
    if (!formRef.value) {
      return
    }
    try {
      await formRef.value.validate()
    } catch {
      return
    }
    saving.value = true
    try {
      await MailApi.saveConfig({ ...form })
      ElNotification.success({ message: t('common.success.operation') })
      await load()
    } finally {
      saving.value = false
    }
  }

  async function deleteConfig() {
    await ElMessageBox.confirm(t('mail.config.deleteConfirm'), t('common.confirmTitle'), { type: 'warning' })
    await MailApi.deleteConfig()
    ElNotification.success({ message: t('common.success.operation') })
    await load()
  }

  async function sendTest() {
    if (!testForm.to_email || !testForm.template_scene) {
      ElNotification.error({ message: t('mail.config.rules.test') })
      return
    }
    testing.value = true
    try {
      await MailApi.test({ to_email: testForm.to_email, template_scene: testForm.template_scene })
      ElNotification.success({ message: t('mail.config.testSuccess') })
      await load()
    } finally {
      testing.value = false
    }
  }

  onMounted(() => {
    void load()
  })

  return {
    config, deleteConfig, dict, form, isConfigured,
    loading, rules, save, saving, sendTest,
    t, testForm, testing, setFormRef,
  }
}
