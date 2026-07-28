export interface SearchDialogLayout {
  bodyHeight: string
  resultHeight: string
}

export function resolveSearchDialogLayout(isMobile: boolean): SearchDialogLayout {
  if (isMobile) {
    return {
      bodyHeight: '72vh',
      resultHeight: '48vh',
    }
  }

  return {
    bodyHeight: '620px',
    resultHeight: '400px',
  }
}
