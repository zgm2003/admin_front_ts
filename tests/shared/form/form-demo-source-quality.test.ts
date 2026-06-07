import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const formDemoPath = 'src/views/Main/component/form/index.vue'

function source(path: string) {
  const absolutePath = join(process.cwd(), path)
  expect(existsSync(absolutePath)).toBe(true)
  return readFileSync(absolutePath, 'utf8')
}

describe('form demo source quality', () => {
  it('does not hide demo form, icon ref, or remote params behind any', () => {
    const text = source(formDemoPath)

    expect(text).not.toContain('(form: any)')
    expect(text).not.toContain('ref<any>')
    expect(text).not.toContain('(params: any)')
    expect(text).not.toContain("type: 'any'")
    expect(text).not.toContain('params.current_page || 1')
    expect(text).not.toContain('params.page_size || 20')

    expect(text).toContain("import type { SearchFormModel } from '@/components/Search/types'")
    expect(text).toContain("import type { RemoteListFetchMethod } from '@/types/common'")
    expect(text).toContain('interface IconSelectExpose {')
    expect(text).toContain('const iconSelectRef = ref<IconSelectExpose | null>(null)')
    expect(text).toContain('interface MockRemoteSelectParams {')
    expect(text).toContain('const mockFetch: RemoteListFetchMethod<MockRemoteSelectOption, MockRemoteSelectParams> = async (params) => {')
    expect(text).toContain("type: 'Record<string, unknown>'")
  })
})
