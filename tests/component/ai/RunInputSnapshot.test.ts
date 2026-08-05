import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RunInputSnapshot from '@/views/Main/ai/runs/components/RunList/RunInputSnapshot.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
const { inputAttachmentPreview } = vi.hoisted(() => ({ inputAttachmentPreview: vi.fn() }))
vi.mock('@/api/ai/runs', () => ({ AiRunApi: { inputAttachmentPreview } }))

const ElImageStub = defineComponent({
  name: 'ElImage',
  props: {
    src: { type: String, required: true },
    previewSrcList: { type: Array, required: true },
  },
  template: '<div class="el-image-stub" :data-src="src" />',
})

const PassthroughStub = defineComponent({
  template: '<div><slot /></div>',
})

function render(snapshot: string) {
  return mount(RunInputSnapshot, {
    props: { runId: 44, snapshot },
    global: {
      stubs: {
        ElCollapse: PassthroughStub,
        ElCollapseItem: PassthroughStub,
        ElImage: ElImageStub,
        ElSkeletonItem: PassthroughStub,
      },
    },
  })
}

describe('RunInputSnapshot', () => {
  beforeEach(() => {
    inputAttachmentPreview.mockReset()
    vi.stubGlobal('location', {
      href: 'https://www.zgm2003.cn/admin/ai/runs',
      origin: 'https://www.zgm2003.cn',
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('loads protected previews for sanitized nested image metadata', async () => {
    inputAttachmentPreview.mockImplementation(({ ordinal }: { ordinal: number }) => ordinal === 2
      ? Promise.resolve({ url: 'https://signed.example/trusted.png?q-signature=proof', expires_in: 300 })
      : Promise.reject(new Error('object version changed')))
    const snapshot = JSON.stringify({
      content: '<script>window.hacked = true</script> describe this',
      meta_json: JSON.stringify({
        attachments: [
          {
            type: 'file',
            mime_type: 'application/pdf',
            name: 'context.pdf',
            size: 2048,
          },
          {
            type: 'image',
            mime_type: 'image/png',
            name: 'trusted.png',
            size: 1536,
          },
          {
            type: 'image',
            mime_type: 'image/png',
            name: 'blocked.png',
            size: 0,
          },
        ],
        runtime_params: { temperature: 0.6, max_tokens: 2048 },
      }),
    })

    const wrapper = render(snapshot)
    await flushPromises()

    expect(wrapper.get('[data-testid="run-input-content"]').text())
      .toBe('<script>window.hacked = true</script> describe this')
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.findAllComponents(ElImageStub)).toHaveLength(1)
    expect(wrapper.getComponent(ElImageStub).props()).toMatchObject({
      src: 'https://signed.example/trusted.png?q-signature=proof',
      previewSrcList: ['https://signed.example/trusted.png?q-signature=proof'],
    })
    expect(inputAttachmentPreview).toHaveBeenNthCalledWith(1, { id: 44, ordinal: 2 }, expect.any(Object))
    expect(inputAttachmentPreview).toHaveBeenNthCalledWith(2, { id: 44, ordinal: 3 }, expect.any(Object))
    expect(wrapper.text()).toContain('trusted.png')
    expect(wrapper.text()).toContain('blocked.png')
    expect(wrapper.text()).toContain('image/png')
    expect(wrapper.text()).toContain('1.50 KB')
    expect(wrapper.text()).toContain('aiRuns.detail.previewUnavailable')
    expect(wrapper.text()).toContain('temperature')
    expect(wrapper.text()).toContain('0.6')
    expect(wrapper.text()).toContain('max_tokens')
    expect(wrapper.text()).toContain('2048')
  })

  it('renders malformed and hostile raw input as escaped text', () => {
    const hostile = '{bad <img src=x onerror="window.hacked=true">'
    const wrapper = render(hostile)

    expect(wrapper.get('[data-testid="run-input-raw"]').text()).toBe(hostile)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[onerror]').exists()).toBe(false)
    expect(wrapper.findComponent(ElImageStub).exists()).toBe(false)
    expect(inputAttachmentPreview).not.toHaveBeenCalled()
  })
})
