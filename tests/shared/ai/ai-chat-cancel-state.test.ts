import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

function functionBody(source: string, name: string) {
  const start = source.indexOf(`async function ${name}()`)
  expect(start).toBeGreaterThanOrEqual(0)
  const nextFunction = source.indexOf('\nasync function ', start + 1)
  return source.slice(start, nextFunction > start ? nextFunction : source.length)
}

describe('AI chat cancel state handling', () => {
  it('marks a generation canceled only after the cancel API succeeds', () => {
    const source = readFrontendSource('src/views/Main/ai/chat/index.vue')
    const body = functionBody(source, 'handleStopGeneration')

    const remoteCancelIndex = body.indexOf('await AiChatApi.cancel')
    const localCancelIndex = body.indexOf('sessions.cancel')

    expect(remoteCancelIndex).toBeGreaterThanOrEqual(0)
    expect(localCancelIndex).toBeGreaterThanOrEqual(0)
    expect(remoteCancelIndex).toBeLessThan(localCancelIndex)
  })

  it('does not mark a request canceled after it already reached a terminal state', async () => {
    const { useConversationSessions } = await import('../../../src/views/Main/ai/chat/composables/useConversationSessions')
    const sessions = useConversationSessions()

    sessions.beginSend(7, 'req-7', 'question')
    sessions.markUserMessage(7, 'req-7', 70)
    sessions.appendDelta(7, 'req-7', 'answer')
    sessions.complete(7, 'req-7', 71)

    sessions.cancel(7, 'req-7')

    expect(sessions.isCanceled(7, 'req-7')).toBe(false)
    expect(sessions.get(7)?.messages[1]?.content).toBe('answer')
    expect(sessions.get(7)?.messages[1]?.id).toBe(71)
  })
})
