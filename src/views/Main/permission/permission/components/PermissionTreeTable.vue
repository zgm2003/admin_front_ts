<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { TableInstance } from 'element-plus'
import { DIcon } from '@/components/DIcon'
import { CommonEnum, PermissionTypeEnum } from '@/enums'
import type { PermissionListItem } from '@/api/permission/permission'

const props = defineProps<{
  rows: PermissionListItem[]
  loading: boolean
  expanded: boolean
  canAdd: boolean
  canEdit: boolean
  canStatus: boolean
  labels: {
    id: string
    name: string
    icon: string
    status: string
    sort: string
    type: string
    actions: string
    add: string
    edit: string
  }
}>()

const emit = defineEmits<{
  addChild: [row: PermissionListItem]
  edit: [row: PermissionListItem]
  statusChange: [row: PermissionListItem]
  selectionChange: [rows: PermissionListItem[]]
}>()

const tableRef = ref<TableInstance | null>(null)

function expandRows(rows: PermissionListItem[], expanded: boolean) {
  rows.forEach((row) => {
    tableRef.value?.toggleRowExpansion(row, expanded)
    if (row.children?.length) {
      expandRows(row.children, expanded)
    }
  })
}

function applyExpansion() {
  void nextTick(() => {
    expandRows(props.rows, props.expanded)
  })
}

function handleRowClick(row: PermissionListItem) {
  tableRef.value?.toggleRowSelection(row)
}

watch(() => props.expanded, applyExpansion)
watch(() => props.rows, applyExpansion)
</script>

<template>
  <div class="permission-table-wrap">
    <el-table
      ref="tableRef"
      class="permission-table"
      :data="rows"
      style="width:100%"
      v-loading="loading"
      row-key="id"
      border
      @selection-change="emit('selectionChange', $event)"
      @row-click="handleRowClick"
    >
      <el-table-column type="selection" width="55" align="center" header-align="center" />
      <el-table-column prop="id" width="150" :label="labels.id" />
      <el-table-column prop="name" :label="labels.name" align="center" />
      <el-table-column :label="labels.icon" align="center" width="80">
        <template #default="scope">
          <DIcon v-if="scope.row.icon" :icon="scope.row.icon" :size="24" />
        </template>
      </el-table-column>
      <el-table-column :label="labels.status" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="CommonEnum.YES"
            :inactive-value="CommonEnum.NO"
            :disabled="!canStatus"
            @change="emit('statusChange', scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="sort" :label="labels.sort" align="center" width="90" />
      <el-table-column :label="labels.type" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.type === PermissionTypeEnum.DIR" effect="dark" type="success">
            {{ scope.row.type_name }}
          </el-tag>
          <el-tag v-if="scope.row.type === PermissionTypeEnum.PAGE" effect="dark" type="primary">
            {{ scope.row.type_name }}
          </el-tag>
          <el-tag v-if="scope.row.type === PermissionTypeEnum.BUTTON" effect="dark" type="danger">
            {{ scope.row.type_name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="labels.actions" align="center" min-width="180" fixed="right" header-align="center">
        <template #default="scope">
          <el-button
            v-if="canAdd && scope.row.type !== PermissionTypeEnum.BUTTON"
            type="success"
            text
            @click.stop="emit('addChild', scope.row)"
          >
            {{ labels.add }}
          </el-button>
          <el-button
            v-if="canEdit"
            type="primary"
            text
            @click.stop="emit('edit', scope.row)"
          >
            {{ labels.edit }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.permission-table-wrap {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

:deep(.permission-table .el-table-column--selection .cell) {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
