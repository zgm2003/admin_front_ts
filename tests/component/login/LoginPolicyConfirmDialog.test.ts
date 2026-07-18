import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import LoginPolicyConfirmDialog from '@/views/Login/components/LoginPolicyConfirmDialog.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

// Test-only render doubles keep the assertions independent of Element Plus teleport behavior.
// eslint-disable-next-line vue/one-component-per-file
const AppDialogStub = defineComponent({
  name: 'AppDialog',
  props: {
    modelValue: { type: Boolean, required: true },
  },
  emits: ['update:modelValue'],
  template: `
    <section>
      <slot />
      <slot name="footer" />
      <button data-testid="dialog-close" @click="$emit('update:modelValue', false)">close</button>
    </section>
  `,
})

// eslint-disable-next-line vue/one-component-per-file
const ElButtonStub = defineComponent({
  name: 'ElButton',
  inheritAttrs: false,
  template: '<button v-bind="$attrs"><slot /></button>',
})

function mountDialog() {
  return mount(LoginPolicyConfirmDialog, {
    props: { visible: true },
    global: {
      stubs: {
        AppDialog: AppDialogStub,
        ElButton: ElButtonStub,
      },
    },
  })
}

describe('LoginPolicyConfirmDialog', () => {
  it('emits explicit confirm and cancel actions separately', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="policy-confirm"]').trigger('click')
    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toBeUndefined()

    await wrapper.get('[data-testid="policy-cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('treats closing the shared dialog as cancellation', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="dialog-close"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('opens policy information without granting consent', async () => {
    const wrapper = mountDialog()

    await wrapper.get('[data-testid="policy-service"]').trigger('click')
    await wrapper.get('[data-testid="policy-privacy"]').trigger('click')

    expect(wrapper.emitted('openService')).toHaveLength(1)
    expect(wrapper.emitted('openPolicy')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })
})
