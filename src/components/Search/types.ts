export type SearchField = {
  key: string
  type: 'input' | 'select-v2' | 'cascader' | 'date-range' | 'date' | 'slot' | 'remote-select'
  label?: string
  placeholder?: string
  width?: number
  options?: any[]
  cascaderProps?: Record<string, any> // cascader 的 :props 配置
  // remote-select 专用配置
  fetchMethod?: (params: Record<string, any>) => Promise<{ list: any[]; total: number }>
  labelField?: string | ((item: any) => string)
  valueField?: string
  keywordField?: string
  [key: string]: any // 其他属性透传给对应组件
}

