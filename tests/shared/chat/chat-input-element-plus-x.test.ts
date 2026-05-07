import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('chat message input Element Plus X migration', () => {
  it('uses the XSender component as a local, direct import', () => {
    const source = readFrontendSource('src/views/Main/chat/components/MessageInput/index.vue')

    expect(source).toContain("import XSender from 'vue-element-plus-x/es/XSender/index.js'")
    expect(source).toContain('<XSender')
    expect(source).toContain('@submit="handleSend"')
    expect(source).toContain('@change="handleSenderChange"')
    expect(source).toContain('@paste-file="handleSenderPasteFile"')
    expect(source).not.toContain('<el-input')
    expect(source).not.toContain("from 'vue-element-plus-x'")
    expect(source).not.toContain('ElementPlusX')
  })

  it('does not install Element Plus X globally in the app entry', () => {
    const source = readFrontendSource('src/main.ts')

    expect(source).not.toContain('ElementPlusX')
    expect(source).not.toContain("from 'vue-element-plus-x'")
    expect(source).not.toContain('app.use(ElementPlusX)')
  })

  it('keeps Element Plus X in a dedicated chat ui bundle group', () => {
    const source = readFrontendSource('vite.config.ts')

    expect(source).toContain("name: 'chat-ui'")
    expect(source).toContain('vue-element-plus-x')
    expect(source).toContain('x-sender')
    expect(source).toContain('virtua')
  })
})
