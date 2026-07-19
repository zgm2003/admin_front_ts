<script setup lang="ts">
import { useUserStore } from '@/store/user'
import { useMailConfigPanel } from './use-mail-config-panel'

const userStore = useUserStore()
const {
  config, deleteConfig, dict, form, isConfigured,
  loading, rules, save, saving, sendTest,
  t, testForm, testing, setFormRef,
} = useMailConfigPanel()
</script>

<template>
  <div
    v-loading="loading"
    class="mail-config"
  >
    <el-alert
      class="mail-config__notice"
      type="info"
      :closable="false"
      show-icon
      :title="t('mail.config.notice')"
    />

    <el-card
      shadow="never"
      class="mail-config__card"
    >
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

      <el-form
        :ref="setFormRef"
        :model="form"
        :rules="rules"
        label-width="150px"
        class="mail-config__form"
      >
        <el-row :gutter="16">
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('mail.config.secretId')"
              prop="secret_id"
            >
              <el-input
                v-model="form.secret_id"
                show-password
                clearable
                :placeholder="isConfigured ? config?.secret_id_hint || t('mail.config.secretKeep') : ''"
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('mail.config.secretKey')"
              prop="secret_key"
            >
              <el-input
                v-model="form.secret_key"
                show-password
                clearable
                :placeholder="isConfigured ? config?.secret_key_hint || t('mail.config.secretKeep') : ''"
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('mail.config.region')"
              prop="region"
            >
              <el-select-v2
                v-model="form.region"
                :options="dict.mail_region_arr"
                class="mail-config__select"
                :placeholder="t('mail.config.rules.region')"
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('mail.config.endpoint')"
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
              :label="t('mail.config.fromEmail')"
              prop="from_email"
            >
              <el-input
                v-model="form.from_email"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('mail.config.fromName')"
              prop="from_name"
            >
              <el-input
                v-model="form.from_name"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('mail.config.verifyCodeTTLMinutes')"
              prop="verify_code_ttl_minutes"
              class="mail-config__form-item--ttl"
            >
              <div class="mail-config__field-stack">
                <div class="mail-config__ttl-control">
                  <el-input-number
                    v-model="form.verify_code_ttl_minutes"
                    class="mail-config__ttl-input"
                    :min="1"
                    :max="60"
                    :precision="0"
                    controls-position="right"
                    :controls="false"
                  />
                  <span class="mail-config__ttl-unit">{{ t('mail.config.minutesUnit') }}</span>
                </div>
                <div class="mail-config__help">
                  {{ t('mail.config.verifyCodeTTLHelp') }}
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('mail.config.replyTo')"
              prop="reply_to"
            >
              <el-input
                v-model="form.reply_to"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col
            :span="24"
            :md="12"
          >
            <el-form-item
              :label="t('mail.config.status')"
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
        <div class="mail-config__actions">
          <el-button
            v-if="userStore.can('system_mail_configEdit')"
            type="primary"
            :loading="saving"
            @click="save"
          >
            {{ t('common.actions.save') }}
          </el-button>
          <el-button
            v-if="isConfigured && userStore.can('system_mail_configDel')"
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
      class="mail-config__card"
    >
      <template #header>
        <strong>{{ t('mail.config.testTitle') }}</strong>
      </template>
      <el-form
        label-width="150px"
        class="mail-config__test"
      >
        <el-form-item :label="t('mail.config.testEmail')">
          <el-input
            v-model="testForm.to_email"
            clearable
          />
        </el-form-item>
        <el-form-item :label="t('mail.config.testScene')">
          <el-select
            v-model="testForm.template_scene"
            class="mail-config__select"
          >
            <el-option
              v-for="item in dict.mail_scene_arr"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-button
          v-if="userStore.can('system_mail_test')"
          type="primary"
          :loading="testing"
          @click="sendTest"
        >
          {{ t('mail.config.sendTest') }}
        </el-button>
      </el-form>
      <el-descriptions
        v-if="config"
        class="mail-config__meta"
        :column="2"
        border
      >
        <el-descriptions-item :label="t('mail.config.lastTestAt')">
          {{ config.last_test_at || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('mail.config.lastTestError')">
          {{ config.last_test_error || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<style scoped src="./MailConfigPanel.styles.css"></style>
