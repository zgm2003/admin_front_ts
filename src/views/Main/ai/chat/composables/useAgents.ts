import { ref, computed } from 'vue'
import { AiAgentApi } from '@/api/ai/agents'
import type { Agent } from './types'

const STORAGE_KEY = 'ai_chat_selected_agent'

export function useAgents() {
  const agents = ref<Agent[]>([])
  const selectedAgentId = ref<number | null>(null)
  const searchLoading = ref(false)
  const loading = ref(false)

  // 当前选中的智能体
  const selectedAgent = computed(() => {
    return agents.value.find(a => a.id === selectedAgentId.value)
  })

  // 智能体选项（el-select-v2 格式）
  const agentOptions = computed(() => {
    return agents.value.map(a => ({
      value: a.id,
      label: a.name,
      avatar: a.avatar,
      description: a.description
    }))
  })

  // 从 localStorage 恢复选择
  const restoreSelection = (): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const id = parseInt(saved, 10)
        if (!isNaN(id) && agents.value.some(a => a.id === id)) {
          selectedAgentId.value = id
          return true
        }
      }
    } catch { /* localStorage 不可用 */ }
    return false
  }

  // 持久化选择到 localStorage
  const persistSelection = (agentId: number | null) => {
    try {
      if (agentId !== null) {
        localStorage.setItem(STORAGE_KEY, String(agentId))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch { /* localStorage 不可用 */ }
  }

  // 选择智能体
  const selectAgent = (agent: Agent) => {
    selectedAgentId.value = agent.id
    persistSelection(agent.id)
  }

  // 加载智能体
  const loadAgents = async (keyword?: string) => {
    if (!keyword) {
      loading.value = true
    }
    searchLoading.value = true
    try {
      const res = await AiAgentApi.list({
        page_size: 50,  // 加载更多智能体
        status: 1,
        name: keyword || undefined
      })
      agents.value = res.list
      
      // 初始加载时，尝试恢复选择或选中第一个
      if (!keyword && agents.value.length > 0) {
        if (!restoreSelection() && !selectedAgentId.value) {
          selectedAgentId.value = agents.value[0]!.id
          persistSelection(selectedAgentId.value)
        }
      }
    } catch { /* ignore */ }
    searchLoading.value = false
    loading.value = false
  }

  // 搜索智能体
  const handleSearch = (keyword: string) => {
    loadAgents(keyword)
  }

  // 获取智能体头像
  const getAgentAvatar = (agentId: number | null | undefined, fallbackAvatar?: string) => {
    if (fallbackAvatar) return fallbackAvatar
    const agent = agents.value.find(a => a.id === agentId)
    return agent?.avatar || ''
  }

  // 获取智能体 modalities
  const getAgentModalities = (agentId: number | null | undefined) => {
    const agent = agents.value.find(a => a.id === agentId)
    return agent?.modalities || null
  }

  return {
    agents,
    selectedAgentId,
    searchLoading,
    loading,
    selectedAgent,
    agentOptions,
    loadAgents,
    handleSearch,
    selectAgent,
    restoreSelection,
    getAgentAvatar,
    getAgentModalities
  }
}
