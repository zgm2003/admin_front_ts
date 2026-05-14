<script setup lang="ts">
import { computed, onMounted, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import {
  MailApi,
  type MailConfigFormState,
  type MailConfigItem,
  type MailTemplateScene,
} from '@/api/system/mail'
import { createDefaultMailDict, normalizeMailDict } from '../mailDict'

const { t } = useI18n()
const userStore = useUserStore()
const formRef = ref<FormInstance | null>(null)
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
</script>

<template>
  <div class="mail-config" v-loading="loading">
    <el-alert
      class="mail-config__notice"
      type="info"
      :closable="false"
      show-icon
      :title="t('mail.config.notice')"
    />

    <el-card shadow="never" class="mail-config__card">
      <template #header>
        <div class="mail-config__header">
          <div>
            <strong>{{ t('mail.config.title') }}</strong>
            <p>{{ t('mail.config.subtitle') }}</p>
          </div>
          <el-tag :type="isConfigured ? 'success' : 'warning'">
            {{ isConfigured ? t('mail.config.configured') : t('mail.config.notConfigured') }}
          </el-tag>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="150px" class="mail-config__form">
        <el-row :gutter="16">
          <el-col :span="24" :md="12">
            <el-form-item :label="t('mail.config.secretId')" prop="secret_id">
              <el-input v-model="form.secret_id" show-password clearable :placeholder="isConfigured ? config?.secret_id_hint || t('mail.config.secretKeep') : ''" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('mail.config.secretKey')" prop="secret_key">
              <el-input v-model="form.secret_key" show-password clearable :placeholder="isConfigured ? config?.secret_key_hint || t('mail.config.secretKeep') : ''" />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('mail.config.region')" prop="region">
              <el-select-v2
                v-model="form.region"
                :options="dict.mail_region_arr"
                class="mail-config__select"
                :placeholder="t('mail.config.rules.region')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('mail.config.endpoint')" prop="endpoint">
              <el-input v-model="form.endpoint" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('mail.config.fromEmail')" prop="from_email">
              <el-input v-model="form.from_email" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('mail.config.fromName')" prop="from_name">
              <el-input v-model="form.from_name" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('mail.config.replyTo')" prop="reply_to">
              <el-input v-model="form.reply_to" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="24" :md="12">
            <el-form-item :label="t('mail.config.status')" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio v-for="item in dict.common_status_arr" :key="item.value" :value="item.value">
                  {{ item.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <div class="mail-config__actions">
          <el-button v-if="userStore.can('system_mail_configEdit')" type="primary" :loading="saving" @click="save">
            {{ t('common.actions.save') }}
          </el-button>
          <el-button v-if="isConfigured && userStore.can('system_mail_configDel')" type="danger" @click="deleteConfig">
            {{ t('common.actions.del') }}
          </el-button>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mail-config__card">
      <template #header>
        <strong>{{ t('mail.config.testTitle') }}</strong>
      </template>
      <el-form label-width="150px" class="mail-config__test">
        <el-form-item :label="t('mail.config.testEmail')">
          <el-input v-model="testForm.to_email" clearable />
        </el-form-item>
        <el-form-item :label="t('mail.config.testScene')">
          <el-select v-model="testForm.template_scene" class="mail-config__select">
            <el-option v-for="item in dict.mail_scene_arr" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-button v-if="userStore.can('system_mail_test')" type="primary" :loading="testing" @click="sendTest">
          {{ t('mail.config.sendTest') }}
        </el-button>
      </el-form>
      <el-descriptions v-if="config" class="mail-config__meta" :column="2" border>
        <el-descriptions-item :label="t('mail.config.lastTestAt')">{{ config.last_test_at || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="t('mail.config.lastTestError')">{{ config.last_test_error || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped>
.mail-config {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.mail-config__notice {
  margin-bottom: 16px;
}

.mail-config__card {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
}

.mail-config__card + .mail-config__card {
  margin-top: 16px;
}

.mail-config__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.mail-config__header p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.mail-config__form {
  width: 100%;
  max-width: 1120px;
  min-width: 0;
}

.mail-config__form :deep(.el-row) {
  margin-right: 0 !important;
  margin-left: 0 !important;
}

.mail-config__form :deep(.el-col),
.mail-config__form :deep(.el-form-item__content),
.mail-config__test :deep(.el-form-item__content) {
  min-width: 0;
}

.mail-config__actions {
  display: flex;
  gap: 12px;
  padding-left: 150px;
}

.mail-config__test {
  width: 100%;
  max-width: 640px;
  min-width: 0;
}

.mail-config__select {
  width: 100%;
}

.mail-config__meta {
  margin-top: 18px;
}

@media (max-width: 768px) {
  .mail-config__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .mail-config__actions {
    flex-wrap: wrap;
    padding-left: 0;
  }

  .mail-config__form :deep(.el-form-item),
  .mail-config__test :deep(.el-form-item) {
    display: block;
  }

  .mail-config__form :deep(.el-form-item__label),
  .mail-config__test :deep(.el-form-item__label) {
    justify-content: flex-start;
    width: auto !important;
    padding-right: 0;
  }

  .mail-config__form :deep(.el-form-item__content),
  .mail-config__test :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }

  .mail-config__meta :deep(.el-descriptions__table) {
    table-layout: fixed;
  }
}
</style>
