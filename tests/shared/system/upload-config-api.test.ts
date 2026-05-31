import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('upload config api contract', () => {
  it('keeps upload driver API types and guards COS-only', () => {
    const source = readFrontendSource('src/api/system/uploadConfig.ts')

    expect(source).toContain("export type UploadDriverType = 'cos'")
    expect(source).not.toContain("'cos' | 'oss'")
    expect(source).not.toContain("params.driver === 'oss'")
  })

  it('uses standard upload config API method names with temporary aliases', () => {
    const source = readFrontendSource('src/api/system/uploadConfig.ts')

    for (const apiName of ['UploadDriverApi', 'UploadRuleApi', 'UploadSettingApi']) {
      expect(source).toContain(`export const ${apiName} = {`)
    }
    expect(source).toContain('pageInit')
    expect(source).toContain('create')
    expect(source).toContain('update')
    expect(source).toContain('deleteOne')
    expect(source).toContain('deleteBatch')
    expect(source).toContain('deleteOne')
    expect(source).toContain('changeStatus')
    expect(source).toContain('changeStatus: changeSettingStatus')
  })

})
