<script setup lang="ts">
import { computed } from 'vue'
import type { RoleMatrixGroup, RoleMatrixRow } from '../role-matrix'
import { toggleMatrixGroup, toggleMatrixPage, toggleMatrixRowAction } from '../role-matrix'

const selectedIds = defineModel<number[]>({ required: true })

const props = defineProps<{
  groups: RoleMatrixGroup[]
  emptyText: string
  pageLabel: string
  actionLabel: string
  pageAccessLabel: string
  groupSelectLabel: string
}>()

const hasGroups = computed(() => props.groups.length > 0)

const isChecked = (id: number): boolean => selectedIds.value.includes(id)

const setPageChecked = (row: RoleMatrixRow, checked: boolean) => {
  selectedIds.value = toggleMatrixPage(selectedIds.value, row, checked)
}

const setActionChecked = (row: RoleMatrixRow, id: number, checked: boolean) => {
  selectedIds.value = toggleMatrixRowAction(selectedIds.value, row, id, checked)
}

const selectGroup = (group: RoleMatrixGroup) => {
  selectedIds.value = toggleMatrixGroup(selectedIds.value, group, true)
}
</script>

<template>
  <el-empty v-if="!hasGroups" :description="emptyText" />
  <div v-else class="role-permission-matrix">
    <section v-for="group in groups" :key="group.groupId" class="role-permission-matrix__group">
      <div class="role-permission-matrix__group-header">
        <div class="role-permission-matrix__group-title">{{ group.groupLabel }}</div>
        <el-button size="small" text type="primary" @click="selectGroup(group)">
          {{ groupSelectLabel }}
        </el-button>
      </div>
      <el-table :data="group.rows" border row-key="pageId" style="width: 100%">
        <el-table-column prop="pageLabel" :label="pageLabel" min-width="220" />
        <el-table-column :label="actionLabel" min-width="420">
          <template #default="{ row }">
            <el-space wrap>
              <el-checkbox
                v-if="row.pagePermissionId"
                :model-value="isChecked(row.pagePermissionId)"
                @update:model-value="(value) => setPageChecked(row, Boolean(value))"
              >
                {{ pageAccessLabel }}
              </el-checkbox>
              <el-checkbox
                v-for="action in row.actions"
                :key="action.id"
                :model-value="isChecked(action.id)"
                @update:model-value="(value) => setActionChecked(row, action.id, Boolean(value))"
              >
                {{ action.label }}
              </el-checkbox>
            </el-space>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<style scoped>
.role-permission-matrix {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.role-permission-matrix__group {
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.role-permission-matrix__group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.role-permission-matrix__group-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
</style>
