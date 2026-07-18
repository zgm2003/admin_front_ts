import { beforeEach, describe, expect, it, vi } from 'vitest'

const notifications = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock('element-plus', () => ({ ElNotification: notifications }))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const { useExportSubmit } = await import('@/hooks/useExportSubmit')

describe('export submit behavior', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects an empty selection without calling the API', async () => {
    const submit = vi.fn()
    const { submitSelectedExport } = useExportSubmit({ submit })

    await submitSelectedExport([])

    expect(submit).not.toHaveBeenCalled()
    expect(notifications.error).toHaveBeenCalledWith({ message: 'common.selectAtLeastOne' })
  })

  it('submits a copied id list and reports the documented response message', async () => {
    const ids = [3, 9]
    const submit = vi.fn().mockResolvedValue({ message: 'export queued' })
    const { submitSelectedExport } = useExportSubmit({ submit })

    await submitSelectedExport(ids)

    expect(submit).toHaveBeenCalledWith([3, 9])
    expect(submit.mock.calls[0]?.[0]).not.toBe(ids)
    expect(notifications.success).toHaveBeenCalledWith({ message: 'export queued' })
  })
})
