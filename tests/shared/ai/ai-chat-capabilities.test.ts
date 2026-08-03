import { afterEach, describe, expect, it, vi } from 'vitest'
import { AiMessageApi } from '@/api/ai/messages'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import {
  detectCapabilityConflicts,
  prepareCapabilityTransition,
} from '@/views/Main/ai/chat/components/MessageInput/capability-transition'
import { selectAttachmentFiles } from '@/views/Main/ai/chat/components/MessageInput/use-attachments'
import { installApiClientHarness } from '../../helpers/api-client'

const cleanups: Array<() => void> = []
afterEach(() => cleanups.splice(0).forEach((cleanup) => cleanup()))

function capabilities(input: {
  image?: boolean
  mimeTypes?: string[]
  maxFiles?: number
  maxBytes?: number
  temperature?: boolean
} = {}): AiAgentEffectiveCapabilities {
  return {
    input_modalities: input.image ? ['text', 'image'] : ['text'],
    output_modalities: ['text'], supports_tools: false, supports_streaming: true,
    supports_structured_output: false,
    runtime_parameters: {
      temperature: { supported: input.temperature ?? false, default: 1, min: 0, max: 2 },
    },
    attachments: {
      max_attachments_per_message: 5,
      max_message_attachment_bytes: 50 * 1024 * 1024,
      image: {
        enabled: input.image ?? false,
        mime_types: input.mimeTypes ?? [],
        max_files: input.maxFiles ?? 0,
        max_file_bytes: input.maxBytes ?? 0,
      },
      native_file: {
        enabled: false,
        disabled_reason: 'official_model_unsupported',
        max_files_per_message: 5,
        max_file_bytes_exclusive: 50 * 1024 * 1024,
        max_request_file_bytes: 50 * 1024 * 1024,
        accepted_extensions: [],
      },
    },
  }
}

describe('AI chat effective capabilities', () => {
  it('uses server MIME, count, and byte limits for image selection', () => {
    const files = [
      { name: 'first.png', type: 'image/png', size: 100 },
      { name: 'too-large.png', type: 'image/png', size: 501 },
      { name: 'wrong.jpg', type: 'image/jpeg', size: 100 },
      { name: 'extra.png', type: 'image/png', size: 100 },
    ]
    const result = selectAttachmentFiles(files.map((file, index) => new File(['x'], file.name, {
      type: file.type,
      lastModified: index,
    })).map((file, index) => Object.defineProperty(file, 'size', { value: files[index]!.size })), capabilities({
      image: true, mimeTypes: ['image/png'], maxFiles: 1, maxBytes: 500,
    }).attachments, [])

    expect(result.accepted.map((item) => item.file.name)).toEqual(['first.png'])
    expect(result.rejected).toEqual({
      unsupported: 1, tooLarge: 1, limit: 1, duplicate: 0, totalSize: 0,
    })
  })

  it('cancels an incompatible agent switch without clearing composer state', async () => {
    const state = {
      attachments: [
        { id: 'png', kind: 'image' as const, name: 'a.png', mimeType: 'image/png', size: 100 },
        { id: 'jpg', kind: 'image' as const, name: 'a.jpg', mimeType: 'image/jpeg', size: 100 },
      ],
      temperatureEnabled: true,
    }
    const target = capabilities({ image: true, mimeTypes: ['image/png'], maxFiles: 1, maxBytes: 500 })
    expect(detectCapabilityConflicts(state, target)).toEqual({
      incompatibleAttachmentIds: ['jpg'], temperature: true,
    })

    const clear = vi.fn()
    await expect(prepareCapabilityTransition({
      state,
      target,
      confirm: () => Promise.reject(new Error('cancel')),
      clear,
    })).resolves.toBe(false)
    expect(clear).not.toHaveBeenCalled()
  })

  it('clears only invalid state after a confirmed agent switch', async () => {
    const state = {
      attachments: [
        { id: 'png', kind: 'image' as const, name: 'a.png', mimeType: 'image/png', size: 100 },
        { id: 'jpg', kind: 'image' as const, name: 'a.jpg', mimeType: 'image/jpeg', size: 100 },
      ],
      temperatureEnabled: true,
    }
    const target = capabilities({ image: true, mimeTypes: ['image/png'], maxFiles: 1, maxBytes: 500 })
    const clear = vi.fn()
    await expect(prepareCapabilityTransition({
      state,
      target,
      confirm: () => Promise.resolve(),
      clear,
    })).resolves.toBe(true)
    expect(clear).toHaveBeenCalledWith({ incompatibleAttachmentIds: ['jpg'], temperature: true })
  })

  it('sends only the authoritative image object key and enabled runtime fields', async () => {
    const harness = installApiClientHarness({
      command_id: 1, conversation_id: 9, request_id: 'request-1', user_message_id: 10,
      state: 'pending',
    })
    cleanups.push(harness.uninstall)

    await AiMessageApi.send({
      conversation_id: 9,
      content: 'describe',
      request_id: 'request-1',
      attachments: [{
        type: 'image', object_key: 'ai_chat_attachments/input.png',
        url: 'https://files.example.test/input.png', mime_type: 'image/png', name: 'input.png', size: 4,
      }],
      runtime_params: { temperature: 0.4 },
    })

    expect(harness.requests[0]?.body).toEqual({
      content: 'describe',
      request_id: 'request-1',
      attachments: [{
        type: 'image', object_key: 'ai_chat_attachments/input.png',
        url: 'https://files.example.test/input.png', mime_type: 'image/png', name: 'input.png', size: 4,
      }],
      runtime_params: { temperature: 0.4 },
    })
    expect(JSON.stringify(harness.requests[0]?.body)).not.toMatch(/max_tokens/)
  })
})
