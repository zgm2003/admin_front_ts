import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const jsonEditorPath = 'src/components/JsonEditor/src/index.vue'

function stripComments(source: string) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function jsonEditorSource() {
  return stripComments(readFileSync(join(process.cwd(), jsonEditorPath), 'utf8'))
}

describe('JsonEditor source quality', () => {
  it('handles JSON parse failures as unknown without optional-chain fallback messages', () => {
    const source = jsonEditorSource()

    expect(source).not.toContain('catch (e: any)')
    expect(source).not.toContain('e?.message ||')
    expect(source).toContain('catch (error: unknown)')
    expect(source).toContain('requireJsonParseErrorMessage(error)')
  })

  it('makes the empty-editor object default explicit instead of using logical-or fallback', () => {
    const source = jsonEditorSource()

    expect(source).not.toContain("modelValue.value || '{}'")
    expect(source).toContain('parseJsonEditorValue(modelValue.value)')
    expect(source).toContain('formatJsonEditorValue(modelValue.value)')
  })

  it('keeps JsonEditor visible text on i18n keys', () => {
    const source = jsonEditorSource()

    expect(source).not.toMatch(/[\u4e00-\u9fff]/)
    expect(source).toContain("t('jsonEditor.invalidJson'")
    expect(source).toContain("t('jsonEditor.formatted')")
    expect(source).toContain("t('jsonEditor.format')")
    expect(source).toContain("t('jsonEditor.validate')")
  })

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
