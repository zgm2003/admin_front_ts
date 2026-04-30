export interface GoodsDialogLayout {
  width: string
  height: string
}

export function resolveGoodsWorkbenchDialogLayout(isMobile: boolean): GoodsDialogLayout {
  if (isMobile) {
    return {
      width: '94vw',
      height: '82vh',
    }
  }

  return {
    width: '1280px',
    height: '78vh',
  }
}

export function resolveGoodsDetailDialogLayout(isMobile: boolean): GoodsDialogLayout {
  if (isMobile) {
    return {
      width: '94vw',
      height: '72vh',
    }
  }

  return {
    width: '750px',
    height: '70vh',
  }
}
