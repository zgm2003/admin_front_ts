<script setup lang="ts">
import {ref, computed} from 'vue'
import { useIsMobile } from '@/utils/responsive'
import {useRouter} from 'vue-router'
import {addApi, delApi, editApi, listApi, initApi, batchEditApi, statusApi} from '@/api/user/permission'
import IconSelect from '@/components/IconSelect'
import { Search } from '@/components/Search'
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
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref({ id: '', name: '', parent_id: '', icon: '', path: '', component: '', actions: [], type: '', code: '', i18n_key: '' })
const add = () => {
  dialogMode.value = 'add'
  form.value = { id: '', name: '', parent_id: '', icon: '', path: '', component: '', actions: [], type: '', code: '', i18n_key: '' }
  dialogVisible.value = true
}
const addChild = (current: any) => {
  dialogMode.value = 'add'
  form.value = { id: '', name: '', parent_id: current.id, icon: '', path: '', component: '', actions: [], type: current.type, code: '', i18n_key: '' }
  dialogVisible.value = true
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
const edit = (current: any) => {
  dialogMode.value = 'edit'
  form.value = { id: current.id, name: current.name, parent_id: current.parent_id, icon: current.icon, path: current.path, component: current.component, actions: current.actions, type: current.type, code: current.code, i18n_key: current.i18n_key }
  dialogVisible.value = true
}
const formRef = ref<any>(null)
const rules = computed(() => ({
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  i18n_key: (form.value.type === 1 || form.value.type === 2) ? [{ required: true, message: '请输入 i18n_key', trigger: 'blur' }] : [],
  code: (form.value.type === 3) ? [{ required: true, message: '请输入 code', trigger: 'blur' }] : []
}))
const confirmSubmit = async () => {
  try {
    const ok = await (formRef.value as any)?.validate?.()
    if (!ok) return
  } catch {
    ElNotification.error({ message: '请完善必填项' })
    return
  }
  const payload = form.value
  const api = dialogMode.value === 'add' ? addApi : editApi
  api(payload).then(() => {
    ElNotification.success({message: dialogMode.value === 'add' ? '新增成功' : '编辑成功'})
    dialogVisible.value = false
    getList();
    init()
  }).catch(() => {})
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
const iconSelectRef = ref<any>(null)
const openIconSelect = () => { iconSelectRef.value.show() }
const confirmIcon = (iconName: string) => { form.value.icon = iconName }
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
const searchFields = computed(() => [
  { key: 'name', type: 'input', placeholder: t('permission.filter.name'), width: 150 }
])
const isMobile = useIsMobile()
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="getList" @reset="getList" />
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
      <el-button v-if="userStore.can('permission.add')" type="success" @click="add">{{ t('common.actions.add') }}</el-button>
      <el-dropdown>
        <el-button type="primary">{{ t('common.actions.batchDelete') }}
          <el-icon class="el-icon--right">
            <arrow-right/>
          </el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="batchDel" v-if="userStore.can('permission.del')">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="table">
      <el-table :data="listData" style="width:100%" v-loading="listLoading" @selection-change="handleSelectionChange"
                ref="tableRef" @row-click="handleRowClick" row-key="id" border default-expand-all stripe>
        <el-table-column type="selection" width="55"/>
        <el-table-column prop="id" width="150" :label="t('permission.table.id')"/>
        <el-table-column prop="name" :label="t('permission.table.name')" align="center"/>
        <el-table-column prop="path" label="PATH" align="center"/>
        <el-table-column label="ICON" align="center">
          <template #default="scope">
            <el-icon size="large">
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
        <el-table-column label="I18N_KEY" align="center" prop="i18n_key"/>
        <el-table-column label="操作" align="center" min-width="180" fixed="right" header-align="center">
          <template #default="scope">
            <el-button type="success" @click="addChild(scope.row)" text v-if="userStore.can('permission.add') && scope.row.type !== 3">新增
            </el-button>
            <el-button type="primary" @click="edit(scope.row)" text v-if="userStore.can('permission.edit')">编辑
            </el-button>
            <el-button type="danger" text v-if="userStore.can('permission.del')" @click="confirmDel(scope.row)">删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
  <el-dialog v-model="dialogVisible" class="add-box dialog-box" :width="isMobile ? '94vw' : '800px'" :title="dialogMode==='add' ? '新增' : '编辑'" draggable destroy-on-close :top="isMobile ? '6vh' : '15vh'">
    <div class="content-box">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
        <el-form-item label="类型" prop="type" required>
          <el-radio-group v-model="form.type">
            <el-radio :value="item.value" border v-for="(item,index) in permissionTypeArr" :key="index">{{
                item.label
              }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="父级菜单">
          <el-tree-select v-model="form.parent_id" :data="permissionTree" show-checkbox clearable check-strictly=true
                           :render-after-expand="false"/>
        </el-form-item>
        <el-form-item label="名称" prop="name" required>
          <el-input v-model="form.name" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="i18n_key" prop="i18n_key" required v-if="form.type === 1 || form.type === 2">
          <el-input v-model="form.i18n_key" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="ICON" v-if="form.type === 1 || form.type === 2">
          <el-input v-model="form.icon" style="width:80%" clearable/>
          <el-button icon="Setting" @click="openIconSelect">选择</el-button>
        </el-form-item>
        <el-form-item label="路由" v-if="form.type === 2">
          <el-input v-model="form.path" style="width:100%" clearable/>
        </el-form-item>
        <el-form-item label="component" v-if="form.type === 2">
          <el-input v-model="form.component" style="width:100%" clearable :rows="5"/>
        </el-form-item>
        <el-form-item label="code" prop="code" required v-if="form.type === 3">
          <el-input v-model="form.code" style="width:100%" clearable/>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="dialogVisible=false">取消</el-button><el-button
        type="primary" @click="confirmSubmit">确认</el-button></span></template>
  </el-dialog>
  <icon-select @select-icon="confirmIcon" ref="iconSelectRef"/>
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
