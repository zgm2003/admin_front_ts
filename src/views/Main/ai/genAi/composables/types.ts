export interface ToolCall {
  call_id: string
  tool_name: string
  tool_inputs: Record<string, any>
  tool_result?: string
  status: 'calling' | 'done'
  collapsed: boolean
}

export interface FileResult {
  path: string
  success: boolean
  error?: string
  is_new?: boolean
  original?: string | null
  content?: string
}

export interface TableResult {
  table_name: string
  success: boolean
  error?: string
  altered?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  tool_calls?: ToolCall[]
  tables?: TableResult[]
  files?: FileResult[]
  reviewContent?: string
  testContent?: string
  isStreaming?: boolean
}

export type Phase = 'idle' | 'researching' | 'generating' | 'reviewing' | 'testing' | 'done'

export interface TemplateItem {
  key: string
  icon: string
  label: string
  prompt: string
}
