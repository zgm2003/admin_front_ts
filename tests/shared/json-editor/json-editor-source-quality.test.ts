import { describe, expect, it } from 'vitest'

describe('JsonEditor parsing behavior', () => {
  it('rejects malformed parse error reasons instead of hiding them behind empty text', async () => {
    const { requireJsonParseErrorMessage } = await import('@/components/JsonEditor/src/json')

    expect(() => requireJsonParseErrorMessage('invalid json')).toThrow('json editor parse failed with non-Error reason')
    expect(() => requireJsonParseErrorMessage(new Error(''))).toThrow('json editor parse error message must be non-empty')
  })

  it('preserves the empty editor compatibility rule as an explicit empty object parse', async () => {
    const { formatJsonEditorValue, parseJsonEditorValue } = await import('@/components/JsonEditor/src/json')

    expect(parseJsonEditorValue('')).toEqual({})
    expect(parseJsonEditorValue('   ')).toEqual({})
    expect(formatJsonEditorValue('')).toBe('{}')
  })
})
