import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router, { setupDynamicRoutes } from './router'
import { createPinia } from 'pinia'
import i18n from './i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { Boot } from '@wangeditor/editor'
import markdownModule from '@wangeditor/plugin-md'

const app = createApp(App)
// register all ElementPlus icons globally
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component as any)
}
// register markdown plugin for wangEditor (once)
Boot.registerModule(markdownModule)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)
setupDynamicRoutes().catch(() => router.replace('/login'))

app.mount('#app')

