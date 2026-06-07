import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const downloadPath = 'src/components/DownloadManager/src/download.ts'
const errorsPath = 'src/components/DownloadManager/src/errors.ts'

function stripComments(source: string) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*([\s\S]*?)\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function source(path: string) {
  const absolutePath = join(process.cwd(), path)
  if (!existsSync(absolutePath)) return ''
  return stripComments(readFileSync(absolutePath, 'utf8'))
}

function downloadFileSource() {
  const text = source(downloadPath)
  const start = text.indexOf('export const downloadFile')
  const end = text.indexOf('export const openUrl')

  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)

  return text.slice(start, end)
}

describe('DownloadManager source quality', () => {
  it('does not type download catch blocks as any', () => {
    const text = source(downloadPath)

    expect(text).not.toContain('catch (error: any)')
    expect(text).not.toContain('catch (err: any)')
    expect(text).toContain('catch (error: unknown)')
  })

  it('classifies user cancellation explicitly and requires real errors', () => {
    const text = source(downloadPath)
    const helper = source(errorsPath)

    expect(text).toContain("import { isDownloadUserCancelled, requireDownloadError } from './errors'")
    expect(text).toContain("isDownloadUserCancelled(error, t('download.userCancelled'))")
    expect(text).toContain("requireDownloadError(error, 'download')")
    expect(text).toContain("requireDownloadError(error, 'web download')")
    expect(helper).toContain('export function isDownloadUserCancelled(error: unknown, cancelMessage: string): boolean')
    expect(helper).toContain('export function requireDownloadError(error: unknown, operation: string): Error')
  })

  it('throws Web fetch failures instead of hiding them behind direct-open fallback', () => {
    const text = downloadFileSource()

    expect(text).toContain("console.error('[downloadFile] Web fetch error:', downloadError)")
    expect(text).toContain('throw downloadError')
    expect(text).not.toContain("window.open(url, '_blank')")
  })

  it('uses explicit filename derivation instead of logical-or fallbacks', () => {
    const text = source(downloadPath)

    expect(text).toContain('const DEFAULT_DOWNLOAD_FILENAME = ')
    expect(text).toContain('function resolveSuggestedDownloadFilename(url: string, filename?: string): string')
    expect(text).toContain('function resolveSavePathFilename(savePath: string, suggestedFilename: string): string')
    expect(text).not.toContain("options.url.split('/').pop()?.split('?')[0] || 'download'")
    expect(text).not.toContain('options.filename || urlFilename')
    expect(text).not.toContain('savePath.split(/[/\\\\]/).pop() || suggestedFilename')
    expect(text).not.toContain("filename || url.split('/').pop()?.split('?')[0] || 'download'")
  })

  it('rejects malformed download errors instead of inventing fallback messages', async () => {
    const absoluteHelperPath = join(process.cwd(), errorsPath)

    expect(existsSync(absoluteHelperPath)).toBe(true)
    if (!existsSync(absoluteHelperPath)) return

    const { isDownloadUserCancelled, requireDownloadError } = await import('@/components/DownloadManager/src/errors')

    expect(isDownloadUserCancelled(new Error('cancelled'), 'cancelled')).toBe(true)
    expect(isDownloadUserCancelled(new Error('failed'), 'cancelled')).toBe(false)
    expect(() => requireDownloadError('download failed', 'download')).toThrow('download failed with non-Error reason')
    expect(() => requireDownloadError(new Error(''), 'download')).toThrow('download error message must be non-empty')
  })
})
