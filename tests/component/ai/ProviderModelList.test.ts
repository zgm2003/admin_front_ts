import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { AiProviderModelItem } from '@/api/ai/providers'
import ProviderModelList from '@/views/Main/ai/providers/components/ProviderModelList.vue'

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

const ElTextStub = {
  name: 'ElText',
  template: '<span><slot /></span>',
}

function providerModel(id: number, displayName: string, status = 1): AiProviderModelItem {
  return {
    id,
    provider_id: 9,
    model_id: `model-${id}`,
    display_name: displayName,
    status,
  }
}

describe('ProviderModelList', () => {
  it('keeps three enabled models inline and puts the rest in a bounded teleported popover', () => {
    const wrapper = mount(ProviderModelList, {
      props: {
        models: [
          providerModel(1, 'Model One'),
          providerModel(2, 'Model Two'),
          providerModel(3, ''),
          providerModel(4, 'Model Four'),
          providerModel(5, 'Model Five'),
          providerModel(6, 'Disabled', 0),
        ],
      },
      global: {
        stubs: {
          ElTag: ElTagStub,
          ElPopover: ElPopoverStub,
          ElSpace: ElSpaceStub,
          ElScrollbar: ElScrollbarStub,
          ElText: ElTextStub,
        },
      },
    })

    const visibleModels = wrapper.findAll('[data-test="visible-provider-model"]')
    expect(visibleModels).toHaveLength(3)
    expect(visibleModels[0].text()).toContain('Model One')
    expect(visibleModels[0].text()).toContain('model-1')
    expect(visibleModels[2].text()).toBe('model-3')
    expect(wrapper.get('[data-test="provider-model-overflow"]').text()).toBe('+2')
    expect(wrapper.findAll('[data-test="overflow-provider-model"]').map(item => item.text()))
      .toEqual(expect.arrayContaining([
        expect.stringContaining('Model Four'),
        expect.stringContaining('Model Five'),
      ]))

    const popover = wrapper.getComponent({ name: 'ElPopover' })
    expect(popover.props('persistent')).toBe(false)
    expect(popover.props('trigger')).toEqual(['hover', 'focus'])
    expect(popover.props('teleported')).toBe(true)
    expect(popover.props('enterable')).toBe(true)
    expect(popover.props('width')).toBe(320)
    expect(popover.props('popperStyle')).toEqual({ maxWidth: 'calc(100vw - 32px)' })
    expect(wrapper.getComponent({ name: 'ElScrollbar' }).props('maxHeight')).toBe('240px')
    expect(wrapper.get('[data-test="provider-model-overflow"]').attributes('tabindex')).toBe('0')
  })
})
