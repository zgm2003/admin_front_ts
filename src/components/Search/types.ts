export type SearchField = {
  key: string
  type: 'input' | 'select-v2' | 'cascader' | 'date-range'
  label?: string
  placeholder?: string
  width?: number
  options?: any[]
  props?: Record<string, any>
}

