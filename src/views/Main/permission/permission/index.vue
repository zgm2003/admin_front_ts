<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useIsMobile} from '@/hooks/useResponsive'
import {PermissionApi} from '@/api/permission/permission'
import IconSelect from '@/components/IconSelect'
import {Search} from '@/components/Search'
import {ElNotification, ElMessageBox} from 'element-plus'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import type { SearchField } from '@/components/Search/types'
import { CommonEnum, PermissionTypeEnum } from '@/enums'
import {ArrowRight, ArrowDown, ArrowUp} from "@element-plus/icons-vue"
import { DynamicIcon } from '@/components/DynamicIcon'

const userStore = useUserStore()
const {t} = useI18n()

const permissionTree = ref<any[]>([])
const permissionTypeArr = ref<{ value: number | string; label: string }[]>([])
const init = () => {
  PermissionApi.init().then((data: any) => {
    permissionTree.value = data.dict.permission_tree;
    permissionTypeArr.value = data.dict.permission_type_arr
  }).catch(() => {
  })
}
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref<{
  id: string
  name: string
  parent_id: string
  icon: string
  path: string
  component: string
  type: number | string
  code: string
  i18n_key: string
  sort: number
  show_menu: number
}>({
  id: '',
  name: '',
  parent_id: '',
  icon: '',
  path: '',
  component: '',
  type: '',
  code: '',
  i18n_key: '',
  sort: 1,
  show_menu: 1
})
const add = () => {
  dialogMode.value = 'add'
  form.value = {
    id: '',
    name: '',
    parent_id: '',
    icon: '',
    path: '',
    component: '',
    type: '',
    code: '',
    i18n_key: '',
    sort: 1,
    show_menu: 1
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}
const addChild = (current: any) => {
  dialogMode.value = 'add'
  const nextType = Math.min(3, Number(current.type || 1) + 1)
  form.value = {
    id: '',
    name: '',
    parent_id: current.id,
    icon: '',
    path: '',
    component: '',
    type: nextType,
    code: '',
    i18n_key: '',
    sort: 1,
    show_menu: 1
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}
const listLoading = ref(false)
const listData = ref([])
const searchForm = ref({name: ''})
const getList = () => {
  listLoading.value = true;
  const param = searchForm.value;
  PermissionApi.list(param).then((data: any) => {
    listData.value = data
  }).finally(() => {
    listLoading.value = false
  })
}

const onSearch = () => {
  getList()
}
const tableRef = ref()
const isExpanded = ref(true)
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  const rows = listData.value
  const expandRows = (data: any[]) => {
    data.forEach((row: any) => {
      tableRef.value?.toggleRowExpansion(row, isExpanded.value)
      if (row.children?.length) expandRows(row.children)
    })
  }
  expandRows(rows)
}
const handleRowClick = (row: any) => {
  (tableRef.value as any).toggleRowSelection(row)
}
const edit = (current: any) => {
  dialogMode.value = 'edit'
  form.value = {
    id: current.id,
    name: current.name,
    parent_id: current.parent_id,
    icon: current.icon,
    path: current.path,
    component: current.component,
    type: current.type,
    code: current.code,
    i18n_key: current.i18n_key,
    sort: current.sort,
    show_menu: current.show_menu
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}
const formRef = ref<any>(null)
const isMenuType = computed(() => form.value.type === PermissionTypeEnum.DIR || form.value.type === PermissionTypeEnum.PAGE)
const rules = computed(() => ({
  type: [{required: true, message: '请选择类型', trigger: 'change'}],
  name: [{required: true, message: '请输入名称', trigger: 'blur'}],
  i18n_key: isMenuType.value ? [{
    required: true,
    message: '请输入 i18n_key',
    trigger: 'blur'
  }] : [],
  show_menu: isMenuType.value ? [{
    required: true,
    message: '请选择是否显示',
    trigger: 'change'
  }] : [],
  code: (form.value.type === PermissionTypeEnum.BUTTON) ? [{required: true, message: '请输入 code', trigger: 'blur'}] : []
}))
const confirmSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const payload = form.value
  const api = dialogMode.value === 'add' ? PermissionApi.add : PermissionApi.edit
  api(payload).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    dialogVisible.value = false
    getList();
    init()
  }).catch(() => {
  })
}
const confirmDel = async (current: any) => {
  try {
    await ElMessageBox.confirm(
        t('common.confirmDelete'),
        t('common.confirmTitle'),
        {type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel')}
    )
  } catch {
    return
  }
  const param = {id: current.id}
  PermissionApi.del(param).then(() => {
    ElNotification.success({message: t('common.success.operation')});
    getList();
    init()
  }).catch(() => {
  })
}
const selectedIds = ref([] as any[])
const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item: any) => item.id)
}
const batchDel = async () => {
  if (!selectedIds.value || selectedIds.value.length === 0) {
    ElNotification.error({message: t('common.selectAtLeastOne')});
    return
  }
  try {
    await ElMessageBox.confirm(
        t('common.confirmBatchDelete'),
        t('common.confirmTitle'),
        {type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel')}
    )
  } catch {
    return
  }
  const param = {id: selectedIds.value}
  PermissionApi.del(param).then(() => {
    ElNotification.success({message: t('common.success.operation')});
    getList()
  }).catch(() => {
  })
}
const iconSelectRef = ref<any>(null)
const openIconSelect = () => {
  iconSelectRef.value.show()
}
const confirmIcon = (iconName: string) => {
  form.value.icon = iconName
}
const changeStatus = async (row: any) => {
  if (!row || !row.id) return
  try {
    await ElMessageBox.confirm(
        t('common.confirmStatusChange'),
        t('common.confirmTitle'),
        {type: 'warning', confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel')}
    )
  } catch {
    row.status = row.status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES // revert
    return
  }
  PermissionApi.status({id: row.id, status: row.status}).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    // 权限列表通常不需要全量刷新，避免树折叠
  }).catch(() => {
    row.status = row.status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES // revert
  })
}
const searchFields = computed<SearchField[]>(() => [
  {key: 'name', type: 'input', label: t('permission.filter.name'), placeholder: t('permission.filter.name'), width: 150}
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
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      <el-button v-if="userStore.can('permission_permission_add')" type="success" @click="add">{{
          t('common.actions.add')
        }}
      </el-button>
      <el-dropdown>
        <el-button type="primary">{{ t('common.actions.batchDelete') }}
          <el-icon class="el-icon--right">
            <arrow-right/>
          </el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="batchDel" v-if="userStore.can('permission_permission_del')">
              {{ t('common.actions.batchDelete') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-button @click="toggleExpand" :icon="isExpanded ? ArrowUp : ArrowDown" type="danger">
        {{ isExpanded ? t('common.actions.collapseAll') : t('common.actions.expandAll') }}
      </el-button>
    </div>
    <div class="table">
      <el-table :data="listData" style="width:100%" v-loading="listLoading" @selection-change="handleSelectionChange"
                ref="tableRef" @row-click="handleRowClick" row-key="id" border default-expand-all>
        <el-table-column type="selection" width="55"/>
        <el-table-column prop="id" width="150" :label="t('permission.table.id')"/>
        <el-table-column prop="name" :label="t('permission.table.name')" align="center"/>
        <el-table-column :label="t('permission.table.icon')" align="center" width="80">
          <template #default="scope">
            <DynamicIcon v-if="scope.row.icon" :icon="scope.row.icon" :size="24" />
          </template>
        </el-table-column>
        <!--        <el-table-column prop="path" :label="t('permission.table.path')" align="center"/>-->
        <!--        <el-table-column prop="component" :label="t('permission.table.component')" align="center"/>-->
        <el-table-column :label="t('permission.table.status')" align="center">
          <template #default="scope">
            <el-switch
                v-model="scope.row.status"
                :active-value="CommonEnum.YES"
                :inactive-value="CommonEnum.NO"
                :disabled="!userStore.can('permission_permission_status')"
                @change="changeStatus(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="sort" :label="t('permission.table.sort')" align="center" width="90"/>
        <el-table-column :label="t('permission.table.type')" align="center">
          <template #default="scope">
            <el-tag effect="dark" v-if="scope.row.type === PermissionTypeEnum.DIR" type="success">{{ scope.row.type_name }}</el-tag>
            <el-tag effect="dark" v-if="scope.row.type === PermissionTypeEnum.PAGE" type="primary">{{ scope.row.type_name }}</el-tag>
            <el-tag effect="dark" v-if="scope.row.type === PermissionTypeEnum.BUTTON" type="danger">{{ scope.row.type_name }}</el-tag>
          </template>
        </el-table-column>
        <!--        <el-table-column :label="t('permission.table.code')" align="center" prop="code"/>-->
        <!--        <el-table-column :label="t('permission.table.i18n_key')" align="center" prop="i18n_key"/>-->
        <el-table-column :label="t('permission.table.actions')" align="center" min-width="180" fixed="right"
                         header-align="center">
          <template #default="scope">
            <el-button type="success" @click="addChild(scope.row)" text
                       v-if="userStore.can('permission_permission_add') && scope.row.type !== PermissionTypeEnum.BUTTON">新增
            </el-button>
            <el-button type="primary" @click="edit(scope.row)" text v-if="userStore.can('permission_permission_edit')">编辑
            </el-button>
            <el-button type="danger" text v-if="userStore.can('permission_permission_del')" @click="confirmDel(scope.row)">删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" class="add-box dialog-box" :width="isMobile ? '94vw' : '800px'"
             :title="dialogMode==='add' ? t('common.actions.add') : t('common.actions.edit')" draggable destroy-on-close>
    <div class="content-box">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
        <el-form-item :label="t('permission.form.type')" prop="type" required>
          <el-radio-group v-model="form.type">
            <el-radio :value="item.value" border v-for="(item,index) in permissionTypeArr" :key="index">{{
                item.label
              }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('permission.form.parent_id')">
          <el-tree-select v-model="form.parent_id" :data="permissionTree" show-checkbox clearable check-strictly=true
                          :render-after-expand="false"/>
        </el-form-item>
        <el-form-item :label="t('permission.form.name')" prop="name" required>
          <el-input v-model="form.name" style="width:100%" clearable :placeholder="t('permission.form.placeholder.name')"/>
        </el-form-item>
        <el-form-item :label="t('permission.form.i18n_key')" prop="i18n_key" required v-if="isMenuType">
          <el-input v-model="form.i18n_key" style="width:100%" clearable :placeholder="t('permission.form.placeholder.i18n_key')"/>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            {{ t('permission.form.help.i18n_key') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('permission.form.show_menu')" prop="show_menu" required v-if="isMenuType">
          <el-radio-group v-model="form.show_menu">
            <el-radio :value="CommonEnum.YES" border>{{ t('common.status.show') }}</el-radio>
            <el-radio :value="CommonEnum.NO" border>{{ t('common.status.hide') }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('permission.form.sort')" prop="sort" required>
          <el-input-number v-model="form.sort" :min="1" :max="1000" :step="1"/>
        </el-form-item>
        <el-form-item :label="t('permission.form.icon')" v-if="isMenuType">
          <el-input v-model="form.icon" style="width:80%" clearable/>
          <el-button icon="Setting" @click="openIconSelect">{{ t('common.actions.edit') }}</el-button>
        </el-form-item>
        <el-form-item :label="t('permission.form.path')" v-if="form.type === PermissionTypeEnum.PAGE">
          <el-input v-model="form.path" style="width:100%" clearable :placeholder="t('permission.form.placeholder.path')"/>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            {{ t('permission.form.help.path') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('permission.form.component')" v-if="form.type === PermissionTypeEnum.PAGE">
          <el-input v-model="form.component" style="width:100%" clearable :rows="5" :placeholder="t('permission.form.placeholder.component')"/>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            {{ t('permission.form.help.component') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('permission.form.code')" prop="code" required v-if="form.type === PermissionTypeEnum.BUTTON">
          <el-input v-model="form.code" style="width:100%" clearable :placeholder="t('permission.form.placeholder.code')"/>
          <div style="color: #909399; font-size: 12px; margin-top: 4px;">
            命名规范：一级菜单_二级菜单_操作，如 user_userManager_edit、permission_permission_del
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="dialogVisible=false">{{ t('common.actions.cancel') }}</el-button><el-button
        type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button></span></template>
  </el-dialog>
  <icon-select @select-icon="confirmIcon" ref="iconSelectRef"/>
</template>
<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-weight: 600;
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto
}
</style>
