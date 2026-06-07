import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const devTestPath = 'src/views/Main/test/index.vue'

function source(path: string) {
  const absolutePath = join(process.cwd(), path)
  expect(existsSync(absolutePath)).toBe(true)
  return readFileSync(absolutePath, 'utf8')
}

describe('Dev test download source quality', () => {
  it('does not hide download errors behind any or fallback messages', () => {
    const text = source(devTestPath)

    expect(text).not.toContain('catch (error: any)')
    expect(text).not.toContain("error.message || t('devTest.downloadFailed'")
    expect(text).not.toContain('testFilename.value || undefined')
    expect(text).toContain('function requireDevTestDownloadErrorMessage(error: unknown): string')
    expect(text).toContain('function optionalDownloadFilename(filename: string): string | undefined')
    expect(text).toContain('catch (error: unknown)')
    expect(text).toContain('requireDevTestDownloadErrorMessage(error)')
  })
})
