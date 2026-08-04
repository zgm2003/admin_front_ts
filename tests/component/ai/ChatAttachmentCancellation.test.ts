// @vitest-environment happy-dom

import { effectScope, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import MessageInput from '@/views/Main/ai/chat/components/MessageInput/index.vue'
import { useAttachments } from '@/views/Main/ai/chat/components/MessageInput/use-attachments'

const mocks = vi.hoisted(() => ({
  getUploadToken: vi.fn(),
  uploadFileToCloud: vi.fn(),
  validateFile: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ref(false) }))
vi.mock('@/components/DIcon', () => ({ DIcon: { template: '<i />' } }))
vi.mock('@/components/EmojiPicker', () => ({ EmojiPicker: { template: '<div />' } }))
vi.mock('@/views/Main/ai/chat/components/MessageInput/use-speech-input', () => ({
  useSpeechInput: () => ({ isRecording: ref(false), toggleVoiceInput: vi.fn() }),
}))
vi.mock('element-plus', () => ({
  ElNotification: { warning: mocks.warning, error: mocks.error },
}))
vi.mock('@/lib/upload', () => ({
  getUploadToken: mocks.getUploadToken,
  uploadFileToCloud: mocks.uploadFileToCloud,
  validateFile: mocks.validateFile,
}))

function capabilities(): AiAgentEffectiveCapabilities {
  return {
    input_modalities: ['text', 'image', 'file'],
    output_modalities: ['text'],
    supports_tools: false,
    supports_streaming: true,
    supports_structured_output: false,
    runtime_parameters: {
      temperature: { supported: true, default: 1, min: 0, max: 2 },
    },
    attachments: {
      max_attachments_per_message: 5,
      max_message_attachment_bytes: 50 * 1024 * 1024,
      image: {
        enabled: true,
        mime_types: ['image/png'],
        max_files: 5,
        max_file_bytes: 10 * 1024 * 1024,
      },
      native_file: {
        enabled: true,
        disabled_reason: '',
        max_files_per_message: 5,
        max_file_bytes_exclusive: 50 * 1024 * 1024,
        max_request_file_bytes: 50 * 1024 * 1024,
        accepted_extensions: ['pdf', 'md', 'docx'],
      },
    },
  }
}

function uploadConfig(name: string) {
  return {
    provider: 'cos',
    key: `ai_chat_attachments/${name}`,
    bucket: 'bucket',
    region: 'region',
    bucket_domain: 'https://files.example.test',
    start_time: 1,
    expired_time: 2,
    credentials: { tmp_secret_id: 'id', tmp_secret_key: 'key', session_token: 'token' },
    rule: { max_size_mb: 100, image_exts: ['png'], file_exts: ['pdf', 'md', 'docx'] },
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function createHarness() {
  const scope = effectScope()
  const state = scope.run(() => useAttachments(() => capabilities(), () => true))
  if (!state) throw new Error('attachment harness was not created')
  return { scope, state }
}

function fileTransfer(files: File[]) {
  return { files } as unknown as DataTransfer
}

const ButtonStub = {
  inheritAttrs: false,
  props: ['disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
}

describe('AI chat attachment cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUploadToken.mockImplementation(({ fileName }: { fileName: string }) => (
      Promise.resolve(uploadConfig(fileName))
    ))
    mocks.uploadFileToCloud.mockImplementation((file: File) => Promise.resolve({
      url: `https://files.example.test/ai_chat_attachments/${file.name}`,
      key: `ai_chat_attachments/${file.name}`,
    }))
  })

  afterEach(() => vi.restoreAllMocks())

  it('does not start the cloud upload when a removed attachment receives a late token', async () => {
    const token = deferred<ReturnType<typeof uploadConfig>>()
    mocks.getUploadToken.mockReturnValueOnce(token.promise)
    const { scope, state } = createHarness()
    const adding = state.addFiles([
      new File(['pdf'], 'removed.pdf', { type: 'application/pdf', lastModified: 1 }),
    ])
    await vi.waitFor(() => expect(mocks.getUploadToken).toHaveBeenCalledOnce())

    const signal = mocks.getUploadToken.mock.calls[0]?.[1] as AbortSignal
    state.removeAttachment(state.pendingAttachments.value[0]!.id)
    expect(signal.aborted).toBe(true)
    token.resolve(uploadConfig('removed.pdf'))
    await adding

    expect(state.pendingAttachments.value).toHaveLength(0)
    expect(mocks.uploadFileToCloud).not.toHaveBeenCalled()
    expect(mocks.error).not.toHaveBeenCalled()
    scope.stop()
  })

  it('does not restore an attachment when a cleared cloud upload completes late', async () => {
    const uploaded = deferred<{ url: string; key: string }>()
    mocks.uploadFileToCloud.mockReturnValueOnce(uploaded.promise)
    const { scope, state } = createHarness()
    const adding = state.addFiles([
      new File(['pdf'], 'cleared.pdf', { type: 'application/pdf', lastModified: 1 }),
    ])
    await vi.waitFor(() => expect(mocks.uploadFileToCloud).toHaveBeenCalledOnce())

    const signal = mocks.uploadFileToCloud.mock.calls[0]?.[2] as AbortSignal
    state.clearAttachments()
    expect(signal.aborted).toBe(true)
    uploaded.resolve({
      url: 'https://files.example.test/cleared.pdf',
      key: 'ai_chat_attachments/cleared.pdf',
    })
    await adding

    expect(state.pendingAttachments.value).toHaveLength(0)
    expect(mocks.error).not.toHaveBeenCalled()
    scope.stop()
  })

  it('keeps seeded attachments isolated from an older upload generation', async () => {
    const uploaded = deferred<{ url: string; key: string }>()
    mocks.uploadFileToCloud.mockReturnValueOnce(uploaded.promise)
    const { scope, state } = createHarness()
    const adding = state.addFiles([
      new File(['old'], 'old.pdf', { type: 'application/pdf', lastModified: 1 }),
    ])
    await vi.waitFor(() => expect(mocks.uploadFileToCloud).toHaveBeenCalledOnce())
    const signal = mocks.uploadFileToCloud.mock.calls[0]?.[2] as AbortSignal

    state.seedAttachments([{
      type: 'file',
      object_key: 'ai_chat_attachments/current.pdf',
      url: 'https://files.example.test/current.pdf',
      mime_type: 'application/pdf',
      name: 'current.pdf',
      size: 7,
    }])
    expect(signal.aborted).toBe(true)
    uploaded.resolve({
      url: 'https://files.example.test/old.pdf',
      key: 'ai_chat_attachments/old.pdf',
    })
    await adding

    expect(state.pendingAttachments.value).toHaveLength(1)
    expect(state.pendingAttachments.value[0]).toMatchObject({
      name: 'current.pdf',
      objectKey: 'ai_chat_attachments/current.pdf',
      status: 'uploaded',
    })
    expect(mocks.error).not.toHaveBeenCalled()
    scope.stop()
  })

  it('does not report an upload error when removal aborts the request', async () => {
    mocks.uploadFileToCloud.mockImplementation((
      _file: File,
      _config: ReturnType<typeof uploadConfig>,
      signal: AbortSignal,
    ) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        reject(new DOMException('Upload aborted', 'AbortError'))
      }, { once: true })
    }))
    const { scope, state } = createHarness()
    const adding = state.addFiles([
      new File(['pdf'], 'cancelled.pdf', { type: 'application/pdf', lastModified: 1 }),
    ])
    await vi.waitFor(() => expect(mocks.uploadFileToCloud).toHaveBeenCalledOnce())

    state.removeAttachment(state.pendingAttachments.value[0]!.id)
    await adding

    expect(state.pendingAttachments.value).toHaveLength(0)
    expect(mocks.error).not.toHaveBeenCalled()
    scope.stop()
  })

  it('cancels and clears an in-flight upload when the composer conversation changes', async () => {
    const uploaded = deferred<{ url: string; key: string }>()
    mocks.uploadFileToCloud.mockReturnValueOnce(uploaded.promise)
    const wrapper = mount(MessageInput, {
      props: { sending: false, agentId: 7, conversationId: 11, capabilities: capabilities() },
      global: {
        stubs: {
          ElButton: ButtonStub,
          ElIcon: { template: '<i><slot /></i>' },
          ElPopover: { template: '<div><slot name="reference" /></div>' },
          ElTooltip: { template: '<span><slot /></span>' },
          RuntimeParamsPanel: true,
        },
      },
    })
    await wrapper.trigger('drop', {
      dataTransfer: fileTransfer([
        new File(['pdf'], 'old-conversation.pdf', { type: 'application/pdf', lastModified: 1 }),
      ]),
    })
    await vi.waitFor(() => expect(mocks.uploadFileToCloud).toHaveBeenCalledOnce())

    const signal = mocks.uploadFileToCloud.mock.calls[0]?.[2] as AbortSignal
    await wrapper.setProps({ conversationId: 12 })
    expect(signal.aborted).toBe(true)
    expect(wrapper.find('[data-attachment-kind="file"]').exists()).toBe(false)

    uploaded.resolve({
      url: 'https://files.example.test/old-conversation.pdf',
      key: 'ai_chat_attachments/old-conversation.pdf',
    })
    await flushPromises()
    expect(wrapper.find('[data-attachment-kind="file"]').exists()).toBe(false)
    expect(mocks.error).not.toHaveBeenCalled()
  })
})
