import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('Admin image single capability guard', () => {
  it('does not revive the old global ai_images asset contract', () => {
    const api = readFrontendSource('src/api/ai/images.ts')
    const page = readFrontendSource('src/views/Main/ai/image-playground/index.vue')
    const types = readFrontendSource('src/views/Main/ai/image-playground/types.ts')
    const composer = readFrontendSource('src/views/Main/ai/image-playground/components/ImageComposer/index.vue')
    const mask = readFrontendSource('src/views/Main/ai/image-playground/components/ImageMaskDialog/index.vue')
    const result = readFrontendSource('src/views/Main/ai/image-playground/components/ImageResultPanel/index.vue')
    const combined = `${api}\n${page}\n${types}\n${composer}\n${mask}\n${result}`

    expect(api).toContain('const BASE = `${ADMIN_API_PREFIX}/ai-images`')
    expect(api).not.toContain('/ai-images/assets')
    expect(api).not.toContain('admin_ai_image_task')
    expect(api).not.toContain('canvas_image_task')
    expect(api).toContain('input_files')
    expect(api).toContain('mask_file')
    expect(api).not.toContain('input_asset_ids')
    expect(api).not.toContain('mask_asset_id')
    expect(api).not.toContain('mask_target_asset_id')
    expect(combined).not.toContain('AiImageAssetItem')
    expect(combined).not.toContain('AiImageAssetCreatePayload')
    expect(combined).not.toContain('ai_image_asset_add')
    expect(combined).not.toContain('AiImageApi.createAsset')
    expect(combined).toContain('mask_target_sort_order')
    expect(combined).toContain('related_sort_order')
  })

  it('uses the Canvas-style studio layout instead of the old table-plus-bottom-composer page', () => {
    const page = readFrontendSource('src/views/Main/ai/image-playground/index.vue')
    const composer = readFrontendSource('src/views/Main/ai/image-playground/components/ImageComposer/index.vue')

    expect(page).toContain('image-workspace--three-panel')
    expect(page).toContain('image-panel--records')
    expect(page).toContain('image-panel--composer')
    expect(page).toContain('image-panel--result')
    expect(page).toContain('ImageResultPanel')
    expect(page).not.toContain('ImageTaskDetailDialog')
    expect(composer).toContain('composer-section--prompt')
    expect(composer).toContain('composer-section--references')
    expect(composer).toContain('quality-segment')
    expect(composer).not.toContain('prompt-row')
    expect(composer).not.toContain('dock-controls')
  })
})
