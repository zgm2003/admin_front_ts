import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('AI chat message input layout', () => {
  it('keeps the old admin three-section input shape with restored chat tools', () => {
    const source = readFrontendSource('src/views/Main/ai/chat/components/MessageInput/index.vue')

    expect(source).toContain('class="input-toolbar"')
    expect(source).toContain('class="input-body"')
    expect(source).toContain('class="input-footer"')
    expect(source).toContain('@keydown="handleKeydown"')
    expect(source).toContain('type="primary"')
    expect(source).toContain("{{ t('aiChat.send') }}")

    expect(source).toContain('Picture')
    expect(source).toContain('Microphone')
    expect(source).toContain('EmojiPicker')
    expect(source).toContain('runtimeParams')
    expect(source).toContain('type="file"')
    expect(source).toContain("emit('stop')")
    expect(source).toContain("emit('openHistory')")
  })
})
