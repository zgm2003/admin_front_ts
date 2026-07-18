<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import type { AuthPlatformInitResponse } from '@/api/permission/authPlatform'
import type { AuthPlatformForm } from '../helpers'

const visible = defineModel<boolean>({ required: true })
const form = defineModel<AuthPlatformForm>('form', { required: true })

defineProps<{
  mode: 'add' | 'edit'
  dict: AuthPlatformInitResponse['dict']
}>()

const emit = defineEmits<{
  (e: 'submit', value: AuthPlatformForm): void
}>()

const { t } = useI18n()
const isMobile = useIsMobile()
const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => ({
  code: [{ required: true, message: t('authPlatform.form.code') + t('common.required'), trigger: 'blur' }],
  name: [{ required: true, message: t('authPlatform.form.name') + t('common.required'), trigger: 'blur' }],
  login_types: [{ required: true, type: 'array', min: 1, message: t('authPlatform.form.login_types') + t('common.required'), trigger: 'change' }],
  captcha_type: [{ required: true, message: t('authPlatform.form.captcha_type') + t('common.required'), trigger: 'change' }],
  access_ttl: [{ required: true, message: t('authPlatform.form.access_ttl') + t('common.required'), trigger: 'blur' }],
  refresh_ttl: [{ required: true, message: t('authPlatform.form.refresh_ttl') + t('common.required'), trigger: 'blur' }],
}))

const yesNoOptions = computed(() => [
  { label: t('common.yes'), value: CommonEnum.YES },
  { label: t('common.no'), value: CommonEnum.NO },
])

watch(visible, (value) => {
  if (!value) return
  void nextTick(() => formRef.value?.clearValidate())
})

async function confirmSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  emit('submit', { ...form.value })
}
</script>

<template>
  <AppDialog
    v-model="visible"
    :width="isMobile ? '94vw' : '720px'"
    destroy-on-close
  >
    <template #header>
      {{ mode === 'add' ? t('authPlatform.addTitle') : t('authPlatform.editTitle') }}
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      :validate-on-rule-change="false"
    >
      <el-divider content-position="left">
        {{ t('authPlatform.form.section_basic') }}
      </el-divider>
      <el-row :gutter="16">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('authPlatform.form.code')"
            prop="code"
            required
          >
            <el-input
              v-model="form.code"
              :placeholder="t('authPlatform.form.codePlaceholder')"
              :disabled="mode === 'edit'"
              clearable
            />
            <div
              v-if="mode === 'add'"
              class="form-help"
            >
              {{ t('authPlatform.form.codeHelp') }}
            </div>
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('authPlatform.form.name')"
            prop="name"
            required
          >
            <el-input
              v-model="form.name"
              :placeholder="t('authPlatform.form.namePlaceholder')"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('authPlatform.form.login_types')"
            prop="login_types"
            required
          >
            <el-checkbox-group v-model="form.login_types">
              <el-checkbox
                v-for="opt in dict.auth_platform_login_type_arr"
                :key="opt.value"
                :value="opt.value"
                :label="opt.label"
              />
            </el-checkbox-group>
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('authPlatform.form.captcha_type')"
            prop="captcha_type"
            required
          >
            <el-select-v2
              v-model="form.captcha_type"
              :options="dict.auth_platform_captcha_type_arr"
              style="width:100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        {{ t('authPlatform.form.section_token') }}
      </el-divider>
      <el-row :gutter="16">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('authPlatform.form.access_ttl')"
            prop="access_ttl"
            required
          >
            <el-input-number
              v-model="form.access_ttl"
              :min="60"
              :max="2592000"
              :step="3600"
              style="width:100%"
              :controls="false"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('authPlatform.form.refresh_ttl')"
            prop="refresh_ttl"
            required
          >
            <el-input-number
              v-model="form.refresh_ttl"
              :min="60"
              :max="31536000"
              :step="86400"
              style="width:100%"
              :controls="false"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        {{ t('authPlatform.form.section_security') }}
      </el-divider>
      <el-alert
        :title="t('authPlatform.form.policy_notice')"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-row :gutter="16">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item :label="t('authPlatform.form.bind_platform')">
            <el-select-v2
              v-model="form.bind_platform"
              :options="yesNoOptions"
              style="width:100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item :label="t('authPlatform.form.bind_device')">
            <el-select-v2
              v-model="form.bind_device"
              :options="yesNoOptions"
              style="width:100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item :label="t('authPlatform.form.bind_ip')">
            <el-select-v2
              v-model="form.bind_ip"
              :options="yesNoOptions"
              style="width:100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item :label="t('authPlatform.form.single_session')">
            <el-select-v2
              v-model="form.single_session"
              :options="yesNoOptions"
              style="width:100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item :label="t('authPlatform.form.max_sessions')">
            <el-input-number
              v-model="form.max_sessions"
              :min="0"
              :max="100"
              :controls="false"
              style="width:100%"
            />
            <div class="form-help">
              {{ t('authPlatform.form.max_sessions_help') }}
            </div>
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item :label="t('authPlatform.form.allow_register')">
            <el-select-v2
              v-model="form.allow_register"
              :options="yesNoOptions"
              style="width:100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">
        {{ t('common.actions.cancel') }}
      </el-button>
      <el-button
        type="primary"
        @click="confirmSubmit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.form-help { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.4; margin-top: 4px }
</style>
