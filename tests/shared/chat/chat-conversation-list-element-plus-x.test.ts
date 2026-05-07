import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('chat conversation list Element Plus X migration', () => {
  it('uses Element Plus X Conversations through a local subpath import', () => {
    const source = readFrontendSource('src/views/Main/chat/components/ConversationList/index.vue')

    expect(source).toContain("import Conversations from 'vue-element-plus-x/es/Conversations/index.js'")
    expect(source).toContain('<Conversations')
    expect(source).toContain(':items="conversationItems"')
    expect(source).toContain(':active="activeConversationId"')
    expect(source).toContain('@change="handleConversationChange"')
    expect(source).toContain('@menu-command="handleConversationMenuCommand"')
    expect(source).not.toContain('<el-scrollbar')
    expect(source).not.toContain("from 'vue-element-plus-x'")
    expect(source).not.toContain('ElementPlusX')
  })

  it('keeps business rendering in typed slots and does not let the UI library own chat state', () => {
    const source = readFrontendSource('src/views/Main/chat/components/ConversationList/index.vue')

    expect(source).toContain('interface ConversationListItem extends ConversationItem')
    expect(source).toContain('const conversationItems = computed<ConversationListItem[]>(() =>')
    expect(source).toContain('function toConversationListItem')
    expect(source).toContain('<template #label="{ item }">')
    expect(source).toContain('select: [conv: ConversationItem]')
    expect(source).toContain('chatStore.selectConversation')
    expect(source).not.toContain('legacyRequest')
  })

  it('keeps touched conversation list files strict without loose TS types', () => {
    for (const file of [
      'src/views/Main/chat/components/ConversationList/index.vue',
      'src/views/Main/chat/components/ConversationList/ConversationListItemContent.vue',
      'src/types/vue-element-plus-x-es.d.ts',
      'tests/shared/chat/chat-conversation-list-element-plus-x.test.ts',
    ]) {
      expect(readFrontendSource(file), file).not.toMatch(forbiddenLooseTypePattern)
    }
  })
})

