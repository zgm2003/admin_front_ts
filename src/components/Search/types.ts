export type SearchField = {
  key: string
  type: 'input' | 'select-v2' | 'cascader' | 'date-range' | 'date' | 'slot'
  label?: string
  placeholder?: string
  width?: number
  options?: any[]
  cascaderProps?: Record<string, any> // cascader 的 :props 配置
  [key: string]: any // 其他属性透传给对应组件
}

