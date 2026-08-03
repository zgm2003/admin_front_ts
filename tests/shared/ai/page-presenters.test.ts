import { describe, expect, it } from 'vitest'

import { createConversationTitle } from '@/views/Main/ai/chat/conversation-title'
import { createRuntimeParams } from '@/views/Main/ai/chat/components/MessageInput/runtime-params'
import {
  formatRunTokens,
  prettyRunJson,
  runStatusTagType,
} from '@/views/Main/ai/runs/components/RunList/presenters'

describe('AI page presenters', () => {
  it('normalizes a new conversation title without inventing content', () => {
    expect(createConversationTitle('  hello\n  admin world  ')).toBe('hello admin world')
    expect(createConversationTitle('x'.repeat(31))).toBe('x'.repeat(30))
  })

  it('uses the first attachment name when the initial message has no text', () => {
    expect(createConversationTitle('   ', '  quarterly\nreport.pdf  ')).toBe('quarterly report.pdf')
    expect(createConversationTitle('', 'x'.repeat(31))).toBe('x'.repeat(30))
  })

  it('emits only explicitly selected runtime parameters', () => {
    expect(createRuntimeParams({
      temperature: { enabled: false, value: 1 },
    })).toEqual({})
    expect(createRuntimeParams({
      temperature: { enabled: true, value: 0 },
    })).toEqual({
      temperature: 0,
    })
  })

  it('formats run details deterministically', () => {
    expect(formatRunTokens(12345)).toBe((12345).toLocaleString())
    expect(prettyRunJson(null)).toBe('-')
    expect(prettyRunJson({ ok: true })).toBe('{\n  "ok": true\n}')
    expect(runStatusTagType('failed')).toBe('danger')
    expect(runStatusTagType('running')).toBe('warning')
  })
})
