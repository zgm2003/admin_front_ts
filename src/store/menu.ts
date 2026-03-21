import { defineStore } from 'pinia'
import type { Pinia } from 'pinia'
import type { PermissionMenuItem } from '@/types/user'

const LIGHT_SYSTEM_DEFAULT = '#409EFF'
const DARK_SYSTEM_DEFAULT = '#1890ff'

export type MenuItem = PermissionMenuItem

function loadStoredTabList(): MenuItem[] {
  const raw = localStorage.getItem('tabList')
  if (!raw) {
    return [HOME_MENU_ITEM]
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as MenuItem[]) : [HOME_MENU_ITEM]
  } catch {
    localStorage.removeItem('tabList')
    return [HOME_MENU_ITEM]
  }
}

export const HOME_MENU_ITEM: MenuItem = {
  index: '0',
  label: '首页',
  path: '/home',
  icon: 'HomeFilled',
  i18n_key: 'menu.home',
}

/** Keys that are persisted as simple strings via $subscribe */
const PERSISTED_KEYS = [
  'selectedMenu', 'systemColor', 'breadcrumb', 'hamburger',
  'tabtag', 'uniqueOpen', 'footer', 'pageTransition',
  'transitionName', 'layoutMode',
] as const

export const useMenuStore = defineStore('menu', {
  state: () => ({
    collapse: false,
    drawer: false,
    selectedMenu: localStorage.getItem('selectedMenu') || '0',
    tabList: loadStoredTabList(),
    systemColor: localStorage.getItem('systemColor') || LIGHT_SYSTEM_DEFAULT,
    breadcrumb: localStorage.getItem('breadcrumb') !== 'false',
    hamburger: localStorage.getItem('hamburger') !== 'false',
    tabtag: localStorage.getItem('tabtag') !== 'false',
    uniqueOpen: localStorage.getItem('uniqueOpen') !== 'false',
    footer: localStorage.getItem('footer') !== 'false',
    pageTransition: localStorage.getItem('pageTransition') !== 'false',
    transitionName: localStorage.getItem('transitionName') || 'fade',
    layoutMode: (localStorage.getItem('layoutMode') as 'single' | 'double') || 'single',
    contentFullscreen: false,
    refreshKey: 0,
  }),
  actions: {
    mobile() {
      this.drawer = false
      this.collapse = false
    },
    toggleCollapse(isMobile: boolean) {
      if (isMobile) this.drawer = !this.drawer
      else this.collapse = !this.collapse
    },
    closeDrawer() {
      this.drawer = false
    },
    close() {
      this.collapse = true
      this.breadcrumb = false
    },
    open() {
      this.collapse = false
      this.breadcrumb = true
    },
    selectMenu(value: MenuItem) {
      if (value.index !== '0') {
        const index = this.tabList.findIndex((item) => item.index === value.index)
        if (index === -1) {
          this.tabList.push(value)
        } else {
          this.tabList[index] = { ...this.tabList[index], ...value }
        }
      }
    },
    closeTag(value: Pick<MenuItem, 'index'>) {
      const index = this.tabList.findIndex((item) => item.index === value.index)
      if (index !== -1) {
        this.tabList.splice(index, 1)
      }
    },
    clearTabList() {
      this.tabList = [HOME_MENU_ITEM]
    },
    applyDefaultSystemColor(isDark: boolean) {
      this.systemColor = isDark ? DARK_SYSTEM_DEFAULT : LIGHT_SYSTEM_DEFAULT
    },
    changeSystemColor(value: string) {
      this.systemColor = value
    },
    changeBreadcrumb(value: boolean) {
      this.breadcrumb = value
    },
    changeHamburger(value: boolean) {
      this.hamburger = value
    },
    changeTabtag(value: boolean) {
      this.tabtag = value
    },
    changeUniqueOpen(value: boolean) {
      this.uniqueOpen = value
    },
    changeFooter(value: boolean) {
      this.footer = value
    },
    changePageTransition(value: boolean) {
      this.pageTransition = value
    },
    changeTransitionName(value: string) {
      this.transitionName = value
    },
    changeLayoutMode(value: 'single' | 'double') {
      this.layoutMode = value
    },
    toggleContentFullscreen() {
      this.contentFullscreen = !this.contentFullscreen
    },
    refreshCurrentPage() {
      this.refreshKey++
    },
    resetUiState() {
      this.selectedMenu = '0'
      this.tabList = [HOME_MENU_ITEM]
      this.collapse = false
      this.drawer = false
      this.breadcrumb = true
      this.hamburger = true
      this.uniqueOpen = true
      this.tabtag = true
      this.footer = true
      this.pageTransition = true
      this.transitionName = 'fade'
      this.systemColor = LIGHT_SYSTEM_DEFAULT
      this.layoutMode = 'single'
      this.contentFullscreen = false
    },
    reset() {
      this.selectedMenu = '0'
      this.tabList = [HOME_MENU_ITEM]
    },
  },
})

/**
 * Setup auto-persistence for menu store.
 * Call once after `app.use(pinia)`.
 */
export function setupMenuStorePersistence(pinia: Pinia) {
  const store = useMenuStore(pinia)
  store.$subscribe((_mutation, state) => {
    for (const key of PERSISTED_KEYS) {
      localStorage.setItem(key, String(state[key]))
    }
    localStorage.setItem('tabList', JSON.stringify(state.tabList))
  })
}
