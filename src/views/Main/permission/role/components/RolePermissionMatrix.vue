<script setup lang="ts">
import { computed } from 'vue'
import type { RoleMatrixRow } from '../role-matrix'
import { toggleMatrixAction } from '../role-matrix'

const selectedIds = defineModel<number[]>({ required: true })

const props = defineProps<{
  rows: RoleMatrixRow[]
  emptyText: string
  pageLabel: string
  actionLabel: string
}>()

const hasRows = computed(() => props.rows.length > 0)

const isChecked = (id: number): boolean => selectedIds.value.includes(id)

const setChecked = (id: number, checked: boolean) => {
  selectedIds.value = toggleMatrixAction(selectedIds.value, id, checked)
}
</script>

<template>
  <el-empty v-if="!hasRows" :description="emptyText" />
  <el-table v-else :data="rows" border row-key="pageId" style="width: 100%">
    <el-table-column prop="pageLabel" :label="pageLabel" min-width="220" />
    <el-table-column :label="actionLabel" min-width="420">
      <template #default="{ row }">
        <el-space wrap>
          <el-checkbox
            v-for="action in row.actions"
            :key="action.id"
            :model-value="isChecked(action.id)"
            @update:model-value="(value) => setChecked(action.id, Boolean(value))"
          >
            {{ action.label }}
          </el-checkbox>
        </el-space>
      </template>
    </el-table-column>
  </el-table>
</template>
