import { AiRunApi, type AiRunDetailResponse, type AiRunItem, type AiRunListParams, type AiRunListResponse } from '@/api/ai/runs'
import type { KernelRealtime } from '@/app/kernel'
import type { ExecuteOptions } from '@/modules/http/client'
import { createResourceQuery } from '@/modules/resource-query/query'
import type { Id } from '@/types/common'

export interface AIRunsWorkflowApi {
  list(params: AiRunListParams, options: ExecuteOptions): Promise<AiRunListResponse>
  detail(params: { id: Id }, options: ExecuteOptions): Promise<AiRunDetailResponse>
}

export interface AIRunsWorkflowOptions {
  readonly api?: AIRunsWorkflowApi
  readonly realtime?: KernelRealtime
}

export function createAIRunsWorkflow(options: AIRunsWorkflowOptions = {}) {
  const api = options.api ?? AiRunApi
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
    onCommit: (result, params) => ({
      ...params,
      current_page: result.page.current_page,
      page_size: result.page.page_size,
    }),
  })
  const detail = createResourceQuery<AiRunDetailResponse, { id: Id }, AiRunDetailResponse>({
    request: (params, context) => api.detail(params, context),
    selectItems: (result) => [result],
  })

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
    detail.dispose()
    list.dispose()
  }

  return { list, detail, loadDetail, recoverAuthoritative, dispose }
}
