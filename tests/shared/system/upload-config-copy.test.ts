import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function sliceSection(source: string, startMarker: string, endMarker: string) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start)

  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)

  return source.slice(start, end)
}

describe('upload config form copy', () => {
  it('explains COS endpoint and bucket domain instead of exposing raw Endpoint wording', () => {
    const zh = readFrontendSource('src/i18n/locales/zh-CN.ts')
    const uploadCopy = sliceSection(zh, '  upload: {', '\n  mail: {')
    const view = readFrontendSource('src/views/Main/system/uploadConfig/components/UploadDriver/index.vue')

    expect(uploadCopy).toContain("endpoint: 'COS 写入端点（可留空）'")
    expect(uploadCopy).toContain("endpoint_placeholder: '默认自动使用 https://{bucket}.cos.{region}.myqcloud.com'")
    expect(uploadCopy).toContain("bucket_domain_placeholder: '例如 cos.example.com，用于生成文件访问地址'")
    expect(uploadCopy).not.toContain("endpoint: 'Endpoint'")
    expect(view).toContain(":placeholder=\"t('upload.driver.form.endpoint_placeholder')\"")
    expect(view).toContain(":placeholder=\"t('upload.driver.form.bucket_domain_placeholder')\"")
  })
})
