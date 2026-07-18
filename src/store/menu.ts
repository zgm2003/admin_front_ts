import { defineStore } from 'pinia'
import type { Pinia } from 'pinia'
import { deviceNamespace } from '@/modules/persistence/namespaces'
import {
  menuUiPreferencesCodec,
  type MenuUiPreferences,
} from '@/modules/persistence/preferences'
import type { Persistence } from '@/modules/persistence/store'
import type { PermissionMenuItem } from '@/types/user'

const LIGHT_SYSTEM_DEFAULT = '#409EFF'
const DARK_SYSTEM_DEFAULT = '#1890ff'

export type MenuItem = PermissionMenuItem

export const HOME_MENU_ITEM: MenuItem = {
  index: '0',
  label: '首页',
  path: '/home',
  icon: 'HomeFilled',
  i18n_key: 'menu.home',
  show_menu: 1,
  sort: 0,
  parent_id: 0,
  children: [],
}

export const useMenuStore = defineStore('menu', {
  state: () => ({
    collapse: false,
    drawer: false,
    selectedMenu: '0',
    tabList: [HOME_MENU_ITEM],
    systemColor: LIGHT_SYSTEM_DEFAULT,
    breadcrumb: true,
    hamburger: true,
    tabtag: true,
    uniqueOpen: true,
    footer: true,
    pageTransition: true,
    transitionName: 'fade',
    layoutMode: 'single' as 'single' | 'double',
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

function menuUiPreferences(state: ReturnType<typeof useMenuStore>['$state']): MenuUiPreferences {
  return {
    systemColor: state.systemColor,
    breadcrumb: state.breadcrumb,
    hamburger: state.hamburger,
    tabtag: state.tabtag,
    uniqueOpen: state.uniqueOpen,
    footer: state.footer,
    pageTransition: state.pageTransition,
    transitionName: state.transitionName,
    layoutMode: state.layoutMode,
  }
}

export function setupMenuStorePersistence(pinia: Pinia, persistence: Persistence): () => void {
  const store = useMenuStore(pinia)
  const restored = persistence.read(deviceNamespace, 'menu-ui', menuUiPreferencesCodec)
  if (restored) store.$patch(restored)
  return store.$subscribe((_mutation, state) => {
    persistence.write(
      deviceNamespace,
      'menu-ui',
      menuUiPreferencesCodec,
      menuUiPreferences(state),
    )
  }, {
    detached: true,
    flush: 'sync',
  })
}
