import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationRuntime from '@/components/NotificationRuntime/src/index.vue'

const mocks = vi.hoisted(() => ({
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  notification: vi.fn(),
  close: vi.fn(),
  routerPush: vi.fn(),
  shouldUseNative: vi.fn(),
  sendNativeNotification: vi.fn(),
  handler: undefined as undefined | ((event: { data: Record<string, unknown> }) => Promise<void>),
}))

vi.mock('@/app/injection', () => ({
  useAppKernel: () => ({ realtime: { subscribe: mocks.subscribe } }),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.routerPush }) }))
vi.mock('@/adapters/native', () => ({
  getNativeBridge: () => ({
    kind: 'tauri',
    window: { openExternal: vi.fn() },
    notifications: {
      shouldUseNative: mocks.shouldUseNative,
      send: mocks.sendNativeNotification,
    },
  }),
}))
vi.mock('element-plus', () => ({ ElNotification: mocks.notification }))

describe('NotificationRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.handler = undefined
    mocks.subscribe.mockImplementation((_type, handler) => {
      mocks.handler = handler
      return mocks.unsubscribe
    })
    mocks.notification.mockReturnValue({ close: mocks.close })
    mocks.shouldUseNative.mockResolvedValue(false)
  })

  it('subscribes once, shows every typed notification, and releases the subscription', async () => {
    const wrapper = mount(NotificationRuntime)
    expect(mocks.subscribe).toHaveBeenCalledWith('notification.created.v1', expect.any(Function))

    await mocks.handler?.({
      data: {
        task_id: 7,
        title: 'Release ready',
        content: 'Candidate uploaded',
        link: '/notification',
        level: 'normal',
        notification_type: 'info',
      },
    })

    expect(mocks.notification).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Release ready',
      message: 'Candidate uploaded',
      type: 'info',
    }))

    const options = mocks.notification.mock.calls[0]?.[0]
    options.onClick()
    expect(mocks.close).toHaveBeenCalledTimes(1)
    expect(mocks.routerPush).toHaveBeenCalledWith('/notification')

    wrapper.unmount()
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('mirrors the same event to native notification only when native mode is active', async () => {
    mocks.shouldUseNative.mockResolvedValue(true)
    mount(NotificationRuntime)

    await mocks.handler?.({
      data: {
        task_id: 8,
        title: 'Urgent',
        content: 'Review now',
        link: '',
        level: 'urgent',
        notification_type: 'warning',
      },
    })

    expect(mocks.sendNativeNotification).toHaveBeenCalledWith('Urgent', 'Review now')
    expect(mocks.notification).toHaveBeenCalledTimes(1)
  })
})
