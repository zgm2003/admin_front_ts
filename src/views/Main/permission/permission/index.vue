<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules, TableInstance } from 'element-plus'
import { ArrowDown, ArrowUp, Setting } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import type { SearchField } from '@/components/Search/types'
import {
  PermissionApi,
  type PermissionInitResponse,
  type PermissionListItem,
  type PermissionListParams,
  type PermissionMutationPayload,
  type PermissionTreeNode,
} from '@/api/permission/permission'
import { Search } from '@/components/Search'
import { AppDialog } from '@/components/AppDialog'
import { DIcon } from '@/components/DIcon'
import { CommonEnum, PermissionTypeEnum, PlatformEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import IconSelect from './components/IconSelect.vue'

const userStore = useUserStore()
const { t } = useI18n()
const PERMISSION_PAGE_PLATFORM = PlatformEnum.ADMIN

interface PermissionForm {
  id: number | ''
  name: string
  parent_id: number | ''
  icon: string
  path: string
  component: string
  type: number
  code: string
  i18n_key: string
  sort: number
  show_menu: number
  platform: string
}

interface IconSelectExposed {
  show: () => void
}

const permissionTree = ref<PermissionInitResponse['dict']['permission_tree']>([])
const permissionTypeArr = ref<PermissionInitResponse['dict']['permission_type_arr']>([])

const createDefaultForm = (platform: string): PermissionForm => ({
  id: '',
  name: '',
  parent_id: '',
  icon: '',
  path: '',
  component: '',
  type: PermissionTypeEnum.DIR,
  code: '',
  i18n_key: '',
  sort: 1,
  show_menu: CommonEnum.YES,
  platform,
})

// 按平台过滤权限树（用于父级菜单选择）
const filterTreeByPlatform = (tree: PermissionTreeNode[], platform: string): PermissionTreeNode[] => {
  return tree
    .filter((node) => node.platform === platform)
    .map((node) => ({
      ...node,
      children: node.children ? filterTreeByPlatform(node.children, platform) : [],
    }))
}

const filteredPermissionTree = computed(() => filterTreeByPlatform(permissionTree.value, PERMISSION_PAGE_PLATFORM))

const init = () => {
  PermissionApi.init().then((data) => {
    permissionTree.value = data.dict.permission_tree
    permissionTypeArr.value = data.dict.permission_type_arr
  }).catch(() => {
  })
}

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref<PermissionForm>(createDefaultForm(PERMISSION_PAGE_PLATFORM))

const add = () => {
  dialogMode.value = 'add'
  form.value = createDefaultForm(PERMISSION_PAGE_PLATFORM)
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const addChild = (current: PermissionListItem) => {
  dialogMode.value = 'add'
  const nextType = Math.min(PermissionTypeEnum.BUTTON, current.type + 1)
  form.value = {
    ...createDefaultForm(PERMISSION_PAGE_PLATFORM),
    parent_id: current.id,
    type: nextType,
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const listLoading = ref(false)
const listData = ref<PermissionListItem[]>([])
const filteredTypeArr = computed(() => permissionTypeArr.value)
const searchForm = ref<Pick<PermissionListParams, 'name'>>({ name: '' })

const getList = () => {
  listLoading.value = true
  const param: PermissionListParams = { ...searchForm.value, platform: PERMISSION_PAGE_PLATFORM }
  PermissionApi.list(param).then((data) => {
    listData.value = data
  }).finally(() => {
    listLoading.value = false
  })
}

const onSearch = () => {
  getList()
}

const tableRef = ref<TableInstance | null>(null)
const isExpanded = ref(false)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  const expandRows = (rows: PermissionListItem[]) => {
    rows.forEach((row) => {
      tableRef.value?.toggleRowExpansion(row, isExpanded.value)
      if (row.children?.length) expandRows(row.children)
    })
  }
  expandRows(listData.value)
}

const handleRowClick = (row: PermissionListItem) => {
  tableRef.value?.toggleRowSelection(row)
}

const edit = (current: PermissionListItem) => {
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
    show_menu: current.show_menu,
    platform: PERMISSION_PAGE_PLATFORM,
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const formRef = ref<FormInstance | null>(null)
const isMenuType = computed(() => form.value.type === PermissionTypeEnum.DIR || form.value.type === PermissionTypeEnum.PAGE)
const rules = computed<FormRules>(() => ({
  type: [{ required: true, message: t('permission.form.rule.type'), trigger: 'change' }],
  name: [{ required: true, message: t('permission.form.rule.name'), trigger: 'blur' }],
  i18n_key: isMenuType.value ? [{
    required: true,
    message: t('permission.form.rule.i18n_key'),
    trigger: 'blur',
  }] : [],
  show_menu: isMenuType.value ? [{
    required: true,
    message: t('permission.form.rule.show_menu'),
    trigger: 'change',
  }] : [],
  code: form.value.type === PermissionTypeEnum.BUTTON ? [{ required: true, message: t('permission.form.rule.code'), trigger: 'blur' }] : [],
  path: form.value.type === PermissionTypeEnum.PAGE ? [{ required: true, message: t('permission.form.rule.path'), trigger: 'blur' }] : [],
  component: form.value.type === PermissionTypeEnum.PAGE ? [{ required: true, message: t('permission.form.rule.component'), trigger: 'blur' }] : [],
}))

const confirmSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const payload: PermissionMutationPayload = {
    name: form.value.name,
    parent_id: form.value.parent_id,
    icon: form.value.icon,
    path: form.value.path,
    component: form.value.component,
    type: form.value.type,
    code: form.value.code,
    i18n_key: form.value.i18n_key,
    sort: form.value.sort,
    show_menu: form.value.show_menu,
    platform: form.value.platform,
  }
  if (dialogMode.value === 'edit') {
    payload.id = Number(form.value.id)
  }

  const api = dialogMode.value === 'add' ? PermissionApi.add : PermissionApi.edit
  api(payload).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    getList()
    init()
  }).catch(() => {
  })
}

const selectedIds = ref<Array<PermissionListItem['id']>>([])
const handleSelectionChange = (selection: PermissionListItem[]) => {
  selectedIds.value = selection.map((item) => item.id)
}

const batchDel = async () => {
  if (selectedIds.value.length === 0) {
    ElNotification.error({ message: t('common.selectAtLeastOne') })
    return
  }
  try {
    await ElMessageBox.confirm(
      t('common.confirmBatchDelete'),
      t('common.confirmTitle'),
      { type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel') },
    )
  } catch {
    return
  }
  const param = { id: selectedIds.value }
  PermissionApi.del(param).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    getList()
  }).catch(() => {
  })
}

const iconSelectRef = ref<IconSelectExposed | null>(null)
const openIconSelect = () => {
  iconSelectRef.value?.show()
}

const confirmIcon = (iconName: string) => {
  form.value.icon = iconName
}

const toggleStatusValue = (status: number) => (status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES)

const changeStatus = async (row: PermissionListItem) => {
  try {
    await ElMessageBox.confirm(
      t('common.confirmStatusChange'),
      t('common.confirmTitle'),
      { type: 'warning', confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel') },
    )
  } catch {
    row.status = toggleStatusValue(row.status)
    return
  }
  PermissionApi.status({ id: row.id, status: row.status }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    // 权限列表通常不需要全量刷新，避免树折叠
  }).catch(() => {
    row.status = toggleStatusValue(row.status)
  })
}

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('permission.filter.name'), placeholder: t('permission.filter.name'), width: 150 },
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
      <el-button v-if="userStore.can('permission_permission_del')" type="danger" @click="batchDel">{{
          t('common.actions.batchDelete')
        }}
      </el-button>
      <el-button @click="toggleExpand" :icon="isExpanded ? ArrowUp : ArrowDown" type="primary">
        {{ isExpanded ? t('common.actions.collapseAll') : t('common.actions.expandAll') }}
      </el-button>
    </div>
    <div class="table">
      <el-table :data="listData" style="width:100%" v-loading="listLoading" @selection-change="handleSelectionChange"
                ref="tableRef" @row-click="handleRowClick" row-key="id" border>
        <el-table-column type="selection" width="55"/>
        <el-table-column prop="id" width="150" :label="t('permission.table.id')"/>
        <el-table-column prop="name" :label="t('permission.table.name')" align="center"/>
        <el-table-column :label="t('permission.table.icon')" align="center" width="80">
          <template #default="scope">
            <DIcon v-if="scope.row.icon" :icon="scope.row.icon" :size="24" />
          </template>
        </el-table-column>
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
        <el-table-column :label="t('permission.table.actions')" align="center" min-width="180" fixed="right"
                         header-align="center">
          <template #default="scope">
            <el-button type="success" @click="addChild(scope.row)" text
                       v-if="userStore.can('permission_permission_add') && scope.row.type !== PermissionTypeEnum.BUTTON">{{ t('common.actions.add') }}
            </el-button>
            <el-button type="primary" @click="edit(scope.row)" text v-if="userStore.can('permission_permission_edit')">{{ t('common.actions.edit') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
  <AppDialog v-model="dialogVisible" class="add-box dialog-box" :width="isMobile ? '94vw' : '800px'"
             :title="dialogMode==='add' ? t('common.actions.add') : t('common.actions.edit')" draggable destroy-on-close>
    <div class="content-box">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
        <el-form-item :label="t('permission.form.type')" prop="type" required>
          <el-radio-group v-model="form.type">
            <el-radio :value="item.value" border v-for="(item,index) in filteredTypeArr" :key="index">{{
                item.label
              }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('permission.form.parent_id')">
          <el-tree-select v-model="form.parent_id" :data="filteredPermissionTree" clearable :check-strictly="true"
                          :render-after-expand="false"/>
        </el-form-item>
        <el-form-item :label="t('permission.form.name')" prop="name" required>
          <el-input v-model="form.name" style="width:100%" clearable :placeholder="t('permission.form.placeholder.name')"/>
        </el-form-item>
        <el-form-item :label="t('permission.form.i18n_key')" prop="i18n_key" required v-if="isMenuType">
          <el-input v-model="form.i18n_key" style="width:100%" clearable :placeholder="t('permission.form.placeholder.i18n_key')"/>
          <div class="form-help-text">
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
          <el-button :icon="Setting" @click="openIconSelect">{{ t('common.actions.edit') }}</el-button>
        </el-form-item>
        <el-form-item :label="t('permission.form.path')" prop="path" required v-if="form.type === PermissionTypeEnum.PAGE">
          <el-input v-model="form.path" style="width:100%" clearable :placeholder="t('permission.form.placeholder.path')"/>
          <div class="form-help-text">
            {{ t('permission.form.help.path') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('permission.form.component')" prop="component" required v-if="form.type === PermissionTypeEnum.PAGE">
          <el-input v-model="form.component" style="width:100%" clearable :rows="5" :placeholder="t('permission.form.placeholder.component')"/>
          <div class="form-help-text">
            {{ t('permission.form.help.component') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('permission.form.code')" prop="code" required v-if="form.type === PermissionTypeEnum.BUTTON">
          <el-input v-model="form.code" style="width:100%" clearable :placeholder="t('permission.form.placeholder.code')"/>
          <div class="form-help-text">
            {{ t('permission.form.codeHint') }}
          </div>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="dialogVisible=false">{{ t('common.actions.cancel') }}</el-button><el-button
        type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button></span></template>
  </AppDialog>
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

.form-help-text {
  width: 100%;
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
</style>
