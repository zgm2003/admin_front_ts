// @vitest-environment jsdom

import axe from 'axe-core'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Search from '@/components/Search/src/index.vue'
import AppTable from '@/components/Table/src/index.vue'

const mocks = vi.hoisted(() => ({
  announcePolite: vi.fn(),
  announceAssertive: vi.fn(),
}))

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ({ value: true }) }))
vi.mock('@vueuse/core', () => ({ useResizeObserver: () => undefined }))
vi.mock('@/shared/accessibility/announcer', () => ({
  announcePolite: mocks.announcePolite,
  announceAssertive: mocks.announceAssertive,
}))

const ElFormStub = {
  name: 'ElForm',
  inheritAttrs: false,
  template: '<form v-bind="$attrs"><slot /></form>',
}
const ElFormItemStub = {
  name: 'ElFormItem',
  props: { label: { type: String, default: '' }, prop: { type: String, default: '' } },
  template: '<div><label v-if="label" :for="`search-${prop}`">{{ label }}</label><slot /></div>',
}
const ElInputStub = {
  name: 'ElInput',
  inheritAttrs: false,
  template: '<input v-bind="$attrs">',
}
const ElButtonStub = {
  name: 'ElButton',
  inheritAttrs: false,
  template: '<button v-bind="$attrs"><slot /></button>',
}
const ElTableStub = {
  name: 'ElTable',
  inheritAttrs: false,
  template: '<table v-bind="$attrs"><tbody><slot /></tbody></table>',
}

describe('accessible shared table and search form', () => {
  it('keeps field labels available on mobile and names the search form', async () => {
    const wrapper = mount(Search, {
      attachTo: document.body,
      props: {
        modelValue: { keyword: '' },
        fields: [{ key: 'keyword', type: 'input', label: 'Keyword', placeholder: 'Search' }],
      },
      global: {
        stubs: {
          ElForm: ElFormStub,
          ElFormItem: ElFormItemStub,
          ElInput: ElInputStub,
          ElSelectV2: true,
          ElCascader: true,
          ElDatePicker: true,
          ElButton: ElButtonStub,
          ElIcon: true,
          RemoteSelect: true,
        },
      },
    })

    expect(wrapper.get('form').attributes('aria-label')).toBeTruthy()
    expect(wrapper.get('label').text()).toBe('Keyword')
    expect(await axe.run(wrapper.element, {
      rules: { 'color-contrast': { enabled: false } },
    }).then((result) => result.violations.filter((violation) => violation.impact === 'serious'
      || violation.impact === 'critical'))).toEqual([])
  })

  it('exposes and announces table loading and result state without replacing errors with empty state', async () => {
    const wrapper = mount(AppTable, {
      attachTo: document.body,
      props: {
        columns: [{ key: 'name', label: 'Name' }],
        data: [{ id: 1, name: 'Ada' }],
        loading: true,
        ariaLabel: 'Users',
      },
      global: {
        stubs: {
          ElTable: ElTableStub,
          ElTableColumn: true,
          ElPagination: true,
          ElSpace: { template: '<div><slot /></div>' },
          TableActions: true,
          ColumnSetting: true,
        },
        directives: { loading: () => undefined },
      },
    })

    const region = wrapper.get('[role="region"]')
    expect(region.attributes('aria-label')).toBe('Users')
    expect(region.attributes('aria-busy')).toBe('true')
    expect(wrapper.get('.table-status').text()).toBeTruthy()
    await wrapper.setProps({ loading: false })
    expect(mocks.announcePolite).toHaveBeenCalledWith('accessibility.results')

    await wrapper.setProps({
      data: [],
      resultState: 'error',
      statusMessage: 'The request failed',
    })
    expect(wrapper.get('[role="alert"]').text()).toBe('The request failed')
    expect(wrapper.get('.table-status').text()).toBe('The request failed')
    expect(mocks.announceAssertive).toHaveBeenCalledWith('The request failed')
    expect(mocks.announcePolite).not.toHaveBeenCalledWith('accessibility.noResults')
  })
})
