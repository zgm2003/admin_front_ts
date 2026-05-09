import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\b${'an'}${'y'}\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('AI message api minimal REST contract', () => {
  it('uses only conversation-scoped list and send endpoints', () => {
    const source = readFrontendSource('src/api/ai/messages.ts')
    expect(source).toContain("import request from '@/lib/http'")
    expect(source).toContain("import { ADMIN_API_PREFIX } from '@/lib/http/api-prefix'")
    expect(source).toContain('request.get<AiMessageListResponse>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.conversation_id, \'conversation id\')}/messages`')
    expect(source).toContain('request.post<AiMessageSendResponse, AiMessageSendBody>(`${ADMIN_API_PREFIX}/ai-conversations/${positiveID(params.conversation_id, \'conversation id\')}/messages`')
    expect(source).toContain('content_type: AiMessageContentType')
    expect(source).not.toContain('PaginatedResponse')
    expect(source).not.toContain('meta_json')
    expect(source).not.toContain('feedback')
    expect(source).not.toContain('editContent')
    expect(source).not.toContain('request.delete')
    expect(source).not.toContain('/api/admin/AiMessages')
  })

  it('keeps AI message api types strict and token-free', () => {
    const source = readFrontendSource('src/api/ai/messages.ts')
    expect(source).not.toMatch(forbiddenLooseTypePattern)
    expect(source).not.toContain('run_id')
    expect(source).not.toContain('token_input')
    expect(source).not.toContain('token_output')
    expect(source).not.toContain('user_id')
  })
})
