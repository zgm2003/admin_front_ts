import type { RemoteListFetchMethod } from '@/types/common'

type SearchLabelResolver<Item extends object = object> = {
  bivarianceHack(item: Item): string
}['bivarianceHack']

export type SearchFormModel = Record<string, unknown>

interface SearchFieldBase {
  key: string
  label?: string
  placeholder?: string
  width?: number | string
  [key: string]: unknown
}

interface InputSearchField extends SearchFieldBase {
  type: 'input'
}

interface SelectSearchField<Option = unknown> extends SearchFieldBase {
  type: 'select-v2'
  options?: Option[]
}

interface CascaderSearchField<Option = unknown> extends SearchFieldBase {
  type: 'cascader'
  options?: Option[]
  cascaderProps?: Record<string, unknown>
}

interface DateRangeSearchField extends SearchFieldBase {
  type: 'date-range'
}

interface DateSearchField extends SearchFieldBase {
  type: 'date'
}

interface SlotSearchField extends SearchFieldBase {
  type: 'slot'
}

export interface RemoteSelectSearchField<
  Item extends object = object,
> extends SearchFieldBase {
  type: 'remote-select'
  fetchMethod: RemoteListFetchMethod<Item>
  labelField?: string | SearchLabelResolver<Item>
  valueField?: string
  keywordField?: string
}

export type SearchField<
  Option = unknown,
  Item extends object = object,
> =
  | InputSearchField
  | SelectSearchField<Option>
  | CascaderSearchField<Option>
  | DateRangeSearchField
  | DateSearchField
  | SlotSearchField
  | RemoteSelectSearchField<Item>
