import { describe, expect, it } from 'vitest'

const {
  createDefaultAgentForm,
  getAgentSceneTagType,
  toAgentMutationPayload,
} = await import('../../../src/views/Main/ai/agents/composables/helpers')

describe('agent helpers', () => {
  it('creates a stable default agent form', () => {
    expect(createDefaultAgentForm()).toEqual({
      name: '',
      model_id: '',
      avatar: '',
      system_prompt: '',
      mode: 'chat',
      scene: '',
      status: 1,
      tool_ids: [],
    })
  })

  it('maps scenes to stable tag types', () => {
    expect(getAgentSceneTagType('goods_script')).toBe('warning')
    expect(getAgentSceneTagType('chat')).toBe('info')
    expect(getAgentSceneTagType('')).toBe('info')
  })

  it('builds mutation payloads without leaking chat-only tool_ids', () => {
    expect(toAgentMutationPayload({
      name: 'demo',
      model_id: 3,
      avatar: '',
      system_prompt: '',
      mode: 'chat',
      scene: '',
      status: 1,
      tool_ids: [1, 2],
    })).toEqual({
      name: 'demo',
      model_id: 3,
      avatar: null,
      system_prompt: null,
      mode: 'chat',
      scene: null,
      status: 1,
    })

    expect(toAgentMutationPayload({
      id: 9,
      name: 'tool-agent',
      model_id: 4,
      avatar: '/avatar.png',
      system_prompt: 'use tools',
      mode: 'tool',
      scene: 'goods_script',
      status: 2,
      tool_ids: [7, 8],
    })).toEqual({
      id: 9,
      name: 'tool-agent',
      model_id: 4,
      avatar: '/avatar.png',
      system_prompt: 'use tools',
      mode: 'tool',
      scene: 'goods_script',
      status: 2,
      tool_ids: [7, 8],
    })
  })

  it('rejects payload creation when model_id is still empty', () => {
    expect(() => toAgentMutationPayload(createDefaultAgentForm())).toThrow('model_id is required')
  })
})
