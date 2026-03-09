import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const readSource = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), 'utf8').split('\r\n').join('\n')

describe('notification task and app button wiring', () => {
  it('notification task cancel dialog uses shared i18n keys', () => {
    const source = readSource('src/views/Main/system/notificationTask/index.vue')

    expect(source).toContain("t('common.confirmTitle')")
    expect(source).toContain("confirmButtonText: t('common.actions.confirm')")
    expect(source).toContain("cancelButtonText: t('common.actions.cancel')")
    expect(source).toContain("ElMessage.success(t('common.success.operation'))")
    expect(source).not.toContain("t('common.warning')")
    expect(source).not.toContain("ElMessage.success(t('common.success'))")
  })

  it('app button actions column reserves enough width', () => {
    const source = readSource('src/views/Main/permission/appButton/index.vue')

    expect(source).toContain("{ key: 'actions', label: t('common.actions.action'), width: 260 }")
  })
})
