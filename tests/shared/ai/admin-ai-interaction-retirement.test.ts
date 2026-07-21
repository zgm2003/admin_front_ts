import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()

const retiredPaths = [
  'src/views/Main/ai/prompts',
  'src/views/Main/ai/image-playground',
  'src/views/Main/ai/assets',
  'src/api/ai/prompts.ts',
  'src/api/ai/images.ts',
  'src/api/ai/assets.ts'
]

describe('admin AI interactive surfaces are retired', () => {
  test('does not ship Prompt, image workspace, or asset management files', () => {
    for (const path of retiredPaths) {
      expect(existsSync(join(root, path))).toBe(false)
    }
  })

  test('does not keep admin image or asset menu/i18n keys', () => {
    const combined = ['zh-CN', 'en-US'].flatMap((locale) => {
      const directory = join(root, 'src/i18n/locales', locale)
      return readdirSync(directory)
        .filter((name) => name.endsWith('.ts'))
        .sort()
        .map((name) => readFileSync(join(directory, name), 'utf8'))
    }).join('\n')

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
