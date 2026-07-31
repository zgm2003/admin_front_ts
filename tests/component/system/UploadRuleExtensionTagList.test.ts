import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ExtensionTagList from '@/views/Main/system/uploadConfig/components/UploadRule/ExtensionTagList.vue'

const ElTagStub = {
  name: 'ElTag',
  props: ['type', 'size'],
  template: '<span class="tag" :data-type="type" :data-size="size"><slot /></span>',
}

const ElPopoverStub = {
  name: 'ElPopover',
  props: ['trigger', 'persistent', 'teleported', 'enterable', 'popperStyle', 'width'],
  template: '<span class="popover"><slot name="reference" /><span class="popover-content"><slot /></span></span>',
}

const ElSpaceStub = {
  name: 'ElSpace',
  template: '<span><slot /></span>',
}

const ElScrollbarStub = {
  name: 'ElScrollbar',
  props: ['maxHeight'],
  template: '<span><slot /></span>',
}

describe('UploadRule ExtensionTagList', () => {
  it('keeps the table row compact and puts remaining extensions in a bounded teleported popover', () => {
    const wrapper = mount(ExtensionTagList, {
      props: {
        items: ['pdf', 'docx', 'txt', 'xlsx', 'csv'],
        type: 'warning',
      },
      global: {
        stubs: {
          ElTag: ElTagStub,
          ElPopover: ElPopoverStub,
          ElSpace: ElSpaceStub,
          ElScrollbar: ElScrollbarStub,
        },
      },
    })

    expect(wrapper.findAll('[data-test="visible-extension"]').map(item => item.text()))
      .toEqual(['pdf', 'docx', 'txt'])
    expect(wrapper.get('[data-test="extension-overflow"]').text()).toBe('+2')
    expect(wrapper.findAll('[data-test="overflow-extension"]').map(item => item.text()))
      .toEqual(['xlsx', 'csv'])
    expect(wrapper.findAll('[data-test="visible-extension"]').every(item => item.attributes('data-type') === 'warning')).toBe(true)

    const popover = wrapper.getComponent({ name: 'ElPopover' })
    expect(popover.props('persistent')).toBe(false)
    expect(popover.props('trigger')).toEqual(['hover', 'focus'])
    expect(popover.props('teleported')).toBe(true)
    expect(popover.props('enterable')).toBe(true)
    expect(popover.props('width')).toBe(320)
    expect(popover.props('popperStyle')).toEqual({ maxWidth: 'calc(100vw - 32px)' })
    expect(wrapper.getComponent({ name: 'ElScrollbar' }).props('maxHeight')).toBe('240px')
    expect(wrapper.get('[data-test="extension-overflow"]').attributes('tabindex')).toBe('0')
  })
})
