import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router, { setupDynamicRoutes } from './router'
import { createPinia } from 'pinia'
import i18n from './i18n'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// 延迟加载 wangEditor（编辑器仅在需要时加载）
Promise.all([
  import('@wangeditor/editor').then(({ Boot }) => Boot),
  import('@wangeditor/plugin-md'),
]).then(([Boot, markdownModule]) => {
  Boot.registerModule(markdownModule.default || markdownModule)
})

// Iconify 图标不需要预加载，@iconify/vue 会自动从 CDN 获取
// 对于 Tauri 离线模式，常用图标会被缓存

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

