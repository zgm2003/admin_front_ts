import type {
  AiKnowledgeBaseMutationParams,
  AiKnowledgeDocumentMutationParams,
} from '@/api/ai/knowledge'

export interface FormDialogExpose {
  clearValidate: () => void
  validate: () => Promise<boolean> | undefined
}

export interface KnowledgeBaseFormState extends AiKnowledgeBaseMutationParams {
  name: string
  description: string
  visibility: string
  chunk_size: number
  chunk_overlap: number
  top_k: number
  score_threshold: number
  status: number
}

export interface KnowledgeDocumentFormState extends AiKnowledgeDocumentMutationParams {
  title: string
  source_type: string
  content: string
  status: number
}
