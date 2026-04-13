export interface GoodsDialogLayout {
  width: string
  top: string
  height: string
}

export function resolveGoodsWorkbenchDialogLayout(isMobile: boolean): GoodsDialogLayout {
  if (isMobile) {
    return {
      width: '94vw',
      top: '4vh',
      height: '82vh',
    }
  }

  return {
    width: '1280px',
    top: '5vh',
    height: '78vh',
  }
}

export function resolveGoodsDetailDialogLayout(isMobile: boolean): GoodsDialogLayout {
  if (isMobile) {
    return {
      width: '94vw',
      top: '4vh',
      height: '72vh',
    }
  }

  return {
    width: '750px',
    top: '8vh',
    height: '70vh',
  }
}
