import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router, { setupDynamicRoutes } from './router'
import { createPinia } from 'pinia'
import i18n from './i18n'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 全局注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(i18n)

// 延迟加载非关键模块（wangEditor、Iconify）
Promise.all([
  import('@wangeditor/editor').then(({ Boot }) => Boot),
  import('@wangeditor/plugin-md'),
  import('@iconify/vue').then(({ addCollection }) => addCollection),
  import('@iconify-json/mdi/icons.json')
]).then(([Boot, markdownModule, addCollection, mdiIcons]) => {
  Boot.registerModule(markdownModule.default || markdownModule)
  addCollection(mdiIcons.default || mdiIcons)
})

// 移除原生 loading
const removeLoading = () => {
  const el = document.getElementById('app-loading')
  if (el) el.remove()
}

// 先挂载应用，再初始化动态路由
app.mount('#app')
setupDynamicRoutes()
  .catch(() => router.replace('/login'))
  .finally(removeLoading)

