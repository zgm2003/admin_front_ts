<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useIsMobile} from '@/hooks/useResponsive'
import {RoleApi} from '@/api/permission/role'
import {ElNotification, ElMessageBox} from 'element-plus'
import type {FormInstance, FormRules} from 'element-plus'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import {useTable} from '@/hooks/useTable'
import { CommonEnum } from '@/enums'

const userStore = useUserStore()
const {t} = useI18n()
const PermissionTree = ref([])
const init = () => {
  RoleApi.init().then((data: any) => {
    PermissionTree.value = data.dict.permission_tree
  }).catch(() => {
  })
}
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref({id: '', name: '', permission_id: ''})
const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('role.table.name') + t('common.required'), trigger: 'blur' }]
}))

const add = () => {
  dialogMode.value = 'add'
  form.value = {id: '', name: '', permission_id: ''}
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const searchForm = ref({name: '', path: '', permission: ''})

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
} = useTable({
  api: RoleApi,
  searchForm,
  initPage: { page_size: 50 }
})

const columns = [
  {key: 'name', label: t('role.table.name')},
  {key: 'is_default', label: t('role.table.is_default'), width: 120},
  {key: 'created_at', label: t('role.table.created_at')},
  {key: 'updated_at', label: t('role.table.updated_at')},
  {key: 'actions', label: t('common.actions.action'), width: 300}
]
const edit = (current: any) => {
  dialogMode.value = 'edit'
  form.value = {id: current.id, name: current.name, permission_id: current.permission_id}
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}
const confirmSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  
  const api = dialogMode.value === 'add' ? RoleApi.add : RoleApi.edit
  api(form.value).then(() => {
    ElNotification.success({message: t('common.success.operation')});
    dialogVisible.value = false;
    getList()
  })
}
const handleDefaultSwitch = async (current: any) => {
  try {
    await ElMessageBox.confirm(
        t('role.confirmSetDefault'),
        t('common.confirmTitle'),
        {type: 'warning', confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel')}
    )
  } catch {
    return
  }
  const param = {id: current.id}
  RoleApi.default(param).then(() => {
    ElNotification.success({message: t('common.success.operation')});
    getList();
  }).catch(() => {
  })
}
const props = {multiple: true, emitPath: false, checkStrictly: true}

// 获取权限树所有叶子节点ID
const getLeafIds = (nodes: any[]): any[] => {
  const ids: any[] = []
  const traverse = (items: any[]) => {
    for (const item of items) {
      if (item.children?.length) {
        traverse(item.children)
      } else {
        ids.push(item.value)
      }
    }
  }
  traverse(nodes)
  return ids
}

// 全选权限
const selectAllPermissions = () => {
  const allIds = getLeafIds(PermissionTree.value)
  form.value.permission_id = allIds as any
}

const searchFields = computed<SearchField[]>(() => [
  {key: 'name', type: 'input', label: t('role.filter.name'), placeholder: t('role.filter.name'), width: 150}
])
const isMobile = useIsMobile()
onMounted(() => {
  init()
  getList()
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
                <arrow-right/>
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
  <el-dialog v-model="dialogVisible" class="add-box dialog-box" :width="isMobile ? '94vw' : '900px'">
    <template #header>{{ dialogMode === 'edit' ? t('common.actions.edit') : t('common.actions.add') }}</template>
    <div class="content-box">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
        <el-form-item :label="t('role.table.name')" prop="name" required>
          <el-input v-model="form.name" clearable style="width:100%"/>
        </el-form-item>
        <el-form-item :label="t('role.form.permission')">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-cascader :options="PermissionTree" :props="props" v-model="form.permission_id" clearable
                         filterable placeholder="请选择权限" collapse-tags
                         style="flex: 1"/>
            <el-button @click="selectAllPermissions">{{ t('common.actions.selectAll') }}</el-button>
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="dialogVisible=false">{{
        t('common.actions.cancel')
      }}</el-button><el-button
        type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button></span></template>
  </el-dialog>
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

.fenye {
  flex: 0 0 auto;
  margin-left: 30%;
  margin-top: 10px
}
</style>
