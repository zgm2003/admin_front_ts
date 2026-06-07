import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const downloadDemoPath = 'src/views/Main/component/download/index.vue'

function source(path: string) {
  const absolutePath = join(process.cwd(), path)
  expect(existsSync(absolutePath)).toBe(true)
  return readFileSync(absolutePath, 'utf8')
}

describe('Download demo source quality', () => {
  it('does not teach or use catch-any download error handling', () => {
    const text = source(downloadDemoPath)

    expect(text).not.toContain('catch (error: any)')
    expect(text).not.toContain("error.message || '下载失败'")
    expect(text).toContain('function requireDownloadDemoErrorMessage(error: unknown): string')
    expect(text).toContain('catch (error: unknown)')
    expect(text).toContain('ElMessage.error(requireDownloadDemoErrorMessage(error))')
  })
})
