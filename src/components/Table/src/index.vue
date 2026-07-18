<script setup lang="ts" generic="Row extends TableRow">
import { computed, ref, watch } from 'vue'
import { useIsMobile } from '@/hooks/useResponsive'
import { ElTable, ElTableColumn, ElPagination, ElSpace } from 'element-plus'
import { useI18n } from 'vue-i18n'
import ColumnSetting from './components/ColumnSetting.vue'
import TableActions from './components/TableActions.vue'
import {
  formatTableColumnValue,
  tableColumnKey,
  tableColumnProp,
  tableColumnValue,
  type TableColumn,
  type TableColumnKey,
  type TablePaginationState,
  type TableRow,
} from './types'

interface AppTableProps<Row extends TableRow> {
  columns?: TableColumn<Row>[]
  data?: Row[]
  loading?: boolean
  rowKey?: string
  selectable?: boolean
  rowClickSelect?: boolean
  pagination?: TablePaginationState | null
  tableProps?: Record<string, unknown>
  autoOverflowTooltip?: boolean
  showRefresh?: boolean
  showColumnSetting?: boolean
  refreshLoading?: boolean
  showIndex?: boolean
  fixedFooter?: boolean
}

const props = withDefaults(defineProps<AppTableProps<Row>>(), {
  columns: () => [],
  data: () => [],
  loading: false,
  rowKey: 'id',
  selectable: false,
  rowClickSelect: true,
  pagination: null,
  tableProps: () => ({}),
  autoOverflowTooltip: true,
  showRefresh: true,
  showColumnSetting: true,
  refreshLoading: false,
  showIndex: false,
  fixedFooter: true,
})
const { t } = useI18n()
const emit = defineEmits<{
  refresh: []
  'selection-change': [selection: Row[]]
  'update:pagination': [pagination: TablePaginationState]
  'column-change': [keys: TableColumnKey[]]
}>()
const selectedColumnKeys = ref<TableColumnKey[]>([])
const tableRef = ref<InstanceType<typeof ElTable> | null>(null)
const page = ref<TablePaginationState | null>(props.pagination ? { ...props.pagination } : null)
const isMobile = useIsMobile()
const getColumnKey = (col: TableColumn<Row>) => tableColumnKey<Row>(col)
const getCellValue = (row: Row, col: TableColumn<Row>) => tableColumnValue(row, col)
const getColumnBindings = (col: TableColumn<Row>): Record<string, unknown> => ({
  align: 'center',
  prop: tableColumnProp<Row>(col),
  width: col.width,
  minWidth: col.minWidth,
  fixed: col.fixed,
  ...col.elementProps,
})
const formatCellValue = (row: Row, col: TableColumn<Row>, index: number) =>
  formatTableColumnValue(row, col, index)
watch(() => props.columns, (cols) => { selectedColumnKeys.value = cols.filter((c) => !c.hidden).map((c) => getColumnKey(c)) }, { immediate: true })
watch(() => selectedColumnKeys.value, (keys) => { emit('column-change', keys) })
const visibleColumns = computed(() => props.columns.filter((c) => selectedColumnKeys.value.includes(getColumnKey(c))))
watch(() => props.pagination, (p) => { page.value = p ? { ...p } : null }, { immediate: true, deep: true })
const onSizeChange = (size: number) => {
  if (!page.value) return
  page.value = { ...page.value, page_size: size, current_page: 1 }
  emit('update:pagination', { ...page.value })
}
const onCurrentChange = (cur: number) => {
  if (!page.value) return
  page.value = { ...page.value, current_page: cur }
  emit('update:pagination', { ...page.value })
}
const onRowClick = (row: Row) => { if (!props.selectable || props.rowClickSelect === false) return; tableRef.value?.toggleRowSelection(row) }
const onSelectionChange = (selection: Row[]) => emit('selection-change', selection)
const paginationLayout = computed(() => isMobile.value ? 'total, prev, pager, next' : 'total, sizes, prev, pager, next, jumper')
const pageSizes = computed(() => isMobile.value ? [10,20] : [10,20,30,40,50])
const mergedTableProps = computed(() => props.fixedFooter ? { height: '100%', ...props.tableProps } : props.tableProps)
</script>
<template>
  <div
    class="table-wrapper"
    :class="{ 'fixed-footer': props.fixedFooter }"
  >
    <div class="table-toolbar">
      <div class="toolbar-left">
        <ElSpace>
          <slot name="toolbar-left" />
        </ElSpace>
      </div>
      <div class="toolbar-right">
        <ElSpace>
          <slot name="toolbar-right" />
          <TableActions
            :show-refresh="props.showRefresh"
            :refresh-loading="props.refreshLoading"
            @refresh="emit('refresh')"
          />
          <ColumnSetting
            v-if="props.showColumnSetting"
            v-model="selectedColumnKeys"
            :columns="props.columns"
          />
        </ElSpace>
      </div>
    </div>
    <ElTable
      ref="tableRef"
      v-loading="props.loading"
      :data="props.data"
      :row-key="props.rowKey"
      border
      v-bind="mergedTableProps"
      :class="{ 'flex-table': props.fixedFooter }"
      @row-click="onRowClick"
      @selection-change="onSelectionChange"
    >
      <ElTableColumn
        v-if="props.selectable"
        type="selection"
        width="48"
        align="center"
        header-align="center"
      />
      <ElTableColumn
        v-if="props.showIndex"
        type="index"
        :label="t('common.index')"
        align="center"
        width="60"
      />
      <ElTableColumn
        v-for="col in visibleColumns"
        :key="getColumnKey(col)"
        :label="col.label"
        :show-overflow-tooltip="(col.overflowTooltip ?? props.autoOverflowTooltip) && (!!col.width || !!col.minWidth)"
        v-bind="getColumnBindings(col)"
      >
        <template #default="{ row, $index }">
          <slot
            :name="'cell-'+getColumnKey(col)"
            :row="row"
            :col="col"
            :value="getCellValue(row, col)"
            :index="$index"
          >
            {{ formatCellValue(row, col, $index) }}
          </slot>
        </template>
      </ElTableColumn>
    </ElTable>
    <div
      v-if="page"
      class="table-footer"
    >
      <ElPagination
        v-model:current-page="page.current_page"
        v-model:page-size="page.page_size"
        :layout="paginationLayout"
        :small="isMobile"
        :pager-count="isMobile ? 5 : 7"
        :page-sizes="pageSizes"
        :total="page.total"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>
  </div>
</template>
<style scoped>
.table-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  min-width: 0;
}

.table-wrapper.fixed-footer {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
  margin-bottom: 8px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  min-width: 0;
}

.flex-table {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-footer {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  margin-top: 8px;
}

:deep(.el-table-column--selection .cell) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
