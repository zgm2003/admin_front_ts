import type { AiAgentMutationParams } from '@/api/ai/agents'

export interface AgentFormState {
  id?: number
  name: string
  model_id: number | ''
  avatar: string
  system_prompt: string
  mode: string
  scene: string
  status: number
  tool_ids: number[]
}

export function createDefaultAgentForm(): AgentFormState {
  return {
    name: '',
    model_id: '',
    avatar: '',
    system_prompt: '',
    mode: 'chat',
    scene: '',
    status: 1,
    tool_ids: [],
  }
}

export function getAgentSceneTagType(scene?: string | null): 'warning' | 'primary' | 'info' {
  if (scene === 'goods_script') return 'warning'
  if (scene?.startsWith('code_gen')) return 'primary'
  return 'info'
}

export function toAgentMutationPayload(form: AgentFormState): AiAgentMutationParams {
  if (typeof form.model_id !== 'number') {
    throw new TypeError('model_id is required')
  }

  const payload: AiAgentMutationParams = {
    name: form.name,
    model_id: form.model_id,
    avatar: form.avatar || null,
    system_prompt: form.system_prompt || null,
    mode: form.mode,
    scene: form.scene || null,
    status: form.status,
  }

  if (typeof form.id === 'number') {
    payload.id = form.id
  }

  if (form.mode === 'tool') {
    payload.tool_ids = form.tool_ids
  }

  return payload
}
