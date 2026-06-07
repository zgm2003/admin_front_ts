import type {
  AiImageFileInput,
  AiImageFileItem,
  AiImageModeration,
  AiImageOutputFormat,
  AiImageQuality,
  AiImageSize,
} from '@/api/ai/images'

export interface ImageComposerFile extends AiImageFileInput {
  client_id: string
  sort_order: number
  stored_file_id: number | null
}

export interface ImageComposerMaskFile extends ImageComposerFile {
  related_sort_order: number
}

export type ImageDisplayFile = AiImageFileItem | ImageComposerFile
export type ImageDisplayMaskFile = AiImageFileItem | ImageComposerMaskFile

export interface ImageComposerState {
  agent_id: number | ''
  prompt: string
  size: AiImageSize | ''
  quality: AiImageQuality | ''
  output_format: AiImageOutputFormat | ''
  output_compression: number | null
  moderation: AiImageModeration | ''
  n: number
  input_files: ImageComposerFile[]
  mask_file: ImageComposerMaskFile | null
  mask_target_sort_order: number | ''
}

export interface UploadImageFileRequest {
  file: File
  source_type: 'upload' | 'mask'
  mask_target_sort_order?: number
}
