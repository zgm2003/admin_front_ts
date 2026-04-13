export interface AiRunsDetailDialogLayout {
  width: string
  top: string
  height: string
}

export function resolveAiRunsDetailDialogLayout(isMobile: boolean): AiRunsDetailDialogLayout {
  if (isMobile) {
    return {
      width: '94vw',
      top: '4vh',
      height: '72vh',
    }
  }

  return {
    width: '800px',
    top: '10vh',
    height: '620px',
  }
}
