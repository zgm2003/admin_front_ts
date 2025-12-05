<script setup lang="ts">
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {addApi, delApi, editApi, listApi, initApi, batchEditApi, statusApi} from '@/api/user/permission'
import IconSelect from '@/components/IconSelect'
import {ElNotification, ElMessageBox} from 'element-plus'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'

const userStore = useUserStore()
const {t} = useI18n()
const router = useRouter()
const permissionTree = ref([])
const permissionTypeArr = ref([])
const init = () => {
  initApi().then((data: any) => {
    permissionTree.value = data.dict.permission_tree;
    permissionTypeArr.value = data.dict.permission_type_arr
  }).catch(() => {
  })
}
init()
const addBoxShow = ref(false)
const addForm = ref({
  name: '',
  parent_id: '',
  icon: '',
  path: '',
  component: '',
  actions: [],
  type: '',
  code: '',
  i18n_key: ''
})
const add = () => {
  addForm.value = {name: '', parent_id: '', icon: '', path: '', component: '', actions: [], type: '', code: ''};
  addBoxShow.value = true
}
const confirmAdd = () => {
  const param = addForm.value;
  addApi(param).then(() => {
    ElNotification.success({message: '新增成功'});
    addBoxShow.value = false;
    getList();
    init()
  }).catch(() => {
  })
}
const listLoading = ref(false)
const listData = ref([])
const searchForm = ref({name: ''})
const getList = () => {
  listLoading.value = true;
  const param = searchForm.value;
  listApi(param).then((data: any) => {
    listLoading.value = false;
    listData.value = data
  }).catch(() => {
    listLoading.value = false
  })
}
getList()
const tableRef = ref()
const handleRowClick = (row: any) => {
  (tableRef.value as any).toggleRowSelection(row)
}
const editBoxShow = ref(false)
const editForm = ref({
  id: '',
  name: '',
  parent_id: '',
  icon: '',
  path: '',
  component: '',
  actions: [],
  type: '',
  code: '',
  i18n_key: ''
})
const edit = (current: any) => {
  editForm.value = {
    id: current.id,
    name: current.name,
    parent_id: current.parent_id,
    icon: current.icon,
    path: current.path,
    component: current.component,
    actions: current.actions,
    type: current.type,
    code: current.code,
    i18n_key: current.i18n_key
  };
  editBoxShow.value = true
}
const confirmEdit = () => {
  const data = editForm.value;
  editApi(data).then(() => {
    ElNotification.success({message: '编辑成功'});
    editBoxShow.value = false;
    getList();
    init()
  }).catch(() => {
  })
}
const confirmDel = async (current: any) => {
  try {
    await ElMessageBox.confirm('确定要删除吗？此操作不可撤销', '二次确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const param = {id: current.id}
  delApi(param).then(() => {
    ElNotification.success({message: '删除成功'});
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
    ElNotification.error({message: '请至少选择一个记录'});
    return
  }
  try {
    await ElMessageBox.confirm('确定批量删除选中记录吗？此操作不可撤销', '二次确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const param = {id: selectedIds.value}
  delApi(param).then(() => {
    ElNotification.success({message: '删除成功'});
    getList()
  }).catch(() => {
  })
}
const iconAddSelect = ref<any>(null)
const openAddIconSelect = () => {
  iconAddSelect.value.show()
}
const confirmAddIcon = (iconName: string) => {
  addForm.value.icon = iconName
}
const iconEditSelect = ref<any>(null)
const openEditIconSelect = () => {
  iconEditSelect.value.show()
}
const confirmEditIcon = (iconName: string) => {
  editForm.value.icon = iconName
}
const changStatus = (row: any) => {
  if (row.status === undefined) {
    ElNotification.error({message: '启用状态字段不存在'});
    return
  }
  const param = {id: row.id, status: row.status};
  statusApi(param).then(() => {
    ElNotification.success({message: '修改成功'});
    getList()
  }).catch(() => {
  })
}
</script>

<template>
  <div class="box">
    <el-form :inline="true" :model="searchForm">
      <el-form-item>
        <el-dropdown>
          <el-button type="primary">{{ t('common.actions.batchDelete') }}
            <el-icon class="el-icon--right">
              <arrow-right/>
            </el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="batchDel" v-if="userStore.can('permission.del')">
                {{ t('common.actions.batchDelete') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-form-item>
      <el-form-item v-if="userStore.can('permission.add')">
        <el-button type="success" @click="add">{{ t('common.actions.add') }}</el-button>
      </el-form-item>
      <el-form-item>
        <el-input v-model="searchForm.name" clearable :placeholder="t('permission.filter.name')" style="width:150px"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">{{ t('common.actions.query') }}</el-button>
      </el-form-item>
    </el-form>
    <div class="table">
      <el-table :data="listData" style="width:100%" v-loading="listLoading" @selection-change="handleSelectionChange"
                ref="tableRef" @row-click="handleRowClick" row-key="id" border default-expand-all>
        <el-table-column type="selection" width="55"/>
        <el-table-column prop="id" width="150" :label="t('permission.table.id')"/>
        <el-table-column prop="name" :label="t('permission.table.name')" align="center"/>
        <el-table-column prop="path" label="PATH" align="center"/>
        <el-table-column label="ICON" align="center">
          <template #default="scope">
            <el-icon>
              <component :is="scope.row.icon"/>
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="component" label="组件" align="center"/>
        <el-table-column label="是否启用" align="center">
          <template #default="scope">
            <el-switch v-model="scope.row.status" :active-value="1" :inactive-value="2"
                       @change="changStatus(scope.row)"/>
          </template>
        </el-table-column>
        <el-table-column label="类型" align="center">
          <template #default="scope">
            <el-tag effect="dark" v-if="scope.row.type===1" type="success">{{ scope.row.type_name }}</el-tag>
            <el-tag effect="dark" v-if="scope.row.type===2" type="primary">{{ scope.row.type_name }}</el-tag>
            <el-tag effect="dark" v-if="scope.row.type===3" type="danger">{{ scope.row.type_name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="CODE" align="center" prop="code"/>
        <el-table-column label="操作" align="center" min-width="180" fixed="right" header-align="center">
          <template #default="scope">
            <el-button type="primary" @click="edit(scope.row)" text v-if="userStore.can('permission.edit')">编辑
            </el-button>
            <el-button type="danger" text v-if="userStore.can('permission.del')" @click="confirmDel(scope.row)">删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
  <el-dialog v-model="addBoxShow" class="add-box dialog-box" width="800" draggable>
    <template #header>新增</template>
    <div class="content-box">
      <el-form :model="addForm" label-width="auto">
        <el-form-item label="类型" required>
          <el-radio-group v-model="addForm.type">
            <el-radio :value="item.value" border v-for="(item,index) in permissionTypeArr" :key="index">{{
                item.label
              }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="父级菜单">
          <el-tree-select v-model="addForm.parent_id" :data="permissionTree" show-checkbox clearable check-strictly=true
                          :render-after-expand="false"/>
        </el-form-item>
        <el-form-item label="i18n_key" required v-if="addForm.type === 1 || addForm.type === 2">
          <el-input v-model="addForm.i18n_key" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="addForm.name" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="ICON" v-if="addForm.type === 1 || addForm.type === 2">
          <el-input v-model="addForm.icon" style="width:80%" clearable/>
          <el-button icon="Setting" @click="openAddIconSelect">选择</el-button>
        </el-form-item>
        <el-form-item label="路由" v-if="addForm.type === 2">
          <el-input v-model="addForm.path" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="component" v-if="addForm.type === 2">
          <el-input v-model="addForm.component" style="width:100%" clearable type="textarea" :rows="5"/>
        </el-form-item>
        <el-form-item label="code" required v-if="addForm.type === 3">
          <el-input v-model="addForm.code" style="width:100%" clearable/>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="addBoxShow=false">取消</el-button><el-button
        type="primary" @click="confirmAdd">确认</el-button></span></template>
  </el-dialog>
  <el-dialog v-model="editBoxShow" class="add-box" width="800" title="编辑" top="20vh" draggable>
    <div class="add-box">
      <el-form label-width="auto" :model="editForm">
        <el-form-item label="类型" required>
          <el-radio-group v-model="editForm.type">
            <el-radio :value="item.value" border v-for="(item,index) in permissionTypeArr" :key="index">{{
                item.label
              }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="父级菜单">
          <el-tree-select v-model="editForm.parent_id" :data="permissionTree" show-checkbox clearable
                          check-strictly=true :render-after-expand="false"/>
        </el-form-item>
        <el-form-item label="i18n_key" required v-if="editForm.type === 1 || editForm.type === 2">
          <el-input v-model="editForm.i18n_key" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="editForm.name" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="ICON" v-if="editForm.type === 1 || editForm.type === 2">
          <el-input v-model="editForm.icon" style="width:80%" clearable/>
          <el-button icon="Setting" @click="openEditIconSelect">选择</el-button>
        </el-form-item>
        <el-form-item label="路由" v-if="editForm.type === 2">
          <el-input v-model="editForm.path" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="component" v-if="editForm.type === 2">
          <el-input v-model="editForm.component" style="width:100%" clearable type="textarea" :rows="5"/>
        </el-form-item>
        <el-form-item label="code" required v-if="editForm.type === 3">
          <el-input v-model="editForm.code" style="width:100%" clearable/>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="editBoxShow=false">取消</el-button><el-button
        type="primary" @click="confirmEdit">确认</el-button></span></template>
  </el-dialog>
  <icon-select @select-icon="confirmAddIcon" ref="iconAddSelect"/>
  <icon-select @select-icon="confirmEditIcon" ref="iconEditSelect"/>
</template>
<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%
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
