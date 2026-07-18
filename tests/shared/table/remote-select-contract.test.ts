import { describe, expect, it } from 'vitest'

import { normalizeRemoteSelectResponse } from '../../../src/components/RemoteSelect/src/index.vue'

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
})
