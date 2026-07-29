import { describe, expect, it } from 'vitest'

import { createConversationTitle } from '@/views/Main/ai/chat/conversation-title'
import { createRuntimeParams } from '@/views/Main/ai/chat/components/MessageInput/runtime-params'
import {
  formatRunTokens,
  knowledgeHitTagType,
  prettyRunJson,
  runStatusTagType,
} from '@/views/Main/ai/runs/components/RunList/presenters'

describe('AI page presenters', () => {
  it('normalizes a new conversation title without inventing content', () => {
    expect(createConversationTitle('  hello\n  admin world  ')).toBe('hello admin world')
    expect(createConversationTitle('x'.repeat(31))).toBe('x'.repeat(30))
  })

  it('emits only explicitly selected runtime parameters', () => {
    expect(createRuntimeParams({
      temperature: { enabled: false, value: 1 },
      maxHistory: { enabled: false, value: 20 },
    })).toEqual({})
    expect(createRuntimeParams({
      temperature: { enabled: true, value: 0 },
      maxHistory: { enabled: true, value: 12 },
    })).toEqual({
      temperature: 0,
      max_history: 12,
    })
  })

  it('formats run details deterministically', () => {
    expect(formatRunTokens(12345)).toBe((12345).toLocaleString())
    expect(prettyRunJson(null)).toBe('-')
    expect(prettyRunJson({ ok: true })).toBe('{\n  "ok": true\n}')
    expect(runStatusTagType('failed')).toBe('danger')
    expect(runStatusTagType('running')).toBe('warning')
    expect(knowledgeHitTagType(1)).toBe('success')
    expect(knowledgeHitTagType(0)).toBe('info')
  })
})
