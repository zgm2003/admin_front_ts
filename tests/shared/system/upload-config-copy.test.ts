import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function sliceTopLevelSection(source: string, section: string) {
  const startMarker = `  ${section}: {`
  const start = source.indexOf(startMarker)
  expect(start).toBeGreaterThanOrEqual(0)

  const nextSection = /\n  [a-zA-Z0-9_]+: \{/g
  nextSection.lastIndex = start + startMarker.length
  const next = nextSection.exec(source)

  return source.slice(start, next?.index ?? source.length)
}

describe('upload config form copy', () => {
  it('explains COS endpoint and bucket domain instead of exposing raw Endpoint wording', () => {
    const zh = readFrontendSource('src/i18n/locales/zh-CN.ts')
    const uploadCopy = sliceTopLevelSection(zh, 'upload')
    const view = readFrontendSource('src/views/Main/system/uploadConfig/components/UploadDriver/index.vue')

    expect(uploadCopy).toContain("endpoint: 'COS 写入端点（可留空）'")
    expect(uploadCopy).toContain("endpoint_placeholder: '默认自动使用 https://{bucket}.cos.{region}.myqcloud.com'")
    expect(uploadCopy).toContain("bucket_domain_placeholder: '例如 cos.example.com，不要填写 https://，用于生成文件访问地址'")
    expect(uploadCopy).not.toContain("endpoint: 'Endpoint'")
    expect(view).toContain(":placeholder=\"t('upload.driver.form.endpoint_placeholder')\"")
    expect(view).toContain(":placeholder=\"t('upload.driver.form.bucket_domain_placeholder')\"")
  })

  it('keeps upload driver UI and API contract COS-only', () => {
    const view = readFrontendSource('src/views/Main/system/uploadConfig/components/UploadDriver/index.vue')
    const api = readFrontendSource('src/api/system/uploadConfig.ts')

    expect(view).not.toContain("form.driver==='oss'")
    expect(view).not.toContain('role_arn')
    expect(api).toContain("export type UploadDriverType = 'cos'")
  })
})
