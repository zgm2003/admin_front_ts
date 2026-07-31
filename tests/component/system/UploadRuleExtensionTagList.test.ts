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
  props: ['visible', 'persistent', 'width'],
  template: '<span class="popover"><slot name="reference" /><span class="popover-content"><slot /></span></span>',
}

const ElSpaceStub = {
  name: 'ElSpace',
  template: '<span><slot /></span>',
}

const ElScrollbarStub = {
  name: 'ElScrollbar',
  template: '<span><slot /></span>',
}

describe('UploadRule ExtensionTagList', () => {
  it('keeps the table row compact and exposes remaining extensions on hover or focus', async () => {
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
    expect(popover.props('visible')).toBe(false)

    await wrapper.get('[data-test="extension-tag-list"]').trigger('mouseenter')
    expect(popover.props('visible')).toBe(true)
    await wrapper.get('[data-test="extension-tag-list"]').trigger('mouseleave')
    expect(popover.props('visible')).toBe(false)
    await wrapper.get('[data-test="extension-overflow"]').trigger('focus')
    expect(popover.props('visible')).toBe(true)
    await wrapper.get('[data-test="extension-overflow"]').trigger('blur')
    expect(popover.props('visible')).toBe(false)
  })
})
