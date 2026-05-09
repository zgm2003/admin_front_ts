import { computed, shallowRef } from 'vue'
import { AiAgentApi } from '@/api/ai/agents'
import type { Agent } from './types'

const STORAGE_KEY = 'ai_chat_selected_agent'

export function useAgents() {
  const agents = shallowRef<Agent[]>([])
  const selectedAgentId = shallowRef<number | null>(null)
  const loading = shallowRef(false)

  const selectedAgent = computed(() => agents.value.find((agent) => agent.id === selectedAgentId.value))

  function persistSelection(agentId: number | null) {
    try {
      if (agentId) {
        localStorage.setItem(STORAGE_KEY, String(agentId))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // localStorage can be unavailable in private mode.
    }
  }

  function restoreSelection(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const id = raw ? Number(raw) : 0
      if (Number.isInteger(id) && agents.value.some((agent) => agent.id === id)) {
        selectedAgentId.value = id
        return true
      }
    } catch {
      // Ignore storage errors.
    }
    return false
  }

  function selectAgent(agent: Agent) {
    selectedAgentId.value = agent.id
    persistSelection(agent.id)
  }

  async function loadAgents() {
    loading.value = true
    try {
      const response = await AiAgentApi.options()
      agents.value = response.list
      if (agents.value.length > 0 && !restoreSelection() && selectedAgentId.value === null) {
        selectedAgentId.value = agents.value[0]!.id
        persistSelection(selectedAgentId.value)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    agents,
    selectedAgentId,
    loading,
    selectedAgent,
    loadAgents,
    selectAgent,
  }
}
