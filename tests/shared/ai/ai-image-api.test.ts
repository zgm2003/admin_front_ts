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
    expect(page).toContain('AiImageApi.pageInit')
    expect(page).toContain('AiImageApi.createAsset')
    expect(page).toContain('AiImageApi.createTask')
    expect(page).toContain("folderName: 'ai-images'")
    expect(composer).toContain('defineModel<ImageComposerState>')
    expect(composer).toContain("emit('uploadAsset'")
    expect(history).toContain("defineModel<AiImageTaskStatus | ''>('status'")
    expect(detail).toContain("emit('reuse'")
    expect(detail).toContain("import type { AiImageAssetItem, AiImageDetailResponse, AiImageTaskStatus } from '@/api/ai/images'")
    expect(detail).toContain(':type="statusType(task.status)"')
    expect(mask).toContain("source_type: 'mask'")
    expect(combined).not.toContain('provider_id?:')
    expect(combined).not.toContain('api_key')
    expect(combined).not.toContain('indexedDB')
    expect(combined).not.toContain('localStorage')
    expect(combined).not.toMatch(forbiddenLooseTypePattern)
  })

  it('keeps the image playground inside the outer layout card instead of nesting overflow-prone cards', () => {
    const page = readFrontendSource('src/views/Main/ai/image-playground/index.vue')
    const composer = readFrontendSource('src/views/Main/ai/image-playground/components/ImageComposer/index.vue')
    const history = readFrontendSource('src/views/Main/ai/image-playground/components/ImageHistoryGrid/index.vue')

    expect(page).toContain('class="image-workspace"')
    expect(page).toContain('class="image-panel image-panel--composer"')
    expect(page).toContain('class="image-panel image-panel--history"')
    expect(page).toContain('overflow: hidden;')
    expect(page).toContain('min-width: 0;')
    expect(composer).not.toContain('<el-card')
    expect(history).not.toContain('<el-card')
  })

  it('uses the shared AppDialog wrapper for image task details with internal scrolling', () => {
    const detail = readFrontendSource('src/views/Main/ai/image-playground/components/ImageTaskDetailDialog/index.vue')

    expect(detail).toContain("import { AppDialog } from '@/components/AppDialog'")
    expect(detail).toContain('<AppDialog')
    expect(detail).toContain(':height="')
    expect(detail).toContain(':body-padding="')
    expect(detail).not.toContain('<el-dialog')
    expect(detail).not.toContain('</el-dialog>')
  })


  it('exposes standard image wrapper names with legacy aliases', () => {
    const source = readFrontendSource('src/api/ai/images.ts')
    const page = readFrontendSource('src/views/Main/ai/image-playground/index.vue')
    expect(source).toContain('const pageInit = () => request.get<AiImageInitResponse>')
    expect(source).toContain('const createAsset = (payload: AiImageAssetCreatePayload)')
    expect(source).toContain('const createTask = (payload: AiImageTaskCreatePayload)')
    expect(source).toContain('const deleteOne = (params: { id: Id })')
    expect(source).toContain('const deleteBatch = async (params: { ids: Id[] })')
    expect(source).toContain('pageInit,')
    expect(source).toContain('createAsset,')
    expect(source).toContain('createTask,')
    expect(source).toContain('deleteOne,')
    expect(source).toContain('deleteBatch,')
    expect(source).toContain('pageInit')
    expect(source).toContain('addAsset: createAsset')
    expect(source).toContain('addTask: createTask')
    expect(source).toContain('deleteOne')
    expect(page).toContain('AiImageApi.pageInit()')
    expect(page).toContain('AiImageApi.createAsset')
    expect(page).toContain('AiImageApi.createTask')
    expect(page).not.toContain('AiImageApi.init')
    expect(page).not.toContain('AiImageApi.addAsset')
    expect(page).not.toContain('AiImageApi.addTask')
  })

})
