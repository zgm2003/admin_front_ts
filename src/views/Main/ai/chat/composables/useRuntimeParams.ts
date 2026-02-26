import { reactive, computed } from 'vue'

export interface RuntimeParams {
  temperature: number | null
  max_tokens: number | null
}

/**
 * 管理 AI 聊天运行时参数（temperature / max_tokens）
 * null 表示使用 Provider 官方默认值
 */
export function useRuntimeParams() {
  const params = reactive<RuntimeParams>({
    temperature: null,
    max_tokens: null,
  })

  /** 是否有任何自定义参数 */
  const hasCustomParams = computed(() =>
    params.temperature !== null || params.max_tokens !== null
  )

  /** 获取非 null 的参数对象（用于发送请求） */
  const getRequestParams = () => {
    const result: Record<string, number> = {}
    if (params.temperature !== null) result.temperature = params.temperature
    if (params.max_tokens !== null) result.max_tokens = params.max_tokens
    return result
  }

  /** 重置所有参数为默认值 */
  const reset = () => {
    params.temperature = null
    params.max_tokens = null
  }

  return {
    params,
    hasCustomParams,
    getRequestParams,
    reset,
  }
}
