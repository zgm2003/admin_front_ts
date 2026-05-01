<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import type { RoleMatrixGroup, RoleMatrixRow, RoleMatrixSelectionState } from '../role-matrix'
import {
  getRoleMatrixGroupSelectionState,
  getRoleMatrixRowSelectionState,
  toggleMatrixGroup,
  toggleMatrixPage,
  toggleMatrixRowAction,
} from '../role-matrix'

const selectedIds = defineModel<number[]>({ required: true })

const props = defineProps<{
  groups: RoleMatrixGroup[]
  emptyText: string
  pageLabel: string
  actionLabel: string
  pageAccessLabel: string
  groupSelectLabel: string
  groupClearLabel: string
  selectedCountLabel: string
  pageCountLabel: string
  actionCountLabel: string
  emptyActionsText: string
  helperText: string
  groupExpandLabel: string
  groupCollapseLabel: string
}>()

interface GroupRuntimeState {
  selection: RoleMatrixSelectionState
  pageTotal: number
  pageSelected: number
  actionTotal: number
  actionSelected: number
}

interface RowRuntimeState {
  selection: RoleMatrixSelectionState
  actionSelected: number
}

const emptySelectionState: RoleMatrixSelectionState = {
  total: 0,
  selected: 0,
  checked: false,
  indeterminate: false,
}
const emptyGroupRuntimeState: GroupRuntimeState = {
  selection: emptySelectionState,
  pageTotal: 0,
  pageSelected: 0,
  actionTotal: 0,
  actionSelected: 0,
}
const emptyRowRuntimeState: RowRuntimeState = {
  selection: emptySelectionState,
  actionSelected: 0,
}

const hasGroups = computed(() => props.groups.length > 0)
const selectedIdSet = computed(() => new Set(selectedIds.value))
const collapsedGroupIds = shallowRef(new Set<RoleMatrixGroup['groupId']>())

const isChecked = (id: number): boolean => selectedIdSet.value.has(id)

const rowKey = (row: RoleMatrixRow): string => `${row.platform}:${row.pageId}`

const groupRuntimeStateMap = computed(() => {
  const map = new Map<RoleMatrixGroup['groupId'], GroupRuntimeState>()
  const selectedSet = selectedIdSet.value

  for (const group of props.groups) {
    let pageTotal = 0
    let pageSelected = 0
    let actionTotal = 0
    let actionSelected = 0

    for (const row of group.rows) {
      if (row.pagePermissionId !== null) {
        pageTotal += 1
        if (selectedSet.has(row.pagePermissionId)) {
          pageSelected += 1
        }
      }

      actionTotal += row.actions.length
      for (const action of row.actions) {
        if (selectedSet.has(action.id)) {
          actionSelected += 1
        }
      }
    }

    map.set(group.groupId, {
      selection: getRoleMatrixGroupSelectionState(group, selectedSet),
      pageTotal,
      pageSelected,
      actionTotal,
      actionSelected,
    })
  }

  return map
})

const rowRuntimeStateMap = computed(() => {
  const map = new Map<string, RowRuntimeState>()
  const selectedSet = selectedIdSet.value

  for (const group of props.groups) {
    for (const row of group.rows) {
      map.set(rowKey(row), {
        selection: getRoleMatrixRowSelectionState(row, selectedSet),
        actionSelected: row.actions.filter((action) => selectedSet.has(action.id)).length,
      })
    }
  }

  return map
})

const groupRuntimeState = (group: RoleMatrixGroup): GroupRuntimeState => (
  groupRuntimeStateMap.value.get(group.groupId) ?? emptyGroupRuntimeState
)

const rowRuntimeState = (row: RoleMatrixRow): RowRuntimeState => (
  rowRuntimeStateMap.value.get(rowKey(row)) ?? emptyRowRuntimeState
)

const setPageChecked = (row: RoleMatrixRow, checked: boolean) => {
  selectedIds.value = toggleMatrixPage(selectedIds.value, row, checked)
}

const setActionChecked = (row: RoleMatrixRow, id: number, checked: boolean) => {
  selectedIds.value = toggleMatrixRowAction(selectedIds.value, row, id, checked)
}

const selectGroup = (group: RoleMatrixGroup) => {
  selectedIds.value = toggleMatrixGroup(selectedIds.value, group, true)
}

const clearGroup = (group: RoleMatrixGroup) => {
  selectedIds.value = toggleMatrixGroup(selectedIds.value, group, false)
}

const setGroupChecked = (group: RoleMatrixGroup, checked: boolean) => {
  selectedIds.value = toggleMatrixGroup(selectedIds.value, group, checked)
}

const isGroupCollapsed = (group: RoleMatrixGroup): boolean => collapsedGroupIds.value.has(group.groupId)

const toggleGroupCollapse = (group: RoleMatrixGroup) => {
  const nextIds = new Set(collapsedGroupIds.value)
  if (nextIds.has(group.groupId)) {
    nextIds.delete(group.groupId)
  } else {
    nextIds.add(group.groupId)
  }
  collapsedGroupIds.value = nextIds
}
</script>

<template>
  <el-empty v-if="!hasGroups" :description="emptyText" />
  <div v-else class="role-permission-matrix">
    <div class="role-permission-matrix__helper">
      <span class="role-permission-matrix__helper-dot"></span>
      <span>{{ helperText }}</span>
    </div>
    <section v-for="group in groups" :key="group.groupId" class="role-permission-matrix__group">
      <div class="role-permission-matrix__group-header">
        <div class="role-permission-matrix__group-main">
          <el-checkbox
            class="role-permission-matrix__group-title"
            :model-value="groupRuntimeState(group).selection.checked"
            :indeterminate="groupRuntimeState(group).selection.indeterminate"
            @update:model-value="(value: unknown) => setGroupChecked(group, Boolean(value))"
          >
            {{ group.groupLabel }}
          </el-checkbox>
          <div class="role-permission-matrix__group-meta">
            <span class="role-permission-matrix__group-stat">
              {{ selectedCountLabel }} {{ groupRuntimeState(group).selection.selected }}/{{ groupRuntimeState(group).selection.total }}
            </span>
            <span class="role-permission-matrix__group-stat">
              {{ pageCountLabel }} {{ groupRuntimeState(group).pageSelected }}/{{ groupRuntimeState(group).pageTotal }}
            </span>
            <span class="role-permission-matrix__group-stat">
              {{ actionCountLabel }} {{ groupRuntimeState(group).actionSelected }}/{{ groupRuntimeState(group).actionTotal }}
            </span>
          </div>
        </div>
        <el-space>
          <el-button size="small" text @click="toggleGroupCollapse(group)">
            {{ isGroupCollapsed(group) ? groupExpandLabel : groupCollapseLabel }}
          </el-button>
          <el-button size="small" text type="primary" @click="selectGroup(group)">
            {{ groupSelectLabel }}
          </el-button>
          <el-button size="small" text @click="clearGroup(group)">
            {{ groupClearLabel }}
          </el-button>
        </el-space>
      </div>
      <el-table v-if="!isGroupCollapsed(group)" :data="group.rows" border row-key="pageId" class="role-permission-matrix__table">
        <el-table-column :label="pageLabel" min-width="260">
          <template #default="{ row }">
            <div class="role-permission-matrix__page">
              <span
                class="role-permission-matrix__page-status"
                :class="{
                  'is-complete': rowRuntimeState(row).selection.checked,
                  'is-partial': rowRuntimeState(row).selection.indeterminate,
                }"
              ></span>
              <div class="role-permission-matrix__page-copy">
                <div class="role-permission-matrix__page-name">{{ row.pageLabel }}</div>
                <div class="role-permission-matrix__page-meta">
                  <span v-if="row.pagePermissionId">{{ pageAccessLabel }}</span>
                  <span>{{ actionCountLabel }} {{ rowRuntimeState(row).actionSelected }}/{{ row.actions.length }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="actionLabel" min-width="420">
          <template #default="{ row }">
            <el-space wrap class="role-permission-matrix__actions">
              <el-checkbox
                v-if="row.pagePermissionId"
                class="role-permission-matrix__view"
                :model-value="isChecked(row.pagePermissionId)"
                @update:model-value="(value: unknown) => setPageChecked(row, Boolean(value))"
              >
                {{ pageAccessLabel }}
              </el-checkbox>
              <el-checkbox
                v-for="action in row.actions"
                :key="action.id"
                :model-value="isChecked(action.id)"
                @update:model-value="(value: unknown) => setActionChecked(row, action.id, Boolean(value))"
              >
                {{ action.label }}
              </el-checkbox>
              <el-tag v-if="row.actions.length === 0" size="small" type="info">
                {{ emptyActionsText }}
              </el-tag>
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

.role-permission-matrix__helper {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.role-permission-matrix__helper-dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  background: var(--el-color-primary);
  border-radius: 999px;
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
  gap: 12px;
  padding: 12px 14px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.role-permission-matrix__group-main {
  min-width: 0;
}

.role-permission-matrix__group-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.role-permission-matrix__group-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.role-permission-matrix__group-stat {
  line-height: 18px;
}

.role-permission-matrix__table {
  width: 100%;
}

.role-permission-matrix__page {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
}

.role-permission-matrix__page-status {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  background: var(--el-border-color);
  border-radius: 999px;
}

.role-permission-matrix__page-status.is-partial {
  background: var(--el-color-warning);
}

.role-permission-matrix__page-status.is-complete {
  background: var(--el-color-success);
}

.role-permission-matrix__page-copy {
  min-width: 0;
}

.role-permission-matrix__page-name {
  overflow: hidden;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-permission-matrix__page-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.role-permission-matrix__actions {
  width: 100%;
}

.role-permission-matrix__view {
  font-weight: 500;
}
</style>
