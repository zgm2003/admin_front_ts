export function isDownloadUserCancelled(error: unknown, cancelMessage: string): boolean {
  return error instanceof Error && error.message === cancelMessage
}

export function requireDownloadError(error: unknown, operation: string): Error {
  if (!(error instanceof Error)) {
    throw new Error(`${operation} failed with non-Error reason`)
  }

  if (error.message.trim().length === 0) {
    throw new Error(`${operation} error message must be non-empty`)
  }

  return error
}
