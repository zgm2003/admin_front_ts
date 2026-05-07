import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontendSource(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

const forbiddenLooseTypePattern = new RegExp(`\\b${'an'}${'y'}\\b|as ${'an'}${'y'}|Record<string, ${'an'}${'y'}>`)

describe('chat message input composition boundaries', () => {
  it('keeps MessageInput as the composer orchestrator instead of a mega component', () => {
    const source = readFrontendSource('src/views/Main/chat/components/MessageInput/index.vue')

    expect(source).toContain("import ComposerToolbar from './ComposerToolbar.vue'")
    expect(source).toContain("import PendingAttachmentList from './PendingAttachmentList.vue'")
    expect(source).toContain("import InputStatusFooter from './InputStatusFooter.vue'")
    expect(source).toContain("import { useChatPendingAttachments")
    expect(source).toContain("import { useChatVoiceInput")
    expect(source).toContain('<ComposerToolbar')
    expect(source).toContain('<PendingAttachmentList')
    expect(source).toContain('<InputStatusFooter')
    expect(source).not.toContain('interface PendingAttachment')
    expect(source.split(/\r?\n/).length).toBeLessThanOrEqual(520)
  })

  it('keeps attachment preview ownership in focused composer files', () => {
    for (const file of [
      'src/views/Main/chat/components/MessageInput/useChatPendingAttachments.ts',
      'src/views/Main/chat/components/MessageInput/useChatVoiceInput.ts',
      'src/views/Main/chat/components/MessageInput/PendingAttachmentList.vue',
      'src/views/Main/chat/components/MessageInput/ComposerToolbar.vue',
      'src/views/Main/chat/components/MessageInput/InputStatusFooter.vue',
    ]) {
      expect(existsSync(resolve(process.cwd(), file)), file).toBe(true)
    }

    const hookSource = readFrontendSource('src/views/Main/chat/components/MessageInput/useChatPendingAttachments.ts')
    expect(hookSource).toContain('export interface PendingAttachment')
    expect(hookSource).toContain('URL.createObjectURL')
    expect(hookSource).toContain('URL.revokeObjectURL')

    const voiceSource = readFrontendSource('src/views/Main/chat/components/MessageInput/useChatVoiceInput.ts')
    expect(voiceSource).toContain('export function useChatVoiceInput')
    expect(voiceSource).toContain('SpeechRecognition')

    const listSource = readFrontendSource('src/views/Main/chat/components/MessageInput/PendingAttachmentList.vue')
    expect(listSource).toContain('attachments: readonly PendingAttachment[]')
    expect(listSource).toContain('remove: [id: string]')

    const toolbarSource = readFrontendSource('src/views/Main/chat/components/MessageInput/ComposerToolbar.vue')
    expect(toolbarSource).toContain('defineProps<{')
    expect(toolbarSource).toContain('defineEmits<{')
    expect(toolbarSource).toContain("'emoji-select': [emoji: string]")
  })

  it('keeps touched composer files strict without loose TS types', () => {
    for (const file of [
      'src/views/Main/chat/components/MessageInput/index.vue',
      'src/views/Main/chat/components/MessageInput/useChatPendingAttachments.ts',
      'src/views/Main/chat/components/MessageInput/useChatVoiceInput.ts',
      'src/views/Main/chat/components/MessageInput/PendingAttachmentList.vue',
      'src/views/Main/chat/components/MessageInput/ComposerToolbar.vue',
      'src/views/Main/chat/components/MessageInput/InputStatusFooter.vue',
      'tests/shared/chat/chat-input-composition.test.ts',
    ]) {
      expect(readFrontendSource(file), file).not.toMatch(forbiddenLooseTypePattern)
    }
  })
})
