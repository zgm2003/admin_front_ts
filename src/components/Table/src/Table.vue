<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { ElTable, ElTableColumn, ElPagination, ElSpace } from 'element-plus'
import { useI18n } from 'vue-i18n'
import ColumnSetting from './components/ColumnSetting.vue'
import TableActions from './components/TableActions.vue'
const props = defineProps({
  columns: { type: Array, default: () => [] },
  data: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  rowKey: { type: String, default: 'id' },
  selectable: { type: Boolean, default: false },
  rowClickSelect: { type: Boolean, default: true },
  pagination: { type: Object, default: null },
  tableProps: { type: Object, default: () => ({}) },
  autoOverflowTooltip: { type: Boolean, default: true },
  showRefresh: { type: Boolean, default: true },
  showColumnSetting: { type: Boolean, default: true },
  refreshLoading: { type: Boolean, default: false },
  showIndex: { type: Boolean, default: false }
})
const { t } = useI18n()
const emit = defineEmits(['refresh','selection-change','update:pagination','column-change'])
const selectedColumnKeys = ref([] as any[])
watch(() => props.columns, (cols: any[]) => { selectedColumnKeys.value = cols.filter((c: any) => !c.hidden).map((c: any) => c.key) }, { immediate: true })
watch(() => selectedColumnKeys.value, (keys: any[]) => { emit('column-change', keys) })
const visibleColumns = computed(() => (props.columns as any[]).filter((c: any) => selectedColumnKeys.value.includes(c.key)))
const page = ref(props.pagination ? { ...(props.pagination as any) } : null)
watch(() => props.pagination, (p: any) => { page.value = p ? { ...p } : null }, { immediate: true, deep: true })
const onSizeChange = (size: number) => { if (!page.value) return; (page.value as any).page_size = size; (page.value as any).current_page = 1; emit('update:pagination', { ...(page.value as any) }) }
const onCurrentChange = (cur: number) => { if (!page.value) return; (page.value as any).current_page = cur; emit('update:pagination', { ...(page.value as any) }) }
const tableRef = ref<any>(null)
const onRowClick = (row: any) => { if (!props.selectable || props.rowClickSelect === false) return; (tableRef.value as any)?.toggleRowSelection(row) }
const isMobile = useMediaQuery('(max-width: 768px)')
const paginationLayout = computed(() => isMobile.value ? 'total, prev, pager, next, sizes' : 'total, sizes, prev, pager, next, jumper')
const pageSizes = computed(() => isMobile.value ? [10,20,50] : [10,20,50,100])
</script>
<template>
  <div class="table-wrapper">
    <div class="table-toolbar">
      <ElSpace>
        <slot name="toolbar" />
        <TableActions :show-refresh="props.showRefresh" :refresh-loading="props.refreshLoading" @refresh="emit('refresh')" />
        <ColumnSetting v-if="props.showColumnSetting" v-model="selectedColumnKeys" :columns="(props.columns as any[])" />
      </ElSpace>
    </div>
    <ElTable ref="tableRef" :data="props.data" :row-key="props.rowKey" border v-loading="props.loading" @row-click="onRowClick" @selection-change="$emit('selection-change', $event)" v-bind="props.tableProps">
      <ElTableColumn v-if="props.selectable" type="selection" width="48" />
      <ElTableColumn v-if="props.showIndex" type="index" :label="t('common.index')" align="center" width="60"/>
      <ElTableColumn v-for="col in visibleColumns" :key="col.key" :prop="col.key" :label="col.label" :width="col.width" :min-width="col.minWidth" :align="col.align || 'center'" :show-overflow-tooltip="(col.overflowTooltip ?? props.autoOverflowTooltip) && (!!col.width || !!col.minWidth)">
        <template #default="{ row }"><slot :name="'cell-'+col.key" :row="row" :col="col">{{ (row as any)[col.key] }}</slot></template>
      </ElTableColumn>
    </ElTable>
    <div class="table-footer" v-if="page"><ElPagination v-model:current-page="(page as any).current_page" v-model:page-size="(page as any).page_size" :layout="paginationLayout" :small="isMobile" :page-sizes="pageSizes" :total="(page as any).total" @size-change="onSizeChange" @current-change="onCurrentChange" /></div>
  </div>
</template>
<style scoped>
.table-wrapper{display:flex;flex-direction:column}
.table-toolbar{display:flex;justify-content:space-between;margin-bottom:8px}
.table-footer{display:flex;justify-content:flex-end;margin-top:8px}
@media (max-width: 768px){
  .table-footer{justify-content:center}
}
</style>
