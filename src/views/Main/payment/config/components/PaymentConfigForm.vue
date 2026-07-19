<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules, UploadRequestOptions } from 'element-plus'
import type {
  PaymentCertificateType,
  PaymentConfigInitResponse,
  PaymentConfigMutationPayload,
} from '@/api/payment/config'
import type { PaymentConfigDialogMode } from '../composables/usePaymentConfigPage'

const props = defineProps<{
  dict: PaymentConfigInitResponse['dict']
  dialogMode: PaymentConfigDialogMode
  rules: FormRules
  privateKeyHint: string
  uploadLoading: PaymentCertificateType | ''
  canUpload: boolean
  uploadCert: (certType: PaymentCertificateType, options: UploadRequestOptions) => Promise<void>
}>()

const form = defineModel<PaymentConfigMutationPayload>({ required: true })
const formRef = ref<FormInstance | null>(null)
const { t } = useI18n()

async function validate(): Promise<boolean> {
  if (!formRef.value) return false
  return formRef.value.validate()
}

function clearValidate() {
  formRef.value?.clearValidate()
}

function uploadRequest(certType: PaymentCertificateType, options: UploadRequestOptions) {
  return props.uploadCert(certType, options)
}

function uploadAppCert(options: UploadRequestOptions) {
  return uploadRequest('app_cert', options)
}

function uploadAlipayCert(options: UploadRequestOptions) {
  return uploadRequest('platform_cert', options)
}

function uploadAlipayRootCert(options: UploadRequestOptions) {
  return uploadRequest('root_cert', options)
}

defineExpose({
  validate,
  clearValidate,
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="props.rules"
    label-width="auto"
    :validate-on-rule-change="false"
  >
    <section class="payment-config-section">
      <div class="payment-config-section__title">
        {{ t('paymentConfig.form.sections.basic') }}
      </div>
      <el-row :gutter="12">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('paymentConfig.form.fields.code')"
            prop="code"
            required
          >
            <el-input
              v-model="form.code"
              :disabled="props.dialogMode === 'edit'"
              clearable
              :placeholder="t('paymentConfig.form.placeholders.code')"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('paymentConfig.form.fields.name')"
            prop="name"
            required
          >
            <el-input
              v-model="form.name"
              clearable
              :placeholder="t('paymentConfig.form.placeholders.name')"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('paymentConfig.form.fields.provider')"
            prop="provider"
            required
          >
            <el-select-v2
              v-model="form.provider"
              :disabled="true"
              :options="props.dict.provider_arr"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('paymentConfig.form.fields.environment')"
            prop="environment"
            required
          >
            <el-select-v2
              v-model="form.environment"
              :options="props.dict.environment_arr"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('paymentConfig.form.fields.status')"
            prop="status"
            required
          >
            <el-select-v2
              v-model="form.status"
              :options="props.dict.common_status_arr"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('paymentConfig.form.fields.sort')"
            prop="sort"
            required
          >
            <el-input-number
              v-model="form.sort"
              :controls="false"
              :max="9999"
              :min="1"
              style="width: 100%"
            />
            <div class="payment-config-help">
              {{ t('paymentConfig.form.help.sort') }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('paymentConfig.form.fields.remark')"
            prop="remark"
          >
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="2"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
    </section>

    <section class="payment-config-section">
      <div class="payment-config-section__title">
        {{ t('paymentConfig.form.sections.alipay') }}
      </div>
      <el-row :gutter="12">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            label="AppID"
            prop="app_id"
            required
          >
            <el-input
              v-model="form.app_id"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('paymentConfig.form.fields.enabledMethods')"
            prop="enabled_methods"
            required
          >
            <el-select-v2
              v-model="form.enabled_methods"
              :options="props.dict.enabled_method_arr"
              multiple
              clearable
              collapse-tags
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('paymentConfig.form.fields.privateKey')"
            prop="app_private_key"
            :required="props.dialogMode === 'add'"
          >
            <el-input
              v-model="form.app_private_key"
              type="textarea"
              :rows="4"
              clearable
              :placeholder="props.dialogMode === 'edit' ? t('paymentConfig.form.placeholders.privateKeyEdit') : t('paymentConfig.form.placeholders.privateKeyAdd')"
            />
            <div
              v-if="props.dialogMode === 'edit' && props.privateKeyHint"
              class="payment-config-key-hint"
            >
              {{ t('paymentConfig.form.help.privateKeyHint', { hint: props.privateKeyHint }) }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('paymentConfig.form.fields.notifyURL')"
            prop="notify_url"
            required
          >
            <el-input
              v-model="form.notify_url"
              clearable
              placeholder="https://www.zgm2003.cn/api/payment/callbacks/alipay"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </section>

    <section class="payment-config-section">
      <div class="payment-config-section__title">
        {{ t('paymentConfig.form.sections.certificates') }}
      </div>
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item
            :label="t('paymentConfig.form.fields.appCert')"
            prop="app_cert_path"
            required
          >
            <div class="payment-config-cert-row">
              <el-input
                v-model="form.app_cert_path"
                readonly
                :placeholder="t('paymentConfig.form.placeholders.certificatePath')"
              />
              <el-upload
                v-if="props.canUpload"
                accept=".crt,.pem"
                :show-file-list="false"
                :http-request="uploadAppCert"
              >
                <el-button :loading="props.uploadLoading === 'app_cert'">
                  {{ t('paymentConfig.actions.uploadCertificate') }}
                </el-button>
              </el-upload>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('paymentConfig.form.fields.alipayCert')"
            prop="platform_cert_path"
            required
          >
            <div class="payment-config-cert-row">
              <el-input
                v-model="form.platform_cert_path"
                readonly
                :placeholder="t('paymentConfig.form.placeholders.certificatePath')"
              />
              <el-upload
                v-if="props.canUpload"
                accept=".crt,.pem"
                :show-file-list="false"
                :http-request="uploadAlipayCert"
              >
                <el-button :loading="props.uploadLoading === 'platform_cert'">
                  {{ t('paymentConfig.actions.uploadCertificate') }}
                </el-button>
              </el-upload>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('paymentConfig.form.fields.rootCert')"
            prop="root_cert_path"
            required
          >
            <div class="payment-config-cert-row">
              <el-input
                v-model="form.root_cert_path"
                readonly
                :placeholder="t('paymentConfig.form.placeholders.certificatePath')"
              />
              <el-upload
                v-if="props.canUpload"
                accept=".crt,.pem"
                :show-file-list="false"
                :http-request="uploadAlipayRootCert"
              >
                <el-button :loading="props.uploadLoading === 'root_cert'">
                  {{ t('paymentConfig.actions.uploadCertificate') }}
                </el-button>
              </el-upload>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </section>
  </el-form>
</template>

<style scoped src="./PaymentConfigForm.styles.css"></style>
