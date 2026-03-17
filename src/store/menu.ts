import { defineStore } from 'pinia'
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
        localStorage.setItem('tabList', JSON.stringify(this.tabList))
      }
    },
    closeTag(value: Pick<MenuItem, 'index'>) {
      const index = this.tabList.findIndex((item) => item.index === value.index)
      if (index !== -1) {
        this.tabList.splice(index, 1)
        localStorage.setItem('tabList', JSON.stringify(this.tabList))
      }
    },
    clearTabList() {
      this.tabList = [HOME_MENU_ITEM]
      localStorage.setItem('tabList', JSON.stringify(this.tabList))
    },
    applyDefaultSystemColor(isDark: boolean) {
      const fallback = isDark ? DARK_SYSTEM_DEFAULT : LIGHT_SYSTEM_DEFAULT
      this.systemColor = fallback
      localStorage.setItem('systemColor', fallback)
    },
    changeSystemColor(value: string) {
      this.systemColor = value
      localStorage.setItem('systemColor', value)
    },
    changeBreadcrumb(value: boolean) {
      this.breadcrumb = value
      localStorage.setItem('breadcrumb', String(value))
    },
    changeHamburger(value: boolean) {
      this.hamburger = value
      localStorage.setItem('hamburger', String(value))
    },
    changeTabtag(value: boolean) {
      this.tabtag = value
      localStorage.setItem('tabtag', String(value))
    },
    changeUniqueOpen(value: boolean) {
      this.uniqueOpen = value
      localStorage.setItem('uniqueOpen', String(value))
    },
    changeFooter(value: boolean) {
      this.footer = value
      localStorage.setItem('footer', String(value))
    },
    changePageTransition(value: boolean) {
      this.pageTransition = value
      localStorage.setItem('pageTransition', String(value))
    },
    changeTransitionName(value: string) {
      this.transitionName = value
      localStorage.setItem('transitionName', value)
    },
    changeLayoutMode(value: 'single' | 'double') {
      this.layoutMode = value
      localStorage.setItem('layoutMode', value)
    },
    toggleContentFullscreen() {
      this.contentFullscreen = !this.contentFullscreen
    },
    reset() {
      this.selectedMenu = '0'
      this.tabList = [HOME_MENU_ITEM]
      localStorage.removeItem('selectedMenu')
      localStorage.removeItem('tabList')
    },
  },
})
