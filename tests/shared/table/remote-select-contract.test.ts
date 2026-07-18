import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { normalizeRemoteSelectResponse } from '../../../src/components/RemoteSelect/src/index.vue'

const remoteSelectSourcePath = fileURLToPath(
  new URL('../../../src/components/RemoteSelect/src/index.vue', import.meta.url)
)
const searchSourcePath = fileURLToPath(
  new URL('../../../src/components/Search/src/index.vue', import.meta.url)
)

describe('RemoteSelect response contract', () => {
  it('keeps standard paginated response data unchanged', () => {
    const response = {
      list: [{ id: 1 }],
      page: { total: 1 },
    }

    expect(normalizeRemoteSelectResponse(response)).toEqual({
      list: response.list,
      total: 1,
    })
  })

  it('fails closed when list is missing', () => {
    expect(() => normalizeRemoteSelectResponse({ page: { total: 1 } })).toThrow(
      'remote select response list must be an array'
    )
  })

  it('fails closed when page.total is missing', () => {
    expect(() => normalizeRemoteSelectResponse({ list: [{ id: 1 }], page: {} })).toThrow(
      'remote select response page.total must be a number'
    )
  })

  it('does not keep contract-hiding fallback expressions in source', () => {
    const source = readFileSync(remoteSelectSourcePath, 'utf8')
    const searchSource = readFileSync(searchSourcePath, 'utf8')

    expect(source).not.toContain('response.list ?? []')
    expect(source).not.toContain('response.total ?? 0')
    expect(source).not.toContain('page?.total ??')
    expect(searchSource).not.toContain("field.labelField || 'label'")
    expect(searchSource).not.toContain("field.valueField || 'value'")
    expect(searchSource).not.toContain("field.keywordField || 'keyword'")
    expect(searchSource).toContain('v-bind="field.elementProps"')
  })
})
