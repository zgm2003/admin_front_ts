import { defineComponent, h, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/modules/http/error'

const mocks = vi.hoisted(() => ({
  can: vi.fn(),
  confirm: vi.fn(),
  downloadTextFile: vi.fn(),
  exportCodes: vi.fn(),
  generateBatch: vi.fn(),
  getList: vi.fn(),
  list: vi.fn(),
  lookup: vi.fn(),
  pageInit: vi.fn(),
  push: vi.fn(),
  randomUUID: vi.fn(),
  selectedIds: { value: [] as number[] },
  tableSearchForm: { value: undefined as unknown },
  tableData: { value: [] as Array<Record<string, unknown>> },
  voidCodes: vi.fn(),
}))

vi.mock('@/api/payment/redeem-codes', () => ({
  PaymentRedeemCodeApi: {
    export: mocks.exportCodes,
    generateBatch: mocks.generateBatch,
    list: mocks.list,
    lookup: mocks.lookup,
    pageInit: mocks.pageInit,
    void: mocks.voidCodes,
  },
}))
vi.mock('@/components/Table', async () => {
  const { defineComponent, h, ref } = await import('vue')
  const AppTable = defineComponent({
    name: 'AppTableMock',
    props: {
      data: { type: Array, default: () => [] },
      selectable: Boolean,
      selectionSelectable: { type: Function, default: undefined },
    },
    setup(props, { slots }) {
      return () => h('div', { 'data-test': 'app-table-stub' }, [
        slots['toolbar-left']?.(),
        slots['toolbar-right']?.(),
        ...(props.data as Array<Record<string, unknown>>).flatMap((row) => [
          slots['cell-code']?.({ row }),
          slots['cell-state']?.({ row }),
          slots['cell-expires_at']?.({ row }),
          slots['cell-redemption']?.({ row }),
          slots['cell-creation']?.({ row }),
          slots['cell-actions']?.({ row }),
        ]),
      ])
    },
  })
  return {
    AppTable,
    useTable: (options: { searchForm: unknown }) => {
      mocks.tableSearchForm.value = options.searchForm
      const selectedIds = ref([...mocks.selectedIds.value])
      return {
        clearSelection: vi.fn(),
        data: ref(mocks.tableData.value),
        dispose: vi.fn(),
        getList: mocks.getList,
        loading: ref(false),
        onPageChange: vi.fn(),
        onSelectionChange: (rows: Array<{ id: number }>) => {
          selectedIds.value = rows.map(({ id }) => id)
          mocks.selectedIds.value = [...selectedIds.value]
        },
        page: ref({ current_page: 1, page_size: 20, total: 0 }),
        refresh: vi.fn(),
        resetPage: vi.fn(),
        selectedIds,
      }
    },
  }
})
vi.mock('@/components/Search', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    Search: defineComponent({
      name: 'SearchMock',
      setup() {
        return () => h('div', { 'data-test': 'search-stub' })
      },
    }),
  }
})
vi.mock('@/store/user', () => ({ useUserStore: () => ({ can: mocks.can }) }))
vi.mock('@/lib/browser/download', () => ({ downloadTextFile: mocks.downloadTextFile }))
vi.mock('element-plus', () => ({
  ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
  ElMessageBox: { confirm: mocks.confirm },
  ElNotification: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}))
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))

const { useRedeemCodePage } = await import(
  '@/views/Main/payment/redeem-codes/composables/useRedeemCodePage'
)
const { default: RedeemCodeGenerateDialog } = await import(
  '@/views/Main/payment/redeem-codes/components/RedeemCodeGenerateDialog.vue'
)
const { default: RedeemCodePage } = await import(
  '@/views/Main/payment/redeem-codes/index.vue'
)

function mountPage() {
  let page!: ReturnType<typeof useRedeemCodePage>
  const Harness = defineComponent({
    setup() {
      page = useRedeemCodePage()
      return () => null
    },
  })
  const wrapper = mount(Harness)
  return { page, wrapper }
}

const form = {
  amount: '10.00',
  quantity: 2,
  expires_at: '',
  note: 'support batch',
}

describe('redeem code page workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.exportCodes.mockReset()
    mocks.generateBatch.mockReset()
    mocks.lookup.mockReset()
    mocks.voidCodes.mockReset()
    mocks.getList.mockReset()
    mocks.pageInit.mockReset()
    mocks.randomUUID.mockReset()
    mocks.randomUUID.mockReturnValueOnce('request-1').mockReturnValueOnce('request-2').mockReturnValueOnce('request-3')
    vi.stubGlobal('crypto', { randomUUID: mocks.randomUUID })
    mocks.can.mockImplementation((code: string) => code !== 'payment_redeem_code_void')
    mocks.confirm.mockResolvedValue('confirm')
    mocks.getList.mockResolvedValue(undefined)
    mocks.pageInit.mockResolvedValue({ states: [] })
    mocks.selectedIds.value = []
  })

  it('reuses the request ID after failure and rotates it only after success or form changes', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    mocks.generateBatch
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ batch: { batch_no: 'BATCH-1' }, codes: [] })
      .mockResolvedValueOnce({ batch: { batch_no: 'BATCH-2' }, codes: [] })
      .mockResolvedValueOnce({ batch: { batch_no: 'BATCH-3' }, codes: [] })

    await expect(page.generateBatch(form)).rejects.toThrow('timeout')
    await expect(page.generateBatch({ ...form })).resolves.toMatchObject({ batch: { batch_no: 'BATCH-1' } })
    await page.generateBatch({ ...form })
    await page.generateBatch({ ...form, note: 'changed' })

    expect(mocks.generateBatch.mock.calls.map(([payload]) => payload.request_id)).toEqual([
      'request-1',
      'request-1',
      'request-2',
      'request-3',
    ])
    expect(mocks.generateBatch.mock.calls[0]?.[0]).toMatchObject({
      amount: '10.00',
      quantity: 2,
      note: 'support batch',
      request_id: 'request-1',
    })
    wrapper.unmount()
  })

  it('serializes concurrent batch generation and permits a manual submission after completion', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    let resolveGenerate!: (value: Record<string, unknown>) => void
    mocks.generateBatch.mockReturnValueOnce(new Promise((resolve) => {
      resolveGenerate = resolve
    }))

    const first = page.generateBatch(form)
    const concurrent = page.generateBatch({ ...form })

    await expect(concurrent).resolves.toBeUndefined()
    expect(mocks.generateBatch).toHaveBeenCalledTimes(1)
    expect(mocks.randomUUID).toHaveBeenCalledTimes(1)

    resolveGenerate({ batch: { batch_no: 'BATCH-1' }, codes: [] })
    await expect(first).resolves.toMatchObject({ batch: { batch_no: 'BATCH-1' } })

    mocks.generateBatch.mockResolvedValueOnce({ batch: { batch_no: 'BATCH-2' }, codes: [] })
    await page.generateBatch(form)
    expect(mocks.generateBatch).toHaveBeenCalledTimes(2)
    expect(mocks.generateBatch.mock.calls.map(([payload]) => payload.request_id)).toEqual([
      'request-1',
      'request-2',
    ])
    wrapper.unmount()
  })

  it('rotates a conflicting request ID without automatically resubmitting', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    mocks.generateBatch
      .mockRejectedValueOnce(createApiError({
        kind: 'business',
        code: 'payment.redeem_code.request_conflict',
        retryable: false,
        messageKey: 'payment.redeem_code.request_conflict',
      }))
      .mockResolvedValueOnce({ batch: { batch_no: 'BATCH-2' }, codes: [] })

    await expect(page.generateBatch(form)).resolves.toBeUndefined()
    expect(mocks.generateBatch).toHaveBeenCalledTimes(1)
    await page.generateBatch(form)
    expect(mocks.generateBatch.mock.calls.map(([payload]) => payload.request_id)).toEqual([
      'request-1',
      'request-2',
    ])
    wrapper.unmount()
  })

  it('uses one request ID and one exact payload for equivalent decimal amount forms', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    mocks.generateBatch
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ batch: { batch_no: 'BATCH-1' }, codes: [] })

    await expect(page.generateBatch({ ...form, amount: '0010.0' })).rejects.toThrow('timeout')
    await page.generateBatch({ ...form, amount: '10.00' })

    expect(mocks.generateBatch.mock.calls.map(([payload]) => ({
      amount: payload.amount,
      request_id: payload.request_id,
    }))).toEqual([
      { amount: '10.00', request_id: 'request-1' },
      { amount: '10.00', request_id: 'request-1' },
    ])
    wrapper.unmount()
  })

  it('treats generation as successful even when the follow-up list refresh fails', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    mocks.generateBatch
      .mockResolvedValueOnce({ batch: { batch_no: 'BATCH-1' }, codes: [] })
      .mockResolvedValueOnce({ batch: { batch_no: 'BATCH-2' }, codes: [] })
    mocks.getList.mockRejectedValueOnce(new Error('refresh failed'))

    await expect(page.generateBatch(form)).resolves.toMatchObject({ batch: { batch_no: 'BATCH-1' } })
    await expect(page.generateBatch(form)).resolves.toMatchObject({ batch: { batch_no: 'BATCH-2' } })

    expect(mocks.generateBatch.mock.calls.map(([payload]) => payload.request_id)).toEqual([
      'request-1',
      'request-2',
    ])
    expect(page.hasPendingGeneration.value).toBe(false)
    wrapper.unmount()
  })

  it('keeps exact-code lookup in a POST body and outside list and route state', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    mocks.lookup.mockResolvedValue({
      item: {
        id: 7,
        code: 'FULL-SECRET-CODE',
        state: 'unused',
      },
    })

    page.lookupInput.value = '  FULL-SECRET-CODE  '
    await page.lookup()

    expect(mocks.lookup).toHaveBeenCalledWith({ code: 'FULL-SECRET-CODE' })
    expect(page.lookupResult.value).toMatchObject({ id: 7, code: 'FULL-SECRET-CODE' })
    expect(page.listParams.value).not.toHaveProperty('code')
    expect(JSON.stringify(mocks.push.mock.calls)).not.toContain('FULL-SECRET-CODE')
    wrapper.unmount()
  })

  it('builds list/export filters without pagination or full code and downloads returned text', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    Object.assign(page.searchForm.value, {
      batch_no: ' BATCH-7 ',
      state: 'unused',
      used_user: ' member@example.com ',
      used_by_text: '42',
      note: ' support ',
      dateRange: ['2026-07-01', '2026-07-25'],
    })
    page.lookupInput.value = 'FULL-SECRET-CODE'
    mocks.exportCodes.mockResolvedValue({
      content: 'code\nFULL-SECRET-CODE\n',
      filename: 'redeem-codes.csv',
      row_count: 1,
    })

    await page.exportCodes()

    expect(page.listParams.value).toEqual({
      batch_no: 'BATCH-7',
      state: 'unused',
      used_user: 'member@example.com',
      used_by: 42,
      note: 'support',
      created_from: new Date(2026, 6, 1, 0, 0, 0, 0).toISOString(),
      created_to: new Date(2026, 6, 26, 0, 0, 0, 0).toISOString(),
    })
    expect(mocks.exportCodes).toHaveBeenCalledWith(page.listParams.value)
    expect(mocks.exportCodes.mock.calls[0]?.[0]).not.toHaveProperty('current_page')
    expect(JSON.stringify(mocks.exportCodes.mock.calls[0]?.[0])).not.toContain('FULL-SECRET-CODE')
    expect(mocks.downloadTextFile).toHaveBeenCalledWith(
      'code\nFULL-SECRET-CODE\n',
      'redeem-codes.csv',
      'text/csv;charset=utf-8',
    )

    mocks.exportCodes.mockResolvedValueOnce({
      content: 'code\nBATCH-CODE\n',
      filename: 'batch.csv',
      row_count: 1,
    })
    await page.exportBatch(' BATCH-ONLY ')
    expect(mocks.exportCodes).toHaveBeenLastCalledWith({ batch_no: 'BATCH-ONLY' })

    page.searchForm.value.dateRange = ['not-a-date', '2026-02-31']
    expect(page.listParams.value).not.toHaveProperty('created_from')
    expect(page.listParams.value).not.toHaveProperty('created_to')
    wrapper.unmount()
  })

  it('derives permissions and only allows unused or expired codes to be voided', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()

    expect(page.canGenerate.value).toBe(true)
    expect(page.canVoid.value).toBe(false)
    expect(page.canVoidRow({ state: 'unused' })).toBe(true)
    expect(page.canVoidRow({ state: 'expired' })).toBe(true)
    expect(page.canVoidRow({ state: 'used' })).toBe(false)
    expect(page.canVoidRow({ state: 'voided' })).toBe(false)
    expect(mocks.can).toHaveBeenCalledWith('payment_redeem_code_generate')
    expect(mocks.can).toHaveBeenCalledWith('payment_redeem_code_void')
    wrapper.unmount()
  })

  it('confirms the eligible count before a batch void and routes used rows by transaction only', async () => {
    mocks.can.mockReturnValue(true)
    const { page, wrapper } = mountPage()
    await flushPromises()
    const rows = [
      { id: 1, code: 'UNUSED-SECRET', state: 'unused', wallet_transaction_no: '' },
      { id: 2, code: 'EXPIRED-SECRET', state: 'expired', wallet_transaction_no: '' },
      { id: 3, code: 'USED-SECRET', state: 'used', wallet_transaction_no: 'TX-300' },
    ]
    mocks.voidCodes.mockResolvedValue({ voided: 2 })

    await page.voidRows(rows)
    page.goToLedger(rows[2]!)

    expect(mocks.confirm.mock.calls[0]?.[0]).toContain('"count":2')
    expect(mocks.voidCodes).toHaveBeenCalledWith({ ids: [1, 2] })
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/payment/ledger',
      query: { keyword: 'TX-300' },
    })
    expect(JSON.stringify(mocks.push.mock.calls)).not.toContain('USED-SECRET')
    wrapper.unmount()
  })

  it('rotates a failed request only after abandoning it is confirmed', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    mocks.generateBatch
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ batch: { batch_no: 'BATCH-2' }, codes: [] })

    await expect(page.generateBatch(form)).rejects.toThrow('timeout')
    expect(page.hasPendingGeneration.value).toBe(true)
    await page.abandonPendingGeneration()
    await page.generateBatch(form)

    expect(mocks.confirm).toHaveBeenCalledTimes(1)
    expect(mocks.generateBatch.mock.calls.map(([payload]) => payload.request_id)).toEqual([
      'request-1',
      'request-2',
    ])
    wrapper.unmount()
  })

  it('ignores abandonment while a failed generation request is being retried', async () => {
    const { page, wrapper } = mountPage()
    await flushPromises()
    mocks.generateBatch.mockRejectedValueOnce(new Error('first timeout'))
    await expect(page.generateBatch(form)).rejects.toThrow('first timeout')

    let rejectRetry!: (reason: Error) => void
    mocks.generateBatch.mockReturnValueOnce(new Promise((_, reject) => {
      rejectRetry = reject
    }))
    const retry = page.generateBatch(form)

    await page.abandonPendingGeneration()
    expect(mocks.confirm).not.toHaveBeenCalled()
    rejectRetry(new Error('retry timeout'))
    await expect(retry).rejects.toThrow('retry timeout')

    mocks.generateBatch.mockResolvedValueOnce({ batch: { batch_no: 'BATCH-1' }, codes: [] })
    await page.generateBatch(form)
    expect(mocks.generateBatch.mock.calls.map(([payload]) => payload.request_id)).toEqual([
      'request-1',
      'request-1',
      'request-1',
    ])
    wrapper.unmount()
  })
})

const ElDialogStub = defineComponent({
  name: 'ElDialog',
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    closeOnClickModal: { type: Boolean, default: true },
    closeOnPressEscape: { type: Boolean, default: true },
    showClose: { type: Boolean, default: true },
  },
  emits: ['update:modelValue'],
  setup(props, { slots }) {
    return () => props.modelValue
      ? h('section', { class: 'dialog-stub' }, [slots.default?.(), slots.footer?.()])
      : null
  },
})
const ElFormStub = defineComponent({
  props: { disabled: Boolean },
  setup(_, { expose, slots }) {
    expose({ validate: () => Promise.resolve(true), clearValidate: vi.fn() })
    return () => h('form', slots.default?.())
  },
})
const ElFormItemStub = defineComponent({
  setup(_, { slots }) {
    return () => h('label', slots.default?.())
  },
})
const ElInputStub = defineComponent({
  inheritAttrs: false,
  props: { modelValue: { type: [String, Number], default: '' } },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () => h('input', {
      ...attrs,
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
    })
  },
})
const ElInputNumberStub = defineComponent({
  inheritAttrs: false,
  props: { modelValue: { type: Number, default: 1 } },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () => h('input', {
      ...attrs,
      type: 'number',
      value: props.modelValue,
      onInput: (event: Event) => emit('update:modelValue', Number((event.target as HTMLInputElement).value)),
    })
  },
})
const ElButtonStub = defineComponent({
  inheritAttrs: false,
  props: { disabled: Boolean, loading: Boolean },
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () => h('button', {
      ...attrs,
      disabled: props.disabled || props.loading,
      type: 'button',
      onClick: (event: MouseEvent) => {
        if (!props.disabled && !props.loading) emit('click', event)
      },
    }, slots.default?.())
  },
})
const PassThroughStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  },
})

function mountGenerateDialog(props: Record<string, unknown>) {
  return mount(RedeemCodeGenerateDialog, {
    props: {
      modelValue: true,
      generating: false,
      hasPendingRequest: false,
      abandonPending: vi.fn().mockResolvedValue(undefined),
      ...props,
    },
    global: {
      directives: { loading: () => undefined },
      stubs: {
        ElAlert: PassThroughStub,
        ElButton: ElButtonStub,
        ElDatePicker: ElInputStub,
        ElDialog: ElDialogStub,
        ElForm: ElFormStub,
        ElFormItem: ElFormItemStub,
        ElIcon: PassThroughStub,
        ElInput: ElInputStub,
        ElInputNumber: ElInputNumberStub,
        ElTooltip: PassThroughStub,
      },
    },
  })
}

describe('redeem code generation dialog', () => {
  it('keeps generated full codes locally, supports copy/export, and clears them when closed', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const generate = vi.fn().mockResolvedValue({
      batch: {
        amount: '10.00',
        batch_no: 'BATCH-1',
        created_at: '2026-07-25T00:00:00Z',
        created_by: 1,
        expires_at: '',
        id: 1,
        note: 'support batch',
        quantity: 2,
        replayed: false,
        request_id: 'request-1',
      },
      codes: [
        { id: 1, code: 'FULL-CODE-ONE' },
        { id: 2, code: 'FULL-CODE-TWO' },
      ],
    })
    const exportBatch = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountGenerateDialog({ generate, exportBatch })

    await wrapper.get('[data-test="generate-amount"]').setValue('10.00')
    await wrapper.get('[data-test="generate-quantity"]').setValue('2')
    await wrapper.get('[data-test="generate-note"]').setValue(' support batch ')
    await wrapper.get('[data-test="generate-submit"]').trigger('click')
    await flushPromises()

    expect(generate).toHaveBeenCalledWith({
      amount: '10.00',
      quantity: 2,
      expires_at: '',
      note: ' support batch ',
    })
    expect(wrapper.text()).toContain('FULL-CODE-ONE')
    expect(wrapper.text()).toContain('FULL-CODE-TWO')

    await wrapper.get('[data-test="copy-generated-codes"]').trigger('click')
    await wrapper.get('[data-test="export-generated-batch"]').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith('FULL-CODE-ONE\nFULL-CODE-TWO')
    expect(exportBatch).toHaveBeenCalledWith('BATCH-1')

    await wrapper.setProps({ modelValue: false })
    await nextTick()
    await wrapper.setProps({ modelValue: true })
    await nextTick()
    expect(wrapper.text()).not.toContain('FULL-CODE-ONE')
    expect(wrapper.text()).not.toContain('FULL-CODE-TWO')
    wrapper.unmount()
  })

  it('does not submit an invalid quantity and exposes confirmed abandonment for pending requests', async () => {
    const generate = vi.fn()
    const abandonPending = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountGenerateDialog({
      generate,
      exportBatch: vi.fn(),
      abandonPending,
      hasPendingRequest: true,
    })

    await wrapper.get('[data-test="generate-amount"]').setValue('10.00')
    await wrapper.get('[data-test="generate-quantity"]').setValue('0')
    await wrapper.get('[data-test="generate-submit"]').trigger('click')
    await wrapper.get('[data-test="abandon-pending-request"]').trigger('click')
    await flushPromises()

    expect(generate).not.toHaveBeenCalled()
    expect(abandonPending).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('keeps the dialog open and presents the result when close is attempted during generation', async () => {
    let resolveGenerate!: (value: Record<string, unknown>) => void
    const generate = vi.fn(() => new Promise<Record<string, unknown>>((resolve) => {
      resolveGenerate = resolve
    }))
    const abandonPending = vi.fn().mockResolvedValue(undefined)
    const wrapper = mountGenerateDialog({
      generate,
      exportBatch: vi.fn(),
      abandonPending,
      hasPendingRequest: true,
    })
    await wrapper.get('[data-test="generate-amount"]').setValue('10.00')
    const submit = wrapper.get('[data-test="generate-submit"]')
    const firstClick = submit.trigger('click')
    const concurrentClick = submit.trigger('click')
    await Promise.all([firstClick, concurrentClick])
    await flushPromises()
    expect(generate).toHaveBeenCalledTimes(1)
    await wrapper.setProps({ generating: true })

    const dialog = wrapper.getComponent(ElDialogStub)
    expect(dialog.props()).toMatchObject({
      closeOnClickModal: false,
      closeOnPressEscape: false,
      showClose: false,
    })
    expect(wrapper.getComponent(ElFormStub).props('disabled')).toBe(true)
    expect(wrapper.get('[data-test="abandon-pending-request"]').attributes('disabled')).toBeDefined()

    await wrapper.get('[data-test="abandon-pending-request"]').trigger('click')
    await wrapper.get('[data-test="generate-close"]').trigger('click')
    dialog.vm.$emit('update:modelValue', false)
    await nextTick()
    expect(abandonPending).not.toHaveBeenCalled()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    resolveGenerate({
      batch: { batch_no: 'BATCH-IN-FLIGHT' },
      codes: [{ id: 1, code: 'VISIBLE-FULL-CODE' }],
    })
    await flushPromises()
    await wrapper.setProps({ generating: false })
    expect(wrapper.text()).toContain('VISIBLE-FULL-CODE')
    wrapper.unmount()
  })

  it('does not restore generated codes when a response arrives after the dialog closes', async () => {
    let resolveGenerate!: (value: Record<string, unknown>) => void
    const generate = vi.fn(() => new Promise<Record<string, unknown>>((resolve) => {
      resolveGenerate = resolve
    }))
    const wrapper = mountGenerateDialog({ generate, exportBatch: vi.fn() })
    await wrapper.get('[data-test="generate-amount"]').setValue('10.00')
    await wrapper.get('[data-test="generate-submit"]').trigger('click')
    await wrapper.setProps({ modelValue: false })

    resolveGenerate({
      batch: { batch_no: 'BATCH-LATE' },
      codes: [{ id: 1, code: 'LATE-FULL-CODE' }],
    })
    await flushPromises()
    await wrapper.setProps({ modelValue: true })
    await nextTick()

    expect(wrapper.text()).not.toContain('LATE-FULL-CODE')
    wrapper.unmount()
  })
})

const codeRows = [
  {
    amount: '10.00', amount_cents: 1000, batch_id: 1, batch_no: 'BATCH-1',
    code: 'UNUSED-FULL-CODE', created_at: '2026-07-25T00:00:00Z', created_by: 1,
    creator_username: 'admin', expires_at: '', id: 1, note: '', state: 'unused',
    used_account: '', used_at: '', used_by: 0, used_username: '', wallet_transaction_no: '',
  },
  {
    amount: '20.00', amount_cents: 2000, batch_id: 1, batch_no: 'BATCH-1',
    code: 'USED-FULL-CODE', created_at: '2026-07-25T00:00:00Z', created_by: 1,
    creator_username: 'admin', expires_at: '2026-08-25T00:00:00Z', id: 2, note: '', state: 'used',
    used_account: 'user@example.com', used_at: '2026-07-25T01:00:00Z', used_by: 7,
    used_username: 'member', wallet_transaction_no: 'TX-USED-2',
  },
]

function mountManagementPage() {
  return mount(RedeemCodePage, {
    global: {
      directives: { loading: () => undefined },
      stubs: {
        RedeemCodeGenerateDialog: true,
        ElButton: ElButtonStub,
        ElIcon: PassThroughStub,
        ElInput: ElInputStub,
        ElTag: PassThroughStub,
        ElTooltip: PassThroughStub,
      },
    },
  })
}

describe('redeem code management page', () => {
  it('wires operation permissions, exact lookup, read-only used rows, and transaction-only routing', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    mocks.tableData.value = codeRows
    mocks.can.mockImplementation((code: string) => code === 'payment_redeem_code_generate')
    mocks.lookup.mockResolvedValue({ item: codeRows[0] })
    mocks.pageInit.mockResolvedValue({ states: [
      { label: 'Unused', value: 'unused' },
      { label: 'Used', value: 'used' },
    ] })
    const wrapper = mountManagementPage()
    await flushPromises()

    expect(wrapper.find('[data-test="open-generate-dialog"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="void-selected"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="void-row"]')).toHaveLength(0)
    expect(wrapper.text()).toContain('UNUSED-FULL-CODE')
    expect(wrapper.text()).toContain('USED-FULL-CODE')

    await wrapper.get('[data-test="ledger-link"]').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({
      path: '/payment/ledger',
      query: { keyword: 'TX-USED-2' },
    })
    expect(JSON.stringify(mocks.push.mock.calls)).not.toContain('USED-FULL-CODE')

    await wrapper.get('[data-test="lookup-code"]').setValue('UNUSED-FULL-CODE')
    await wrapper.get('[data-test="lookup-submit"]').trigger('click')
    await flushPromises()
    expect(mocks.lookup).toHaveBeenCalledWith({ code: 'UNUSED-FULL-CODE' })

    wrapper.unmount()
  })

  it('shows void controls only with permission and disables selection for used rows', async () => {
    mocks.tableData.value = codeRows
    mocks.can.mockImplementation((code: string) => code === 'payment_redeem_code_void')
    const wrapper = mountManagementPage()
    await flushPromises()

    expect(wrapper.find('[data-test="open-generate-dialog"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="void-selected"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="void-row"]')).toHaveLength(1)
    const table = wrapper.getComponent({ name: 'AppTableMock' })
    expect(table.props('selectable')).toBe(true)
    const selectionSelectable = table.props('selectionSelectable') as (row: typeof codeRows[number]) => boolean
    expect(selectionSelectable(codeRows[0]!)).toBe(true)
    expect(selectionSelectable(codeRows[1]!)).toBe(false)
    wrapper.unmount()
  })
})
