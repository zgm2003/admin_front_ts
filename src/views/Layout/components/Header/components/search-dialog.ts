export interface SearchDialogLayout {
  width: string
  top: string
  bodyHeight: string
  resultHeight: string
}

export function resolveSearchDialogLayout(isMobile: boolean): SearchDialogLayout {
  if (isMobile) {
    return {
      width: '94vw',
      top: '4vh',
      bodyHeight: '72vh',
      resultHeight: '48vh',
    }
  }

  return {
    width: '700px',
    top: '10vh',
    bodyHeight: '620px',
    resultHeight: '400px',
  }
}
