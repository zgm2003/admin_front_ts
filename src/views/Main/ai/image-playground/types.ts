import type {
  AiImageAssetItem,
  AiImageModeration,
  AiImageOutputFormat,
  AiImageQuality,
  AiImageSize,
} from '@/api/ai/images'

export interface ImageComposerState {
  agent_id: number | ''
  prompt: string
  size: AiImageSize | ''
  quality: AiImageQuality | ''
  output_format: AiImageOutputFormat | ''
  output_compression: number | null
  moderation: AiImageModeration | ''
  n: number
  input_assets: AiImageAssetItem[]
  mask_asset: AiImageAssetItem | null
  mask_target_asset_id: number | ''
}

export interface UploadAssetRequest {
  file: File
  source_type: 'upload' | 'mask'
  mask_target_asset_id?: number
}
