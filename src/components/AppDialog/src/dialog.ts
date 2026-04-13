export const DEFAULT_APP_DIALOG_WIDTH = '720px'
export const DEFAULT_APP_DIALOG_MOBILE_WIDTH = '94vw'
export const DEFAULT_APP_DIALOG_BODY_PADDING = '20px'

export type AppDialogSize = string | number

export function toCssLength(value?: AppDialogSize): string | undefined {
  if (typeof value === 'number') {
    return `${value}px`
  }

  if (typeof value === 'string' && value.trim()) {
    return value
  }

  return undefined
}

export function resolveAppDialogWidth(params: {
  isMobile: boolean
  width?: AppDialogSize
  mobileWidth?: AppDialogSize
}) {
  const { isMobile, width, mobileWidth } = params

  if (isMobile) {
    return toCssLength(mobileWidth) ?? DEFAULT_APP_DIALOG_MOBILE_WIDTH
  }

  return toCssLength(width) ?? DEFAULT_APP_DIALOG_WIDTH
}

export function resolveAppDialogContentHeight(height?: AppDialogSize) {
  return toCssLength(height)
}

export function resolveAppDialogBodyPadding(padding?: AppDialogSize) {
  return toCssLength(padding) ?? DEFAULT_APP_DIALOG_BODY_PADDING
}

export function resolveAppDialogAlignCenter(params: {
  isMobile: boolean
  alignCenter?: boolean
}) {
  const { isMobile, alignCenter } = params
  return isMobile ? false : Boolean(alignCenter)
}

export function resolveAppDialogDraggable(params: {
  isMobile: boolean
  draggable?: boolean
}) {
  const { isMobile, draggable } = params
  return draggable ?? !isMobile
}

export function filterAppDialogAttrs(attrs: Record<string, unknown>) {
  const { fullscreen: _fullscreen, ...rest } = attrs
  return rest
}
