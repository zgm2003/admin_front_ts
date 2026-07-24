/* eslint-disable max-lines, vue/one-component-per-file */
import { computed, defineComponent, inject, nextTick, provide, ref, watch } from 'vue'
import { enableAutoUnmount, flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MailPage from '@/views/Main/system/mail/index.vue'
import MailLogPanel from '@/views/Main/system/mail/components/MailLogPanel.vue'
import { useUserStore } from '@/store/user'
import { createApiError } from '@/modules/http/error'

const api = vi.hoisted(() => ({
  pageInit: vi.fn(),
  logs: vi.fn(),
  log: vi.fn(),
  deleteLogs: vi.fn(),
}))

vi.mock('@/api/system/mail', () => ({ MailApi: api }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/i18n', () => ({ default: { global: { t: (key: string) => key } } }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ref(false) }))
vi.mock('@/components/Search', () => ({
  Search: {
    name: 'Search',
    props: { fields: { type: Array, default: () => [] } },
    emits: ['query', 'reset', 'update:modelValue'],
    computed: {
      optionLabels() {
        return (this.fields as Array<{ options?: Array<{ label: string }> }>)
          .flatMap((field) => field.options ?? [])
          .map((option) => option.label)
          .join('|')
      },
    },
    template: '<div data-testid="mail-search-options">{{ optionLabels }}</div>',
  },
}))
vi.mock('@/components/Table', () => ({
  AppTable: {
    name: 'AppTable',
    props: { columns: { type: Array, default: () => [] }, data: { type: Array, default: () => [] } },
    template: `<section data-testid="mail-log-table">
      <span v-for="column in columns" :key="column.key" data-testid="column-label">{{ column.label }}</span>
      <article v-for="row in data" :key="row.id" data-testid="log-row">
        <slot name="cell-status" :row="row" />
        <slot name="cell-verification_code" :row="row" />
        <slot name="cell-verification_code_status" :row="row" />
        <slot name="cell-verification_code_expires_at" :row="row" />
        <slot name="cell-actions" :row="row" />
      </article>
    </section>`,
  },
}))
vi.mock('@/components/AppDialog', () => ({
  AppDialog: {
    name: 'AppDialog',
    props: { modelValue: Boolean },
    emits: ['update:modelValue', 'closed'],
    template: `<section v-if="modelValue" data-testid="mail-log-dialog">
      <button data-testid="close-detail" @click="$emit('update:modelValue', false); $emit('closed')">close</button>
      <slot />
    </section>`,
  },
}))

type SwitchTab = (name: string | number) => void
const tabKey = Symbol('mail-tabs')
const ElTabsStub = defineComponent({
  name: 'ElTabs',
  props: { modelValue: { type: [String, Number], required: true } },
  emits: ['update:modelValue', 'tab-change'],
  setup(props, { emit }) {
    provide(tabKey, {
      active: computed(() => props.modelValue),
      switchTab: (name: string | number) => {
        emit('update:modelValue', name)
        emit('tab-change', name)
      },
    })
  },
  template: '<div data-testid="mail-tabs"><slot /></div>',
})
const ElTabPaneStub = defineComponent({
  name: 'ElTabPane',
  inheritAttrs: false,
  props: { label: { type: String, default: '' }, name: { type: [String, Number], required: true } },
  setup(props) {
    const tabs = inject<{ active: { value: string | number }, switchTab: SwitchTab }>(tabKey)!
    const loaded = ref(tabs.active.value === props.name)
    watch(tabs.active, (active) => {
      if (active === props.name) loaded.value = true
    })
    return { ...tabs, loaded }
  },
  template: `<div><button v-bind="$attrs" @click="switchTab(name)">{{ label }}</button>
    <div v-if="loaded" v-show="active === name"><slot /></div></div>`,
})
const ElButtonStub = defineComponent({
  name: 'ElButton',
  inheritAttrs: false,
  emits: ['click'],
  template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
})
const passthrough = { template: '<span><slot /></span>' }
const globals = {
  directives: { loading: () => undefined },
  stubs: {
    MailConfigPanel: { template: '<div data-testid="config-panel" />' },
    MailTemplatePanel: { template: '<div data-testid="template-panel" />' },
    ElTabs: ElTabsStub,
    ElTabPane: ElTabPaneStub,
    ElButton: ElButtonStub,
    ElTag: passthrough,
    ElSkeleton: true,
    ElDescriptions: passthrough,
    ElDescriptionsItem: passthrough,
    ElAlert: true,
    ElSpace: passthrough,
    ElDatePicker: true,
  },
}
enableAutoUnmount(afterEach)

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail })
  return { promise, resolve, reject }
}
const diagnostics = (status: string | null = 'sending', code: string | null = '012345') => ({
  verification_code: code,
  verification_code_status: status,
  verification_code_expires_at: status ? '2026-07-24 10:05:00' : null,
})
const log = (id: number, diagnostic = diagnostics()) => ({
  id, scene: 'login', template_id: 2, to_email: `admin${id}@example.com`, subject: `subject-${id}`,
  status: 2, tencent_request_id: `request-${id}`, tencent_message_id: `message-${id}`,
  error_code: '', error_message: '', duration_ms: 12, sent_at: '2026-07-24 10:00:00',
  created_at: '2026-07-24 10:00:00', updated_at: '2026-07-24 10:00:00', ...diagnostic,
})
const pageInit = (labels = ['Sending label', 'Active label', 'Expired label', 'Failed label']) => ({ dict: {
  common_status_arr: [], mail_scene_arr: [], mail_log_scene_arr: [{ label: 'Login', value: 'login' }],
  mail_log_status_arr: [{ label: 'Delivered', value: 2 }],
  mail_verification_code_status_arr: ['sending', 'not_expired', 'expired', 'send_failed']
    .map((value, index) => ({ label: labels[index], value })),
  mail_region_arr: [], default_region: 'ap-guangzhou', default_endpoint: 'ses.tencentcloudapi.com', default_ttl_minutes: 5,
} })
const list = (items: ReturnType<typeof log>[]) => ({
  list: items, page: { current_page: 1, page_size: 20, total: items.length, total_page: 1 },
})

function permit(allowed: boolean) {
  const store = useUserStore()
  store.buttonCodes = new Set(allowed ? ['system_mail_logView'] : [])
  return store
}
function mountPage() {
  return mount(MailPage, { global: globals })
}
async function activate(wrapper: VueWrapper) {
  await wrapper.get('[data-testid="mail-tab-log"]').trigger('click')
  await vi.dynamicImportSettled()
  await flushPromises()
}
function panel(wrapper: VueWrapper) {
  const component = wrapper.findComponent({ ref: 'mailLogPanelRef' })
  if (component.exists()) expect(component.findComponent(MailLogPanel).exists() || component.type() === MailLogPanel).toBe(true)
  return component
}
function exposed(wrapper: VueWrapper) {
  return panel(wrapper).vm as unknown as {
    activate(): Promise<void>
    clearDiagnostics(): void
    refreshLogs(): Promise<void>
  }
}

describe('secure mail diagnostics lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
  })

  it('does not render or request diagnostics without log-view permission', async () => {
    permit(false)
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.findAll('button').some((button) => button.text() === 'mail.tabs.log')).toBe(false)
    expect(panel(wrapper).exists()).toBe(false)
    expect(api.pageInit).not.toHaveBeenCalled()
    expect(api.logs).not.toHaveBeenCalled()
  })

  it('lazy activates once and deduplicates concurrent activation', async () => {
    permit(true)
    const init = deferred<ReturnType<typeof pageInit>>()
    const rows = deferred<ReturnType<typeof list>>()
    api.pageInit.mockReturnValue(init.promise)
    api.logs.mockReturnValue(rows.promise)
    const wrapper = mountPage()
    expect(api.pageInit).not.toHaveBeenCalled()
    await activate(wrapper)
    const duplicate = exposed(wrapper).activate()
    expect(api.pageInit).toHaveBeenCalledTimes(1)
    init.resolve(pageInit())
    await flushPromises()
    expect(api.logs).toHaveBeenCalledTimes(1)
    rows.resolve(list([log(1)]))
    await duplicate
    expect(wrapper.text()).toContain('012345')
  })

  it('propagates non-canceled typed errors after abort and silences only typed cancellation', async () => {
    permit(true)
    const denied = deferred<ReturnType<typeof pageInit>>()
    api.pageInit.mockReturnValueOnce(denied.promise)
    const wrapper = mount(MailLogPanel, { global: globals })
    const lifecycle = wrapper.vm as unknown as {
      activate(): Promise<void>
      clearDiagnostics(): void
    }
    const activation = lifecycle.activate()
    lifecycle.clearDiagnostics()
    expect((api.pageInit.mock.calls[0]?.[0]?.signal as AbortSignal).aborted).toBe(true)
    const authorization = createApiError({
      kind: 'authorization', retryable: false, messageKey: 'http.forbidden',
    })
    denied.reject(authorization)
    await expect(activation).rejects.toBe(authorization)

    const canceledRequest = deferred<ReturnType<typeof pageInit>>()
    api.pageInit.mockReturnValueOnce(canceledRequest.promise)
    const canceledActivation = lifecycle.activate()
    lifecycle.clearDiagnostics()
    expect((api.pageInit.mock.calls[1]?.[0]?.signal as AbortSignal).aborted).toBe(true)
    const canceled = createApiError({
      kind: 'canceled', retryable: false, messageKey: 'http.canceled',
    })
    canceledRequest.reject(canceled)
    await expect(canceledActivation).resolves.toBeUndefined()
  })

  it('synchronously clears and unmounts on permission loss and ignores late activation responses', async () => {
    const store = permit(true)
    const init = deferred<ReturnType<typeof pageInit>>()
    api.pageInit.mockReturnValue(init.promise)
    const wrapper = mountPage()
    await activate(wrapper)
    const signal = api.pageInit.mock.calls[0]?.[0]?.signal as AbortSignal
    store.buttonCodes = new Set()
    expect(signal.aborted).toBe(true)
    await nextTick()
    expect(wrapper.find('[data-testid="mail-tab-log"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="config-panel"]').exists()).toBe(true)
    init.resolve(pageInit())
    await flushPromises()
    expect(api.logs).not.toHaveBeenCalled()
    expect(wrapper.text()).not.toContain('012345')
  })

  it('removes existing list and detail plaintext when permission is lost', async () => {
    const store = permit(true)
    const item = log(1, diagnostics('not_expired', '246810'))
    api.pageInit.mockResolvedValue(pageInit())
    api.logs.mockResolvedValue(list([item]))
    api.log.mockResolvedValue(item)
    const wrapper = mountPage()
    await activate(wrapper)
    await wrapper.get('[data-testid="view-mail-log-detail"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('246810')
    expect(wrapper.get('[data-testid="mail-log-dialog"]').text()).toContain('246810')

    store.buttonCodes = new Set()
    await nextTick()
    expect(panel(wrapper).exists()).toBe(false)
    expect(wrapper.text()).not.toContain('246810')
    expect(wrapper.find('[data-testid="mail-log-dialog"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="config-panel"]').exists()).toBe(true)
  })

  it('synchronously aborts active list and detail requests when permission is lost', async () => {
    const store = permit(true)
    api.pageInit.mockResolvedValue(pageInit())
    api.logs.mockResolvedValueOnce(list([log(1)]))
    const wrapper = mountPage()
    await activate(wrapper)
    const pendingList = deferred<ReturnType<typeof list>>()
    const pendingDetail = deferred<ReturnType<typeof log>>()
    api.logs.mockReturnValueOnce(pendingList.promise)
    api.log.mockReturnValueOnce(pendingDetail.promise)
    const listPromise = exposed(wrapper).refreshLogs()
    await wrapper.get('[data-testid="view-mail-log-detail"]').trigger('click')
    const listSignal = api.logs.mock.calls[1]?.[1]?.signal as AbortSignal
    const detailSignal = api.log.mock.calls[0]?.[1]?.signal as AbortSignal

    store.buttonCodes = new Set()
    expect(listSignal.aborted).toBe(true)
    expect(detailSignal.aborted).toBe(true)
    pendingList.resolve(list([]))
    pendingDetail.resolve(log(1))
    await expect(listPromise).resolves.toBeUndefined()
    await nextTick()
    expect(panel(wrapper).exists()).toBe(false)
  })

  it('rejects late list and detail commits and aborts superseded detail requests', async () => {
    permit(true)
    api.pageInit.mockResolvedValue(pageInit())
    const pendingList = deferred<ReturnType<typeof list>>()
    api.logs.mockReturnValueOnce(pendingList.promise)
    const wrapper = mountPage()
    await activate(wrapper)
    await flushPromises()
    const lifecycle = exposed(wrapper)
    lifecycle.clearDiagnostics()
    pendingList.resolve(list([log(1)]))
    await flushPromises()
    expect(wrapper.text()).not.toContain('012345')

    api.logs.mockResolvedValueOnce(list([log(1), log(2, diagnostics('expired', '654321'))]))
    await lifecycle.activate()
    await flushPromises()
    const first = deferred<ReturnType<typeof log>>()
    const second = deferred<ReturnType<typeof log>>()
    api.log.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const detailButtons = wrapper.findAll('[data-testid="view-mail-log-detail"]')
    await detailButtons[0]!.trigger('click')
    const firstSignal = api.log.mock.calls[0]?.[1]?.signal as AbortSignal
    await detailButtons[1]!.trigger('click')
    expect(firstSignal.aborted).toBe(true)
    second.resolve(log(2, diagnostics('expired', '654321')))
    await flushPromises()
    first.resolve(log(1))
    await flushPromises()
    expect(wrapper.get('[data-testid="mail-log-dialog"]').text()).toContain('654321')
    expect(wrapper.get('[data-testid="mail-log-dialog"]').text()).not.toContain('012345')
    const closing = deferred<ReturnType<typeof log>>()
    api.log.mockReturnValueOnce(closing.promise)
    await detailButtons[0]!.trigger('click')
    const closingSignal = api.log.mock.calls[2]?.[1]?.signal as AbortSignal
    await wrapper.get('[data-testid="close-detail"]').trigger('click')
    expect(closingSignal.aborted).toBe(true)
    expect(wrapper.find('[data-testid="mail-log-dialog"]').exists()).toBe(false)
  })

  it('clears retained diagnostics and aborts active work on tab departure before fresh return', async () => {
    permit(true)
    api.pageInit.mockResolvedValue(pageInit())
    const item = log(1, diagnostics('sending', '112233'))
    const pendingList = deferred<ReturnType<typeof list>>()
    const pendingDetail = deferred<ReturnType<typeof log>>()
    api.logs
      .mockResolvedValueOnce(list([item]))
      .mockReturnValueOnce(pendingList.promise)
      .mockResolvedValueOnce(list([log(2, diagnostics('expired', '445566'))]))
    api.log.mockResolvedValueOnce(item).mockReturnValueOnce(pendingDetail.promise)
    const wrapper = mountPage()
    await activate(wrapper)
    const detailButton = wrapper.get('[data-testid="view-mail-log-detail"]')
    await detailButton.trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="mail-log-dialog"]').text()).toContain('112233')
    expect(wrapper.get('[data-testid="diagnostic-status"]').text()).toBe('Sending label')

    await detailButton.trigger('click')
    const detailSignal = api.log.mock.calls[1]?.[1]?.signal as AbortSignal
    const listPromise = exposed(wrapper).refreshLogs()
    const listSignal = api.logs.mock.calls[1]?.[1]?.signal as AbortSignal
    await wrapper.get('[data-testid="mail-tab-config"]').trigger('click')
    expect(detailSignal.aborted).toBe(true)
    expect(listSignal.aborted).toBe(true)
    expect(panel(wrapper).exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="log-row"]')).toHaveLength(0)
    expect(wrapper.find('[data-testid="mail-log-dialog"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="mail-search-options"]').text()).toBe('')
    expect(wrapper.text()).not.toContain('112233')
    expect(wrapper.text()).not.toContain('Sending label')

    pendingList.resolve(list([item]))
    pendingDetail.resolve(item)
    await expect(listPromise).resolves.toBeUndefined()
    await activate(wrapper)
    await flushPromises()
    expect(api.pageInit).toHaveBeenCalledTimes(2)
    expect(api.logs).toHaveBeenCalledTimes(3)
    expect(wrapper.text()).toContain('445566')
  })

  it('clears on route deactivation and unmount, then freshly activates cached log state', async () => {
    permit(true)
    api.pageInit.mockResolvedValue(pageInit())
    const firstItem = log(1, diagnostics('sending', '135790'))
    const activeDetail = deferred<ReturnType<typeof log>>()
    const reactivationList = deferred<ReturnType<typeof list>>()
    api.logs.mockResolvedValueOnce(list([firstItem])).mockReturnValueOnce(reactivationList.promise)
    api.log.mockReturnValueOnce(activeDetail.promise)
    const Harness = defineComponent({
      components: { MailPage },
      setup() { return { show: ref(true) } },
      template: '<KeepAlive><MailPage v-if="show" /></KeepAlive>',
    })
    const wrapper = mount(Harness, { global: globals })
    await activate(wrapper)
    await flushPromises()
    expect(wrapper.text()).toContain('135790')
    await wrapper.get('[data-testid="view-mail-log-detail"]').trigger('click')
    const detailSignal = api.log.mock.calls[0]?.[1]?.signal as AbortSignal
    ;(wrapper.vm as unknown as { show: boolean }).show = false
    await nextTick()
    expect(detailSignal.aborted).toBe(true)
    expect(wrapper.text()).not.toContain('135790')
    ;(wrapper.vm as unknown as { show: boolean }).show = true
    await flushPromises()
    expect(api.pageInit).toHaveBeenCalledTimes(2)
    expect(api.logs).toHaveBeenCalledTimes(2)
    const activeSignal = api.logs.mock.calls[1]?.[1]?.signal as AbortSignal
    wrapper.unmount()
    expect(activeSignal.aborted).toBe(true)
  })

  it('renders identical delivery and diagnostic values for every list row and detail', async () => {
    permit(true)
    const labels = ['opaque-a', 'opaque-b', 'opaque-c', 'opaque-d']
    const items = ['sending', 'not_expired', 'expired', 'send_failed']
      .map((status, index) => ({
        ...log(index + 1, diagnostics(status, `12345${index}`)),
        status: (index % 3) + 1,
      }))
    const init = pageInit(labels)
    init.dict.mail_log_status_arr = [
      { label: 'Queued delivery', value: 1 },
      { label: 'Delivered mail', value: 2 },
      { label: 'Failed delivery', value: 3 },
    ]
    api.pageInit.mockResolvedValue(init)
    api.logs.mockResolvedValue(list(items))
    api.log.mockImplementation((id: number) => Promise.resolve(items[id - 1]))
    const wrapper = mountPage()
    await activate(wrapper)
    await flushPromises()
    for (const status of ['sending', 'not_expired', 'expired', 'send_failed']) expect(wrapper.text()).not.toContain(status)
    for (let index = 0; index < items.length; index++) {
      const item = items[index]!
      const selector = `[data-log-id="${item.id}"]`
      const listValues = {
        delivery: wrapper.get(`[data-testid="delivery-status"]${selector}`).text(),
        code: wrapper.get(`[data-testid="diagnostic-code"]${selector}`).text(),
        status: wrapper.get(`[data-testid="diagnostic-status"]${selector}`).text(),
        expiry: wrapper.get(`[data-testid="diagnostic-expiry"]${selector}`).text(),
      }
      expect(listValues.expiry).toBe('2026-07-24 10:05:00')
      expect(listValues.status).toBe(labels[index])
      await wrapper.get(`[data-testid="view-mail-log-detail"]${selector}`).trigger('click')
      await flushPromises()
      expect(wrapper.get('[data-testid="detail-delivery-status"]').text()).toBe(listValues.delivery)
      expect(wrapper.get('[data-testid="detail-diagnostic-code"]').text()).toBe(listValues.code)
      expect(wrapper.get('[data-testid="detail-diagnostic-status"]').text()).toBe(listValues.status)
      expect(wrapper.get('[data-testid="detail-diagnostic-expiry"]').text()).toBe(listValues.expiry)
    }
  })

  it('renders all-null diagnostics as dashes and never writes browser storage', async () => {
    permit(true)
    const localWrite = vi.spyOn(Storage.prototype, 'setItem')
    api.pageInit.mockResolvedValue(pageInit())
    api.logs.mockResolvedValue(list([log(1, diagnostics(null, null))]))
    api.log.mockResolvedValue(log(1, diagnostics(null, null)))
    const wrapper = mountPage()
    await activate(wrapper)
    await flushPromises()
    expect(wrapper.get('[data-testid="diagnostic-code"]').text()).toBe('-')
    expect(wrapper.get('[data-testid="diagnostic-status"]').text()).toBe('-')
    expect(wrapper.get('[data-testid="diagnostic-expiry"]').text()).toBe('-')
    await wrapper.get('[data-testid="view-mail-log-detail"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[data-testid="detail-diagnostic-code"]').text()).toBe('-')
    expect(wrapper.get('[data-testid="detail-diagnostic-status"]').text()).toBe('-')
    expect(wrapper.get('[data-testid="detail-diagnostic-expiry"]').text()).toBe('-')
    expect(localWrite).not.toHaveBeenCalled()
  })
})
