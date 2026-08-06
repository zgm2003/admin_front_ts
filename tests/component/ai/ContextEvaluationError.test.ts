import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/modules/http/error'
import { useContextWorkspace } from '@/views/Main/ai/context/use-context-workspace'

const mocks = vi.hoisted(() => ({
  pageInit: vi.fn(),
  profilesList: vi.fn(),
  evaluationRun: vi.fn(),
  notifyError: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElNotification: { error: mocks.notifyError },
}))

vi.mock('@/api/ai/context', () => ({
  AiContextApi: {
    pageInit: mocks.pageInit,
    profiles: { list: mocks.profilesList },
    spaces: { list: vi.fn() },
    documents: { list: vi.fn(), versions: vi.fn() },
    evaluations: { run: mocks.evaluationRun },
  },
}))

function mountWorkspace() {
  let workspace: ReturnType<typeof useContextWorkspace> | undefined
  const Host = defineComponent({
    setup() {
      workspace = useContextWorkspace()
      return () => h('div')
    },
  })
  const wrapper = mount(Host)
  if (!workspace) throw new Error('Context workspace was not created')
  return { workspace, wrapper }
}

describe('Context evaluation errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pageInit.mockResolvedValue({
      embedding_model_options: [],
      memory_model_options: [],
      reranker_model_options: [],
    })
    mocks.profilesList.mockResolvedValue({ items: [] })
  })

  it('shows the backend error and restores loading when evaluation fails', async () => {
    mocks.evaluationRun.mockRejectedValueOnce(createApiError({
      kind: 'internal',
      code: 'internal.unknown',
      retryable: false,
      messageKey: 'internal.unknown',
      message: '上下文评测未配置',
    }))
    const { workspace, wrapper } = mountWorkspace()
    await flushPromises()

    const request = workspace.runEvaluation(7, '测试问题')
    expect(workspace.evaluationLoading.value).toBe(true)
    await expect(request).resolves.toBeUndefined()

    expect(mocks.notifyError).toHaveBeenCalledOnce()
    expect(mocks.notifyError).toHaveBeenCalledWith({ message: '上下文评测未配置' })
    expect(workspace.evaluationLoading.value).toBe(false)
    expect(workspace.evaluation.value).toBeNull()
    wrapper.unmount()
  })

  it('silences canceled evaluation requests and restores loading', async () => {
    mocks.evaluationRun.mockRejectedValueOnce(createApiError({
      kind: 'canceled',
      code: 'http.canceled',
      retryable: false,
      messageKey: 'http.canceled',
    }))
    const { workspace, wrapper } = mountWorkspace()
    await flushPromises()

    await expect(workspace.runEvaluation(7, '测试问题')).resolves.toBeUndefined()

    expect(mocks.notifyError).not.toHaveBeenCalled()
    expect(workspace.evaluationLoading.value).toBe(false)
    wrapper.unmount()
  })
})
