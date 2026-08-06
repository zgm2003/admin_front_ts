import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import type { AiProviderModelItem } from '@/api/ai/providers'
import ProviderModelList from '@/views/Main/ai/providers/components/ProviderModelList.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => ({
      'aiProviders.modelKinds.chat': 'Chat',
      'aiProviders.modelKinds.embedding': 'Embedding',
      'aiProviders.modelKinds.rerank': 'Rerank',
    })[key] ?? key,
  }),
}))

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

function providerModel(
  id: number,
  displayName: string,
  modelKind: AiProviderModelItem['model_kind'] = 'chat',
  status: AiProviderModelItem['status'] = 1,
): AiProviderModelItem {
  return {
    id,
    provider_id: 9,
    model_id: `model-${id}`,
    model_kind: modelKind,
    display_name: displayName,
    status,
  }
}

describe('ProviderModelList', () => {
  it('keeps one enabled model summary inline and puts every remaining model in a bounded popover', () => {
    const wrapper = mount(ProviderModelList, {
      props: {
        models: [
          providerModel(1, 'Model One'),
          providerModel(2, 'Model Two', 'embedding'),
          providerModel(3, '', 'rerank'),
          providerModel(4, 'Model Four', 'chat'),
          providerModel(5, 'Model Five', 'embedding'),
          providerModel(6, 'Disabled', 'chat', 2),
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
    expect(visibleModels).toHaveLength(1)
    expect(visibleModels[0].text()).toContain('Model One')
    expect(visibleModels[0].text()).toContain('model-1')
    expect(visibleModels[0].text()).toContain('Chat')
    expect(wrapper.get('[data-test="provider-model-overflow"]').text()).toBe('+4')
    expect(wrapper.findAll('[data-test="overflow-provider-model"]').map(item => item.text()))
      .toEqual(expect.arrayContaining([
        expect.stringContaining('Model Two'),
        expect.stringContaining('model-3'),
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

  it('uses a plain bounded flex layout without styling Element Plus internals', () => {
    const source = readFileSync('src/views/Main/ai/providers/components/ProviderModelList.vue', 'utf8')
    expect(source).not.toContain(':deep')
    expect(source).toContain('white-space: nowrap')
    expect(source).toMatch(/\.provider-model-list__summary\s*\{[\s\S]*?flex:\s*1 1 0;[\s\S]*?overflow:\s*hidden;/)
  })

  it('disables the AppTable overflow tooltip for the model column', () => {
    const source = readFileSync('src/views/Main/ai/providers/index.vue', 'utf8')
    expect(source).toMatch(/\{\s*key:\s*'models',[^\r\n]*overflowTooltip:\s*false[^\r\n]*\}/)
  })
})
