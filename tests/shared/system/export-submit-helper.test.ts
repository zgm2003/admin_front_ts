import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('export submit helper wiring', () => {
  it('defines a reusable export helper with selection guard and success fallback', () => {
    const source = readFrontendSource('src/hooks/useExportSubmit.ts')

    expect(source).toContain('export function useExportSubmit')
    expect(source).toContain("ElNotification.error({ message: t('common.selectAtLeastOne') })")
    expect(source).toContain('const data = await options.submit([...ids])')
    expect(source).toContain("ElNotification.success({ message: data.message || t('common.export.submitted') })")
  })

  it('uses the helper from the user list export button instead of duplicating submit flow', () => {
    const source = readFrontendSource('src/views/Main/user/userManager/components/UserList/index.vue')

    expect(source).toContain("import { useExportSubmit } from '@/hooks/useExportSubmit'")
    expect(source).toContain('const { submitSelectedExport } = useExportSubmit({')
    expect(source).toContain('submit: (ids) => UsersListApi.export({ ids }),')
    expect(source).toContain('await submitSelectedExport(selectedIds.value)')
  })
})
