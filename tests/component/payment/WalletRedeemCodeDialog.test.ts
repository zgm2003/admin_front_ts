import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiError, type ApiErrorKind } from '@/modules/http/error'
import type {
  WalletRedemptionResponse,
  WalletSummaryResponse,
} from '@/api/wallet'

const mocks = vi.hoisted(() => ({
  error: vi.fn(),
  getList: vi.fn(),
  push: vi.fn(),
  redeem: vi.fn(),
  success: vi.fn(),
  summary: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('@/api/wallet', () => ({
  WalletApi: {
    redeem: mocks.redeem,
    summary: mocks.summary,
    transactions: vi.fn(),
  },
}))

vi.mock('@/components/Search', () => ({
  Search: defineComponent({
    name: 'Search',
    props: { fields: { type: Array, default: () => [] } },
    setup: () => () => null,
  }),
}))

vi.mock('@/components/Table', () => ({
  AppTable: defineComponent({ name: 'AppTable', setup: () => () => null }),
  useTable: () => ({
    data: { value: [] },
    getList: mocks.getList,
    loading: { value: false },
    onPageChange: vi.fn(),
    page: { value: { current_page: 1, page_size: 20, total: 0 } },
    refresh: vi.fn(),
    resetPage: vi.fn(),
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, data?: Record<string, unknown>) => data?.amount
      ? `${key}:${String(data.amount)}`
      : key,
  }),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: mocks.error,
    success: mocks.success,
    warning: mocks.warning,
  },
}))

const RedeemCodeDialog = (await import(
  '@/views/Main/personal/wallet/components/RedeemCodeDialog.vue'
)).default
const WalletPage = (await import('@/views/Main/personal/wallet/index.vue')).default

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

const ElInputStub = defineComponent({
  name: 'ElInput',
  inheritAttrs: false,
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit, expose }) {
    expose({ focus: vi.fn() })
    return () => h('input', {
      ...attrs,
      value: props.modelValue,
      onInput: (event: Event) => emit(
        'update:modelValue',
        (event.target as HTMLInputElement).value,
      ),
    })
  },
})

const ElButtonStub = defineComponent({
  name: 'ElButton',
  inheritAttrs: false,
  props: {
    disabled: Boolean,
    icon: { type: [Object, Function], default: undefined },
    loading: Boolean,
  },
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () => h('button', {
      ...attrs,
      'data-icon': (props.icon as { name?: string } | undefined)?.name ?? '',
      disabled: props.disabled || props.loading,
      type: 'button',
      onClick: (event: MouseEvent) => emit('click', event),
    }, slots.default?.())
  },
})

const PassThroughStub = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.())
  },
})

const ElAlertStub = defineComponent({
  name: 'ElAlert',
  props: { title: { type: String, default: '' } },
  setup(props) {
    return () => h('div', { role: 'alert' }, props.title)
  },
})

const walletSummary = (balance: string): WalletSummaryResponse => ({
  available_balance: balance,
  balance,
  held_amount: '0.00',
  total_consume: '0.00',
  total_recharge: balance,
})

const redemptionResult = (amount = '18.80'): WalletRedemptionResponse => ({
  amount,
  replayed: false,
  transaction: {
    amount_cents: 1880,
    amount_text: amount,
    balance_after_cents: 2880,
    balance_after_text: '28.80',
    balance_before_cents: 1000,
    balance_before_text: '10.00',
    created_at: '2026-07-25T00:00:00Z',
    direction: 'income',
    direction_text: 'Income',
    source_type: 'redeem_code',
    source_type_text: 'Redeem code',
    transaction_no: 'TX-REDEEM-1',
  },
  wallet: walletSummary('28.80'),
})

const globalStubs = {
  ElAlert: ElAlertStub,
  ElButton: ElButtonStub,
  ElDialog: ElDialogStub,
  ElForm: PassThroughStub,
  ElFormItem: PassThroughStub,
  ElInput: ElInputStub,
  ElScrollbar: PassThroughStub,
  ElTabPane: PassThroughStub,
  ElTabs: PassThroughStub,
  ElTag: PassThroughStub,
}

function mountDialog() {
  return mount(RedeemCodeDialog, {
    props: { modelValue: true },
    global: { stubs: globalStubs },
  })
}

async function mountWalletPage() {
  mocks.summary.mockResolvedValueOnce(walletSummary('10.00'))
  mocks.getList.mockResolvedValueOnce(undefined)
  const wrapper = mount(WalletPage, { global: { stubs: globalStubs } })
  await flushPromises()
  mocks.summary.mockClear()
  mocks.getList.mockClear()
  return wrapper
}

describe('wallet redeem code dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getList.mockResolvedValue(undefined)
    mocks.summary.mockResolvedValue(walletSummary('10.00'))
  })

  it('contains one code input and guards duplicate submits at the function boundary', async () => {
    let resolveRedeem!: (result: WalletRedemptionResponse) => void
    mocks.redeem.mockReturnValue(new Promise((resolve) => {
      resolveRedeem = resolve
    }))
    const wrapper = mountDialog()

    expect(wrapper.findAll('input')).toHaveLength(1)
    await wrapper.get('[data-test="redeem-code-input"]').setValue('  ONLY-IN-BODY  ')
    const submit = wrapper.get('[data-test="redeem-code-submit"]')
    const firstClick = submit.trigger('click')
    const secondClick = submit.trigger('click')
    await Promise.all([firstClick, secondClick])

    expect(mocks.redeem).toHaveBeenCalledTimes(1)
    expect(mocks.redeem).toHaveBeenCalledWith({ code: 'ONLY-IN-BODY' })
    expect(submit.attributes('disabled')).toBeDefined()

    const dialog = wrapper.getComponent(ElDialogStub)
    expect(dialog.props()).toMatchObject({
      closeOnClickModal: false,
      closeOnPressEscape: false,
      showClose: false,
    })
    dialog.vm.$emit('update:modelValue', false)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    resolveRedeem(redemptionResult())
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    wrapper.unmount()
  })

  it('rejects a blank code locally without consuming a redemption attempt', async () => {
    const wrapper = mountDialog()
    const input = wrapper.get('[data-test="redeem-code-input"]')
    await input.setValue('   ')

    await wrapper.get('[data-test="redeem-code-submit"]').trigger('click')
    await flushPromises()

    expect(mocks.redeem).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toBe('wallet.redeem.errors.unavailable')
    expect(input.attributes('maxlength')).toBe('128')
    expect((input.element as HTMLInputElement).value).toBe('   ')
    wrapper.unmount()
  })

  it('retains the entered code after a failure and permits a manual retry', async () => {
    mocks.redeem
      .mockRejectedValueOnce(createApiError({
        kind: 'business',
        code: 'unavailable',
        message: 'this code was already used by another account',
        messageKey: 'unavailable',
        retryable: false,
        status: 400,
      }))
      .mockResolvedValueOnce(redemptionResult())
    const wrapper = mountDialog()
    const input = wrapper.get('[data-test="redeem-code-input"]')
    await input.setValue('RETRY-SAME-CODE')

    await wrapper.get('[data-test="redeem-code-submit"]').trigger('click')
    await flushPromises()

    expect((input.element as HTMLInputElement).value).toBe('RETRY-SAME-CODE')
    expect(wrapper.get('[role="alert"]').text()).toBe('wallet.redeem.errors.unavailable')
    expect(wrapper.text()).not.toContain('already used')
    expect(wrapper.get('[data-test="redeem-code-submit"]').attributes('disabled')).toBeUndefined()

    await wrapper.get('[data-test="redeem-code-submit"]').trigger('click')
    await flushPromises()
    expect(mocks.redeem).toHaveBeenCalledTimes(2)
    expect(mocks.redeem).toHaveBeenLastCalledWith({ code: 'RETRY-SAME-CODE' })

    wrapper.unmount()
  })

  it('clears the entered code and error after an allowed external close', async () => {
    mocks.redeem.mockRejectedValueOnce(createApiError({
      kind: 'business',
      code: 'unavailable',
      message: 'unavailable',
      messageKey: 'unavailable',
      retryable: false,
      status: 400,
    }))
    const wrapper = mountDialog()
    const input = wrapper.get('[data-test="redeem-code-input"]')
    await input.setValue('CLEAR-ON-CLOSE')
    await wrapper.get('[data-test="redeem-code-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('wallet.redeem.errors.unavailable')
    wrapper.getComponent(ElDialogStub).vm.$emit('update:modelValue', false)
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
    expect((input.element as HTMLInputElement).value).toBe('')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    wrapper.unmount()
  })

  it.each([
    ['400 code_required', 'validation', 400, 'code_required', 'wallet.redeem.errors.unavailable'],
    ['429', 'rate-limit', 429, 'too_many_attempts', 'wallet.redeem.errors.tooFrequent'],
    ['500 integrity', 'internal', 500, 'integrity', 'wallet.redeem.errors.resultUncertain'],
    ['503 rate dependency', 'dependency', 503, 'rate_limit_unavailable', 'wallet.redeem.errors.serviceUnavailable'],
    ['503 dependency', 'dependency', 503, 'dependency_unavailable', 'wallet.redeem.errors.serviceUnavailable'],
    ['network', 'network', undefined, 'http.network', 'wallet.redeem.errors.resultUncertain'],
  ] as const)(
    'maps %s failures without exposing backend details',
    async (_, kind, status, code, expectedKey) => {
      mocks.redeem.mockRejectedValue(createApiError({
        kind: kind as ApiErrorKind,
        code,
        message: 'expired, voided, or used by somebody@example.com',
        messageKey: code,
        retryable: false,
        status,
      }))
      const wrapper = mountDialog()
      await wrapper.get('[data-test="redeem-code-input"]').setValue('SECRET-CODE')
      await wrapper.get('[data-test="redeem-code-submit"]').trigger('click')
      await flushPromises()

      expect(wrapper.get('[role="alert"]').text()).toBe(expectedKey)
      expect(wrapper.text()).not.toContain('somebody@example.com')
      expect(wrapper.text()).not.toContain('expired')
      wrapper.unmount()
    },
  )
})

describe('personal wallet redemption workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getList.mockResolvedValue(undefined)
    mocks.summary.mockResolvedValue(walletSummary('10.00'))
  })

  it('adds a Ticket secondary action and the redeem_code source filter', async () => {
    const wrapper = await mountWalletPage()
    const action = wrapper.get('[data-test="open-redeem-code"]')

    expect(action.text()).toContain('wallet.redeem.action')
    expect(action.attributes('data-icon')).toBe('Ticket')
    expect(action.classes()).not.toContain('el-button--primary')

    const search = wrapper.getComponent({ name: 'Search' })
    const fields = search.props('fields') as Array<{
      key: string
      options?: Array<{ label: string; value: string }>
    }>
    expect(fields.find(({ key }) => key === 'source_type')?.options).toContainEqual({
      label: 'wallet.sourceRedeemCode',
      value: 'redeem_code',
    })
    wrapper.unmount()
  })

  it('closes and clears first, adopts the authoritative wallet, then refreshes both views in parallel', async () => {
    const wrapper = await mountWalletPage()
    let resolveSummary!: (summary: WalletSummaryResponse) => void
    let resolveTransactions!: () => void
    mocks.summary.mockReturnValue(new Promise((resolve) => {
      resolveSummary = resolve
    }))
    mocks.getList.mockReturnValue(new Promise<void>((resolve) => {
      resolveTransactions = resolve
    }))
    mocks.redeem.mockResolvedValue(redemptionResult('18.80'))

    await wrapper.get('[data-test="open-redeem-code"]').trigger('click')
    await wrapper.get('[data-test="redeem-code-input"]').setValue('SUCCESS-CODE')
    await wrapper.get('[data-test="redeem-code-submit"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('.dialog-stub').exists()).toBe(false)
    expect(wrapper.text()).toContain('¥28.80')
    expect(mocks.success).toHaveBeenCalledWith('wallet.redeem.messages.success:18.80')
    expect(mocks.summary).toHaveBeenCalledTimes(1)
    expect(mocks.getList).toHaveBeenCalledTimes(1)

    resolveSummary(walletSummary('29.00'))
    resolveTransactions()
    await flushPromises()
    expect(wrapper.text()).toContain('¥29.00')

    await wrapper.get('[data-test="open-redeem-code"]').trigger('click')
    expect((wrapper.get('[data-test="redeem-code-input"]').element as HTMLInputElement).value).toBe('')
    wrapper.unmount()
  })

  it.each(['summary', 'transactions'] as const)(
    'keeps redemption successful when the %s refresh fails and never resubmits',
    async (failedRefresh) => {
      const wrapper = await mountWalletPage()
      mocks.redeem.mockResolvedValue(redemptionResult('18.80'))
      mocks.summary.mockImplementation(() => failedRefresh === 'summary'
        ? Promise.reject(new Error('summary refresh failed'))
        : Promise.resolve(walletSummary('29.00')))
      mocks.getList.mockImplementation(() => failedRefresh === 'transactions'
        ? Promise.reject(new Error('transactions refresh failed'))
        : Promise.resolve())

      await wrapper.get('[data-test="open-redeem-code"]').trigger('click')
      await wrapper.get('[data-test="redeem-code-input"]').setValue('SUCCESS-NO-RETRY')
      await wrapper.get('[data-test="redeem-code-submit"]').trigger('click')
      await flushPromises()

      expect(wrapper.find('.dialog-stub').exists()).toBe(false)
      expect(mocks.success).toHaveBeenCalledTimes(1)
      expect(mocks.success).toHaveBeenCalledWith('wallet.redeem.messages.success:18.80')
      expect(mocks.warning).toHaveBeenCalledWith('wallet.redeem.messages.partialRefresh')
      expect(mocks.error).not.toHaveBeenCalled()
      expect(mocks.redeem).toHaveBeenCalledTimes(1)
      if (failedRefresh === 'summary') expect(wrapper.text()).toContain('¥28.80')
      wrapper.unmount()
    },
  )
})
