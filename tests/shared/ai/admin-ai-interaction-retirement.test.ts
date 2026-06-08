import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()

const retiredPaths = [
  'src/views/Main/ai/image-playground',
  'src/views/Main/ai/assets',
  'src/api/ai/images.ts',
  'src/api/ai/assets.ts'
]

describe('admin AI interactive surfaces are retired', () => {
  test('does not ship image workspace or asset management files', () => {
    for (const path of retiredPaths) {
      expect(existsSync(join(root, path))).toBe(false)
    }
  })

  test('does not keep admin image or asset menu/i18n keys', () => {
    const zhCN = readFileSync(join(root, 'src/i18n/locales/zh-CN.ts'), 'utf8')
    const enUS = readFileSync(join(root, 'src/i18n/locales/en-US.ts'), 'utf8')
    const combined = `${zhCN}\n${enUS}`

    for (const token of [
      'ai_image_playground',
      'ai_assets',
      '图片工作台',
      'Image Playground',
      'assetLibrary'
    ]) {
      expect(combined).not.toContain(token)
    }
  })
})
