import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import {
  SmsApi,
  type SmsConfigFormState,
  type SmsConfigItem,
  type SmsTemplateScene,
} from '@/api/system/sms'
import { createDefaultSmsDict, normalizeSmsDict } from '../smsDict'

export function useSmsConfigPanel() {
  const { t } = useI18n()
  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }
  const loading = shallowRef(false)
  const saving = shallowRef(false)
  const testing = shallowRef(false)
  const config = ref<SmsConfigItem | null>(null)
  const dict = ref(createDefaultSmsDict())

  const form = reactive<SmsConfigFormState>({
    secret_id: '',
    secret_key: '',
    sms_sdk_app_id: '',
    sign_name: '',
    region: 'ap-guangzhou',
    endpoint: 'sms.tencentcloudapi.com',
    status: CommonEnum.YES,
    verify_code_ttl_minutes: 5,
  })

  const testForm = reactive({
    to_phone: '',
    template_scene: '' as SmsTemplateScene | '',
  })

  const isConfigured = computed(() => config.value?.configured === true)

  const rules = computed<FormRules<SmsConfigFormState>>(() => ({
    secret_id: isConfigured.value ? [] : [{ required: true, message: t('sms.config.rules.secretId'), trigger: 'blur' }],
    secret_key: isConfigured.value ? [] : [{ required: true, message: t('sms.config.rules.secretKey'), trigger: 'blur' }],
    sms_sdk_app_id: [{ required: true, message: t('sms.config.rules.smsSdkAppId'), trigger: 'blur' }],
    sign_name: [{ required: true, message: t('sms.config.rules.signName'), trigger: 'blur' }],
    region: [{ required: true, message: t('sms.config.rules.region'), trigger: 'change' }],
    endpoint: [{ required: true, message: t('sms.config.rules.endpoint'), trigger: 'blur' }],
    status: [{ required: true, message: t('sms.config.rules.status'), trigger: 'change' }],
    verify_code_ttl_minutes: [
      { required: true, message: t('sms.config.rules.verifyCodeTTL'), trigger: 'blur' },
      { type: 'number', min: 1, max: 60, message: t('sms.config.rules.verifyCodeTTLRange'), trigger: 'blur' },
    ],
  }))

  function applyConfig(row: SmsConfigItem) {
    config.value = row
    form.secret_id = ''
    form.secret_key = ''
    form.sms_sdk_app_id = row.sms_sdk_app_id
    form.sign_name = row.sign_name
    form.region = row.region || dict.value.default_region
    form.endpoint = row.endpoint || dict.value.default_endpoint
    form.status = row.configured ? row.status : CommonEnum.YES
    form.verify_code_ttl_minutes = row.verify_code_ttl_minutes || dict.value.default_ttl_minutes
  }

  async function load() {
    loading.value = true
    try {
      const [initData, configData] = await Promise.all([SmsApi.pageInit(), SmsApi.config()])
      dict.value = normalizeSmsDict(initData.dict)
      applyConfig(configData)
      if (!testForm.template_scene && dict.value.sms_scene_arr[0]) {
        testForm.template_scene = dict.value.sms_scene_arr[0].value
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
      await SmsApi.saveConfig({ ...form })
      ElNotification.success({ message: t('common.success.operation') })
      await load()
    } finally {
      saving.value = false
    }
  }

  async function deleteConfig() {
    await ElMessageBox.confirm(t('sms.config.deleteConfirm'), t('common.confirmTitle'), { type: 'warning' })
    await SmsApi.deleteConfig()
    ElNotification.success({ message: t('common.success.operation') })
    await load()
  }

  async function sendTest() {
    if (!testForm.to_phone || !testForm.template_scene) {
      ElNotification.error({ message: t('sms.config.rules.test') })
      return
    }
    testing.value = true
    try {
      await SmsApi.test({ to_phone: testForm.to_phone, template_scene: testForm.template_scene })
      ElNotification.success({ message: t('sms.config.testSuccess') })
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
