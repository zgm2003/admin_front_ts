import { inject, type App, type InjectionKey } from 'vue'
import type { AppKernel } from './kernel'

export const appKernelKey: InjectionKey<AppKernel> = Symbol('AdminAppKernel')

export function provideAppKernel(app: App, kernel: AppKernel) {
  app.provide(appKernelKey, kernel)
}

export function useAppKernel(): AppKernel {
  const kernel = inject(appKernelKey)
  if (!kernel) {
    throw new Error('Admin AppKernel has not been provided')
  }
  return kernel
}
