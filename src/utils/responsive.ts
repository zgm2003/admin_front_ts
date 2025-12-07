import { useMediaQuery } from '@vueuse/core'

export const BREAKPOINTS = {
  sm: '(max-width: 768px)',
  md: '(max-width: 1024px)',
  lg: '(max-width: 1280px)'
}

export function useIsMobile() {
  return useMediaQuery(BREAKPOINTS.sm)
}

export function useBreakpoint(query: string) {
  return useMediaQuery(query)
}
