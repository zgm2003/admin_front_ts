import type { AiAgentCapabilities, AiAgentMutationParams } from '@/api/ai/agents'

export type AgentCapabilityState = Required<AiAgentCapabilities>

export interface AgentFormState {
  id?: number
  name: string
  model_id: number | ''
  avatar: string
  system_prompt: string
  mode: string
  scene: string
  scene_codes: string[]
  capabilities: AgentCapabilityState
  runtime_config: Record<string, unknown> | null
  policy: Record<string, unknown> | null
  status: number
  tool_ids: number[]
}

export function createDefaultCapabilities(): AgentCapabilityState {
  return {
    chat: true,
    tools: false,
    rag: false,
    workflow: false,
    image: false,
    file: false,
    memory: true,
  }
}

export function createDefaultAgentForm(): AgentFormState {
  return {
    name: '',
    model_id: '',
    avatar: '',
    system_prompt: '',
    mode: 'chat',
    scene: '',
    scene_codes: [],
    capabilities: createDefaultCapabilities(),
    runtime_config: null,
    policy: null,
    status: 1,
    tool_ids: [],
  }
}

export function getAgentSceneTagType(scene?: string | null): 'warning' | 'info' {
  if (scene === 'goods_script') return 'warning'
  return 'info'
}

export function toAgentMutationPayload(form: AgentFormState): AiAgentMutationParams {
  if (typeof form.model_id !== 'number') {
    throw new TypeError('model_id is required')
  }

  const firstScene = form.scene_codes[0] || form.scene || null
  const payload: AiAgentMutationParams = {
    name: form.name,
    model_id: form.model_id,
    avatar: form.avatar || null,
    system_prompt: form.system_prompt || null,
    mode: form.mode || 'chat',
    scene: firstScene,
    scene_codes: form.scene_codes,
    capabilities: form.capabilities,
    runtime_config: form.runtime_config,
    policy: form.policy,
    status: form.status,
    tool_ids: form.tool_ids,
  }

  if (typeof form.id === 'number') {
    payload.id = form.id
  }

  return payload
}
