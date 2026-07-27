import { afterEach, describe, expect, it } from 'vitest'
import { AiToolApi } from '@/api/ai/tools'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

describe('AI tool paid generation API', () => {
  it('sends the caller-owned request identity in the exact generated-draft body', async () => {
    const harness = installApiClientHarness({
      ok: false,
      draft: null,
      warnings: [],
      clarifying_questions: [],
      usage: null,
    })
    cleanups.push(harness.uninstall)

    await AiToolApi.generateDraft({
      agent_id: 7,
      request_id: '123e4567-e89b-42d3-a456-426614174000',
      requirement: 'Create a lookup tool',
      code_hint: 'lookup_user',
    })

    expect(harness.requests).toHaveLength(1)
    expect(harness.requests[0]).toMatchObject({
      method: 'POST',
      path: '/api/admin/v1/ai-tools/generate-draft',
      body: {
        agent_id: 7,
        request_id: '123e4567-e89b-42d3-a456-426614174000',
        requirement: 'Create a lookup tool',
        code_hint: 'lookup_user',
      },
    })
  })
})
