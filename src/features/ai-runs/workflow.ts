import { shallowRef } from 'vue'
import {
  AiRunApi,
  type AiRunDetailResponse,
  type AiRunInitResponse,
  type AiRunItem,
  type AiRunListParams,
  type AiRunListResponse,
  type AiRunStatsByAgentItem,
  type AiRunStatsByAgentResponse,
  type AiRunStatsByDateItem,
  type AiRunStatsByDateResponse,
  type AiRunStatsByUserItem,
  type AiRunStatsByUserResponse,
  type AiRunStatsListParams,
  type AiRunStatsParams,
  type AiRunStatsSummaryResponse,
} from '@/api/ai/runs'
import type { KernelRealtime } from '@/app/kernel'
import type { ExecuteOptions } from '@/modules/http/client'
import { createResourceQuery } from '@/modules/resource-query/query'
import type { Id } from '@/types/common'

export interface AIRunsWorkflowApi {
  pageInit(options: ExecuteOptions): Promise<AiRunInitResponse>
  list(params: AiRunListParams, options: ExecuteOptions): Promise<AiRunListResponse>
  detail(params: { id: Id }, options: ExecuteOptions): Promise<AiRunDetailResponse>
  stats(params: AiRunStatsParams, options: ExecuteOptions): Promise<AiRunStatsSummaryResponse>
  statsByDate(params: AiRunStatsListParams, options: ExecuteOptions): Promise<AiRunStatsByDateResponse>
  statsByAgent(params: AiRunStatsListParams, options: ExecuteOptions): Promise<AiRunStatsByAgentResponse>
  statsByUser(params: AiRunStatsListParams, options: ExecuteOptions): Promise<AiRunStatsByUserResponse>
}

export interface AIRunsWorkflowOptions {
  readonly api?: AIRunsWorkflowApi
  readonly realtime?: KernelRealtime
}

export function createAIRunsWorkflow(options: AIRunsWorkflowOptions = {}) {
  const api = options.api ?? AiRunApi
  const page = shallowRef({ current_page: 1, page_size: 20, total: 0, total_page: 0 })
  const pageInit = createResourceQuery<AiRunInitResponse, undefined, AiRunInitResponse>({
    request: (_params, context) => api.pageInit(context),
    selectItems: (result) => [result],
  })
  const list = createResourceQuery<AiRunItem, AiRunListParams, AiRunListResponse>({
    async request(params, context) {
      let result = await api.list(params, context)
      if (!context.signal.aborted && result.list.length === 0 && result.page.current_page > 1) {
        result = await api.list({
          ...params,
          current_page: result.page.current_page - 1,
          page_size: result.page.page_size,
        }, context)
      }
      return result
    },
    selectItems: (result) => result.list,
    onCommit(result, params) {
      page.value = result.page
      return {
        ...params,
        current_page: result.page.current_page,
        page_size: result.page.page_size,
      }
    },
  })
  const detail = createResourceQuery<AiRunDetailResponse, { id: Id }, AiRunDetailResponse>({
    request: (params, context) => api.detail(params, context),
    selectItems: (result) => [result],
  })
  const stats = createResourceQuery<AiRunStatsSummaryResponse, AiRunStatsParams, AiRunStatsSummaryResponse>({
    request: (params, context) => api.stats(params, context),
    selectItems: (result) => [result],
  })
  const statsByDate = createResourceQuery<AiRunStatsByDateItem, AiRunStatsListParams, AiRunStatsByDateResponse>({
    request: (params, context) => api.statsByDate(params, context),
    selectItems: (result) => result.list,
  })
  const statsByAgent = createResourceQuery<AiRunStatsByAgentItem, AiRunStatsListParams, AiRunStatsByAgentResponse>({
    request: (params, context) => api.statsByAgent(params, context),
    selectItems: (result) => result.list,
  })
  const statsByUser = createResourceQuery<AiRunStatsByUserItem, AiRunStatsListParams, AiRunStatsByUserResponse>({
    request: (params, context) => api.statsByUser(params, context),
    selectItems: (result) => result.list,
  })

  function loadPageInit() {
    return pageInit.execute(undefined)
  }

  function loadDetail(id: Id) {
    return detail.execute({ id })
  }

  async function recoverAuthoritative(requestID?: string) {
    const work: Promise<unknown>[] = []
    if (list.state.value.kind !== 'idle') work.push(list.refresh())
    const currentDetail = detail.state.value.data[0]
    if (detail.state.value.kind !== 'idle' && (!requestID || currentDetail?.request_id === requestID)) {
      work.push(detail.refresh())
    }
    for (const resource of [stats, statsByDate, statsByAgent, statsByUser] as const) {
      if (resource.state.value.kind !== 'idle') work.push(resource.refresh())
    }
    await Promise.all(work)
  }

  const unsubscribe = options.realtime
    ? [
        options.realtime.subscribe('ai.response.completed.v1', ({ data }) => recoverAuthoritative(data.request_id)),
        options.realtime.subscribe('ai.response.failed.v1', ({ data }) => recoverAuthoritative(data.request_id)),
        options.realtime.subscribe('ai.response.canceled.v1', ({ data }) => recoverAuthoritative(data.request_id)),
      ]
    : []
  const unregisterRecovery = options.realtime?.registerRecovery(async () => {
    await recoverAuthoritative()
  }) ?? (() => undefined)

  function dispose() {
    unsubscribe.forEach((release) => release())
    unregisterRecovery()
    statsByUser.dispose()
    statsByAgent.dispose()
    statsByDate.dispose()
    stats.dispose()
    detail.dispose()
    list.dispose()
    pageInit.dispose()
  }

  return {
    pageInit,
    loadPageInit,
    list,
    page,
    detail,
    loadDetail,
    stats,
    statsByDate,
    statsByAgent,
    statsByUser,
    loadStats: (params: AiRunStatsParams) => stats.execute(params),
    loadStatsByDate: (params: AiRunStatsListParams) => statsByDate.execute(params),
    loadStatsByAgent: (params: AiRunStatsListParams) => statsByAgent.execute(params),
    loadStatsByUser: (params: AiRunStatsListParams) => statsByUser.execute(params),
    recoverAuthoritative,
    dispose,
  }
}
