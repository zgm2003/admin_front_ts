import { defineStore } from 'pinia'
import Cookies from 'js-cookie'

const LIGHT_SYSTEM_DEFAULT = '#409EFF'
const DARK_SYSTEM_DEFAULT = '#1890ff'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    collapse: false,
    drawer: false,
    selectedMenu: Cookies.get('selectedMenu') || '0',
    tabList: Cookies.get('tabList')
      ? JSON.parse(Cookies.get('tabList') as string)
      : [
          { index: '0', label: '首页', path: '/home', icon: 'HomeFilled' },
        ],
    systemColor: localStorage.getItem('systemColor') || LIGHT_SYSTEM_DEFAULT,
    breadcrumb: localStorage.getItem('breadcrumb') !== 'false',
    hamburger: localStorage.getItem('hamburger') !== 'false',
    screenfull: localStorage.getItem('screenfull') !== 'false',
    tabtag: localStorage.getItem('tabtag') !== 'false',
    uniqueOpen: localStorage.getItem('uniqueOpen') !== 'false',
    footer: localStorage.getItem('footer') !== 'false',
    pageTransition: localStorage.getItem('pageTransition') !== 'false',
    transitionName: localStorage.getItem('transitionName') || 'el-fade-in',
  }),
  actions: {
    mobile() {
      this.breadcrumb = false
      this.screenfull = false
      this.drawer = false
    },
    toggleCollapse(isMobile: boolean) {
      if (isMobile) this.drawer = !this.drawer
      else this.collapse = !this.collapse
    },
    closeDrawer() { this.drawer = false },
    close() { this.collapse = true; this.breadcrumb = false; this.screenfull = false },
    open() { this.collapse = false; this.breadcrumb = true; this.screenfull = true },
    selectMenu(val: any) {
      if (val.index !== '0') {
        const index = this.tabList.findIndex((item: any) => item.index === val.index)
        if (index === -1) {
          this.tabList.push(val)
          Cookies.set('tabList', JSON.stringify(this.tabList))
        }
      }
    },
    closeTag(val: any) {
      const index = this.tabList.findIndex((item: any) => item.index === val.index)
      if (index !== -1) {
        this.tabList.splice(index, 1)
        Cookies.set('tabList', JSON.stringify(this.tabList))
      }
    },
    clearTabList() {
      this.tabList = [{ index: '0', label: '首页', path: '/home', icon: 'HomeFilled' }]
      Cookies.set('tabList', JSON.stringify(this.tabList))
    },
    applyDefaultSystemColor(isDark: boolean) {
      const def = isDark ? DARK_SYSTEM_DEFAULT : LIGHT_SYSTEM_DEFAULT
      this.systemColor = def
      localStorage.setItem('systemColor', def)
    },
    changeSystemColor(color: string) { this.systemColor = color; localStorage.setItem('systemColor', color) },
    changeBreadcrumb(val: boolean) { this.breadcrumb = val; localStorage.setItem('breadcrumb', String(val)) },
    changeHamburger(val: boolean) { this.hamburger = val; localStorage.setItem('hamburger', String(val)) },
    changeScreenfull(val: boolean) { this.screenfull = val; localStorage.setItem('screenfull', String(val)) },
    changeTabtag(val: boolean) { this.tabtag = val; localStorage.setItem('tabtag', String(val)) },
    changeUniqueOpen(val: boolean) { this.uniqueOpen = val; localStorage.setItem('uniqueOpen', String(val)) },
    changeFooter(val: boolean) { this.footer = val; localStorage.setItem('footer', String(val)) },
    changePageTransition(val: boolean) { this.pageTransition = val; localStorage.setItem('pageTransition', String(val)) },
    changeTransitionName(val: string) { this.transitionName = val; localStorage.setItem('transitionName', val) },
    reset() {
      this.selectedMenu = '0'
      this.tabList = [{ index: '0', label: '首页', path: '/home', icon: 'HomeFilled' }]
      Cookies.remove('selectedMenu')
      Cookies.remove('tabList')
    }
  },
})
