import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const validatorPath = 'src/hooks/web/useValidator.ts'

function source(path: string) {
  const absolutePath = join(process.cwd(), path)
  expect(existsSync(absolutePath)).toBe(true)
  return readFileSync(absolutePath, 'utf8')
}

describe('useValidator source quality', () => {
  it('does not hide validator types or messages behind any and logical-or fallbacks', () => {
    const text = source(validatorPath)

    expect(text).not.toContain('val: any')
    expect(text).not.toContain('message ||')
    expect(text).toContain('type ValidatorValue = string')
    expect(text).toContain('function resolveValidatorMessage(message: string | undefined, fallback: string): string')
    expect(text).toContain('const lengthRange = (val: ValidatorValue, callback: Callback, options: LengthRange) => {')
    expect(text).toContain('const notSpace = (val: ValidatorValue, callback: Callback, message?: string) => {')
    expect(text).toContain('const isEmail = (val: ValidatorValue, callback: Callback, message?: string) => {')
  })
})
