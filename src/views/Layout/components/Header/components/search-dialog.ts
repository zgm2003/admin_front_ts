export interface SearchDialogLayout {
  width: string
  bodyHeight: string
  resultHeight: string
}

export function resolveSearchDialogLayout(isMobile: boolean): SearchDialogLayout {
  if (isMobile) {
    return {
      width: '94vw',
      bodyHeight: '72vh',
      resultHeight: '48vh',
    }
  }

  return {
    width: '700px',
    bodyHeight: '620px',
    resultHeight: '400px',
  }
}
