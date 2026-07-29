import { afterEach, describe, expect, it, vi } from 'vitest'
import { AiMessageApi } from '@/api/ai/messages'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import {
  detectCapabilityConflicts,
  prepareCapabilityTransition,
} from '@/views/Main/ai/chat/components/MessageInput/capability-transition'
import { selectImageFiles } from '@/views/Main/ai/chat/components/MessageInput/use-image-attachments'
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
      max_history: { supported: true, default: 20, min: 1, max: 50, transitional: true },
    },
    attachments: {
      image: {
        enabled: input.image ?? false,
        mime_types: input.mimeTypes ?? [],
        max_files: input.maxFiles ?? 0,
        max_file_bytes: input.maxBytes ?? 0,
      },
      native_file: { enabled: false },
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
    const result = selectImageFiles(files, capabilities({
      image: true, mimeTypes: ['image/png'], maxFiles: 1, maxBytes: 500,
    }).attachments.image, 0)

    expect(result.accepted.map((file) => file.name)).toEqual(['first.png'])
    expect(result.rejected).toEqual({ type: 1, size: 1, limit: 1 })
  })

  it('cancels an incompatible agent switch without clearing composer state', async () => {
    const state = {
      images: [
        { id: 'png', mimeType: 'image/png', size: 100 },
        { id: 'jpg', mimeType: 'image/jpeg', size: 100 },
      ],
      temperatureEnabled: true,
    }
    const target = capabilities({ image: true, mimeTypes: ['image/png'], maxFiles: 1, maxBytes: 500 })
    expect(detectCapabilityConflicts(state, target)).toEqual({
      invalidImageIds: ['jpg'], temperature: true,
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
      images: [
        { id: 'png', mimeType: 'image/png', size: 100 },
        { id: 'jpg', mimeType: 'image/jpeg', size: 100 },
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
    expect(clear).toHaveBeenCalledWith({ invalidImageIds: ['jpg'], temperature: true })
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
      attachments: [{ type: 'image', object_key: 'ai_chat_images/input.png', name: 'input.png' }],
      runtime_params: { temperature: 0.4, max_history: 8 },
    })

    expect(harness.requests[0]?.body).toEqual({
      content: 'describe',
      request_id: 'request-1',
      attachments: [{ type: 'image', object_key: 'ai_chat_images/input.png', name: 'input.png' }],
      runtime_params: { temperature: 0.4, max_history: 8 },
    })
    expect(JSON.stringify(harness.requests[0]?.body)).not.toMatch(/max_tokens|"url"|mime|size/)
  })
})
