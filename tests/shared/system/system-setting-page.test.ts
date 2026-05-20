import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('system setting page', () => {
  it('does not hard-code captcha policy helper alert above the table', () => {
    const page = read('src/views/Main/system/setting/index.vue')
    const zh = read('src/i18n/locales/zh-CN.ts')
    const en = read('src/i18n/locales/en-US.ts')

    expect(page).not.toContain('captchaSettingKeys')
    expect(page).not.toContain('setting-hint')
    expect(page).not.toContain('<el-alert')
    expect(page).not.toContain('setting.hints.captcha')
    expect(zh).not.toContain('captchaTitle')
    expect(zh).not.toContain('captchaDescription')
    expect(en).not.toContain('captchaTitle')
    expect(en).not.toContain('captchaDescription')
  })
})
