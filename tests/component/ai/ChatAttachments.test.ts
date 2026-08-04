// @vitest-environment happy-dom

import { effectScope, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AiAgentEffectiveCapabilities } from '@/api/ai/agents'
import MessageInput from '@/views/Main/ai/chat/components/MessageInput/index.vue'
import {
  selectAttachmentFiles,
  useAttachments,
  type PendingAttachment,
} from '@/views/Main/ai/chat/components/MessageInput/use-attachments'

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

function capabilities(input: { nativeFile?: boolean } = {}): AiAgentEffectiveCapabilities {
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
        enabled: input.nativeFile ?? true,
        disabled_reason: input.nativeFile === false ? 'provider_api_protocol_unsupported' : '',
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

function createHarness(agentCapabilities = capabilities()) {
  const scope = effectScope()
  const state = scope.run(() => useAttachments(() => agentCapabilities, () => true))
  if (!state) throw new Error('attachment harness was not created')
  return { scope, state }
}

function fileTransfer(files: File[]) {
  return { files } as unknown as DataTransfer
}

function clipboardTransfer(files: File[]) {
  return {
    items: files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })),
  } as unknown as DataTransfer
}

const ButtonStub = {
  inheritAttrs: false,
  props: ['disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
}

function mountInput(agentCapabilities = capabilities()) {
  return mount(MessageInput, {
    props: { sending: false, agentId: 7, capabilities: agentCapabilities },
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
}

describe('AI chat attachments', () => {
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

  it.each(['picker', 'drop', 'paste'] as const)('adds a PDF through %s into the same queue', async (source) => {
    const { scope, state } = createHarness()
    const file = new File(['pdf'], 'report.pdf', { type: 'application/pdf', lastModified: 1 })
    if (source === 'picker') {
      state.handleFileChange({ target: { files: [file], value: 'selected' } } as unknown as Event)
    } else if (source === 'drop') {
      state.handleDrop({ preventDefault: vi.fn(), dataTransfer: fileTransfer([file]) } as unknown as DragEvent)
    } else {
      const preventDefault = vi.fn()
      state.handlePaste({ preventDefault, clipboardData: clipboardTransfer([file]) } as unknown as ClipboardEvent)
      expect(preventDefault).toHaveBeenCalledOnce()
    }

    await flushPromises()
    await nextTick()

    expect(state.pendingAttachments.value).toHaveLength(1)
    expect(state.pendingAttachments.value[0]).toMatchObject({
      kind: 'file', status: 'uploaded', name: 'report.pdf',
    })
    expect(mocks.getUploadToken).toHaveBeenCalledWith(expect.objectContaining({
      folderName: 'ai_chat_attachments', fileKind: 'file', fileName: 'report.pdf',
    }), expect.any(AbortSignal))
    scope.stop()
  })

  it('does not consume a plain text paste', () => {
    const { scope, state } = createHarness()
    const preventDefault = vi.fn()
    state.handlePaste({
      preventDefault,
      clipboardData: { items: [{ kind: 'string', type: 'text/plain' }] },
    } as unknown as ClipboardEvent)

    expect(preventDefault).not.toHaveBeenCalled()
    expect(mocks.getUploadToken).not.toHaveBeenCalled()
    scope.stop()
  })

  it('retries only the failed attachment', async () => {
    mocks.uploadFileToCloud.mockImplementation((file: File) => (
      file.name === 'failed.pdf'
        ? Promise.reject(new Error('network'))
        : Promise.resolve({
          url: `https://files.example.test/${file.name}`,
          key: `ai_chat_attachments/${file.name}`,
        })
    ))
    const { scope, state } = createHarness()
    await state.addFiles([
      new File(['ok'], 'ready.pdf', { type: 'application/pdf', lastModified: 1 }),
      new File(['bad'], 'failed.pdf', { type: 'application/pdf', lastModified: 2 }),
    ])
    await flushPromises()

    expect(state.pendingAttachments.value.map((item: PendingAttachment) => item.status))
      .toEqual(['uploaded', 'failed'])
    mocks.uploadFileToCloud.mockResolvedValueOnce({
      url: 'https://files.example.test/failed.pdf',
      key: 'ai_chat_attachments/failed.pdf',
    })
    await state.retryAttachment(state.pendingAttachments.value[1]!.id)

    expect(mocks.uploadFileToCloud).toHaveBeenCalledTimes(3)
    expect(mocks.uploadFileToCloud.mock.calls[2]?.[0]).toMatchObject({ name: 'failed.pdf' })
    expect(state.pendingAttachments.value[1]?.status).toBe('uploaded')
    scope.stop()
  })

  it('does not expose storage references from upload failures', async () => {
    mocks.uploadFileToCloud.mockRejectedValueOnce(new Error(
      'PUT https://cos.example.test/ai_chat_attachments/private.pdf failed',
    ))
    const { scope, state } = createHarness()

    await state.addFiles([
      new File(['private'], 'private.pdf', { type: 'application/pdf', lastModified: 1 }),
    ])

    expect(state.pendingAttachments.value[0]?.status).toBe('failed')
    expect(state.pendingAttachments.value[0]?.error).toBe('aiChat.uploadFailed')
    expect(mocks.error).toHaveBeenCalledWith({ message: 'aiChat.uploadFailed' })
    scope.stop()
  })

  it('keeps incompatible files visible and blocks sending after an agent change', async () => {
    const current = ref(capabilities())
    const scope = effectScope()
    const state = scope.run(() => useAttachments(current, () => true))
    if (!state) throw new Error('attachment harness was not created')
    await state.addFiles([new File(['pdf'], 'report.pdf', { type: 'application/pdf', lastModified: 1 })])
    await flushPromises()

    current.value = capabilities({ nativeFile: false })
    await nextTick()

    expect(state.pendingAttachments.value).toHaveLength(1)
    expect(state.hasIncompatibleAttachment.value).toBe(true)
    expect(state.blockingReason.value).toBe('provider_api_protocol_unsupported')
    expect(state.canSubmitAttachments.value).toBe(false)
    scope.stop()
  })

  it('renders a file card, sends all attachment facts, and blocks without deleting it after an agent change', async () => {
    const wrapper = mountInput()
    const file = new File(['pdf'], 'report.pdf', { type: 'application/pdf', lastModified: 1 })
    await wrapper.trigger('drop', { dataTransfer: fileTransfer([file]) })
    await flushPromises()

    expect(wrapper.get('[data-attachment-kind="file"]').text()).toContain('report.pdf')
    await wrapper.get('button[aria-label="aiChat.send"]').trigger('click')
    expect(wrapper.emitted('send')?.[0]?.[1]).toEqual([{
      request: {
        type: 'file',
        object_key: 'ai_chat_attachments/report.pdf',
        url: 'https://files.example.test/ai_chat_attachments/report.pdf',
        mime_type: 'application/pdf',
        name: 'report.pdf',
        size: 3,
      },
      preview: {
        type: 'file',
        object_key: 'ai_chat_attachments/report.pdf',
        url: 'https://files.example.test/ai_chat_attachments/report.pdf',
        mime_type: 'application/pdf',
        name: 'report.pdf',
        size: 3,
      },
    }])

    await wrapper.setProps({ capabilities: capabilities({ nativeFile: false }) })
    await nextTick()
    expect(wrapper.get('[data-attachment-kind="file"]').text()).toContain('report.pdf')
    expect(wrapper.text()).toContain('aiChat.providerApiProtocolUnsupported')
    expect(wrapper.get('button[aria-label="aiChat.send"]').attributes('disabled')).toBeDefined()
  })

  it('seeds historical attachments without re-uploading and emits the complete remaining set', () => {
    const { scope, state } = createHarness()
    state.seedAttachments([
      {
        type: 'image', object_key: 'ai_chat_attachments/a.png',
        url: 'https://files.example.test/a.png', mime_type: 'image/png', name: 'a.png', size: 4,
      },
      {
        type: 'file', object_key: 'ai_chat_attachments/report.pdf',
        url: 'https://files.example.test/report.pdf', mime_type: 'application/pdf', name: 'report.pdf', size: 8,
      },
    ])

    expect(mocks.getUploadToken).not.toHaveBeenCalled()
    state.removeAttachment(state.pendingAttachments.value[0]!.id)
    expect(state.completedAttachments()).toEqual([{
      request: {
        type: 'file', object_key: 'ai_chat_attachments/report.pdf',
        url: 'https://files.example.test/report.pdf', mime_type: 'application/pdf', name: 'report.pdf', size: 8,
      },
      preview: {
        type: 'file', object_key: 'ai_chat_attachments/report.pdf',
        url: 'https://files.example.test/report.pdf', mime_type: 'application/pdf', name: 'report.pdf', size: 8,
      },
    }])
    scope.stop()
  })

  it('enforces the native-file count independently from the shared attachment limit', () => {
    const agentCapabilities = capabilities()
    agentCapabilities.attachments.native_file.max_files_per_message = 1

    const selection = selectAttachmentFiles([
      new File(['a'], 'first.pdf', { type: 'application/pdf', lastModified: 1 }),
      new File(['b'], 'second.pdf', { type: 'application/pdf', lastModified: 2 }),
      new File(['c'], 'diagram.png', { type: 'image/png', lastModified: 3 }),
    ], agentCapabilities.attachments, [])

    expect(selection.accepted.map(({ file }) => file.name)).toEqual(['first.pdf', 'diagram.png'])
    expect(selection.rejected.limit).toBe(1)
  })
})
