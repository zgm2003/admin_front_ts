import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('retired AI stream websocket acceleration contract', () => {
  it('has no polling acceleration code because chat is websocket-only now', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/api/ai/chat.ts'), 'utf8')
    expect(source).toContain('AI_RESPONSE_EVENTS')
    expect(source).not.toContain('/ai-chat/' + 'runs')
    expect(source).not.toContain('/events')
    expect(source).not.toContain('streamByRunEvents')
  })
})
