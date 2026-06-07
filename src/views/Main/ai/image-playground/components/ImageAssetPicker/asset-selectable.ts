import type { AiAssetItem } from '@/api/ai/assets'

export type ImageAssetBlockedReasonKey = 'aiImages.assetTypeRequired' | 'aiImages.assetUrlMissing'

export function assetBlockedReasonKey(asset: Pick<AiAssetItem, 'type' | 'url'>): ImageAssetBlockedReasonKey | null {
  if (asset.type !== 'image') return 'aiImages.assetTypeRequired'
  if (asset.url.trim() === '') return 'aiImages.assetUrlMissing'
  return null
}

export function isImageAssetSelectable(asset: Pick<AiAssetItem, 'type' | 'url'>): boolean {
  return assetBlockedReasonKey(asset) === null
}
