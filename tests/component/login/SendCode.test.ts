import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SendCode from '@/components/SendCode/src/index.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, values?: Record<string, unknown>) => values
      ? `${key}:${String(values.timer)}`
      : key,
  }),
}))

vi.mock('@/hooks/useResponsive', () => ({
  useIsMobile: () => ref(false),
}))

vi.mock('element-plus', () => ({
  ElNotification: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// eslint-disable-next-line vue/one-component-per-file
const ElInputStub = defineComponent({
  name: 'ElInput',
  inheritAttrs: false,
  props: {
    modelValue: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  template: '<input v-bind="$attrs" :value="modelValue">',
})

// eslint-disable-next-line vue/one-component-per-file
const ElButtonStub = defineComponent({
  name: 'ElButton',
  inheritAttrs: false,
  props: {
    disabled: { type: Boolean, default: false },
  },
  template: '<button v-bind="$attrs" :disabled="disabled"><slot /></button>',
})

// eslint-disable-next-line vue/one-component-per-file
const AppCaptchaOverlayStub = defineComponent({
  name: 'AppCaptchaOverlay',
  template: '<div data-testid="captcha-overlay" />',
})

function mountSendCode(scene: 'login' | 'forget' | 'bind_email') {
  return mount(SendCode, {
    attrs: {
      class: 'external-send-code',
      'data-testid': 'send-code',
    },
    props: {
      account: 'person@example.com',
      scene,
    },
    global: {
      stubs: {
        ElInput: ElInputStub,
        ElButton: ElButtonStub,
        AppCaptchaOverlay: AppCaptchaOverlayStub,
      },
    },
  })
}

describe('SendCode', () => {
  it.each([
    ['login', 'auth.register.sendCode'],
    ['forget', 'auth.register.sendCode'],
    ['bind_email', 'personal.security.getCode'],
  ] as const)('uses the locale domain available to the %s scene', (scene, expectedKey) => {
    const wrapper = mountSendCode(scene)

    expect(wrapper.get('button').text()).toBe(expectedKey)
  })

  it('forwards external attributes to the visible wrapper', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const wrapper = mountSendCode('login')

    expect(wrapper.get('.send-code-wrapper').classes()).toContain('external-send-code')
    expect(wrapper.get('.send-code-wrapper').attributes('data-testid')).toBe('send-code')
    expect(warning.mock.calls.flat().join(' ')).not.toContain('Extraneous non-props attributes')

    warning.mockRestore()
  })
})
