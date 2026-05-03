import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createAuthPlatformDefaultForm } from '@/views/Main/permission/authPlatform/helpers'
import { CommonEnum } from '@/enums'

describe('auth platform helpers', () => {
  it('uses the stricter baseline defaults for new platforms', () => {
    expect(createAuthPlatformDefaultForm()).toMatchObject({
      bind_platform: CommonEnum.YES,
      bind_device: CommonEnum.NO,
      bind_ip: CommonEnum.NO,
      single_session: CommonEnum.YES,
      max_sessions: 1,
      allow_register: CommonEnum.YES,
      captcha_type: 'slide',
    })
  })

  it('renders a runtime policy notice in the page source', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/views/Main/permission/authPlatform/index.vue'), 'utf8')

    expect(source).toContain("t('authPlatform.form.policy_notice')")
    expect(source).toContain("t('authPlatform.form.captcha_type')")
  })
})
