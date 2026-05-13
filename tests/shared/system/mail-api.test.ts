import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf-8')
}

const forbiddenLooseTypePattern = new RegExp(`\b${'an'}${'y'}\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('mail api and page contract', () => {
  it('uses Go REST endpoints for Tencent SES mail management', () => {
    const source = readFrontendSource('src/api/system/mail.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<MailPageInitResponse>(`${BASE}/page-init`)')
    expect(source).toContain('request.get<MailConfigItem>(`${BASE}/config`)')
    expect(source).toContain('request.put<void, MailConfigFormState>(`${BASE}/config`, payload)')
    expect(source).toContain('request.post<void, MailTestPayload>(`${BASE}/test`, payload)')
    expect(source).toContain('request.get<MailTemplateListResponse>(`${BASE}/templates`)')
    expect(source).toContain('request.get<PaginatedResponse<MailLogItem>>(`${BASE}/logs`, { params: normalizeLogParams(params) })')
    expect(source).toContain('request.delete<void, MailDeletePayload>(`${BASE}/logs`, { data: { ids } })')
    expect(source).not.toContain('legacyRequest')
    expect(source).not.toContain('/api/admin/Mail')
  })

  it('keeps encrypted secrets and sensitive log payloads out of frontend contracts', () => {
    for (const file of [
      'src/api/system/mail.ts',
      'src/views/Main/system/mail/index.vue',
      'src/views/Main/system/mail/components/MailConfigPanel.vue',
      'src/views/Main/system/mail/components/MailTemplatePanel.vue',
      'src/views/Main/system/mail/components/MailLogPanel.vue',
    ]) {
      const source = readFrontendSource(file)
      expect(source).not.toContain('secret_id_enc')
      expect(source).not.toContain('secret_key_enc')
      expect(source).not.toContain('template_data')
      expect(source).not.toContain('TemplateData')
      expect(source).not.toContain('verify_code')
      expect(source).not.toMatch(forbiddenLooseTypePattern)
    }
  })

  it('keeps route view thin and splits mail feature panels by responsibility', () => {
    const viewSource = readFrontendSource('src/views/Main/system/mail/index.vue')

    expect(viewSource).toContain("import('./components/MailConfigPanel.vue')")
    expect(viewSource).toContain("import('./components/MailTemplatePanel.vue')")
    expect(viewSource).toContain("import('./components/MailLogPanel.vue')")
    expect(viewSource).not.toContain('MailApi.')
  })

  it('guards mutations with system mail button permissions', () => {
    const configSource = readFrontendSource('src/views/Main/system/mail/components/MailConfigPanel.vue')
    const templateSource = readFrontendSource('src/views/Main/system/mail/components/MailTemplatePanel.vue')
    const logSource = readFrontendSource('src/views/Main/system/mail/components/MailLogPanel.vue')

    expect(configSource).toContain("userStore.can('system_mail_configEdit')")
    expect(configSource).toContain("userStore.can('system_mail_configDel')")
    expect(configSource).toContain("userStore.can('system_mail_test')")
    expect(templateSource).toContain("userStore.can('system_mail_templateAdd')")
    expect(templateSource).toContain("userStore.can('system_mail_templateEdit')")
    expect(templateSource).toContain("userStore.can('system_mail_templateStatus')")
    expect(templateSource).toContain("userStore.can('system_mail_templateDel')")
    expect(logSource).toContain("userStore.can('system_mail_logDel')")
  })

  it('uses shared CRUD primitives for the mail log list', () => {
    const logSource = readFrontendSource('src/views/Main/system/mail/components/MailLogPanel.vue')

    expect(logSource).toContain("import { Search } from '@/components/Search'")
    expect(logSource).toContain("import { useCrudTable } from '@/hooks/useCrudTable'")
    expect(logSource).toContain('useCrudTable<MailLogItem, MailLogListParams>')
    expect(logSource).toContain('<Search')
    expect(logSource).toContain('<AppTable')
    expect(logSource).toContain('<AppDialog')
    expect(logSource).not.toContain('<el-form')
    expect(logSource).not.toContain('<el-table')
    expect(logSource).not.toContain('<el-pagination')
  })
})
