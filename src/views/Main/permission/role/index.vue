<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import RolePermissionMatrix from './components/RolePermissionMatrix.vue'
import RolePermissionDiffDialog from './components/RolePermissionDiffDialog.vue'
import { useRolePage } from './use-role-page'

const userStore = useUserStore()
const {
  activePlatform, add, addedPermissionLabels, batchDel, clearCurrentPlatformPermissions,
  columns, confirmDel, confirmSubmit, dialogMode, dialogVisible,
  diffAddedTitle, diffDialogVisible, diffRemovedTitle, edit, form,
  handleDefaultSwitch, isMobile, listData, listLoading, matrixGroups,
  onPageChange, onSearch, onSelectionChange, page, platformOptions,
  refresh, removedPermissionLabels, rules, searchFields, searchForm,
  selectAllPermissions, submitRole, t, setFormRef,
} = useRolePage()
</script>

<template>
  <div class="box">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
    <div class="table">
      <AppTable
        :columns="columns"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        selectable
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-button
            v-if="userStore.can('permission_role_add')"
            type="success"
            @click="add"
          >
            {{
              t('common.actions.add')
            }}
          </el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="userStore.can('permission_role_del')"
                  @click="batchDel"
                >
                  {{
                    t('common.actions.batchDelete')
                  }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-is_default="{ row }">
          <el-tag
            v-if="row.is_default === CommonEnum.YES"
            type="success"
          >
            {{ t('role.table.is_default') }}
          </el-tag>
          <span v-else />
        </template>
        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('permission_role_edit')"
            type="primary"
            text
            @click="edit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="userStore.can('permission_role_del')"
            type="danger"
            text
            @click="confirmDel(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
          <el-button
            v-if="userStore.can('permission_role_setDefault') && row.is_default !== CommonEnum.YES"
            type="success"
            text
            @click="handleDefaultSwitch(row)"
          >
            {{ t('role.actions.setDefault') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>
  <AppDialog
    v-model="dialogVisible"
    class="add-box dialog-box"
    :width="isMobile ? '94vw' : '1040px'"
    :height="isMobile ? '72vh' : 'min(72vh, 720px)'"
  >
    <template #header>
      {{ dialogMode === 'edit' ? t('common.actions.edit') : t('common.actions.add') }}
    </template>
    <div class="content-box">
      <el-form
        :ref="setFormRef"
        :model="form"
        :rules="rules"
        label-width="auto"
      >
        <el-form-item
          :label="t('role.table.name')"
          prop="name"
          required
        >
          <el-input
            v-model="form.name"
            clearable
            style="width:100%"
          />
        </el-form-item>
        <el-form-item :label="t('role.form.permission')">
          <div class="role-permission-editor">
            <div class="role-permission-editor__toolbar">
              <el-tabs
                v-model="activePlatform"
                class="role-permission-editor__tabs"
              >
                <el-tab-pane
                  v-for="item in platformOptions"
                  :key="item.value"
                  :label="item.label"
                  :name="item.value"
                />
              </el-tabs>
              <el-space>
                <el-button @click="selectAllPermissions">
                  {{ t('common.actions.selectAll') }}
                </el-button>
                <el-button @click="clearCurrentPlatformPermissions">
                  {{ t('role.permissionMatrix.clearPlatform') }}
                </el-button>
              </el-space>
            </div>
            <RolePermissionMatrix
              v-model="form.permission_id"
              :groups="matrixGroups"
              :empty-text="t('common.noData')"
              :page-label="t('permission.table.name')"
              :action-label="t('role.form.permission')"
              :page-access-label="t('role.permissionMatrix.pageAccess')"
              :group-select-label="t('common.actions.selectAll')"
              :group-clear-label="t('role.permissionMatrix.clearGroup')"
              :selected-count-label="t('role.permissionMatrix.selected')"
              :page-count-label="t('role.permissionMatrix.pages')"
              :action-count-label="t('role.permissionMatrix.actions')"
              :empty-actions-text="t('role.permissionMatrix.emptyActions')"
              :helper-text="t('role.permissionMatrix.helper')"
              :group-expand-label="t('common.actions.expand')"
              :group-collapse-label="t('common.actions.collapse')"
            />
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer"><el-button @click="dialogVisible=false">{{
        t('common.actions.cancel')
      }}</el-button><el-button
        type="primary"
        @click="confirmSubmit"
      >{{ t('common.actions.confirm') }}</el-button></span>
    </template>
  </AppDialog>
  <RolePermissionDiffDialog
    v-model="diffDialogVisible"
    :title="t('common.confirmTitle')"
    :added-title="diffAddedTitle"
    :removed-title="diffRemovedTitle"
    :added-labels="addedPermissionLabels"
    :removed-labels="removedPermissionLabels"
    :empty-text="t('common.noData')"
    :cancel-text="t('common.actions.cancel')"
    :confirm-text="t('common.actions.confirm')"
    @confirm="submitRole"
  />
</template>
<style scoped src="./styles.css"></style>
