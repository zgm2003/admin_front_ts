import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import RunInputSnapshot from '@/views/Main/ai/runs/components/RunList/RunInputSnapshot.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

const ElImageStub = defineComponent({
  name: 'ElImage',
  props: {
    src: { type: String, required: true },
    previewSrcList: { type: Array, required: true },
  },
  template: '<div class="el-image-stub" :data-src="src" />',
})

function render(snapshot: string) {
  return mount(RunInputSnapshot, {
    props: { snapshot },
    global: { stubs: { ElImage: ElImageStub } },
  })
}

describe('RunInputSnapshot', () => {
  beforeEach(() => {
    vi.stubGlobal('location', {
      href: 'https://www.zgm2003.cn/admin/ai/runs',
      origin: 'https://www.zgm2003.cn',
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('renders nested metadata, trusted image preview and every attachment fact', () => {
    const snapshot = JSON.stringify({
      content: '<script>window.hacked = true</script> describe this',
      meta_json: JSON.stringify({
        attachments: [
          {
            type: 'image',
            url: '/uploads/trusted.png',
            name: 'trusted.png',
            size: 1536,
          },
          {
            type: 'image',
            url: 'javascript:alert(1)',
            name: 'blocked.png',
            size: 0,
          },
        ],
        runtime_params: { temperature: 0.6, max_tokens: 2048 },
      }),
    })

    const wrapper = render(snapshot)

    expect(wrapper.get('[data-testid="run-input-content"]').text())
      .toBe('<script>window.hacked = true</script> describe this')
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.findAllComponents(ElImageStub)).toHaveLength(1)
    expect(wrapper.getComponent(ElImageStub).props()).toMatchObject({
      src: 'https://www.zgm2003.cn/uploads/trusted.png',
      previewSrcList: ['https://www.zgm2003.cn/uploads/trusted.png'],
    })
    expect(wrapper.text()).toContain('trusted.png')
    expect(wrapper.text()).toContain('blocked.png')
    expect(wrapper.text()).toContain('image')
    expect(wrapper.text()).toContain('1.50 KB')
    expect(wrapper.text()).toContain('javascript:alert(1)')
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
  })
})
