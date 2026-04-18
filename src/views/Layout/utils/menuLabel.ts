export type MenuItemLike = { i18n_key?: string; path?: string; label?: string; name?: string }

export function resolveKeyFromPath(path?: string): string | '' {
  if (!path) return ''
  const noHash = path.split('#')[0] ?? ''
  const noQuery = noHash.split('?')[0] ?? ''
  const segs = noQuery.replace(/^\/+/, '').split('/')
  const last = segs.filter(Boolean).pop()
  return last ? `menu.${last}` : ''
}

export function resolveMenuLabel(t: (k: string) => string, item: MenuItemLike): string {
  if (item.i18n_key) {
    const v = t(item.i18n_key)
    if (v && v !== item.i18n_key) return v
  }
  const byPath = resolveKeyFromPath(item.path)
  if (byPath) {
    const v = t(byPath)
    if (v && v !== byPath) return v
  }
  if (item.name) {
    const byName = `menu.${item.name}`
    const v = t(byName)
    if (v && v !== byName) return v
  }
  return item.label || ''
}
