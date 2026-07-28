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
    title: { type: String, default: '' },
    width: { type: String, default: '' },
    draggable: { type: Boolean, default: false },
    alignCenter: { type: Boolean, default: false },
  },
  emits: ['update:modelValue', 'closed'],
  template: `
    <section
      data-testid="dialog"
      v-bind="$attrs"
      :data-width="width"
      :data-draggable="String(draggable)"
      :data-align-center="String(alignCenter)"
      :aria-label="title || undefined"
    >
      <header data-testid="header" class="el-dialog__header"><slot name="header" /></header>
      <slot />
      <footer data-testid="footer"><slot name="footer" /></footer>
      <button data-testid="close" @click="$emit('update:modelValue', false)">close</button>
      <button data-testid="closed" @click="$emit('closed')">closed</button>
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

  it('can hide the visible header while retaining an accessible dialog name', () => {
    const wrapper = mountDialog({ showHeader: false, title: 'Edit profile' })
    const ariaLabelWrapper = mountDialog({
      showHeader: false,
      title: 'Ignored title',
      ariaLabel: 'Edit account settings',
    })
    const dialog = wrapper.get('[data-testid="dialog"]')

    expect(dialog.classes()).toContain('app-dialog--header-hidden')
    expect(wrapper.find('[data-testid="header"]').exists()).toBe(true)
    expect(dialog.attributes('aria-label')).toBe('Edit profile')
    expect(ariaLabelWrapper.get('[data-testid="dialog"]').attributes('aria-label'))
      .toBe('Edit account settings')
  })

  it('applies explicit header and footer padding without changing the default Element Plus spacing', () => {
    const defaults = mountDialog()
    const customized = mountDialog({ headerPadding: 12, footerPadding: '8px 16px' })

    const defaultDialog = defaults.get('[data-testid="dialog"]')
    const customizedDialog = customized.get('[data-testid="dialog"]')

    expect(defaultDialog.classes()).not.toContain('app-dialog--custom-header-padding')
    expect(defaultDialog.classes()).not.toContain('app-dialog--custom-footer-padding')
    expect(defaultDialog.attributes('style')).toBeUndefined()
    expect(customizedDialog.classes()).toContain('app-dialog--custom-header-padding')
    expect(customizedDialog.classes()).toContain('app-dialog--custom-footer-padding')
    expect(customizedDialog.attributes('style'))
      .toContain('--app-dialog-header-padding: 12px')
    expect(customizedDialog.attributes('style'))
      .toContain('--app-dialog-footer-padding: 8px 16px')
  })

  it('preserves consumer class, style, data attributes, and closed listeners', async () => {
    const onClosed = vi.fn()
    const wrapper = mount(AppDialog, {
      props: { modelValue: true },
      attrs: {
        class: 'consumer-dialog',
        style: { color: 'rgb(1, 2, 3)' },
        'data-extra': 'kept',
        onClosed,
      },
      global: { stubs: { ElDialog: ElDialogStub, ElScrollbar: ElScrollbarStub } },
    })
    const dialog = wrapper.get('[data-testid="dialog"]')

    expect(dialog.classes()).toContain('consumer-dialog')
    expect(dialog.attributes('style')).toContain('color: rgb(1, 2, 3)')
    expect(dialog.attributes('data-extra')).toBe('kept')

    await wrapper.get('[data-testid="closed"]').trigger('click')
    expect(onClosed).toHaveBeenCalledOnce()
  })
})
