export type TableRow = object
export type TableColumnKey = string

export interface TableColumn<Row extends TableRow = TableRow> {
  key?: TableColumnKey
  prop?: keyof Row & string
  label: string
  hidden?: boolean
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | string
  overflowTooltip?: boolean
  formatter?: (
    row: Row,
    column: { property: string },
    value: unknown,
    index: number
  ) => unknown
  [elementTableColumnProp: string]: unknown
}

export interface TablePaginationState {
  current_page: number
  page_size: number
  total: number
  total_page?: number
}

export function tableColumnKey<Row extends TableRow>(column: Pick<TableColumn<Row>, 'key' | 'prop'>): TableColumnKey {
  const key = column.key ?? column.prop

  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error('AppTable column key or prop is required')
  }

  return key
}

export function tableColumnProp<Row extends TableRow>(column: Pick<TableColumn<Row>, 'key' | 'prop'>): string {
  return column.prop ?? tableColumnKey<Row>(column)
}
