import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router, { setupDynamicRoutes } from './router'
import { createPinia } from 'pinia'
import i18n from './i18n'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

const app = createApp(App)

// ⚠️ 移除全量图标注册，改用 DynamicIcon 按需加载
// 这样可以减少 2.96 MB 的打包体积

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)

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

// 先初始化动态路由，再挂载应用
setupDynamicRoutes()
  .catch(() => router.replace('/login'))
  .finally(() => app.mount('#app'))

