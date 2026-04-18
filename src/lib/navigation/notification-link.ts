const LEGACY_ROUTE_MAP: Array<[legacy: string, next: string]> = [
  ['/devTools/exportTask', '/system/exportTask'],
]

export function normalizeNotificationLink(link?: string): string {
  if (!link) {
    return ''
  }

  for (const [legacyPrefix, nextPrefix] of LEGACY_ROUTE_MAP) {
    if (link === legacyPrefix || link.startsWith(`${legacyPrefix}?`)) {
      return link.replace(legacyPrefix, nextPrefix)
    }
  }

  return link
}
