import { defineStore } from 'pinia'

const LIGHT_SYSTEM_DEFAULT = '#409EFF'
const DARK_SYSTEM_DEFAULT = '#1890ff'

// 首页菜单配置（统一管理，避免硬编码）
export const HOME_MENU_ITEM = {
  index: '0',
  label: '首页',
  path: '/home',
  icon: 'HomeFilled',
  i18n_key: 'menu.home'
} as const

export const useMenuStore = defineStore('menu', {
  state: () => ({
    collapse: false,
    drawer: false,
    selectedMenu: localStorage.getItem('selectedMenu') || '0',
    tabList: localStorage.getItem('tabList')
      ? JSON.parse(localStorage.getItem('tabList') as string)
      : [HOME_MENU_ITEM],
    systemColor: localStorage.getItem('systemColor') || LIGHT_SYSTEM_DEFAULT,
    breadcrumb: localStorage.getItem('breadcrumb') !== 'false',
    hamburger: localStorage.getItem('hamburger') !== 'false',
    tabtag: localStorage.getItem('tabtag') !== 'false',
    uniqueOpen: localStorage.getItem('uniqueOpen') !== 'false',
    footer: localStorage.getItem('footer') !== 'false',
    pageTransition: localStorage.getItem('pageTransition') !== 'false',
    transitionName: localStorage.getItem('transitionName') || 'fade',
    layoutMode: (localStorage.getItem('layoutMode') as 'single' | 'double') || 'single',
    contentFullscreen: false, // 内容全屏模式（隐藏 Aside 和 Header）
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
    closeDrawer() { this.drawer = false },
    close() { this.collapse = true; this.breadcrumb = false },
    open() { this.collapse = false; this.breadcrumb = true },
    selectMenu(val: any) {
      if (val.index !== '0') {
        const index = this.tabList.findIndex((item: any) => item.index === val.index)
        if (index === -1) {
          this.tabList.push(val)
          localStorage.setItem('tabList', JSON.stringify(this.tabList))
        }
      }
    },
    closeTag(val: any) {
      const index = this.tabList.findIndex((item: any) => item.index === val.index)
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
      const def = isDark ? DARK_SYSTEM_DEFAULT : LIGHT_SYSTEM_DEFAULT
      this.systemColor = def
      localStorage.setItem('systemColor', def)
    },
    changeSystemColor(color: string) { this.systemColor = color; localStorage.setItem('systemColor', color) },
    changeBreadcrumb(val: boolean) { this.breadcrumb = val; localStorage.setItem('breadcrumb', String(val)) },
    changeHamburger(val: boolean) { this.hamburger = val; localStorage.setItem('hamburger', String(val)) },
    changeTabtag(val: boolean) { this.tabtag = val; localStorage.setItem('tabtag', String(val)) },
    changeUniqueOpen(val: boolean) { this.uniqueOpen = val; localStorage.setItem('uniqueOpen', String(val)) },
    changeFooter(val: boolean) { this.footer = val; localStorage.setItem('footer', String(val)) },
    changePageTransition(val: boolean) { this.pageTransition = val; localStorage.setItem('pageTransition', String(val)) },
    changeTransitionName(val: string) { this.transitionName = val; localStorage.setItem('transitionName', val) },
    changeLayoutMode(val: 'single' | 'double') { this.layoutMode = val; localStorage.setItem('layoutMode', val) },
    toggleContentFullscreen() { this.contentFullscreen = !this.contentFullscreen },
    reset() {
      this.selectedMenu = '0'
      this.tabList = [HOME_MENU_ITEM]
      localStorage.removeItem('selectedMenu')
      localStorage.removeItem('tabList')
    }
  },
})
