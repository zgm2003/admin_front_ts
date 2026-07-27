// @vitest-environment happy-dom

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ToolGenerateDialog from '@/views/Main/ai/tools/components/ToolGenerateDialog/index.vue'
import { createApiError } from '@/modules/http/error'

const mocks = vi.hoisted(() => ({
  generateDraft: vi.fn(),
  generatePageInit: vi.fn(async () => ({ agent_options: [{ label: 'Agent', value: 7 }] })),
  createAiRequestId: vi.fn(),
  notifyError: vi.fn(),
}))

vi.mock('@/api/ai/tools', () => ({
  AiToolApi: {
    generateDraft: mocks.generateDraft,
    generatePageInit: mocks.generatePageInit,
  },
}))
vi.mock('@/api/ai/request-id', () => ({ createAiRequestId: mocks.createAiRequestId }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ({ value: false }) }))
vi.mock('element-plus', () => ({ ElNotification: { error: mocks.notifyError, warning: vi.fn() } }))

const FormStub = {
  template: '<form><slot /></form>',
  setup(_props: unknown, { expose }: { expose: (value: unknown) => void }) {
    expose({ validate: async () => true, clearValidate: () => undefined })
  },
}
const InputStub = {
  props: ['modelValue', 'type'],
  emits: ['update:modelValue'],
  template: `<textarea v-if="type === 'textarea'" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />
    <input v-else :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
}
const SelectStub = {
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
  template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', Number($event.target.value))"><option value="7">Agent</option></select>',
}

function mountDialog() {
  return mount(ToolGenerateDialog, {
    props: { modelValue: false },
    global: {
      stubs: {
        AppDialog: { template: '<section><slot name="header"/><slot/><slot name="footer"/></section>' },
        ElForm: FormStub,
        ElFormItem: { template: '<label><slot /></label>' },
        ElInput: InputStub,
        ElSelectV2: SelectStub,
        ElAlert: true,
        ElText: true,
        ElButton: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
      },
    },
  })
}

describe('ToolGenerateDialog paid operation identity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createAiRequestId.mockReset()
    mocks.generateDraft.mockReset()
    mocks.createAiRequestId.mockReturnValueOnce('request-a').mockReturnValueOnce('request-b')
    mocks.generateDraft
      .mockRejectedValueOnce(new Error('transport failed'))
      .mockResolvedValue({ ok: false, draft: null, warnings: [], clarifying_questions: [], usage: null })
  })

  it('reuses an identity for unchanged transport replay and rotates after form changes', async () => {
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flushPromises()
    await wrapper.get('textarea').setValue('Create a lookup tool')

    const submit = wrapper.findAll('button').at(-1)!
    await submit.trigger('click')
    await flushPromises()
    await submit.trigger('click')
    await flushPromises()

    expect(mocks.generateDraft.mock.calls.slice(0, 2).map(([body]) => body.request_id)).toEqual([
      'request-a',
      'request-a',
    ])

    await wrapper.get('textarea').setValue('Create a changed lookup tool')
    await submit.trigger('click')
    await flushPromises()

    expect(mocks.generateDraft.mock.calls[2]?.[0].request_id).toBe('request-b')
    expect(mocks.createAiRequestId).toHaveBeenCalledTimes(2)
  })

  it('rotates after a definitive HTTP business failure', async () => {
    mocks.generateDraft.mockReset()
    mocks.generateDraft
      .mockRejectedValueOnce(createApiError({
        kind: 'business',
        code: 'ai.billing.insufficient_balance',
        retryable: false,
        messageKey: 'ai.billing.insufficient_balance',
        data: { wallet_path: '/profile/wallet', recharge_path: '/payment/recharge' },
      }))
      .mockResolvedValue({ ok: false, draft: null, warnings: [], clarifying_questions: [], usage: null })
    const wrapper = mountDialog()
    await wrapper.setProps({ modelValue: true })
    await flushPromises()
    await wrapper.get('textarea').setValue('Create a lookup tool')

    const submit = wrapper.findAll('button').at(-1)!
    await submit.trigger('click')
    await flushPromises()
    await submit.trigger('click')
    await flushPromises()

    expect(mocks.generateDraft.mock.calls.map(([body]) => body.request_id)).toEqual([
      'request-a',
      'request-b',
    ])
  })
})
