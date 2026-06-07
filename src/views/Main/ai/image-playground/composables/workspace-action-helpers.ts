import type { ImageComposerFile } from '../types'

export const IMAGE_REFERENCE_LIMIT = 10

export interface NextReferenceFilesResult {
  appended: boolean
  files: ImageComposerFile[]
}

export function nextReferenceFiles(
  currentFiles: readonly ImageComposerFile[],
  createNextFile: () => ImageComposerFile,
  limit: number = IMAGE_REFERENCE_LIMIT,
): NextReferenceFilesResult {
  if (currentFiles.length >= limit) {
    return {
      appended: false,
      files: [...currentFiles],
    }
  }

  return {
    appended: true,
    files: [...currentFiles, createNextFile()],
  }
}

export function fulfilledDeletedIDs<T>(
  ids: readonly number[],
  results: readonly PromiseSettledResult<T>[],
): number[] {
  if (ids.length !== results.length) return []

  const deletedIDs: number[] = []
  for (const [index, result] of results.entries()) {
    if (result.status === 'fulfilled') {
      const id = ids[index]
      if (id === undefined) return []
      deletedIDs.push(id)
    }
  }
  return deletedIDs
}
