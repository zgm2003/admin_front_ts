import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('AI chat transport contract', () => {
  it('keeps chat transport websocket-only and run-free', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/api/ai/chat.ts'), 'utf8')

    expect(source).toContain("start: 'ai.response.start.v1'")
    expect(source).toContain("delta: 'ai.response.delta.v1'")
    expect(source).toContain("completed: 'ai.response.completed.v1'")
    expect(source).toContain("failed: 'ai.response.failed.v1'")
    expect(source).toContain('createAiRequestId')
    expect(source).not.toContain('ai.response.' + 'cancel.v1')
    expect(source).not.toContain('/ai-chat/' + 'runs')
    expect(source).not.toContain('run_id')
    expect(source).not.toContain('Event' + 'Source')
    expect(source).not.toContain('text/event' + '-stream')
    expect(source).not.toContain('stream' + 'Post')
    expect(source).not.toContain('timeout_ms')
  })
})
