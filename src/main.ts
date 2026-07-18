import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Cookies from 'js-cookie'
import './style.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import i18n from './i18n'
import router, { setupDynamicRoutes } from './router'
import { AppKernel } from './app/kernel'
import { createBrowserLocalStorageAdapter } from './adapters/web/storage'
import { parseEnvironment } from './app/environment'
import { provideAppKernel } from './app/injection'
import { createDeviceIdProvider, installDeviceIdProvider } from './lib/http/device'
import { permissionCodeSet, type PermissionCode } from './modules/routing/generated/permissions'
import { Persistence } from './modules/persistence/store'
import { setupMenuStorePersistence } from './store/menu'
import { useUserStore } from './store/user'

const app = createApp(App)
const pinia = createPinia()
const persistence = new Persistence(createBrowserLocalStorageAdapter())
installDeviceIdProvider(createDeviceIdProvider(persistence))
app.use(pinia)
setupMenuStorePersistence(pinia, persistence)
app.use(router)
app.use(i18n)

const userStore = useUserStore(pinia)
const kernel = new AppKernel({
  environment: () => parseEnvironment(import.meta.env, window.location),
  auth: {
    async restore() {
      return Cookies.get('access_token') || Cookies.get('refresh_token')
        ? { kind: 'authenticated' }
        : { kind: 'anonymous' }
    },
    async dispose() {},
  },
  principal: {
    async load(signal) {
      if (signal.aborted) throw signal.reason
      await userStore.fetchUserInfo()
      if (signal.aborted) throw signal.reason
      const buttonCodes = new Set<PermissionCode>()
      for (const code of userStore.buttonCodes) {
        if (!permissionCodeSet.has(code as PermissionCode)) {
          throw new Error(`users/me returned unknown permission code: ${code}`)
        }
        buttonCodes.add(code as PermissionCode)
      }
      return {
        userId: Number(userStore.user_id),
        username: userStore.username,
        avatar: userStore.avatar,
        roleName: userStore.role_name,
        buttonCodes,
      }
    },
    async clear() {
      userStore.$reset()
    },
  },
  routes: {
    async install(_principal, signal) {
      if (signal.aborted) throw signal.reason
      await setupDynamicRoutes()
    },
    async clear() {},
  },
  realtime: {
    async disconnect() {},
  },
  adapters: [],
})
provideAppKernel(app, kernel)

function removeLoading() {
  const element = document.getElementById('app-loading')
  if (!element) return
  element.classList.add('fade-out')
  setTimeout(() => element.remove(), 600)
}

app.mount('#app')

async function bootstrap() {
  await router.isReady()
  const state = await kernel.bootstrap()
  if (state.kind === 'anonymous' && router.currentRoute.value.name !== 'login') {
    await router.replace('/login')
  }
}

bootstrap()
  .catch(() => undefined)
  .finally(removeLoading)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    void kernel.dispose()
  })
}
