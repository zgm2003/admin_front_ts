import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const workspaceFiles = [
  'src/api/ai/images.ts',
  'src/views/Main/ai/image-playground/index.vue',
  'src/views/Main/ai/image-playground/types.ts',
  'src/views/Main/ai/image-playground/composables/useImageWorkspaceActions.ts',
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

  it('moves side-effect-heavy workspace actions into a guarded composable', () => {
    const page = readRequired('src/views/Main/ai/image-playground/index.vue')
    const actions = readRequired('src/views/Main/ai/image-playground/composables/useImageWorkspaceActions.ts')

    expect(page).toContain("import { IMAGE_REFERENCE_LIMIT, useImageWorkspaceActions } from './composables/useImageWorkspaceActions'")
    expect(page).toContain('useImageWorkspaceActions({')
    expect(actions).toContain('export const IMAGE_REFERENCE_LIMIT = 10')
    expect(actions).toContain('CommonEnum.YES')
    expect(actions).toContain('function ensureReferenceCapacity')
    expect(actions).toContain('Promise.allSettled')
    expect(actions).toContain('finally')
    expect(actions).toContain('await refreshList()')
    expect(actions).toContain('async function saveAsset')
    expect(actions).toContain('async function deleteSelected')
  })

  it('handles dialog async load errors and disables invalid reference insertion paths', () => {
    const page = readRequired('src/views/Main/ai/image-playground/index.vue')
    const result = readRequired('src/views/Main/ai/image-playground/components/ImageResultPanel/index.vue')
    const promptDialog = readRequired('src/views/Main/ai/image-playground/components/ImagePromptDialog/index.vue')
    const assetPicker = readRequired('src/views/Main/ai/image-playground/components/ImageAssetPicker/index.vue')

    expect(promptDialog).not.toContain('void loadPrompts(1)')
    expect(promptDialog).toContain('loadPromptsSafely')
    expect(promptDialog).toContain('.catch(handlePromptLoadError)')
    expect(promptDialog).toContain('loadError')
    expect(assetPicker).not.toContain('void loadAssets(1)')
    expect(assetPicker).toContain('loadAssetsSafely')
    expect(assetPicker).toContain('.catch(handleAssetLoadError)')
    expect(assetPicker).toContain('loadError')

    expect(page).toContain(':can-add-reference="canAddReference"')
    expect(result).toContain('canAddReference: boolean')
    expect(result).toContain(':disabled="!canAddReference"')
    expect(assetPicker).toContain('isAssetSelectable')
    expect(assetPicker).toContain(':disabled="!isAssetSelectable(asset)"')
    expect(assetPicker).toContain('assetUrlMissing')
  })
})
