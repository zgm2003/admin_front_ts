import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workspaceFiles = [
  'src/api/ai/images.ts',
  'src/views/Main/ai/image-playground/index.vue',
  'src/views/Main/ai/image-playground/types.ts',
  'src/views/Main/ai/image-playground/components/ImageHistoryGrid/index.vue',
  'src/views/Main/ai/image-playground/components/ImageComposer/index.vue',
  'src/views/Main/ai/image-playground/components/ImageResultPanel/index.vue',
  'src/views/Main/ai/image-playground/components/ImagePromptDialog/index.vue',
  'src/views/Main/ai/image-playground/components/ImageAssetPicker/index.vue',
]

const forbiddenWorkspaceTerms = [
  'favorite',
  'is_favorite',
  'ai_image_task_favorite',
  'audit',
  '审核',
  'moderation',
  'output_compression',
  'output_format_arr',
]

const requiredWorkspaceTerms = [
  'ImagePromptDialog',
  'ImageAssetPicker',
  'deleteSelected',
  'retry',
  'saveAsset',
  'addReference',
]

function readIfExists(relativePath: string) {
  const absolutePath = resolve(process.cwd(), relativePath)
  if (!existsSync(absolutePath)) {
    return ''
  }
  return readFileSync(absolutePath, 'utf8')
}

function readRequired(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('AI image workspace convergence with Canvas interactions', () => {
  it('uses Canvas-style prompt and asset workspace actions', () => {
    const missingFiles = workspaceFiles.filter((file) => !existsSync(resolve(process.cwd(), file)))
    const workspaceSource = workspaceFiles.map(readIfExists).join('\n')
    const zhCN = readRequired('src/i18n/locales/zh-CN.ts')
    const enUS = readRequired('src/i18n/locales/en-US.ts')
    const localizedSource = `${workspaceSource}\n${zhCN}\n${enUS}`

    expect(missingFiles).toEqual([])
    for (const term of requiredWorkspaceTerms) {
      expect(workspaceSource).toContain(term)
    }
    for (const key of ['addToAssets', 'addToReferences', 'resultPending']) {
      expect(localizedSource).toContain(key)
    }
  })

  it('removes favorite, moderation, and output-format controls from the image workspace', () => {
    const workspaceSource = workspaceFiles.map(readIfExists).join('\n')

    for (const term of forbiddenWorkspaceTerms) {
      expect(workspaceSource).not.toContain(term)
    }
  })
})
