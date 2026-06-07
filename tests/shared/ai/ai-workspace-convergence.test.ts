import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { AiAssetItem } from '@/api/ai/assets'
import type { AiImageFileInput } from '@/api/ai/images'
import {
  IMAGE_REFERENCE_LIMIT,
  fulfilledDeletedIDs,
  nextReferenceFiles,
} from '@/views/Main/ai/image-playground/composables/workspace-action-helpers'
import type { ImageComposerFile } from '@/views/Main/ai/image-playground/types'
import {
  assetBlockedReasonKey,
  isImageAssetSelectable,
} from '@/views/Main/ai/image-playground/components/ImageAssetPicker/asset-selectable'

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

function makeImageInput(index: number): AiImageFileInput {
  return {
    storage_provider: 'remote_url',
    storage_key: `https://example.test/reference-${index}.png`,
    storage_url: `https://example.test/reference-${index}.png`,
    mime_type: 'image/png',
    width: 1024,
    height: 1024,
    size_bytes: index,
  }
}

function makeReferenceFile(index: number): ImageComposerFile {
  return {
    ...makeImageInput(index),
    client_id: `draft-${index}`,
    sort_order: index,
    stored_file_id: null,
  }
}

function makeAsset(overrides: Partial<AiAssetItem> = {}): AiAssetItem {
  return {
    id: 1,
    slug: 'asset-1',
    type: 'image',
    category: 'reference',
    title: 'Reference asset',
    cover_url: 'https://example.test/asset.png',
    description: 'Reference image',
    content: '',
    url: 'https://example.test/asset.png',
    tags_json: '[]',
    status: 1,
    created_at: '2026-06-07T00:00:00Z',
    updated_at: '2026-06-07T00:00:00Z',
    ...overrides,
  }
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
    const helpers = readRequired('src/views/Main/ai/image-playground/composables/workspace-action-helpers.ts')

    expect(page).toContain("import { IMAGE_REFERENCE_LIMIT, useImageWorkspaceActions } from './composables/useImageWorkspaceActions'")
    expect(page).toContain('useImageWorkspaceActions({')
    expect(helpers).toContain('export const IMAGE_REFERENCE_LIMIT = 10')
    expect(actions).toContain('CommonEnum.YES')
    expect(actions).toContain('function ensureReferenceCapacity')
    expect(actions).toContain('nextReferenceFiles')
    expect(actions).toContain('fulfilledDeletedIDs')
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

  it('rejects the 11th reference image without mutating existing files', () => {
    const existingFiles = Array.from({ length: IMAGE_REFERENCE_LIMIT }, (_, index) => makeReferenceFile(index + 1))
    const originalSnapshot = structuredClone(existingFiles)
    let createCalls = 0

    const result = nextReferenceFiles(existingFiles, () => {
      createCalls += 1
      return makeReferenceFile(IMAGE_REFERENCE_LIMIT + 1)
    })

    expect(result.appended).toBe(false)
    expect(result.files).toEqual(originalSnapshot)
    expect(existingFiles).toEqual(originalSnapshot)
    expect(createCalls).toBe(0)
  })

  it('appends the 10th reference image when only 9 references exist', () => {
    const existingFiles = Array.from({ length: IMAGE_REFERENCE_LIMIT - 1 }, (_, index) => makeReferenceFile(index + 1))
    const nextInput = makeImageInput(IMAGE_REFERENCE_LIMIT)
    const nextFile = makeReferenceFile(IMAGE_REFERENCE_LIMIT)

    const result = nextReferenceFiles(existingFiles, () => nextFile)

    expect(result.appended).toBe(true)
    expect(result.files).toEqual([...existingFiles, nextFile])
    expect(result.files.at(-1)).toMatchObject(nextInput)
    expect(existingFiles).toHaveLength(IMAGE_REFERENCE_LIMIT - 1)
  })

  it('returns only fulfilled deleted ids and fails closed when result counts drift', () => {
    const results: PromiseSettledResult<void>[] = [
      { status: 'fulfilled', value: undefined },
      { status: 'rejected', reason: new Error('delete failed') },
      { status: 'fulfilled', value: undefined },
    ]

    expect(fulfilledDeletedIDs([101, 102, 103], results)).toEqual([101, 103])
    expect(fulfilledDeletedIDs([101, 102, 103], results.slice(0, 2))).toEqual([])
  })

  it('blocks non-image or URL-less assets from being selected', () => {
    const selectable = makeAsset()
    const nonImage = makeAsset({ type: 'text' })
    const missingURL = makeAsset({ url: '   ' })

    expect(isImageAssetSelectable(nonImage)).toBe(false)
    expect(assetBlockedReasonKey(nonImage)).toBe('aiImages.assetTypeRequired')
    expect(isImageAssetSelectable(missingURL)).toBe(false)
    expect(assetBlockedReasonKey(missingURL)).toBe('aiImages.assetUrlMissing')
    expect(isImageAssetSelectable(selectable)).toBe(true)
    expect(assetBlockedReasonKey(selectable)).toBeNull()
  })
})
