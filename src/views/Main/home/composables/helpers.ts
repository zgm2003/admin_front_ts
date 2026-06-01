export interface HomeNavigationAction {
  type: 'none' | 'internal' | 'external'
  value?: string
}

export function resolveHomeNavigationAction(target?: string): HomeNavigationAction {
  if (target === undefined) {
    return { type: 'none' }
  }

  const value = target.trim()
  if (value === '') {
    return { type: 'none' }
  }

  if (/^https?:\/\//i.test(value)) {
    return {
      type: 'external',
      value,
    }
  }

  return {
    type: 'internal',
    value,
  }
}
