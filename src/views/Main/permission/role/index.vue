<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { SearchField } from '@/components/Search/types'
import { AppDialog } from '@/components/AppDialog'
import {
  RoleApi,
  type RoleAddPayload,
  type RoleEditPayload,
  type RoleInitResponse,
  type RoleListItem,
  type RoleListParams,
} from '@/api/permission/role'
import { Search } from '@/components/Search'
import { AppTable } from '@/components/Table'
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum, PermissionTypeEnum, PlatformEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import RolePermissionMatrix from './components/RolePermissionMatrix.vue'
import RolePermissionDiffDialog from './components/RolePermissionDiffDialog.vue'
import { buildRolePermissionMatrix, diffPermissionIds } from './role-matrix'

const userStore = useUserStore()
const { t } = useI18n()

interface RoleForm {
  id: number | ''
  name: string
  permission_id: number[]
}

const permissionTree = ref<RoleInitResponse['dict']['permission_tree']>([])
const platformOptions = ref<RoleInitResponse['dict']['permission_platform_arr']>([])
const activePlatform = ref<string>(PlatformEnum.ADMIN)
const originalPermissionIds = ref<number[]>([])

const matrixRows = computed(() => buildRolePermissionMatrix(permissionTree.value, activePlatform.value))
const currentPlatformActionIds = computed(() => matrixRows.value.flatMap((row) => row.actions.map((action) => action.id)))
const permissionLabelMap = computed(() => {
  const map = new Map<number, string>()
  const walk = (nodes: RoleInitResponse['dict']['permission_tree']) => {
    for (const node of nodes) {
      if (node.type === PermissionTypeEnum.BUTTON) {
        map.set(node.value, node.label)
      }
      if (node.children?.length) {
        walk(node.children)
      }
    }
  }

  walk(permissionTree.value)

  return map
})

const init = async () => {
  const data = await RoleApi.init()
  permissionTree.value = data.dict.permission_tree
  platformOptions.value = data.dict.permission_platform_arr
  if (!platformOptions.value.some((item) => item.value === activePlatform.value)) {
    activePlatform.value = platformOptions.value[0]?.value ?? PlatformEnum.ADMIN
  }
}

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref<RoleForm>({ id: '', name: '', permission_id: [] })
const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('role.table.name') + t('common.required'), trigger: 'blur' }]
}))

const add = () => {
  dialogMode.value = 'add'
  form.value = { id: '', name: '', permission_id: [] }
  originalPermissionIds.value = []
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const searchForm = ref<Pick<RoleListParams, 'name'>>({ name: '' })

const {
  loading: listLoading,
  data: listData,
  page,

  onSearch,
  onPageChange,
  refresh,
  getList,
  onSelectionChange,
  confirmDel,
  batchDel
} = useCrudTable<RoleListItem, RoleListParams>({
  api: RoleApi,
  searchForm,
  initPage: { page_size: 50 },
})

const columns = [
  { key: 'name', label: t('role.table.name') },
  { key: 'is_default', label: t('role.table.is_default'), width: 120 },
  { key: 'created_at', label: t('role.table.created_at') },
  { key: 'updated_at', label: t('role.table.updated_at') },
  { key: 'actions', label: t('common.actions.action'), width: 300 },
]

const edit = (current: RoleListItem) => {
  dialogMode.value = 'edit'
  const permissionIds = [...current.permission_id].sort((a, b) => a - b)
  form.value = { id: current.id, name: current.name, permission_id: permissionIds }
  originalPermissionIds.value = permissionIds
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const diffDialogVisible = ref(false)
const permissionDiff = ref<{ added: number[]; removed: number[] }>({ added: [], removed: [] })
const addedPermissionLabels = computed(() => permissionDiff.value.added.map((id) => permissionLabelMap.value.get(id) ?? `#${id}`))
const removedPermissionLabels = computed(() => permissionDiff.value.removed.map((id) => permissionLabelMap.value.get(id) ?? `#${id}`))
const diffAddedTitle = computed(() => `${t('common.actions.add')}${t('role.form.permission')}`)
const diffRemovedTitle = computed(() => `${t('common.actions.del')}${t('role.form.permission')}`)

const submitRole = async () => {
  const addPayload: RoleAddPayload = { name: form.value.name, permission_id: form.value.permission_id }
  const editPayload: RoleEditPayload = { id: Number(form.value.id), name: form.value.name, permission_id: form.value.permission_id }

  if (dialogMode.value === 'add') {
    await RoleApi.add(addPayload)
  } else {
    await RoleApi.edit(editPayload)
  }

  ElNotification.success({ message: t('common.success.operation') })
  diffDialogVisible.value = false
  dialogVisible.value = false
  void getList()
}

const confirmSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  permissionDiff.value = diffPermissionIds(originalPermissionIds.value, form.value.permission_id)
  if (permissionDiff.value.added.length === 0 && permissionDiff.value.removed.length === 0) {
    await submitRole()
    return
  }

  diffDialogVisible.value = true
}

const handleDefaultSwitch = async (current: Pick<RoleListItem, 'id'>) => {
  try {
    await ElMessageBox.confirm(
      t('role.confirmSetDefault'),
      t('common.confirmTitle'),
      { type: 'warning', confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel') },
    )
  } catch {
    return
  }

  await RoleApi.default({ id: current.id })
  ElNotification.success({ message: t('common.success.operation') })
  void getList()
}

const selectAllPermissions = () => {
  form.value.permission_id = Array.from(new Set([
    ...form.value.permission_id,
    ...currentPlatformActionIds.value,
  ])).sort((a, b) => a - b)
}

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('role.filter.name'), placeholder: t('role.filter.name'), width: 150 },
])
const isMobile = useIsMobile()
onMounted(() => {
  void init()
  void getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>
    <div class="table">
      <AppTable :columns="columns" :data="listData" :loading="listLoading" row-key="id" :pagination="page" selectable
                :show-index="true"
                @refresh="refresh" @update:pagination="onPageChange" @selection-change="onSelectionChange">
        <template #toolbar-left>
          <el-button v-if="userStore.can('permission_role_add')" type="success" @click="add">{{
              t('common.actions.add')
            }}
          </el-button>
          <el-dropdown>
            <el-button type="primary">{{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('permission_role_del')">{{
                    t('common.actions.batchDelete')
                  }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-is_default="{ row }">
          <el-tag type="success" v-if="row.is_default === CommonEnum.YES">{{ t('role.table.is_default') }}</el-tag>
          <span v-else></span>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" @click="edit(row)" text v-if="userStore.can('permission_role_edit')">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text v-if="userStore.can('permission_role_del')" @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
          <el-button type="success" text @click="handleDefaultSwitch(row)"
                     v-if="userStore.can('permission_role_setDefault') && row.is_default !== CommonEnum.YES">{{ t('role.actions.setDefault') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>
  <AppDialog v-model="dialogVisible" class="add-box dialog-box" :width="isMobile ? '94vw' : '900px'">
    <template #header>{{ dialogMode === 'edit' ? t('common.actions.edit') : t('common.actions.add') }}</template>
    <div class="content-box">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
        <el-form-item :label="t('role.table.name')" prop="name" required>
          <el-input v-model="form.name" clearable style="width:100%"/>
        </el-form-item>
        <el-form-item :label="t('role.form.permission')">
          <div class="role-permission-editor">
            <div class="role-permission-editor__toolbar">
              <el-tabs v-model="activePlatform" class="role-permission-editor__tabs">
                <el-tab-pane
                  v-for="item in platformOptions"
                  :key="item.value"
                  :label="item.label"
                  :name="item.value"
                />
              </el-tabs>
              <el-button @click="selectAllPermissions">{{ t('common.actions.selectAll') }}</el-button>
            </div>
            <RolePermissionMatrix
              v-model="form.permission_id"
              :rows="matrixRows"
              :empty-text="t('common.noData')"
              :page-label="t('permission.table.name')"
              :action-label="t('role.form.permission')"
            />
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="dialogVisible=false">{{
        t('common.actions.cancel')
      }}</el-button><el-button
        type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button></span></template>
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
<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto
}

.role-permission-editor {
  width: 100%;
}

.role-permission-editor__toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 10px;
}

.role-permission-editor__tabs {
  flex: 1;
  min-width: 0;
}

.fenye {
  flex: 0 0 auto;
  margin-left: 30%;
  margin-top: 10px
}
</style>
