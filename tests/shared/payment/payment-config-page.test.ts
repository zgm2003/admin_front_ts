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
    expect(page).toContain(':height="dialogLayout.height"')
    expect(page).toContain(':top="dialogLayout.top"')
    expect(`${page}\n${form}`).not.toContain('payment_channel_')
    expect(`${page}\n${form}`).not.toContain('merchant_id')
    expect(form).toContain('readonly')
    expect(form).toContain('placeholder="上传后自动填入私有证书路径"')
    expect(form).toContain("uploadRequest('app_cert'")
    expect(form).toContain("uploadRequest('alipay_cert'")
    expect(form).toContain("uploadRequest('alipay_root_cert'")
    expect(composable).toContain('PaymentConfigApi.uploadCertificate(payload)')
  })
})
