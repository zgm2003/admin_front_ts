import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('AI chat message list labels', () => {
  it('does not print “你/助手” above chat bubbles', () => {
    const source = readFrontendSource('src/views/Main/ai/chat/components/MessageList/index.vue')

    expect(source).not.toContain("t('aiChat.you')")
    expect(source).not.toContain("t('aiChat.assistant')")
    expect(source).not.toContain('message-meta')
  })

  it('does not render an empty text bubble for image-only user messages', () => {
    const source = readFrontendSource('src/views/Main/ai/chat/components/MessageList/index.vue')

    expect(source).toContain('v-else-if="message.role === AiRoleEnum.ASSISTANT" class="empty-content"')
    expect(source).not.toContain('v-else class="empty-content"')
  })
})
