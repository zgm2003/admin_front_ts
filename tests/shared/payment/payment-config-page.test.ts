import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('payment config page', () => {
  it('uses config permissions and private cert upload flow', () => {
    const page = read('src/views/Main/payment/config/index.vue')
    const form = read('src/views/Main/payment/config/components/PaymentConfigForm.vue')
    const composable = read('src/views/Main/payment/config/composables/usePaymentConfigPage.ts')

    expect(composable).toContain("from '@/api/payment/config'")
    expect(page).toContain("userStore.can('payment_config_add')")
    expect(page).toContain("userStore.can('payment_config_edit')")
    expect(page).toContain("userStore.can('payment_config_status')")
    expect(page).toContain("userStore.can('payment_config_del')")
    expect(page).not.toContain("payment_config_delete")
    expect(page).toContain("userStore.can('payment_config_upload_cert')")
    expect(page).toContain("userStore.can('payment_config_test')")
    expect(page).toContain('PaymentConfigForm')
    expect(page).toContain(':upload-cert="uploadCert"')
    expect(page).toContain(':private-key-hint="editingPrivateKeyHint"')
    expect(page).toContain(':height="dialogLayout.height"')
    expect(page).toContain(':top="dialogLayout.top"')
    expect(`${page}\n${form}`).not.toContain('payment_channel_')
    expect(`${page}\n${form}`).not.toContain('merchant_id')
    expect(`${page}\n${form}\n${composable}`).not.toContain('return_url')
    expect(form).not.toContain('同步返回地址')
    expect(form).toContain('readonly')
    expect(form).toContain('props.privateKeyHint')
    expect(form).toContain("t('paymentConfig.form.placeholders.certificatePath')")
    expect(form).toContain("uploadRequest('app_cert'")
    expect(form).toContain("uploadRequest('alipay_cert'")
    expect(form).toContain("uploadRequest('alipay_root_cert'")
    expect(composable).toContain('PaymentConfigApi.uploadCertificate(payload)')
    expect(composable).toContain("label: t('paymentConfig.columns.updatedAt')")
  })

  it('keeps payment config visible copy behind vue-i18n', () => {
    const page = read('src/views/Main/payment/config/index.vue')
    const form = read('src/views/Main/payment/config/components/PaymentConfigForm.vue')
    const composable = read('src/views/Main/payment/config/composables/usePaymentConfigPage.ts')
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    expect(page).toContain("import { useI18n } from 'vue-i18n'")
    expect(form).toContain("import { useI18n } from 'vue-i18n'")
    expect(composable).toContain("import { useI18n } from 'vue-i18n'")
    expect(`${page}\n${form}\n${composable}`).not.toMatch(/[\u4e00-\u9fff]/)
    expect(zh).toContain('paymentConfig: {')
    expect(en).toContain('paymentConfig: {')
  })

  it('shows the canonical public Alipay callback URL in notify-url guidance', () => {
    const form = read('src/views/Main/payment/config/components/PaymentConfigForm.vue')

    expect(form).toContain('https://www.zgm2003.cn/api/payment/callbacks/alipay')
    expect(form).not.toContain('/pay/alipay/notify')
  })
})
