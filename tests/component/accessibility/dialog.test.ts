// @vitest-environment jsdom

import axe from 'axe-core'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import AppDialog from '@/components/AppDialog/src/index.vue'
import SearchDialog from '@/views/Layout/components/Header/components/SearchDialog.vue'

vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ({ value: false }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const ElDialogStub = defineComponent({
  name: 'ElDialog',
  inheritAttrs: false,
  props: {
    modelValue: Boolean,
    closeOnPressEscape: Boolean,
    title: { type: String, default: '' },
  },
  emits: ['closed'],
  template: `
    <section
      role="dialog"
      aria-modal="true"
      v-bind="$attrs"
      :aria-label="title || undefined"
      :aria-labelledby="title ? undefined : 'element-dialog-title'"
      aria-describedby="element-dialog-body"
      :data-close-on-escape="String(closeOnPressEscape)"
    >
      <header class="el-dialog__header">
        <slot name="header" title-id="element-dialog-title" title-class="el-dialog__title" />
      </header>
      <div id="element-dialog-body"><slot /></div>
      <slot name="footer" />
      <button data-testid="closed" @click="$emit('closed')">closed</button>
    </section>
  `,
})

const ElInputStub = defineComponent({
  name: 'ElInput',
  inheritAttrs: false,
  props: {
    modelValue: { type: String, default: '' },
    size: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
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

describe('accessible AppDialog', () => {
  it('provides a name, description, modal semantics, and Escape policy', async () => {
    const wrapper = mount(AppDialog, {
      attachTo: document.body,
      props: {
        modelValue: true,
        title: 'Delete item',
        description: 'This action cannot be undone.',
      },
      slots: { default: '<button>Confirm</button>' },
      global: { stubs: { ElDialog: ElDialogStub, ElScrollbar: true } },
    })

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-label')).toBe('Delete item')
    expect(dialog.attributes('aria-describedby')).toBeTruthy()
    expect(wrapper.get(`#${dialog.attributes('aria-describedby')} [id^="app-dialog-description-"]`).text())
      .toBe('This action cannot be undone.')
    expect(dialog.attributes('data-close-on-escape')).toBe('true')

    const result = await axe.run(wrapper.element, {
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(result.violations.filter((violation) => violation.impact === 'serious'
      || violation.impact === 'critical')).toEqual([])
  })

  it('labels custom and visually hidden headers through Element Plus slot ids', () => {
    const customHeader = mount(AppDialog, {
      props: { modelValue: true },
      slots: { header: 'Edit account' },
      global: { stubs: { ElDialog: ElDialogStub, ElScrollbar: true } },
    })
    const customDialog = customHeader.get('[role="dialog"]')
    const customLabelId = customDialog.attributes('aria-labelledby')
    expect(customHeader.get(`#${customLabelId}`).text()).toBe('Edit account')

    const hiddenHeader = mount(AppDialog, {
      props: { modelValue: true, ariaLabel: 'Search navigation' },
      global: { stubs: { ElDialog: ElDialogStub, ElScrollbar: true } },
    })
    const hiddenDialog = hiddenHeader.get('[role="dialog"]')
    const hiddenLabel = hiddenHeader.get(`#${hiddenDialog.attributes('aria-labelledby')}`)
    expect(hiddenLabel.text()).toBe('Search navigation')
    expect(hiddenLabel.classes()).toContain('sr-only')
  })

  it('returns focus to the trigger after the dialog closes', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open dialog'
    document.body.append(trigger)
    trigger.focus()
    const wrapper = mount(AppDialog, {
      attachTo: document.body,
      props: { modelValue: false, title: 'Settings' },
      global: { stubs: { ElDialog: ElDialogStub, ElScrollbar: true } },
    })

    await wrapper.setProps({ modelValue: true })
    await wrapper.get('[data-testid="closed"]').trigger('click')

    expect(document.activeElement).toBe(trigger)
  })

  it('keeps an accessible name when its visible header is disabled', () => {
    const wrapper = mount(AppDialog, {
      props: { modelValue: true, title: 'Search navigation', showHeader: false },
      global: { stubs: { ElDialog: ElDialogStub, ElScrollbar: true } },
    })

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.attributes('aria-label')).toBe('Search navigation')
    expect(dialog.classes()).toContain('app-dialog--header-hidden')
  })

  it('keeps header search unnamed visually, named accessibly, and clears results on reopen', async () => {
    setActivePinia(createPinia())
    const wrapper = mount(SearchDialog, {
      props: { modelValue: true },
      global: {
        stubs: {
          DIcon: true,
          ElButton: true,
          ElDialog: ElDialogStub,
          ElEmpty: true,
          ElIcon: true,
          ElInput: ElInputStub,
          ElScrollbar: { template: '<div><slot /></div>' },
        },
      },
    })

    const appDialog = wrapper.getComponent(AppDialog)
    expect(appDialog.props('showHeader')).toBe(false)
    expect(wrapper.get('[role="dialog"]').attributes('aria-label')).toBe('search.placeholder')

    const input = wrapper.get('input')
    await input.setValue('provider')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('update:modelValue')).toEqual([[false]])

    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })
    expect((input.element as HTMLInputElement).value).toBe('')

    wrapper.unmount()
  })
})
