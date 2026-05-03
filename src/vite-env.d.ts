/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOME_KEY: string
  readonly VITE_GO_API_BASE_URL: string
  readonly VITE_SSE_URL: string
  readonly VITE_WEB_SOCKET_URL: string
  readonly VITE_PLATFORM: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
