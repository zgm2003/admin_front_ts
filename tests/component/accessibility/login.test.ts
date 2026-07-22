// @vitest-environment jsdom

import axe from 'axe-core'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import LoginFormCard from '@/views/Login/components/LoginFormCard.vue'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ({ value: false }) }))

const ElFormStub = {
  name: 'ElForm',
  inheritAttrs: false,
  template: '<form v-bind="$attrs"><slot /></form>',
}
const ElFormItemStub = {
  name: 'ElFormItem',
  template: '<div><slot /></div>',
}
const ElInputStub = {
  name: 'ElInput',
  inheritAttrs: false,
  props: { modelValue: { type: String, default: '' }, type: { type: String, default: 'text' } },
  template: `
    <div>
      <slot name="prefix" />
      <input v-bind="$attrs" :value="modelValue" :type="type">
      <slot name="suffix" />
    </div>
  `,
}
const ElButtonStub = {
  name: 'ElButton',
  inheritAttrs: false,
  template: '<button v-bind="$attrs"><slot /></button>',
}
const ElCheckboxStub = {
  name: 'ElCheckbox',
  inheritAttrs: false,
  props: { label: { type: String, default: '' } },
  template: '<label><input type="checkbox" v-bind="$attrs" :aria-label="label || undefined"><span>{{ label }}</span><slot /></label>',
}

function mountLogin() {
  return mount(LoginFormCard, {
    attachTo: document.body,
    props: {
      loginTypes: [
        { label: 'Password', value: 'password' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
      ],
      activeType: 'password',
      loginForm: { login_account: '', password: '', code: '' },
      rules: {},
      showPassword: false,
      isPasswordLogin: true,
      isSubmitting: false,
      isSendingCode: false,
      isShaking: false,
      agreePolicy: false,
    },
    global: {
      stubs: {
        ElForm: ElFormStub,
        ElFormItem: ElFormItemStub,
        ElInput: ElInputStub,
        ElButton: ElButtonStub,
        ElCheckbox: ElCheckboxStub,
        ElIcon: true,
        SendCode: true,
      },
    },
  })
}

describe('accessible login form', () => {
  it('associates labels, uses native controls, and supports tab keyboard navigation', async () => {
    const wrapper = mountLogin()
    const tabs = wrapper.findAll('[role="tab"]')

    expect(wrapper.get('[role="tablist"]')).toBeTruthy()
    expect(tabs).toHaveLength(3)
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(wrapper.get('label[for="login-account"]').exists()).toBe(true)
    expect(wrapper.get('#login-account').attributes('autocomplete')).toBe('username')
    expect(wrapper.get('label[for="login-password"]').exists()).toBe(true)
    expect(wrapper.get('#login-password').attributes('autocomplete')).toBe('current-password')
    expect(wrapper.get('button.password-toggle').attributes('aria-label')).toBeTruthy()
    expect(wrapper.get('button.forget-pwd').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('auth.login.remember')

    await tabs[0].trigger('keydown', { key: 'ArrowRight' })
    expect(wrapper.emitted('tabChange')).toContainEqual(['email'])
    expect(document.activeElement).toBe(tabs[1].element)

    const result = await axe.run(wrapper.element, {
      rules: { 'color-contrast': { enabled: false } },
    })
    expect(result.violations.filter((violation) => violation.impact === 'serious'
      || violation.impact === 'critical')).toEqual([])
  })
})
