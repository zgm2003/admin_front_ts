import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AppDialog from '@/components/AppDialog/src/index.vue'

const responsive = vi.hoisted(() => ({ isMobile: { value: false } }))

vi.mock('@/hooks/useResponsive', () => ({
  useIsMobile: () => responsive.isMobile,
}))

// eslint-disable-next-line vue/one-component-per-file
const ElDialogStub = defineComponent({
  name: 'ElDialog',
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    width: { type: String, default: '' },
    draggable: { type: Boolean, default: false },
    alignCenter: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  template: `
    <section
      data-testid="dialog"
      :data-width="width"
      :data-draggable="String(draggable)"
      :data-align-center="String(alignCenter)"
    >
      <slot name="header" />
      <slot />
      <footer data-testid="footer"><slot name="footer" /></footer>
      <button data-testid="close" @click="$emit('update:modelValue', false)">close</button>
    </section>
  `,
})

// eslint-disable-next-line vue/one-component-per-file
const ElScrollbarStub = defineComponent({
  name: 'ElScrollbar',
  props: { height: { type: String, default: '' } },
  template: '<div data-testid="scrollbar" :data-height="height"><slot /></div>',
})

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(AppDialog, {
    props: { modelValue: true, ...props },
    slots: {
      default: '<p data-testid="body">body</p>',
      footer: '<button data-testid="footer-action">confirm</button>',
    },
    attrs: { fullscreen: true, 'data-extra': 'kept' },
    global: { stubs: { ElDialog: ElDialogStub, ElScrollbar: ElScrollbarStub } },
  })
}

describe('AppDialog behavior', () => {
  beforeEach(() => { responsive.isMobile.value = false })

  it('binds resolved desktop size and forwards model updates without fullscreen', async () => {
    const wrapper = mountDialog({ width: 680 })
    const dialog = wrapper.get('[data-testid="dialog"]')

    expect(dialog.attributes('data-width')).toBe('680px')
    expect(dialog.attributes('data-draggable')).toBe('true')
    expect(dialog.attributes()).not.toHaveProperty('fullscreen')

    await wrapper.get('[data-testid="close"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])
  })

  it('uses mobile width and disables drag and centering on mobile', () => {
    responsive.isMobile.value = true
    const dialog = mountDialog({ alignCenter: true }).get('[data-testid="dialog"]')

    expect(dialog.attributes('data-width')).toBe('94vw')
    expect(dialog.attributes('data-draggable')).toBe('false')
    expect(dialog.attributes('data-align-center')).toBe('false')
  })

  it('scrolls only the body while keeping the footer outside the scrollbar', () => {
    const wrapper = mountDialog({ height: 420 })

    expect(wrapper.get('[data-testid="scrollbar"]').attributes('data-height')).toBe('420px')
    expect(wrapper.get('[data-testid="scrollbar"] [data-testid="body"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="footer"] [data-testid="footer-action"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="scrollbar"] [data-testid="footer-action"]').exists()).toBe(false)
  })
})
