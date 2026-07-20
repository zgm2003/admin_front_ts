import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MarkdownRenderer from '@/components/MarkdownRenderer/src/index.vue'

describe('MarkdownRenderer', () => {
  it('keeps automatic links working with the audited LinkifyIt runtime', async () => {
    const wrapper = mount(MarkdownRenderer, {
      props: { content: 'Visit https://example.com/docs' },
    })
    await flushPromises()

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('https://example.com/docs')
    expect(link.text()).toBe('https://example.com/docs')
  })
})
