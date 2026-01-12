import { ref, computed } from 'vue'
import { AiAgentApi } from '@/api/ai/agents'
import type { Agent } from './types'

export function useAgents() {
  const agents = ref<Agent[]>([])
  const selectedAgentId = ref<number | null>(null)
  const searchLoading = ref(false)

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

  // 加载智能体
  const loadAgents = async (keyword?: string) => {
    searchLoading.value = true
    try {
      const res = await AiAgentApi.list({
        page_size: 10,
        status: 1,
        name: keyword || undefined
      })
      agents.value = res.list || []
      // 初始加载时默认选中第一个
      if (!keyword && agents.value.length > 0 && !selectedAgentId.value) {
        selectedAgentId.value = agents.value[0]?.id ?? null
      }
    } catch { /* ignore */ }
    searchLoading.value = false
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
    selectedAgent,
    agentOptions,
    loadAgents,
    handleSearch,
    getAgentAvatar,
    getAgentModalities
  }
}
