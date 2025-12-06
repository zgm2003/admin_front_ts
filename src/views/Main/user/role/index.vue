<script setup lang="ts">
import {ref, computed} from 'vue'
import {addApi, delApi, editApi, listApi, initApi} from '@/api/user/role'
import {ElNotification, ElMessageBox} from 'element-plus'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import { Search } from '@/components/Search'

const userStore = useUserStore()
const {t} = useI18n()
const PermissionTree = ref([])
const init = () => {
  initApi().then((data: any) => {
    PermissionTree.value = data.dict.permission_tree
  }).catch(() => {
  })
}
init()
const addBoxShow = ref(false)
const addForm = ref({name: '', permission_id: ''})
const add = () => {
  addForm.value = {name: '', permission_id: ''};
  addBoxShow.value = true
}
const confirmAdd = () => {
  const param = addForm.value;
  addApi(param).then(() => {
    ElNotification.success({message: '新增成功'});
    addBoxShow.value = false;
    getList()
  }).catch(() => {
  })
}
const listLoading = ref(false)
const listData = ref([])
const searchForm = ref({name: '', path: '', permission: ''})
const page = ref({current_page: 1, page_size: 50, total: 0})
const columns = [
  {key: 'name', label: t('role.table.name')},
  {key: 'created_at', label: t('role.table.created_at')},
  {key: 'updated_at', label: t('role.table.updated_at')},
  {key: 'actions', label: '操作', width: 180, align: 'center'}
]
const getList = () => {
  listLoading.value = true;
  const param: any = {...searchForm.value, page_size: page.value.page_size, current_page: page.value.current_page};
  listApi(param).then((data: any) => {
    listLoading.value = false;
    listData.value = data.list;
    page.value = data.page
  }).catch(() => {
    listLoading.value = false
  })
}
getList()
const selectedIds = ref([] as any[])
const onSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item: any) => item.id)
}
const refresh = () => {
  getList()
}
const onPageChange = (p: any) => {
  page.value = p;
  getList()
}
const editBoxShow = ref(false)
const editForm = ref({id: '', name: '', permission_id: ''})
const edit = (current: any) => {
  editForm.value = {id: current.id, name: current.name, permission_id: current.permission_id};
  editBoxShow.value = true
}
const confirmEdit = () => {
  const data = editForm.value;
  editApi(data).then(() => {
    ElNotification.success({message: '编辑成功'});
    editBoxShow.value = false;
    getList()
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
const props = {multiple: true, emitPath: false, checkStrictly: true}
const searchFields = computed(() => [
  { key: 'name', type: 'input', placeholder: t('role.filter.name'), width: 150 }
])
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="getList" @reset="getList" />
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <el-button v-if="userStore.can('role.add')" type="success" @click="add">{{ t('common.actions.add') }}</el-button>
      <el-dropdown>
        <el-button type="primary">{{ t('common.actions.batchDelete') }}
          <el-icon class="el-icon--right">
            <arrow-right/>
          </el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="batchDel" v-if="userStore.can('role.del')">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="table">
      <AppTable :columns="columns" :data="listData" :loading="listLoading" row-key="id" :pagination="page" selectable :show-index="true"
                @refresh="refresh" @update:pagination="onPageChange" @selection-change="onSelectionChange">
        <template #cell-actions="{ row }">
          <el-button type="primary" @click="edit(row)" text v-if="userStore.can('role.edit')">编辑</el-button>
          <el-button type="danger" text v-if="userStore.can('role.del')" @click="confirmDel(row)">删除</el-button>
        </template>
      </AppTable>
    </div>
  </div>
  <el-dialog v-model="addBoxShow" class="add-box dialog-box" width="800">
    <template #header>新增</template>
    <div class="content-box">
      <el-form :model="addForm" label-width="auto">
        <el-form-item label="角色名" required>
          <el-input v-model="addForm.name" clearable style="width:100%"/>
        </el-form-item>
        <el-form-item label="权限">
          <el-cascader :options="PermissionTree" :props="props" v-model="addForm.permission_id" collapse-tags clearable
                       style="width:100%"/>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="addBoxShow=false">取消</el-button><el-button
        type="primary" @click="confirmAdd">确认</el-button></span></template>
  </el-dialog>
  <el-dialog v-model="editBoxShow" class="add-box" width="1000" title="编辑" top="20vh">
    <div class="add-box">
      <el-form label-width="auto" :model="editForm">
        <el-form-item label="角色名" required>
          <el-input v-model="editForm.name" clearable/>
        </el-form-item>
        <el-form-item label="权限">
          <el-cascader :options="PermissionTree" :props="props" v-model="editForm.permission_id" clearable
                       style="width:100%"/>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="editBoxShow=false">取消</el-button><el-button
        type="primary" @click="confirmEdit">确认</el-button></span></template>
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
