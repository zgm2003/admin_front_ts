import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8')
}

const forbiddenLooseTypePattern = new RegExp(`\b${'an'}${'y'}\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('sms api and page contract', () => {
  it('uses Go REST endpoints for Tencent Cloud SMS management', () => {
    const source = readFrontendSource('src/api/system/sms.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<SmsPageInitResponse>(`${BASE}/page-init`)')
    expect(source).toContain('request.get<SmsConfigItem>(`${BASE}/config`)')
    expect(source).toContain('request.put<void, SmsConfigFormState>(`${BASE}/config`, payload)')
    expect(source).toContain('request.post<void, SmsTestPayload>(`${BASE}/test`, payload)')
    expect(source).toContain('request.get<SmsTemplateListResponse>(`${BASE}/templates`)')
    expect(source).toContain('request.get<PaginatedResponse<SmsLogItem>>(`${BASE}/logs`, { params: normalizeLogParams(params) })')
    expect(source).toContain('request.delete<void, SmsDeletePayload>(`${BASE}/logs`, { data: { ids } })')
    expect(source).toContain('sms_region_arr: DictOption<SmsRegion>[]')
    expect(source).toContain("export type SmsRegion = 'ap-guangzhou'")
    expect(source).toContain("export type SmsTemplateScene = 'login' | 'forget' | 'bind_phone' | 'change_password'")
    expect(source).not.toContain('bind_email')
    expect(source).not.toContain('addTemplate')
    expect(source).not.toContain('editTemplate')
    expect(source).not.toContain('changeTemplateStatus')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/Sms')
  })

  it('keeps encrypted secrets and sensitive log payloads out of frontend contracts', () => {
    for (const file of [
      'src/api/system/sms.ts',
      'src/views/Main/system/sms/index.vue',
      'src/views/Main/system/sms/components/SmsConfigPanel.vue',
      'src/views/Main/system/sms/components/SmsTemplatePanel.vue',
      'src/views/Main/system/sms/components/SmsLogPanel.vue',
    ]) {
      const source = readFrontendSource(file)
      expect(source).not.toContain('secret_id_enc')
      expect(source).not.toContain('secret_key_enc')
      expect(source).not.toContain('template_params')
      expect(source).not.toContain('TemplateParams')
      expect(source).not.toContain('raw_request')
      expect(source).not.toContain('raw_response')
      expect(source).not.toMatch(forbiddenLooseTypePattern)
    }
  })

  it('exposes channel verify-code ttl without app_name or SMS body fields', () => {
    const apiSource = readFrontendSource('src/api/system/sms.ts')
    const configSource = readFrontendSource('src/views/Main/system/sms/components/SmsConfigPanel.vue')
    const templateSource = readFrontendSource('src/views/Main/system/sms/components/SmsTemplatePanel.vue')
    const zhSource = readFrontendSource('src/i18n/locales/zh-CN.ts')
    const enSource = readFrontendSource('src/i18n/locales/en-US.ts')

    expect(apiSource).toContain('verify_code_ttl_minutes: number')
    expect(configSource).toContain('form.verify_code_ttl_minutes = row.verify_code_ttl_minutes || dict.value.default_ttl_minutes')
    expect(configSource).toContain('prop="verify_code_ttl_minutes"')
    expect(configSource).toContain(":controls=\"false\"")
    expect(templateSource).toContain("const verifyCodeTemplateVariables = ['code', 'ttl_minutes']")
    expect(templateSource).not.toContain('app_name')
    expect(apiSource).not.toContain('template_content')
    expect(apiSource).not.toContain('body')
    expect(zhSource).toContain('短信验证码有效期；模板变量 ttl_minutes 自动取这个值。')
    expect(enSource).toContain('SMS verification-code TTL. The ttl_minutes template variable uses this value.')
    expect(zhSource).not.toContain('邮件和短信验证码共用')
    expect(enSource).not.toContain('Shared by email and SMS')
  })

  it('keeps route view thin and splits SMS feature panels by responsibility', () => {
    const viewSource = readFrontendSource('src/views/Main/system/sms/index.vue')

    expect(viewSource).toContain("import('./components/SmsConfigPanel.vue')")
    expect(viewSource).toContain("import('./components/SmsTemplatePanel.vue')")
    expect(viewSource).toContain("import('./components/SmsLogPanel.vue')")
    expect(viewSource).not.toContain('SmsApi.')
  })

  it('guards mutations with system SMS button permissions', () => {
    const configSource = readFrontendSource('src/views/Main/system/sms/components/SmsConfigPanel.vue')
    const templateSource = readFrontendSource('src/views/Main/system/sms/components/SmsTemplatePanel.vue')
    const logSource = readFrontendSource('src/views/Main/system/sms/components/SmsLogPanel.vue')

    expect(configSource).toContain("userStore.can('system_sms_configEdit')")
    expect(configSource).toContain("userStore.can('system_sms_configDel')")
    expect(configSource).toContain("userStore.can('system_sms_test')")
    expect(templateSource).toContain("userStore.can('system_sms_templateAdd')")
    expect(templateSource).toContain("userStore.can('system_sms_templateEdit')")
    expect(templateSource).toContain("userStore.can('system_sms_templateStatus')")
    expect(templateSource).toContain("userStore.can('system_sms_templateDel')")
    expect(logSource).toContain("userStore.can('system_sms_logDel')")
  })

  it('uses shared CRUD primitives for the SMS log list and AppDialog for dialogs', () => {
    const templateSource = readFrontendSource('src/views/Main/system/sms/components/SmsTemplatePanel.vue')
    const logSource = readFrontendSource('src/views/Main/system/sms/components/SmsLogPanel.vue')

    expect(logSource).toContain("import { Search } from '@/components/Search'")
    expect(logSource).toContain("import { useCrudTable } from '@/hooks/useCrudTable'")
    expect(logSource).toContain('useCrudTable<SmsLogItem, SmsLogListParams>')
    expect(logSource).toContain('<Search')
    expect(logSource).toContain('<AppTable')
    expect(logSource).toContain('<AppDialog')
    expect(templateSource).toContain('<AppDialog')
    expect(logSource).not.toContain('<el-table')
    expect(logSource).not.toContain('<el-pagination')
  })

  it('uses constrained Tencent SMS region options and explains log template context', () => {
    const helperSource = readFrontendSource('src/views/Main/system/sms/smsDict.ts')
    const configSource = readFrontendSource('src/views/Main/system/sms/components/SmsConfigPanel.vue')
    const logSource = readFrontendSource('src/views/Main/system/sms/components/SmsLogPanel.vue')

    expect(helperSource).toContain('createDefaultSmsDict')
    expect(helperSource).toContain('normalizeSmsDict')
    expect(helperSource).toContain('sms_region_arr')
    expect(helperSource).toContain('ap-guangzhou')
    expect(helperSource).not.toContain('ap-hongkong')
    expect(helperSource).toContain('sms.tencentcloudapi.com')
    expect(configSource).toContain('<el-select-v2')
    expect(configSource).toContain(':options="dict.sms_region_arr"')
    expect(configSource).not.toContain('<el-input v-model="form.region"')
    expect(logSource).toContain('detail.template')
    expect(logSource).toContain("t('sms.log.templateTitle')")
    expect(logSource).toContain("t('sms.log.securityNotice')")
  })

  it('lazy-loads SMS tabs and refreshes SMS logs when the log tab is reactivated', () => {
    const viewSource = readFrontendSource('src/views/Main/system/sms/index.vue')
    const logSource = readFrontendSource('src/views/Main/system/sms/components/SmsLogPanel.vue')

    expect(viewSource).toContain('name="config" lazy')
    expect(viewSource).toContain('name="template" lazy')
    expect(viewSource).toContain('name="log" lazy')
    expect(viewSource).toContain('@tab-change="handleTabChange"')
    expect(viewSource).toContain('ref="smsLogPanelRef"')
    expect(viewSource).toContain('smsLogPanelRef.value?.refreshLogs()')
    expect(logSource).toContain('defineExpose({ refreshLogs })')
  })
})
