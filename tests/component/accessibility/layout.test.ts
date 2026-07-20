// @vitest-environment jsdom

import axe from 'axe-core'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { nextTick, reactive, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Layout from '@/views/Layout/index.vue'
import { announceAssertive, announcePolite } from '@/shared/accessibility/announcer'

const route = reactive({ fullPath: '/home', meta: {} })
const menuStore = reactive({
  drawer: false,
  contentFullscreen: false,
  collapse: false,
  tabtag: true,
  pageTransition: false,
  transitionName: 'fade',
  refreshKey: 0,
  footer: true,
  mobile: vi.fn(),
})

vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/store/menu', () => ({ useMenuStore: () => menuStore }))
vi.mock('@/hooks/useResponsive', () => ({ useIsMobile: () => ref(false) }))
vi.mock('@/components/NotificationRuntime', () => ({ NotificationRuntime: { template: '<div />' } }))
vi.mock('@/views/Layout/components/Aside/index.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/Layout/components/Header/index.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/Layout/components/TabTag/index.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/views/Layout/components/Footer/index.vue', () => ({ default: { template: '<div />' } }))

const passthrough = (name: string, tag: string) => ({
  name,
  inheritAttrs: false,
  template: `<${tag} v-bind="$attrs"><slot /></${tag}>`,
})

const RouterViewStub = {
  template: '<slot :Component="\'section\'" />',
}

async function seriousViolations(element: Element) {
  const result = await axe.run(element, {
    rules: { 'color-contrast': { enabled: false } },
  })
  return result.violations.filter((violation) => violation.impact === 'serious'
    || violation.impact === 'critical')
}

describe('accessible application layout', () => {
  it('provides landmarks, a working skip link, and live regions', async () => {
    const wrapper = mount(Layout, {
      attachTo: document.body,
      global: {
        stubs: {
          ElContainer: passthrough('ElContainer', 'div'),
          ElAside: passthrough('ElAside', 'aside'),
          ElHeader: passthrough('ElHeader', 'header'),
          ElMain: passthrough('ElMain', 'main'),
          ElFooter: passthrough('ElFooter', 'footer'),
          ElDrawer: passthrough('ElDrawer', 'aside'),
          RouterView: RouterViewStub,
          NotificationRuntime: true,
          Aside: true,
          Header: true,
          TabTag: true,
          Footer: true,
        },
      },
    })

    const skipLink = wrapper.get('a[href="#main-content"]')
    const main = wrapper.get('main#main-content')
    expect(main.attributes('tabindex')).toBe('-1')
    const navigation = wrapper.get('nav')
    expect(navigation.attributes('aria-label')).toBeTruthy()
    expect(navigation.classes()).toContain('layout-navigation')

    const layoutSource = readFileSync(resolve(process.cwd(), 'src/views/Layout/index.vue'), 'utf8')
    expect(layoutSource).toContain(`.layout-navigation {
  height: 100%;
  min-height: 0;
}`)
    expect(wrapper.get('[aria-live="polite"]').attributes('aria-atomic')).toBe('true')
    expect(wrapper.get('[aria-live="assertive"]').attributes('aria-atomic')).toBe('true')

    announcePolite('Three results')
    announceAssertive('Request failed')
    await nextTick()
    await nextTick()
    expect(wrapper.get('[aria-live="polite"]').text()).toBe('Three results')
    expect(wrapper.get('[aria-live="assertive"]').text()).toBe('Request failed')

    await skipLink.trigger('click')
    await nextTick()
    expect(document.activeElement).toBe(main.element)

    skipLink.element.focus()
    route.fullPath = '/system/setting'
    await nextTick()
    await nextTick()
    expect(document.activeElement).toBe(main.element)
    expect(await seriousViolations(wrapper.element)).toEqual([])
  })

  it('keeps focus, reduced-motion, contrast, and forced-color rules explicit', () => {
    const stylesheet = readFileSync(resolve(process.cwd(), 'src/style.css'), 'utf8')
    expect(stylesheet).toContain(':focus-visible')
    expect(stylesheet).toContain('@media (prefers-reduced-motion: reduce)')
    expect(stylesheet).toContain('@media (prefers-contrast: more)')
    expect(stylesheet).toContain('@media (forced-colors: active)')
  })
})
