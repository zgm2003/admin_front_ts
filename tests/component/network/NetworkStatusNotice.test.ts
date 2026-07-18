import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NetworkStatusNotice from '@/components/NetworkStatusNotice/src/index.vue'

const network = vi.hoisted(() => ({
  state: null as null | {
    isOffline: { value: boolean }
    lastOfflineAt: { value: Date | null }
  },
  refreshPage: vi.fn(),
}))

vi.mock('@/hooks/useNetworkStatus', async () => {
  const { shallowRef } = await import('vue')
  const isOffline = shallowRef(false)
  const lastOfflineAt = shallowRef<Date | null>(null)
  network.state = { isOffline, lastOfflineAt }
  return {
    useNetworkStatus: () => ({
      isOffline,
      lastOfflineAt,
      refreshPage: network.refreshPage,
    }),
  }
})

vi.mock('vue-i18n', async () => {
  const { shallowRef } = await import('vue')
  return {
    useI18n: () => ({
      locale: shallowRef('en-US'),
      t: (key: string) => key,
    }),
  }
})

describe('NetworkStatusNotice', () => {
  beforeEach(() => {
    network.refreshPage.mockReset()
    if (network.state) {
      network.state.isOffline.value = false
      network.state.lastOfflineAt.value = null
    }
  })

  it('renders nothing while the browser is online', () => {
    const wrapper = mount(NetworkStatusNotice, {
      global: {
        stubs: {
          transition: false,
          ElAlert: true,
          ElButton: true,
          ElIcon: true,
          RefreshRight: true,
        },
      },
    })
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('announces offline state and exposes a working refresh action', async () => {
    const wrapper = mount(NetworkStatusNotice, {
      global: {
        stubs: {
          transition: false,
          ElAlert: { template: '<section><slot name="title" /><slot /></section>' },
          ElButton: { template: '<button data-testid="refresh"><slot /></button>' },
          ElIcon: { template: '<i><slot /></i>' },
          RefreshRight: true,
        },
      },
    })

    network.state!.lastOfflineAt.value = new Date('2026-07-19T08:30:00Z')
    network.state!.isOffline.value = true
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[role="status"]').attributes('aria-live')).toBe('assertive')
    expect(wrapper.text()).toContain('network.offline.title')
    await wrapper.get('[data-testid="refresh"]').trigger('click')
    expect(network.refreshPage).toHaveBeenCalledTimes(1)
  })
})
