import {createI18n} from 'vue-i18n'
import Cookies from 'js-cookie'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'

const messages = { 'zh-CN': zhCN, 'en-US': enUS }

export default createI18n({
  legacy: false,
  locale: Cookies.get('lang') || 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages
})
