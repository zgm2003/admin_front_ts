import type { TableColumnCtx } from 'element-plus'

export type TableRow = object
export type TableColumnKey = string

export type TableColumnElementProps<Row extends TableRow = TableRow> = Partial<Pick<
  TableColumnCtx<Row>,
  | 'align'
  | 'headerAlign'
  | 'sortable'
  | 'sortMethod'
  | 'sortBy'
  | 'resizable'
  | 'columnKey'
  | 'className'
  | 'labelClassName'
  | 'filters'
  | 'filterMethod'
  | 'filterPlacement'
  | 'filterMultiple'
  | 'filteredValue'
  | 'selectable'
  | 'reserveSelection'
  | 'sortOrders'
  | 'tooltipFormatter'
>>

interface TableColumnBase<Row extends TableRow> {
  label: string
  hidden?: boolean
  width?: string | number
  minWidth?: string | number
  fixed?: boolean | string
  overflowTooltip?: boolean
  elementProps?: TableColumnElementProps<Row>
}

type PropertyTableColumn<Row extends TableRow> = {
  [K in keyof Row & string]: TableColumnBase<Row> & {
    prop: K
    key?: TableColumnKey
    formatter?: (
      row: Row,
      column: { property: K },
      value: Row[K],
      index: number,
    ) => unknown
  }
}[keyof Row & string]

interface DerivedTableColumn<Row extends TableRow> extends TableColumnBase<Row> {
  key: TableColumnKey
  prop?: never
  formatter?: (
    row: Row,
    column: { property: string },
    value: unknown,
    index: number,
  ) => unknown
}

export type TableColumn<Row extends TableRow = TableRow> =
  | PropertyTableColumn<Row>
  | DerivedTableColumn<Row>

function isPropertyTableColumn<Row extends TableRow>(
  column: TableColumn<Row>,
): column is PropertyTableColumn<Row> {
  return column.prop !== undefined
}

export interface TablePaginationState {
  current_page: number
  page_size: number
  total: number
  total_page?: number
}

interface TableColumnIdentity<Row extends TableRow> {
  readonly key?: TableColumnKey
  readonly prop?: keyof Row & string
}

export function tableColumnKey<Row extends TableRow>(column: TableColumnIdentity<Row>): TableColumnKey {
  const key = column.key ?? column.prop
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error('AppTable column key or prop is required')
  }
  return key
}

export function tableColumnProp<Row extends TableRow>(column: TableColumnIdentity<Row>): string {
  return column.prop ?? tableColumnKey<Row>(column)
}

export function tableColumnValue<Row extends TableRow>(row: Row, column: TableColumn<Row>): unknown {
  if (isPropertyTableColumn(column)) return row[column.prop]
  return Reflect.get(row, tableColumnKey(column))
}

export function formatTableColumnValue<Row extends TableRow>(
  row: Row,
  column: TableColumn<Row>,
  index: number,
): unknown {
  if (!column.formatter) return tableColumnValue(row, column)
  if (isPropertyTableColumn(column)) {
    return column.formatter(row, { property: column.prop }, row[column.prop], index)
  }
  const key = tableColumnKey(column)
  return column.formatter(
    row,
    { property: key },
    Reflect.get(row, key),
    index,
  )
}
