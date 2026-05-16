<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import {
  SmsApi,
  type SmsConfigFormState,
  type SmsConfigItem,
  type SmsTemplateScene,
} from '@/api/system/sms'
import { createDefaultSmsDict, normalizeSmsDict } from '../smsDict'

const { t } = useI18n()
const userStore = useUserStore()
const formRef = ref<FormInstance | null>(null)
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
</script>

<template>
  <div class="sms-config" v-loading="loading">
    <el-alert
      class="sms-config__notice"
      type="info"
      :closable="false"
      show-icon
      :title="t('sms.config.notice')"
    />

    <el-card shadow="never" class="sms-config__card">
      <template #header>
        <div class="sms-config__header">
          <div>
            <strong>{{ t('sms.config.title') }}</strong>
            <p>{{ t('sms.config.subtitle') }}</p>
          </div>
          <el-tag :type="isConfigured ? 'success' : 'warning'">
            {{ isConfigured ? t('sms.config.configured') : t('sms.config.notConfigured') }}
          </el-tag>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="160px" class="sms-config__form">
        <el-row :gutter="16">
          <el-col :span="24" :md="12">
            <el-form-item :label="t('sms.config.secretId')" prop="secret_id">
              <el-input v-model="form.secret_id" show-password clearable :placeholder="isConfigured ? config?.secret_id_hint || t('sms.config.secretKeep') : ''" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('sms.config.secretKey')" prop="secret_key">
              <el-input v-model="form.secret_key" show-password clearable :placeholder="isConfigured ? config?.secret_key_hint || t('sms.config.secretKeep') : ''" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('sms.config.smsSdkAppId')" prop="sms_sdk_app_id">
              <el-input v-model="form.sms_sdk_app_id" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('sms.config.signName')" prop="sign_name">
              <el-input v-model="form.sign_name" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('sms.config.region')" prop="region">
              <el-select-v2
                v-model="form.region"
                :options="dict.sms_region_arr"
                class="sms-config__select"
                :placeholder="t('sms.config.rules.region')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('sms.config.endpoint')" prop="endpoint">
              <el-input v-model="form.endpoint" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('sms.config.verifyCodeTTLMinutes')" prop="verify_code_ttl_minutes" class="sms-config__form-item--ttl">
              <div class="sms-config__field-stack">
                <div class="sms-config__ttl-control">
                  <el-input-number
                    v-model="form.verify_code_ttl_minutes"
                    class="sms-config__ttl-input"
                    :min="1"
                    :max="60"
                    :precision="0"
                    :controls="false"
                  />
                  <span class="sms-config__ttl-unit">{{ t('sms.config.minutesUnit') }}</span>
                </div>
                <div class="sms-config__help">{{ t('sms.config.verifyCodeTTLHelp') }}</div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('sms.config.status')" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="item in dict.common_status_arr" :key="item.value" :value="item.value">
                  {{ item.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="sms-config__actions">
          <el-button v-if="userStore.can('system_sms_configEdit')" type="primary" :loading="saving" @click="save">
            {{ t('common.actions.save') }}
          </el-button>
          <el-button v-if="isConfigured && userStore.can('system_sms_configDel')" type="danger" @click="deleteConfig">
            {{ t('common.actions.del') }}
          </el-button>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="sms-config__card">
      <template #header>
        <strong>{{ t('sms.config.testTitle') }}</strong>
      </template>
      <el-form label-width="160px" class="sms-config__test">
        <el-form-item :label="t('sms.config.testPhone')">
          <el-input v-model="testForm.to_phone" clearable placeholder="13800138000" />
        </el-form-item>
        <el-form-item :label="t('sms.config.testScene')">
          <el-select v-model="testForm.template_scene" class="sms-config__select">
            <el-option v-for="item in dict.sms_scene_arr" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-button v-if="userStore.can('system_sms_test')" type="primary" :loading="testing" @click="sendTest">
          {{ t('sms.config.sendTest') }}
        </el-button>
      </el-form>
      <el-descriptions v-if="config" class="sms-config__meta" :column="2" border>
        <el-descriptions-item :label="t('sms.config.lastTestAt')">{{ config.last_test_at || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('sms.config.lastTestError')">{{ config.last_test_error || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
.sms-config {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sms-config__notice {
  margin-bottom: 16px;
}

.sms-config__card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.sms-config__card + .sms-config__card {
  margin-top: 16px;
}

.sms-config__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.sms-config__header p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.sms-config__form {
  width: 100%;
  max-width: 1120px;
  min-width: 0;
}

.sms-config__form :deep(.el-row) {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

.sms-config__form :deep(.el-col),
.sms-config__form :deep(.el-form-item__content),
.sms-config__test :deep(.el-form-item__content) {
  min-width: 0;
}

.sms-config__actions {
  display: flex;
  gap: 12px;
  padding-left: 160px;
}

.sms-config__test {
  width: 100%;
  max-width: 640px;
  min-width: 0;
}

.sms-config__select {
  width: 100%;
}

.sms-config__form-item--ttl :deep(.el-form-item__label) {
  white-space: nowrap;
}

.sms-config__field-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
}

.sms-config__ttl-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sms-config__ttl-input {
  width: 180px;
}

.sms-config__ttl-unit {
  flex: none;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.sms-config__help {
  width: 100%;
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.sms-config__meta {
  margin-top: 18px;
}

@media (max-width: 768px) {
  .sms-config__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .sms-config__actions {
    flex-wrap: wrap;
    padding-left: 0;
  }

  .sms-config__form :deep(.el-form-item),
  .sms-config__test :deep(.el-form-item) {
    display: block;
  }

  .sms-config__form :deep(.el-form-item__label),
  .sms-config__test :deep(.el-form-item__label) {
    justify-content: flex-start;
    width: auto !important;
    padding-right: 0;
  }

  .sms-config__form :deep(.el-form-item__content),
  .sms-config__test :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }

  .sms-config__meta :deep(.el-descriptions__table) {
    table-layout: fixed;
  }
}
</style>
