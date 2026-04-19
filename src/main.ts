import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router, { setupDynamicRoutes } from './router'
import { createPinia } from 'pinia'
import { setupMenuStorePersistence } from './store/menu'
import i18n from './i18n'
// Element Plus 全量样式 + 暗色模式
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
setupMenuStorePersistence(pinia)
app.use(router)
app.use(i18n)

// 移除原生 loading
const removeLoading = () => {
  const el = document.getElementById('app-loading')
  if (el) {
    el.classList.add('fade-out')
    setTimeout(() => el.remove(), 600)
  }
}

// 先挂载应用，再初始化动态路由
app.mount('#app')
router.isReady()
  .then(() => setupDynamicRoutes())
  .catch(() => router.replace('/login'))
  .finally(removeLoading)

