import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
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

  it('renders unlabeled code fences as plaintext without highlighter errors', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    try {
      const wrapper = mount(MarkdownRenderer, {
        props: { content: '```\nplain text\n```' },
      })
      await flushPromises()

      expect(consoleError).not.toHaveBeenCalled()
      expect(wrapper.get('.code-lang').text()).toBe('plaintext')
      expect(wrapper.get('code').classes()).toContain('language-plaintext')
    } finally {
      consoleError.mockRestore()
    }
  })
})
