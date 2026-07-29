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
  restoreOfficialPrice: vi.fn(),
  syncPrice: vi.fn(),
  warning: vi.fn(),
}))

vi.mock('@/api/ai/official-models', () => ({
  AiOfficialModelApi: {
    detail: mocks.detail,
    list: mocks.list,
    pageInit: mocks.pageInit,
    restoreOfficialPrice: mocks.restoreOfficialPrice,
    syncPrice: mocks.syncPrice,
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
      const cells = ['identity', 'lifecycle', 'modalities', 'capabilities', 'limits', 'price', 'verification', 'actions']
      return () => h('div', { 'data-test': 'official-model-table' }, (props.data as Array<Record<string, unknown>>)
        .flatMap((row) => cells.map((cell) => slots[`cell-${cell}`]?.({ row }))))
    },
  }),
}))

const { useOfficialModelPage } = await import('@/views/Main/ai/official-models/use-official-model-page')
const { default: OfficialModelPage } = await import('@/views/Main/ai/official-models/index.vue')
const { default: OfficialModelDrawer } = await import(
  '@/views/Main/ai/official-models/components/OfficialModelDrawer.vue'
)

const rates = [
  { category: 'input' as const, price: '2.5', tier_key: 'short_context', unit: 'token', unit_scale: 1_000_000 },
  { category: 'input' as const, price: '5', tier_key: 'long_context', unit: 'token', unit_scale: 1_000_000 },
  { category: 'output' as const, price: '15', tier_key: 'short_context', unit: 'token', unit_scale: 1_000_000 },
]

function officialModel(lifecycle: 'active' | 'deprecated' | 'retired' = 'active', version = 3) {
  const official = {
    available: true,
    override_version: 0,
    pricing_version: 'official_models_v1',
    rates,
    source: 'official' as const,
    source_url: 'https://developers.openai.com/api/docs/pricing',
    verified_at: '2026-07-27',
  }
  return {
    aliases: ['gpt-5.4-latest'],
    capabilities: {
      image_input: { max_bytes: 10_485_760, max_files: 5, mime_types: ['image/jpeg', 'image/png'] },
      input_modalities: ['text', 'image'],
      native_file_input: false,
      output_modalities: ['text'],
      supported_parameters: ['temperature'],
      supports_streaming: true,
      supports_structured_output: true,
      supports_tools: true,
    },
    catalog_vendor: 'openai',
    catalog_version: 'official_models_v1',
    context_tier_threshold_tokens: 272_000,
    context_window_tokens: 1_050_000,
    effective: { ...official, override_version: version, source: 'override' as const, source_url: 'https://openai.com/pricing' },
    lifecycle_status: lifecycle,
    max_output_tokens: 128_000,
    model_family: 'gpt',
    model_id: `gpt-5.4-${lifecycle}`,
    model_source_url: 'https://developers.openai.com/api/docs/models/gpt-5.4',
    official,
    pricing_profile: 'standard_global',
    pricing_source_url: 'https://developers.openai.com/api/docs/pricing',
    retrieved_at: '2026-07-27',
    review_after: '2026-08-27',
  }
}

function mountComposable() {
  let page!: ReturnType<typeof useOfficialModelPage>
  const Harness = defineComponent({
    setup() {
      page = useOfficialModelPage()
      return () => null
    },
  })
  const wrapper = mount(Harness)
  return { page, wrapper }
}

const PassThrough = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })

describe('official model administration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.can.mockReturnValue(true)
    mocks.confirm.mockResolvedValue('confirm')
    mocks.isMobile.value = false
    mocks.pageInit.mockResolvedValue({ dict: {
      vendor_options: [{ label: 'OpenAI', value: 'openai' }],
      family_options: [{ label: 'GPT', value: 'gpt' }],
      lifecycle_options: [{ label: 'Active', value: 'active' }],
      input_modality_options: [{ label: 'Image', value: 'image' }],
    } })
    mocks.list.mockResolvedValue({ list: [officialModel('active'), officialModel('deprecated'), officialModel('retired')] })
    mocks.detail.mockResolvedValue(officialModel())
    mocks.syncPrice.mockResolvedValue({ before: officialModel().official, after: officialModel().effective })
    mocks.restoreOfficialPrice.mockResolvedValue({ before: officialModel().effective, after: officialModel().official })
  })

  it('renders identity, lifecycle, capabilities, limits, prices, and source facts', async () => {
    const wrapper = mount(OfficialModelPage, {
      global: { stubs: { ElButton: PassThrough, ElTag: PassThrough, ElTooltip: PassThrough, OfficialModelDrawer: true } },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('gpt-5.4-active')
    expect(wrapper.text()).toContain('official_models_v1')
    expect(wrapper.find('[data-test="lifecycle-active"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="lifecycle-deprecated"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="lifecycle-retired"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="model-modalities"]').text()).toContain('image')
    expect(wrapper.find('[data-test="model-capabilities"]').text()).toContain('tools')
    expect(wrapper.find('[data-test="model-limits"]').text()).toContain('1050000')
    expect(wrapper.findAll('[data-test="effective-rate"]')).toHaveLength(9)
    expect(wrapper.text()).toContain('2026-07-27')
  })

  it('groups each effective rate into a left label and a right price', async () => {
    const wrapper = mount(OfficialModelPage, {
      global: { stubs: { ElButton: PassThrough, ElTag: PassThrough, ElTooltip: PassThrough, OfficialModelDrawer: true } },
    })
    await flushPromises()

    const firstRate = wrapper.get('[data-test="effective-rate"]')
    expect(firstRate.element.children).toHaveLength(2)
    expect(firstRate.get('[data-test="effective-rate-label"]').text()).toContain('aiOfficialModel.categories.input')
    expect(firstRate.get('[data-test="effective-rate-price"]').text()).toContain('¥2.5')
    expect(firstRate.get('[data-test="effective-rate-price"]').text()).toContain('aiOfficialModel.units.millionTokensShort')
  })

  it('stacks core capabilities vertically', async () => {
    const wrapper = mount(OfficialModelPage, {
      global: { stubs: { ElButton: PassThrough, ElTag: PassThrough, ElTooltip: PassThrough, OfficialModelDrawer: true } },
    })
    await flushPromises()

    const capabilities = wrapper.get('[data-test="model-capabilities"]')
    const capabilityRows = capabilities.findAll('[data-test="model-capability"]')
    expect(capabilityRows).toHaveLength(3)
    expect(capabilityRows.every(row => row.element.tagName === 'DIV')).toBe(true)
  })

  it('keeps catalog facts readonly and hides price actions without sync permission', async () => {
    mocks.can.mockReturnValue(false)
    const wrapper = mount(OfficialModelPage, {
      global: { stubs: { ElButton: PassThrough, ElTag: PassThrough, ElTooltip: PassThrough, OfficialModelDrawer: true } },
    })
    await flushPromises()

    expect(mocks.can).toHaveBeenCalledWith('ai_official_model_price_sync')
    expect(wrapper.find('[data-test="view-model"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="sync-price"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="restore-price"]').exists()).toBe(false)
    expect(wrapper.find('input[name="model_id"]').exists()).toBe(false)
  })

  it('submits the complete fixed price set and reloads detail after a version conflict', async () => {
    const state = mountComposable()
    await flushPromises()
    await state.page.openDetail(officialModel())
    await state.page.syncPrice({
      expected_version: 3,
      rates,
      source_url: 'https://openai.com/pricing',
      verified_at: '2026-07-28',
    })
    expect(mocks.syncPrice).toHaveBeenCalledWith(expect.objectContaining({ rates }))

    mocks.syncPrice.mockRejectedValueOnce(createApiError({
      kind: 'business', code: 'ai.official_model.version_conflict', messageKey: 'ai.official_model.version_conflict',
      retryable: false, status: 409,
    }))
    mocks.detail.mockResolvedValueOnce(officialModel('active', 4))
    await state.page.syncPrice({ expected_version: 3, rates, source_url: 'https://openai.com/pricing', verified_at: '2026-07-28' })

    expect(state.page.selectedModel.value?.effective.override_version).toBe(4)
    expect(state.page.drawerVisible.value).toBe(true)
    expect(mocks.warning).toHaveBeenCalled()
    state.wrapper.unmount()
  })

  it('uses a full-screen mobile drawer and exposes forms only for price evidence', () => {
    mocks.isMobile.value = true
    const DrawerStub = defineComponent({
      name: 'ElDrawer',
      props: { modelValue: Boolean, size: { type: [String, Number], default: '' } },
      setup(props, { slots }) {
        return () => props.modelValue
          ? h('section', { 'data-test': 'drawer', 'data-size': String(props.size) }, [slots.default?.(), slots.footer?.()])
          : null
      },
    })
    const wrapper = mount(OfficialModelDrawer, {
      props: { canSyncPrice: true, item: officialModel(), loading: false, modelValue: true, saving: false },
      global: { stubs: {
        ElButton: PassThrough, ElDatePicker: PassThrough, ElDrawer: DrawerStub, ElForm: PassThrough,
        ElFormItem: PassThrough, ElInput: PassThrough, ElLink: PassThrough, ElTag: PassThrough,
      } },
    })

    expect(wrapper.get('[data-test="drawer"]').attributes('data-size')).toBe('100%')
    expect(wrapper.findAll('[data-test="rate-price-input"]')).toHaveLength(3)
    expect(wrapper.find('[data-test="catalog-fact-input"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="add-rate"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="delete-rate"]').exists()).toBe(false)
  })
})
