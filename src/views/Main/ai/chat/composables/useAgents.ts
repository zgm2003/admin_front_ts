import { computed, shallowRef } from 'vue'
import { AiAgentApi } from '@/api/ai/agents'
import { useAppKernel } from '@/app/injection'
import { userNamespace } from '@/modules/persistence/namespaces'
import { aiChatPreferencesCodec } from '@/modules/persistence/preferences'
import type { Agent } from './types'

const PREFERENCE_KEY = 'ai-chat'

export function useAgents() {
  const kernel = useAppKernel()
  const agents = shallowRef<Agent[]>([])
  const selectedAgentId = shallowRef<number | null>(null)
  const loading = shallowRef(false)

  const selectedAgent = computed(() => agents.value.find((agent) => agent.id === selectedAgentId.value))

  function currentNamespace() {
    const state = kernel.state.value
    return state.kind === 'ready' ? userNamespace(state.principal.userId) : null
  }

  function persistSelection(agentId: number | null) {
    const namespace = currentNamespace()
    if (!namespace) return
    if (agentId === null) kernel.persistence.remove(namespace, PREFERENCE_KEY)
    else kernel.persistence.write(namespace, PREFERENCE_KEY, aiChatPreferencesCodec, {
      selectedAgentId: agentId,
    })
  }

  function restoreSelection(): boolean {
    const namespace = currentNamespace()
    if (!namespace) return false
    const restored = kernel.persistence.read(namespace, PREFERENCE_KEY, aiChatPreferencesCodec)
    if (restored && agents.value.some((agent) => agent.id === restored.selectedAgentId)) {
      selectedAgentId.value = restored.selectedAgentId
      return true
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
