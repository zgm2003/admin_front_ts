/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GO_API_BASE_URL: string
  readonly VITE_WEB_SOCKET_URL: string
  readonly VITE_PLATFORM: string
  readonly VITE_ADMIN_RUNTIME_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
