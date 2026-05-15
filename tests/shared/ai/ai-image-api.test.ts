import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI image playground contract', () => {
  it('uses agent-driven ai-images REST endpoints', () => {
    const source = readFrontendSource('src/api/ai/images.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain('request.get<AiImageInitResponse>(`${BASE}/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiImageTaskItem>>(BASE')
    expect(source).toContain('request.get<AiImageDetailResponse>(`${BASE}/${positiveID(params.id')
    expect(source).toContain('request.post<AiImageAssetItem, AiImageAssetCreatePayload>(`${BASE}/assets`')
    expect(source).toContain('request.post<AiImageCreateTaskResponse, AiImageTaskCreatePayload>(BASE')
    expect(source).toContain('request.patch<AiImageTaskItem, { is_favorite: number }>(`${BASE}/${positiveID(params.id')
    expect(source).toContain('request.delete<void>(`${BASE}/${id}`)')
    expect(source).toContain("agent_id: number")
    expect(source).not.toContain('provider_id?:')
    expect(source).not.toContain('api_key')
    expect(source).not.toContain('indexedDB')
    expect(source).not.toContain('localStorage')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
  })

  it('keeps the route view thin and splits real image UI components', () => {
    const page = readFrontendSource('src/views/Main/ai/image-playground/index.vue')
    const composer = readFrontendSource('src/views/Main/ai/image-playground/components/ImageComposer/index.vue')
    const assets = readFrontendSource('src/views/Main/ai/image-playground/components/ImageAssetList/index.vue')
    const history = readFrontendSource('src/views/Main/ai/image-playground/components/ImageHistoryGrid/index.vue')
    const detail = readFrontendSource('src/views/Main/ai/image-playground/components/ImageTaskDetailDialog/index.vue')
    const mask = readFrontendSource('src/views/Main/ai/image-playground/components/ImageMaskDialog/index.vue')
    const combined = `${page}\n${composer}\n${assets}\n${history}\n${detail}\n${mask}`

    expect(page).toContain('<ImageComposer')
    expect(page).toContain('<ImageHistoryGrid')
    expect(page).toContain('<ImageMaskDialog')
    expect(page).toContain('<ImageTaskDetailDialog')
    expect(page).toContain('AiImageApi.init')
    expect(page).toContain('AiImageApi.addAsset')
    expect(page).toContain('AiImageApi.addTask')
    expect(page).toContain("folderName: 'ai-images'")
    expect(composer).toContain('defineModel<ImageComposerState>')
    expect(composer).toContain("emit('uploadAsset'")
    expect(history).toContain("defineModel<AiImageTaskStatus | ''>('status'")
    expect(detail).toContain("emit('reuse'")
    expect(mask).toContain("source_type: 'mask'")
    expect(combined).not.toContain('provider_id?:')
    expect(combined).not.toContain('api_key')
    expect(combined).not.toContain('indexedDB')
    expect(combined).not.toContain('localStorage')
    expect(combined).not.toMatch(forbiddenLooseTypePattern)
  })
})
