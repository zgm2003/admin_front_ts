// @vitest-environment jsdom

import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationPage from '@/views/Main/notification/index.vue'

const mocks = vi.hoisted(() => ({
  readMutate: vi.fn(),
  announcePolite: vi.fn(),
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/app/injection', () => ({ useAppKernel: () => ({ realtime: {} }) }))
vi.mock('@/components/Search', () => ({
  Search: { name: 'Search', template: '<div />' },
}))
vi.mock('@/components/Table', () => ({
  AppTable: {
    name: 'AppTable',
    props: { data: { type: Array, default: () => [] } },
    template: `
      <section>
        <slot name="toolbar-left" />
        <div v-for="row in data" :key="row.id">
          <slot name="cell-actions" :row="row" />
        </div>
      </section>
    `,
  },
}))
vi.mock('@/shared/accessibility/announcer', () => ({
  announcePolite: mocks.announcePolite,
  announceAssertive: vi.fn(),
}))
vi.mock('element-plus', async (importOriginal) => ({
  ...await importOriginal<typeof import('element-plus')>(),
  ElMessageBox: { confirm: vi.fn(async () => true) },
  ElNotification: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}))
vi.mock('@/features/notifications/workflow', () => ({
  createNotificationsWorkflow: () => ({
    list: {},
    page: {},
    read: { mutate: mocks.readMutate },
    deleteOne: { mutate: vi.fn() },
    deleteBatch: { mutate: vi.fn() },
    loadPageInit: vi.fn(async () => ({
      dict: {
        notification_type_arr: [],
        notification_level_arr: [],
        notification_read_status_arr: [],
      },
    })),
    loadUnreadCount: vi.fn(async () => undefined),
    dispose: vi.fn(),
  }),
}))
vi.mock('@/features/shared/use-workflow-table', async () => {
  const { ref } = await import('vue')
  return {
    useWorkflowTable: () => ({
      state: ref({ kind: 'success', data: [{ id: 7 }] }),
      loading: ref(false),
      data: ref([{
        id: 7,
        title: 'Build complete',
        content: 'Done',
        type: 1,
        type_text: 'System',
        level: 1,
        level_text: 'Normal',
        is_read: 2,
        created_at: '2026-07-20T00:00:00Z',
        link: '',
      }]),
      page: ref({ current_page: 1, page_size: 10, total: 1 }),
      onSearch: vi.fn(),
      onPageChange: vi.fn(),
      refresh: vi.fn(),
      getList: vi.fn(async () => undefined),
      onSelectionChange: vi.fn(),
      selectedIds: ref([]),
      clearSelection: vi.fn(),
    }),
  }
})

const ElButtonStub = defineComponent({
  name: 'ElButton',
  inheritAttrs: false,
  template: '<button v-bind="$attrs"><slot /></button>',
})

describe('notification accessibility announcements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.readMutate.mockResolvedValue({ kind: 'success' })
  })

  it('announces a successful state change through the application live region', async () => {
    const wrapper = mount(NotificationPage, {
      global: {
        stubs: {
          DIcon: true,
          ElButton: ElButtonStub,
          ElTag: true,
        },
      },
    })
    await flushPromises()

    const markRead = wrapper.findAll('button')
      .find((button) => button.text().includes('notification.page.markRead'))
    expect(markRead).toBeTruthy()
    await markRead?.trigger('click')
    await flushPromises()

    expect(mocks.readMutate).toHaveBeenCalledWith({ id: 7 })
    expect(mocks.announcePolite).toHaveBeenCalledWith('common.success.operation')
  })
})
