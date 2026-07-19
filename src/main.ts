import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'
import i18n, { registerLocaleRouteGuard } from './i18n'
import router from './router'
import { createCatchAllRoute } from './router/routes'
import { registerRouterGuards } from './router/guards'
import { AppKernel } from './app/kernel'
import { parseEnvironment } from './app/environment'
import { provideAppKernel } from './app/injection'
import { CookieCredentialAdapter } from './adapters/browser/cookie-credentials'
import { createBrowserRefreshCoordinator } from './adapters/web/browser-coordinator'
import { createBrowserLocalStorageAdapter } from './adapters/web/storage'
import { BrowserWebSocketTransport } from './adapters/web/websocket'
import { AuthSession } from './modules/auth/session'
import { issueRealtimeTicket } from './api/auth/browserGrant'
import { ApiClient } from './modules/http/client'
import { createAxiosTransport } from './modules/http/axios-adapter'
import { getCurrentPrincipalOperation } from './modules/http/admin-operations'
import { installApiClient } from './lib/http'
import { createDeviceIdProvider, installDeviceIdProvider } from './lib/http/device'
import { buildCommonHeaders, generateTraceId } from './lib/http/headers'
import { mapPrincipalRoutes } from './modules/routing/principal'
import { RuntimeRouteRegistry } from './modules/routing/registry'
import {
  localViewLoaders,
  type LocalViewLoader,
} from './modules/routing/generated/local-views'
import {
  backendViewKeys,
  type BackendViewKey,
} from './modules/routing/generated/views'
import { Persistence } from './modules/persistence/store'
import { MenuIdentityPersistence } from './modules/persistence/menu-state'
import { readDevicePreferences } from './modules/persistence/preferences'
import { setupMenuStorePersistence } from './store/menu'
import { useUserStore } from './store/user'
import { toggleDarkMode } from './hooks/useTheme'
import { RealtimeClient } from './modules/realtime/client'

const app = createApp(App)
const pinia = createPinia()
const persistence = new Persistence(createBrowserLocalStorageAdapter())
const deviceIdProvider = createDeviceIdProvider(persistence)
installDeviceIdProvider(deviceIdProvider)

let environmentCache: ReturnType<typeof parseEnvironment> | null = null
function environment() {
  if (!environmentCache) {
    environmentCache = parseEnvironment(import.meta.env, window.location)
  }
  return environmentCache
}

function requestHeaders() {
  const preferredLanguage = readDevicePreferences(persistence).language
  return buildCommonHeaders({
    language: preferredLanguage === 'en-US' ? 'en-US' : 'zh-CN',
    deviceId: deviceIdProvider.get(),
    traceId: generateTraceId(),
  })
}

const credentialAdapter = new CookieCredentialAdapter({
  apiOrigin: () => environment().apiOrigin,
  headers: requestHeaders,
})

const storedDevicePreferences = readDevicePreferences(persistence)
if (storedDevicePreferences.language) i18n.global.locale.value = storedDevicePreferences.language
const unregisterLocaleRouteGuard = registerLocaleRouteGuard(router)

app.use(pinia)
const stopMenuStorePersistence = setupMenuStorePersistence(pinia, persistence)
app.use(i18n)
app.use(router)
toggleDarkMode(storedDevicePreferences.theme === 'dark')

const userStore = useUserStore(pinia)
const menuPersistence = new MenuIdentityPersistence(pinia, persistence)
const views: Partial<Record<BackendViewKey, LocalViewLoader>> = {}
for (const key of backendViewKeys) {
  const loader = (localViewLoaders as Partial<Record<BackendViewKey, LocalViewLoader>>)[key]
  if (loader) views[key] = loader
}
const routeRegistry = new RuntimeRouteRegistry({
  router,
  views,
  uiState: menuPersistence,
  rootRouteName: 'HomeView',
})

let realtimeClient: RealtimeClient | null = null

const auth = new AuthSession({
  adapter: credentialAdapter,
  coordinator: createBrowserRefreshCoordinator(),
  logoutHooks: {
    async disconnectRealtime() {
      await realtimeClient?.disconnect({ purge: true })
    },
    async abortAuthenticatedRequests() {
      apiClient.abortAuthenticatedRequests()
    },
    async removeRoutes() {
      routeRegistry.clear()
    },
    async clearPrincipal() {
      userStore.clearPrincipal()
    },
    async clearIdentityPersistence() {
      menuPersistence.clearActive(true)
    },
    async navigateToLogin() {
      await router.replace('/login')
    },
  },
})

const apiClient = new ApiClient({
  transport: createAxiosTransport({
    baseURL: () => environment().apiOrigin.origin,
    withCredentials: true,
  }),
  auth,
  headers: requestHeaders,
})
const uninstallApiClient = installApiClient(apiClient)
const installedRealtimeClient = new RealtimeClient({
  endpoint: () => environment().realtimeOrigin,
  transport: new BrowserWebSocketTransport(),
  persistence,
  issueTicket: async (signal) => (await issueRealtimeTicket(signal)).ticket,
  onProtocolError(error) {
    console.error('[Realtime] Protocol error:', error)
  },
})
realtimeClient = installedRealtimeClient
let unregisterRouterGuards: (() => void) | null = null

function requestedRoute(): string | null {
  const current = router.currentRoute.value
  const redirect = current.name === 'login' ? current.query.redirect : null
  if (typeof redirect === 'string') return redirect
  return current.path === '/login' ? '/home' : current.fullPath
}

const kernel = new AppKernel({
  environment,
  auth,
  persistence,
  principal: {
    async load(signal) {
      const data = await apiClient.execute(getCurrentPrincipalOperation, undefined, { signal })
      const routes = mapPrincipalRoutes(data.router)
      const principal = {
        userId: data.user_id,
        username: data.username,
        avatar: data.avatar,
        roleName: data.role_name,
        menus: data.permissions,
        routes,
        buttonCodes: new Set(data.buttonCodes),
      }
      userStore.applyPrincipal(principal)
      menuPersistence.activate(principal.userId, routes, principal.buttonCodes)
      return principal
    },
    async clear() {
      userStore.clearPrincipal()
    },
  },
  routes: {
    async install(principal, signal) {
      if (signal.aborted) throw signal.reason
      await routeRegistry.install(principal.routes, principal.buttonCodes, {
        requestedPath: requestedRoute(),
      })
      if (!router.hasRoute('CatchAll404')) router.addRoute(createCatchAllRoute())
    },
    async clear() {
      routeRegistry.clear()
    },
  },
  realtime: installedRealtimeClient,
  adapters: [{
    async dispose() {
      unregisterRouterGuards?.()
      unregisterRouterGuards = null
      unregisterLocaleRouteGuard()
      menuPersistence.clearActive(false)
      stopMenuStorePersistence()
      uninstallApiClient()
    },
  }],
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
  if (!unregisterRouterGuards) {
    unregisterRouterGuards = registerRouterGuards(router, kernel, { pinia, menuPersistence })
  }
  if (state.kind === 'anonymous' && router.currentRoute.value.name !== 'login') {
    const path = router.currentRoute.value.fullPath
    await router.replace({ name: 'login', query: path === '/' ? {} : { redirect: path } })
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
