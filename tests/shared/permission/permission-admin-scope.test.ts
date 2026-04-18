import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('permission page admin-only scope', () => {
  it('does not keep dead multi-platform state in the admin-only page', () => {
    const source = readFileSync(resolve('e:/admin/admin_front_ts/src/views/Main/permission/permission/index.vue'), 'utf8')

    expect(source).not.toContain('const platformOptions = ref')
    expect(source).not.toContain('const activePlatform = ref<string>(PlatformEnum.ADMIN)')
  })
})
