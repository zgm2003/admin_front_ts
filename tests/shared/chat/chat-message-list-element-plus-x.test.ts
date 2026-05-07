import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('chat message list Element Plus X migration guard', () => {
  it('uses BubbleList and Bubble through local subpath imports only', () => {
    const source = readFrontendSource('src/views/Main/chat/components/MessageList/index.vue')

    expect(source).toContain("import BubbleList from 'vue-element-plus-x/es/BubbleList/index.js'")
    expect(source).toContain("import Bubble from 'vue-element-plus-x/es/Bubble/index.js'")
    expect(source).toContain('<BubbleList')
    expect(source).toContain(':list="messageBubbleItems"')
    expect(source).toContain('item-key="id"')
    expect(source).toContain('item-type="itemType"')
    expect(source).toContain(':virtual="true"')
    expect(source).toContain('@load-more-top="handleLoadMoreTop"')
    expect(source).not.toContain("from 'vue-element-plus-x'")
    expect(source).not.toContain('ElementPlusX')
  })

  it('keeps message paging, scroll and display state owned by our store layer', () => {
    const source = readFrontendSource('src/views/Main/chat/components/MessageList/index.vue')
    const storeSource = readFrontendSource('src/store/chat.ts')

    expect(source).toContain('interface MessageBubbleItem extends BubbleListItemProps')
    expect(source).toContain('const messageBubbleItems = computed<MessageBubbleItem[]>(() =>')
    expect(source).toContain('function toMessageBubbleItem')
    expect(source).toContain('async function handleLoadMoreTop')
    expect(source).toContain('await chatStore.loadMoreMessages()')
    expect(source).toContain('bubbleListRef.value?.loadMoreTopComplete()')
    expect(source).toContain('bubbleListRef.value?.scrollToBottom')
    expect(source).toContain('<template #item="{ item }">')
    expect(source).toContain('<MessageBubbleContent')

    expect(storeSource).toContain('messageIdSets: Map<number, Set<number>>')
    expect(storeSource).toContain('const existingIds = this.messageIdSets.get(conversationId)')
    expect(storeSource).toContain('filter(m => !existingIds.has(m.id))')
  })

  it('keeps message body rendering in focused typed components', () => {
    for (const file of [
      'src/views/Main/chat/components/MessageList/MessageBubbleContent.vue',
      'src/views/Main/chat/components/MessageList/index.vue',
    ]) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(true)
    }

    const contentSource = readFrontendSource('src/views/Main/chat/components/MessageList/MessageBubbleContent.vue')

    expect(contentSource).toContain('item: MessageBubbleDisplayItem')
    expect(contentSource).toContain('MessageType.Text')
    expect(contentSource).toContain('MessageType.Image')
    expect(contentSource).toContain('MessageType.File')
    expect(contentSource).toContain('downloadFile(item.content, item.fileName)')
    expect(contentSource).not.toContain('chatStore')
    expect(contentSource).not.toContain('ChatRoomApi')
  })

  it('keeps touched message list files strict without loose TS types', () => {
    for (const file of [
      'src/views/Main/chat/components/MessageList/index.vue',
      'src/views/Main/chat/components/MessageList/MessageBubbleContent.vue',
      'src/types/vue-element-plus-x-es.d.ts',
      'tests/shared/chat/chat-message-list-element-plus-x.test.ts',
    ]) {
      expect(readFrontendSource(file), file).not.toMatch(forbiddenLooseTypePattern)
    }
  })
})
