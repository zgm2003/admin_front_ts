import type { ElCascader } from 'element-plus'
import type { CascaderProps, CascaderOption } from 'element-plus/es/components/cascader-panel/src/types'
import type { DatePickerPropsPublic } from 'element-plus/es/components/date-picker/src/props'
import type { InputPropsPublic } from 'element-plus/es/components/input/src/input'
import type { SelectPropsPublic } from 'element-plus/es/components/select/src/select'
import type { SelectV2PropsPublic } from 'element-plus/es/components/select-v2/src/defaults'
import type { OptionType } from 'element-plus/es/components/select-v2/src/select.types'
import type { RemoteListFetchMethod, RemoteListParams } from '@/types/common'

type SearchLabelResolver<Item extends object = object> = {
  bivarianceHack(item: Item): string
}['bivarianceHack']

export type SearchFormValue = string | number | string[] | number[] | Date | Date[] | null | undefined
export type SearchFormModel = Record<string, SearchFormValue>
type SearchModelKey<Model extends object> = keyof Model & string

type InputElementProps = Partial<Omit<
  InputPropsPublic,
  'modelValue' | 'placeholder' | 'disabled' | 'clearable'
>>
type SelectElementProps = Partial<Omit<
  SelectV2PropsPublic,
  'modelValue' | 'options' | 'placeholder' | 'disabled' | 'clearable'
>>
type CascaderElementProps = Partial<Omit<
  InstanceType<typeof ElCascader>['$props'],
  'modelValue' | 'options' | 'props' | 'placeholder' | 'disabled' | 'clearable'
>>
type DateElementProps = Partial<Omit<
  DatePickerPropsPublic,
  'modelValue' | 'type' | 'placeholder' | 'disabled' | 'clearable'
>>
type RemoteSelectElementProps = Partial<Omit<
  SelectPropsPublic,
  'modelValue' | 'placeholder' | 'disabled' | 'clearable'
>>

interface SearchFieldBase<K extends string, ElementProps> {
  key: K
  label?: string
  placeholder?: string
  width?: number | string
  disabled?: boolean
  clearable?: boolean
  elementProps?: ElementProps
}

interface InputSearchField<K extends string> extends SearchFieldBase<K, InputElementProps> {
  type: 'input'
}

interface SelectSearchField<K extends string, Option extends OptionType = OptionType>
extends SearchFieldBase<K, SelectElementProps> {
  type: 'select-v2'
  options: Option[]
}

interface CascaderSearchField<K extends string, Option extends CascaderOption = CascaderOption>
extends SearchFieldBase<K, CascaderElementProps> {
  type: 'cascader'
  options: Option[]
  cascaderProps?: CascaderProps
}

interface DateRangeSearchField<K extends string> extends SearchFieldBase<K, DateElementProps> {
  type: 'date-range'
}

interface DateSearchField<K extends string> extends SearchFieldBase<K, DateElementProps> {
  type: 'date'
}

interface SlotSearchField<K extends string> extends SearchFieldBase<K, never> {
  type: 'slot'
}

export interface RemoteSelectSearchField<
  Model extends object = SearchFormModel,
  K extends SearchModelKey<Model> = SearchModelKey<Model>,
  Item extends object = object,
  Params extends RemoteListParams = RemoteListParams,
> extends SearchFieldBase<K, RemoteSelectElementProps> {
  type: 'remote-select'
  fetchMethod: RemoteListFetchMethod<Item, Params>
  labelField?: string | SearchLabelResolver<Item>
  valueField?: string
  keywordField?: string
}

type Supports<Model extends object, K extends SearchModelKey<Model>, Value, Field> =
  string extends keyof Model
    ? Field
    : [NonNullable<Model[K]>] extends [Value] ? Field : never

export type SearchField<
  Model extends object = SearchFormModel,
  K extends SearchModelKey<Model> = SearchModelKey<Model>,
  Option extends OptionType = OptionType,
  Item extends object = object,
  Params extends RemoteListParams = RemoteListParams,
> = K extends SearchModelKey<Model>
  ? | Supports<Model, K, string | number, InputSearchField<K>>
    | Supports<Model, K, string | number | string[] | number[], SelectSearchField<K, Option>>
    | Supports<Model, K, string | number | string[] | number[], CascaderSearchField<K>>
    | Supports<Model, K, string[] | Date[], DateRangeSearchField<K>>
    | Supports<Model, K, string | Date, DateSearchField<K>>
    | SlotSearchField<K>
    | Supports<
      Model,
      K,
      string | number | string[] | number[],
      RemoteSelectSearchField<Model, K, Item, Params>
    >
  : never
