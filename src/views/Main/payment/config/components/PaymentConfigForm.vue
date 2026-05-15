<script setup lang="ts">
import { ref } from 'vue'
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
  uploadLoading: PaymentCertificateType | ''
  canUpload: boolean
  uploadCert: (certType: PaymentCertificateType, options: UploadRequestOptions) => Promise<void>
}>()

const form = defineModel<PaymentConfigMutationPayload>({ required: true })
const formRef = ref<FormInstance | null>(null)

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
        基础信息
      </div>
      <el-row :gutter="12">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            label="配置编码"
            prop="code"
            required
          >
            <el-input
              v-model="form.code"
              :disabled="props.dialogMode === 'edit'"
              clearable
              placeholder="如 alipay_default"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            label="配置名称"
            prop="name"
            required
          >
            <el-input
              v-model="form.name"
              clearable
              placeholder="如 支付宝默认配置"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            label="支付渠道"
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
            label="环境"
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
            label="状态"
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
        <el-col :span="24">
          <el-form-item
            label="备注"
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
        支付宝参数
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
            label="支付方式"
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
            label="应用私钥"
            prop="app_private_key"
            :required="props.dialogMode === 'add'"
          >
            <el-input
              v-model="form.app_private_key"
              type="textarea"
              :rows="4"
              clearable
              :placeholder="props.dialogMode === 'edit' ? '不填则保留原私钥' : '请输入应用私钥'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            label="异步通知地址"
            prop="notify_url"
            required
          >
            <el-input
              v-model="form.notify_url"
              clearable
              placeholder="https://your-domain.example/pay/alipay/notify"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            label="同步返回地址"
            prop="return_url"
          >
            <el-input
              v-model="form.return_url"
              clearable
              placeholder="https://example.com/pay/result"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </section>

    <section class="payment-config-section">
      <div class="payment-config-section__title">
        证书上传
      </div>
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item
            label="应用公钥证书"
            prop="app_cert_path"
            required
          >
            <div class="payment-config-cert-row">
              <el-input
                v-model="form.app_cert_path"
                readonly
                placeholder="上传后自动填入私有证书路径"
              />
              <el-upload
                v-if="props.canUpload"
                accept=".crt,.pem"
                :show-file-list="false"
                :http-request="(options) => uploadRequest('app_cert', options)"
              >
                <el-button :loading="props.uploadLoading === 'app_cert'">
                  上传证书
                </el-button>
              </el-upload>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            label="支付宝公钥证书"
            prop="platform_cert_path"
            required
          >
            <div class="payment-config-cert-row">
              <el-input
                v-model="form.platform_cert_path"
                readonly
                placeholder="上传后自动填入私有证书路径"
              />
              <el-upload
                v-if="props.canUpload"
                accept=".crt,.pem"
                :show-file-list="false"
                :http-request="(options) => uploadRequest('alipay_cert', options)"
              >
                <el-button :loading="props.uploadLoading === 'alipay_cert'">
                  上传证书
                </el-button>
              </el-upload>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            label="支付宝根证书"
            prop="root_cert_path"
            required
          >
            <div class="payment-config-cert-row">
              <el-input
                v-model="form.root_cert_path"
                readonly
                placeholder="上传后自动填入私有证书路径"
              />
              <el-upload
                v-if="props.canUpload"
                accept=".crt,.pem"
                :show-file-list="false"
                :http-request="(options) => uploadRequest('alipay_root_cert', options)"
              >
                <el-button :loading="props.uploadLoading === 'alipay_root_cert'">
                  上传证书
                </el-button>
              </el-upload>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </section>
  </el-form>
</template>

<style scoped>
.payment-config-section {
  padding: 4px 0 12px;
}

.payment-config-section__title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.payment-config-cert-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  width: 100%;
}
</style>

