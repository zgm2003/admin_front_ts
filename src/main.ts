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

// Iconify 图标不需要预加载，@iconify/vue 会自动从 CDN 获取
// 对于 Tauri 离线模式，常用图标会被缓存

// 移除原生 loading
const removeLoading = () => {
  const el = document.getElementById('app-loading')
  if (el) {
    el.classList.add('fade-out')
    // 动画结束后从 DOM 移除，避免内存占用
    setTimeout(() => {
      el.remove()
    }, 600)
  }
}

// 先挂载应用，再初始化动态路由
app.mount('#app')
setupDynamicRoutes()
  .catch(() => router.replace('/login'))
  .finally(removeLoading)

