import type { SearchField } from '../../../../src/components/Search/types'
import type { TableColumn } from '../../../../src/components/Table/src/types'

interface Row { id: number; name: string }
interface SearchModel {
  keyword: string
  dateRange: string[]
  status: number | ''
  mixed: string | string[]
}

export const propertyColumn: TableColumn<Row> = {
  prop: 'name',
  label: 'Name',
  formatter(_row, _column, value) {
    return value.toUpperCase()
  },
}

export const derivedColumn: TableColumn<Row> = {
  key: 'actions',
  label: 'Actions',
  elementProps: { sortable: false },
  formatter(_row, _column, value) {
    return String(value)
  },
}

export const fields: SearchField<SearchModel>[] = [
  { key: 'keyword', type: 'input', elementProps: { maxlength: 20 } },
  { key: 'dateRange', type: 'date-range' },
  { key: 'status', type: 'select-v2', options: [] },
]

export const invalidColumn: TableColumn<Row> = {
  key: 'actions',
  label: 'Actions',
  // @ts-expect-error arbitrary Element Plus props belong inside typed elementProps
  arbitraryTopLevelProp: true,
}

// @ts-expect-error keyword is not compatible with a date-range control
export const invalidSearch: SearchField<SearchModel> = { key: 'keyword', type: 'date-range' }

// @ts-expect-error every non-null model variant must be compatible with the control
export const mixedSearch: SearchField<SearchModel> = { key: 'mixed', type: 'input' }
