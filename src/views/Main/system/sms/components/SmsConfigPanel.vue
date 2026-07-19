<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { useSmsConfigPanel } from './use-sms-config-panel'

const userStore = useUserStore()
const {
  config, deleteConfig, dict, form, isConfigured,
  loading, rules, save, saving, sendTest,
  t, testForm, testing, setFormRef,
} = useSmsConfigPanel()
</script>

<template>
  <div
    v-loading="loading"
    class="sms-config"
  >
    <el-alert
      class="sms-config__notice"
      type="info"
      :closable="false"
      show-icon
      :title="t('sms.config.notice')"
    />

    <el-card
      shadow="never"
      class="sms-config__card"
    >
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

      <el-form
        :ref="setFormRef"
        :model="form"
        :rules="rules"
        label-width="160px"
        class="sms-config__form"
      >
        <el-row :gutter="16">
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('sms.config.secretId')"
              prop="secret_id"
            >
              <el-input
                v-model="form.secret_id"
                show-password
                clearable
                :placeholder="isConfigured ? config?.secret_id_hint || t('sms.config.secretKeep') : ''"
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('sms.config.secretKey')"
              prop="secret_key"
            >
              <el-input
                v-model="form.secret_key"
                show-password
                clearable
                :placeholder="isConfigured ? config?.secret_key_hint || t('sms.config.secretKeep') : ''"
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('sms.config.smsSdkAppId')"
              prop="sms_sdk_app_id"
            >
              <el-input
                v-model="form.sms_sdk_app_id"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('sms.config.signName')"
              prop="sign_name"
            >
              <el-input
                v-model="form.sign_name"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('sms.config.region')"
              prop="region"
            >
              <el-select-v2
                v-model="form.region"
                :options="dict.sms_region_arr"
                class="sms-config__select"
                :placeholder="t('sms.config.rules.region')"
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('sms.config.endpoint')"
              prop="endpoint"
            >
              <el-input
                v-model="form.endpoint"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('sms.config.verifyCodeTTLMinutes')"
              prop="verify_code_ttl_minutes"
              class="sms-config__form-item--ttl"
            >
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
                <div class="sms-config__help">
                  {{ t('sms.config.verifyCodeTTLHelp') }}
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('sms.config.status')"
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
          </el-col>
        </el-row>
        <div class="sms-config__actions">
          <el-button
            v-if="userStore.can('system_sms_configEdit')"
            type="primary"
            :loading="saving"
            @click="save"
          >
            {{ t('common.actions.save') }}
          </el-button>
          <el-button
            v-if="isConfigured && userStore.can('system_sms_configDel')"
            type="danger"
            @click="deleteConfig"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </div>
      </el-form>
    </el-card>

    <el-card
      shadow="never"
      class="sms-config__card"
    >
      <template #header>
        <strong>{{ t('sms.config.testTitle') }}</strong>
      </template>
      <el-form
        label-width="160px"
        class="sms-config__test"
      >
        <el-form-item :label="t('sms.config.testPhone')">
          <el-input
            v-model="testForm.to_phone"
            clearable
            placeholder="13800138000"
          />
        </el-form-item>
        <el-form-item :label="t('sms.config.testScene')">
          <el-select
            v-model="testForm.template_scene"
            class="sms-config__select"
          >
            <el-option
              v-for="item in dict.sms_scene_arr"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-button
          v-if="userStore.can('system_sms_test')"
          type="primary"
          :loading="testing"
          @click="sendTest"
        >
          {{ t('sms.config.sendTest') }}
        </el-button>
      </el-form>
      <el-descriptions
        v-if="config"
        class="sms-config__meta"
        :column="2"
        border
      >
        <el-descriptions-item :label="t('sms.config.lastTestAt')">
          {{ config.last_test_at || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('sms.config.lastTestError')">
          {{ config.last_test_error || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped src="./SmsConfigPanel.styles.css"></style>
