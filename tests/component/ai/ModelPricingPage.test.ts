/* eslint-disable vue/one-component-per-file */
import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiError } from '@/modules/http/error'

const mocks = vi.hoisted(() => ({
  can: vi.fn(),
  confirm: vi.fn(),
  detail: vi.fn(),
  isMobile: { value: false },
  list: vi.fn(),
  pageInit: vi.fn(),
  restore: vi.fn(),
  update: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('@/api/ai/model-prices', () => ({
  AiModelPriceApi: {
    detail: mocks.detail,
    list: mocks.list,
    pageInit: mocks.pageInit,
    restore: mocks.restore,
    update: mocks.update,
  },
}))
vi.mock('@/store/user', () => ({ useUserStore: () => ({ can: mocks.can }) }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => mocks.isMobile }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', () => ({
  ElMessageBox: { confirm: mocks.confirm },
  ElNotification: { success: vi.fn(), warning: mocks.warning },
}))
vi.mock('@/components/Search', () => ({
  Search: defineComponent({ name: 'SearchMock', setup: () => () => h('div') }),
}))
vi.mock('@/components/Table', () => ({
  AppTable: defineComponent({
    name: 'AppTableMock',
    props: { data: { type: Array, default: () => [] } },
    setup(props, { slots }) {
      return () => h('div', { 'data-test': 'pricing-table' }, (props.data as Array<Record<string, unknown>>)
        .flatMap((row) => [
          slots['cell-model']?.({ row }),
          slots['cell-official']?.({ row }),
          slots['cell-effective']?.({ row }),
          slots['cell-source']?.({ row }),
          slots['cell-actions']?.({ row }),
        ]))
    },
  }),
}))

const { useModelPricingPage } = await import('@/views/Main/ai/model-pricing/use-model-pricing-page')
const { default: ModelPricingPage } = await import('@/views/Main/ai/model-pricing/index.vue')
const { default: ModelPriceDrawer } = await import(
  '@/views/Main/ai/model-pricing/components/ModelPriceDrawer.vue'
)

const rates = [
  { category: 'input', price: '2.5', tier_key: 'short_context', unit: 'token', unit_scale: 1_000_000 },
  { category: 'input', price: '5', tier_key: 'long_context', unit: 'token', unit_scale: 1_000_000 },
  { category: 'output', price: '15', tier_key: 'short_context', unit: 'token', unit_scale: 1_000_000 },
]

function priceItem(version = 3) {
  const official = {
    available: true,
    override_version: 0,
    pricing_version: 'official_numeric_parity_v3',
    rates,
    source: 'official',
    source_url: 'https://developers.openai.com/api/docs/pricing',
    verified_at: '2026-07-27',
  }
  return {
    aliases: [],
    catalog_vendor: 'openai',
    catalog_version: 'official_numeric_parity_v3',
    context_tier_threshold_tokens: 272_000,
    effective: {
      ...official,
      override_version: version,
      source: 'override',
      source_url: 'https://example.com/reviewed-pricing',
    },
    max_output_tokens: 128_000,
    model_family: 'gpt',
    model_id: 'gpt-5.4',
    official,
    pricing_profile: 'standard_global',
    review_after: '',
  }
}

function mountComposable() {
  let page!: ReturnType<typeof useModelPricingPage>
  const Harness = defineComponent({
    setup() {
      page = useModelPricingPage()
      return () => null
    },
  })
  const wrapper = mount(Harness)
  return { page, wrapper }
}

const PassThrough = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })

describe('model pricing administration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.can.mockReturnValue(true)
    mocks.confirm.mockResolvedValue('confirm')
    mocks.isMobile.value = false
    mocks.pageInit.mockResolvedValue({ dict: { family_options: [
      { label: 'GPT', value: 'gpt' },
      { label: 'Claude', value: 'claude' },
    ] } })
    mocks.list.mockResolvedValue({ list: [priceItem()] })
    mocks.detail.mockResolvedValue(priceItem())
    mocks.update.mockResolvedValue({ before: priceItem().official, after: priceItem().effective })
    mocks.restore.mockResolvedValue({ before: priceItem().effective, after: priceItem().official })
  })

  it('renders every effective tier and hides all write controls without edit permission', async () => {
    mocks.can.mockReturnValue(false)
    const wrapper = mount(ModelPricingPage, {
      global: {
        stubs: {
          ElButton: PassThrough,
          ElTag: PassThrough,
          ModelPriceDrawer: true,
        },
      },
    })
    await flushPromises()

    expect(wrapper.findAll('[data-test="effective-rate"]')).toHaveLength(3)
    expect(wrapper.find('[data-test="edit-price"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="restore-price"]').exists()).toBe(false)
    expect(mocks.can).toHaveBeenCalledWith('ai_model_pricing_edit')
    wrapper.unmount()
  })

  it('blocks direct write calls without permission and refreshes detail after a version conflict', async () => {
    mocks.can.mockReturnValue(false)
    const readonly = mountComposable()
    await flushPromises()
    await readonly.page.saveOverride({
      expected_version: 3,
      rates,
      source_url: 'https://example.com/reviewed-pricing',
      verified_at: '2026-07-27',
    })
    await readonly.page.restoreOfficial(priceItem())
    expect(mocks.update).not.toHaveBeenCalled()
    expect(mocks.restore).not.toHaveBeenCalled()
    readonly.wrapper.unmount()

    mocks.can.mockReturnValue(true)
    const refreshed = priceItem(4)
    mocks.detail.mockResolvedValueOnce(priceItem()).mockResolvedValueOnce(refreshed)
    mocks.update.mockRejectedValueOnce(createApiError({
      kind: 'business',
      code: 'ai.model_pricing.version_conflict',
      messageKey: 'ai.model_pricing.version_conflict',
      retryable: false,
      status: 409,
    }))
    const editable = mountComposable()
    await flushPromises()
    await editable.page.openEdit(priceItem())
    await editable.page.saveOverride({
      expected_version: 3,
      rates,
      source_url: 'https://example.com/reviewed-pricing',
      verified_at: '2026-07-27',
    })

    expect(mocks.update).toHaveBeenCalledTimes(1)
    expect(mocks.detail).toHaveBeenCalledTimes(2)
    expect(editable.page.selectedPrice.value?.effective.override_version).toBe(4)
    expect(editable.page.drawerVisible.value).toBe(true)
    expect(mocks.warning).toHaveBeenCalled()
    editable.wrapper.unmount()
  })

  it('uses a full-screen mobile drawer and keeps the rate key set fixed', () => {
    mocks.isMobile.value = true
    const DrawerStub = defineComponent({
      name: 'ElDrawer',
      props: {
        modelValue: Boolean,
        size: { type: [String, Number], default: '' },
      },
      setup(props, { slots }) {
        return () => props.modelValue
          ? h('section', { 'data-test': 'drawer', 'data-size': String(props.size) }, [
              slots.default?.(),
              slots.footer?.(),
            ])
          : null
      },
    })
    const wrapper = mount(ModelPriceDrawer, {
      props: {
        canEdit: true,
        item: priceItem(),
        loading: false,
        modelValue: true,
        saving: false,
      },
      global: {
        stubs: {
          ElButton: PassThrough,
          ElDatePicker: PassThrough,
          ElDrawer: DrawerStub,
          ElForm: PassThrough,
          ElFormItem: PassThrough,
          ElInput: PassThrough,
          ElTag: PassThrough,
        },
      },
    })

    expect(wrapper.get('[data-test="drawer"]').attributes('data-size')).toBe('100%')
    expect(wrapper.findAll('[data-test="rate-price-input"]')).toHaveLength(3)
    expect(wrapper.find('[data-test="add-rate"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="delete-rate"]').exists()).toBe(false)
  })
})
