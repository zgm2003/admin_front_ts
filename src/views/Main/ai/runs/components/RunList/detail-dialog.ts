export interface AiRunsDetailDialogLayout {
  width: string
  height: string
}

export function resolveAiRunsDetailDialogLayout(isMobile: boolean): AiRunsDetailDialogLayout {
  if (isMobile) {
    return {
      width: '94vw',
      height: '72vh',
    }
  }

  return {
    width: '800px',
    height: '620px',
  }
}
