import { shallowRef } from 'vue'
import {
  AiRunApi,
  type AiRunDashboardParams,
  type AiRunDashboardResponse,
  type AiRunDetailResponse,
  type AiRunInitResponse,
  type AiRunItem,
  type AiRunListParams,
  type AiRunListResponse,
  type AiRunPageInitParams,
} from '@/api/ai/runs'
import type { KernelRealtime } from '@/app/kernel'
import type { ExecuteOptions } from '@/modules/http/client'
import { createResourceQuery } from '@/modules/resource-query/query'
import type { Id } from '@/types/common'

const dashboardRefreshDelayMS = 250

export interface AIRunsWorkflowApi {
  pageInit(params: AiRunPageInitParams, options: ExecuteOptions): Promise<AiRunInitResponse>
  list(params: AiRunListParams, options: ExecuteOptions): Promise<AiRunListResponse>
  detail(params: { id: Id }, options: ExecuteOptions): Promise<AiRunDetailResponse>
  dashboard(params: AiRunDashboardParams, options: ExecuteOptions): Promise<AiRunDashboardResponse>
}

export interface AIRunsWorkflowOptions {
  readonly api?: AIRunsWorkflowApi
  readonly realtime?: KernelRealtime
}

export function createAIRunsWorkflow(options: AIRunsWorkflowOptions = {}) {
  const api = options.api ?? AiRunApi
  const page = shallowRef({ current_page: 1, page_size: 20, total: 0, total_page: 0 })
  const lastDashboard = shallowRef<AiRunDashboardResponse | null>(null)
  let lastDashboardParams: AiRunDashboardParams | null = null
  let dashboardRefreshTimer: ReturnType<typeof setTimeout> | null = null
  let pageInitCache: { key: string; value: AiRunInitResponse } | null = null
  let activePageInit: { key: string; promise: Promise<AiRunInitResponse> } | null = null

  const pageInit = createResourceQuery<AiRunInitResponse, AiRunPageInitParams, AiRunInitResponse>({
    request: (params, context) => api.pageInit(params, context),
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
  const dashboard = createResourceQuery<AiRunDashboardResponse, AiRunDashboardParams, AiRunDashboardResponse>({
    request: (params, context) => api.dashboard(params, context),
    selectItems: (result) => [result],
    onCommit(result, params) {
      lastDashboard.value = result
      lastDashboardParams = { ...params }
    },
  })

  function loadPageInit(params: AiRunPageInitParams = {}): Promise<AiRunInitResponse> {
    const key = pageInitKey(params)
    if (pageInitCache?.key === key) return Promise.resolve(pageInitCache.value)
    if (activePageInit?.key === key) return activePageInit.promise

    const promise = pageInit.execute(params)
    activePageInit = { key, promise }
    void promise.then(
      (value) => {
        if (activePageInit?.promise === promise) pageInitCache = { key, value }
      },
      () => {
        if (activePageInit?.promise === promise) pageInitCache = null
      },
    ).finally(() => {
      if (activePageInit?.promise === promise) activePageInit = null
    })
    return promise
  }

  function loadDetail(id: Id) {
    return detail.execute({ id })
  }

  function loadDashboard(params: AiRunDashboardParams) {
    return dashboard.execute(params)
  }

  function refreshDashboardSnapshot(): Promise<AiRunDashboardResponse> | null {
    if (lastDashboardParams === null) return null
    return dashboard.execute({ ...lastDashboardParams })
  }

  async function recoverAuthoritative(requestID?: string, includeDashboard = true) {
    const work: Promise<unknown>[] = []
    if (list.state.value.kind !== 'idle') work.push(list.refresh())
    const currentDetail = detail.state.value.data[0]
    if (detail.state.value.kind !== 'idle' && (!requestID || currentDetail?.request_id === requestID)) {
      work.push(detail.refresh())
    }
    if (includeDashboard) {
      clearDashboardRefreshTimer()
      const refresh = refreshDashboardSnapshot()
      if (refresh !== null) work.push(refresh)
    }
    await Promise.all(work)
  }

  function scheduleDashboardRefresh() {
    if (lastDashboardParams === null || !dashboardRangeIncludesShanghaiToday(lastDashboardParams)) return
    clearDashboardRefreshTimer()
    dashboardRefreshTimer = setTimeout(() => {
      dashboardRefreshTimer = null
      void refreshDashboardSnapshot()?.catch(() => undefined)
    }, dashboardRefreshDelayMS)
  }

  function onTerminalEvent(requestID: string) {
    scheduleDashboardRefresh()
    return recoverAuthoritative(requestID, false)
  }

  const unsubscribe = options.realtime
    ? [
        options.realtime.subscribe('ai.response.completed.v1', ({ data }) => onTerminalEvent(data.request_id)),
        options.realtime.subscribe('ai.response.failed.v1', ({ data }) => onTerminalEvent(data.request_id)),
        options.realtime.subscribe('ai.response.canceled.v2', ({ data }) => onTerminalEvent(data.request_id)),
      ]
    : []
  const unregisterRecovery = options.realtime?.registerRecovery(async () => {
    await recoverAuthoritative()
  }) ?? (() => undefined)

  function clearDashboardRefreshTimer() {
    if (dashboardRefreshTimer === null) return
    clearTimeout(dashboardRefreshTimer)
    dashboardRefreshTimer = null
  }

  function dispose() {
    clearDashboardRefreshTimer()
    unsubscribe.forEach((release) => release())
    unregisterRecovery()
    activePageInit = null
    pageInitCache = null
    dashboard.dispose()
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
    dashboard,
    lastDashboard,
    loadDashboard,
    recoverAuthoritative,
    dispose,
  }
}

function pageInitKey(params: AiRunPageInitParams): string {
  return `${params.date_start ?? ''}\u0000${params.date_end ?? ''}`
}

function dashboardRangeIncludesShanghaiToday(params: AiRunDashboardParams, now = new Date()): boolean {
  if (!params.date_start && !params.date_end) return true
  if (!params.date_start || !params.date_end) return false
  const today = shanghaiCalendarDate(now)
  return params.date_start <= today && params.date_end >= today
}

function shanghaiCalendarDate(value: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}
