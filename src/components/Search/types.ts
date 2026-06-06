import type { RemoteListFetchMethod, RemoteListParams } from '@/types/common'
import type { CascaderOption } from 'element-plus/es/components/cascader-panel/src/types'
import type { OptionType } from 'element-plus/es/components/select-v2/src/select.types'

type SearchLabelResolver<Item extends object = object> = {
  bivarianceHack(item: Item): string
}['bivarianceHack']

export type SearchFormValue = string | number | string[] | number[] | Date | Date[] | null | undefined
export type SearchFormModel = Record<string, SearchFormValue>

interface SearchFieldBase {
  key: string
  label?: string
  placeholder?: string
  width?: number | string
  disabled?: boolean
  clearable?: boolean
  [key: string]: unknown
}

interface InputSearchField extends SearchFieldBase {
  type: 'input'
}

interface SelectSearchField<Option extends OptionType = OptionType> extends SearchFieldBase {
  type: 'select-v2'
  options: Option[]
}

interface CascaderSearchField<Option extends CascaderOption = CascaderOption> extends SearchFieldBase {
  type: 'cascader'
  options: Option[]
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
  Params extends RemoteListParams = RemoteListParams,
> extends SearchFieldBase {
  type: 'remote-select'
  fetchMethod: RemoteListFetchMethod<Item, Params>
  labelField?: string | SearchLabelResolver<Item>
  valueField?: string
  keywordField?: string
}

export type SearchField<
  Option extends OptionType = OptionType,
  Item extends object = object,
  Params extends RemoteListParams = RemoteListParams,
> =
  | InputSearchField
  | SelectSearchField<Option>
  | CascaderSearchField<Option>
  | DateRangeSearchField
  | DateSearchField
  | SlotSearchField
  | RemoteSelectSearchField<Item, Params>
