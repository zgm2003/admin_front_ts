import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI knowledge api contract', () => {
  it('uses real ai-knowledge-bases REST endpoints and no retired map route', () => {
    const source = readFrontendSource('src/api/ai/knowledge.ts')

    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain('request.get<AiKnowledgeInitResponse>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/page-init`)')
    expect(source).toContain('request.get<PaginatedResponse<AiKnowledgeBaseItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases`')
    expect(source).toContain('request.post<AiKnowledgeCreateResponse, AiKnowledgeBaseMutationBody>(`${ADMIN_API_PREFIX}/ai-knowledge-bases`')
    expect(source).toContain('request.get<PaginatedResponse<AiKnowledgeDocumentItem>>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.knowledge_base_id,')
    expect(source).toContain('request.post<void>(`${ADMIN_API_PREFIX}/ai-knowledge-documents/${positiveID(params.id,')
    expect(source).toContain('request.post<AiKnowledgeRetrievalTestResponse, AiKnowledgeRetrievalTestBody>(`${ADMIN_API_PREFIX}/ai-knowledge-bases/${positiveID(params.knowledge_base_id,')
    expect(source).not.toContain('ai-knowledge-maps')
    expect(source).not.toContain('knowledgeMaps')
    expect(source).not.toContain('legacy' + 'Request')
  })

  it('keeps DTOs strict and avoids retired Dify map fields', () => {
    const source = readFrontendSource('src/api/ai/knowledge.ts')
    const page = readFrontendSource('src/views/Main/ai/knowledge/index.vue')
    const baseList = readFrontendSource('src/views/Main/ai/knowledge/components/KnowledgeBaseList/index.vue')
    const documentPanel = readFrontendSource('src/views/Main/ai/knowledge/components/KnowledgeDocumentPanel/index.vue')
    const form = readFrontendSource('src/views/Main/ai/knowledge/components/KnowledgeBaseFormDialog/index.vue')
    const combined = `${source}\n${page}\n${baseList}\n${documentPanel}\n${form}`

    expect(source).toContain("export type AiKnowledgeSourceType = 'text' | 'markdown' | 'file'")
    expect(source).toContain('chunk_size_chars: number')
    expect(source).toContain('default_top_k: number')
    expect(source).toContain('default_min_score: number')
    expect(source).toContain('default_max_context_chars: number')
    expect(source).toContain('index_status: AiKnowledgeIndexStatus')
    expect(source).toContain('content_chars: number')
    expect(combined).not.toContain('engine_dataset_id')
    expect(combined).not.toContain('visibility')
    expect(combined).not.toContain('provider_id')
    expect(combined).not.toContain('meta_json')
    expect(combined).not.toContain('knowledge_map')
    expect(combined).not.toContain('AiKnowledgeMap')
    expect(combined).not.toMatch(forbiddenLooseTypePattern)
  })

  it('keeps route view thin and splits real knowledge UI components', () => {
    const page = readFrontendSource('src/views/Main/ai/knowledge/index.vue')
    const baseList = readFrontendSource('src/views/Main/ai/knowledge/components/KnowledgeBaseList/index.vue')
    const documentPanel = readFrontendSource('src/views/Main/ai/knowledge/components/KnowledgeDocumentPanel/index.vue')
    const chunkDialog = readFrontendSource('src/views/Main/ai/knowledge/components/KnowledgeChunkDialog/index.vue')
    const retrievalDialog = readFrontendSource('src/views/Main/ai/knowledge/components/RetrievalTestDialog/index.vue')

    expect(page).toContain('<KnowledgeBaseList')
    expect(page).toContain('<KnowledgeDocumentPanel')
    expect(page).not.toContain('useCrudTable')
    expect(baseList).toContain('defineEmits')
    expect(documentPanel).toContain('defineProps')
    expect(documentPanel).toContain('AiKnowledgeApi.reindexDocument')
    expect(chunkDialog).toContain('AiKnowledgeApi.chunks')
    expect(retrievalDialog).toContain('AiKnowledgeApi.retrievalTest')
  })

  it('exposes standard knowledge wrapper names with legacy aliases', () => {
    const source = readFrontendSource('src/api/ai/knowledge.ts')
    const form = readFrontendSource('src/views/Main/ai/knowledge/components/KnowledgeDocumentFormDialog/index.vue')
    expect(source).toContain('const pageInit = () => request.get<AiKnowledgeInitResponse>')
    expect(source).toContain('const create = (params: AiKnowledgeBaseMutationParams)')
    expect(source).toContain('const update = (params: AiKnowledgeBaseMutationParams)')
    expect(source).toContain('const changeStatus = (params: { id: Id; status: number })')
    expect(source).toContain('const deleteOne = (params: { id: Id })')
    expect(source).toContain('const deleteBatch = async (params: { ids: Id[] })')
    expect(source).toContain('const createDocument = (params: AiKnowledgeDocumentMutationParams)')
    expect(source).toContain('const updateDocument = (params: AiKnowledgeDocumentMutationParams)')
    expect(source).toContain('pageInit,')
    expect(source).toContain('create,')
    expect(source).toContain('update,')
    expect(source).toContain('changeStatus,')
    expect(source).toContain('deleteOne,')
    expect(source).toContain('deleteBatch,')
    expect(source).toContain('createDocument,')
    expect(source).toContain('updateDocument,')
    expect(source).toContain('pageInit')
    expect(source).toContain('create')
    expect(source).toContain('update')
    expect(source).toContain('changeStatus')
    expect(source).toContain('deleteOne')
    expect(source).toContain('addDocument: createDocument')
    expect(source).toContain('editDocument: updateDocument')
    expect(form).toContain('AiKnowledgeApi.createDocument')
    expect(form).toContain('AiKnowledgeApi.updateDocument')
    expect(form).not.toContain('AiKnowledgeApi.addDocument')
    expect(form).not.toContain('AiKnowledgeApi.editDocument')
  })

})
