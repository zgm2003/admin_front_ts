<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useIsMobile} from '@/utils/responsive'
import {RoleApi} from '@/api/user/role'
import {ElNotification, ElMessageBox} from 'element-plus'
import {useUserStore} from '@/store/user'
import {useI18n} from 'vue-i18n'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'

const userStore = useUserStore()
const {t} = useI18n()
const PermissionTree = ref([])
const init = () => {
  RoleApi.init().then((data: any) => {
    PermissionTree.value = data.dict.permission_tree
  }).catch(() => {
  })
}
const dialogShow = ref(false)
const isEdit = ref(false)
const form = ref({id: '', name: '', permission_id: ''})
const add = () => {
  isEdit.value = false
  form.value = {id: '', name: '', permission_id: ''}
  dialogShow.value = true
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
  RoleApi.list(param).then((data: any) => {
    listLoading.value = false;
    listData.value = data.list;
    page.value = data.page
  }).catch(() => {
    listLoading.value = false
  })
}
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
const edit = (current: any) => {
  isEdit.value = true
  form.value = {id: current.id, name: current.name, permission_id: current.permission_id}
  dialogShow.value = true
}
const submit = () => {
  const data = form.value
  if (!data.name) {
    ElNotification.error({message: t('role.table.name') + t('common.required')});
    return
  }
  if (!isEdit.value) {
    RoleApi.add(data).then(() => {
      ElNotification.success({message: t('common.success.operation')});
      dialogShow.value = false;
      getList()
    })
  } else {
    RoleApi.edit(data).then(() => {
      ElNotification.success({message: t('common.success.operation')});
      dialogShow.value = false;
      getList()
    })
  }
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
  RoleApi.del(param).then(() => {
    ElNotification.success({message: t('common.success.operation')});
    getList();
  }).catch(() => {
  })
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
  RoleApi.del(param).then(() => {
    ElNotification.success({message: t('common.success.operation')});
    getList()
  }).catch(() => {
  })
}
const props = {multiple: true, emitPath: false, checkStrictly: true}
const searchFields = computed(() => [
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
    <Search v-model="searchForm" :fields="searchFields" @query="getList" @reset="getList"/>
    <div class="table">
      <AppTable :columns="columns" :data="listData" :loading="listLoading" row-key="id" :pagination="page" selectable
                :show-index="true"
                @refresh="refresh" @update:pagination="onPageChange" @selection-change="onSelectionChange">
        <template #toolbar-left>
          <el-button v-if="userStore.can('role.add')" type="success" @click="add">{{
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
                <el-dropdown-item @click="batchDel" v-if="userStore.can('role.del')">{{
                    t('common.actions.batchDelete')
                  }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" @click="edit(row)" text v-if="userStore.can('role.edit')">编辑</el-button>
          <el-button type="danger" text v-if="userStore.can('role.del')" @click="confirmDel(row)">删除</el-button>
        </template>
      </AppTable>
    </div>
  </div>
  <el-dialog v-model="dialogShow" class="add-box dialog-box" :width="isMobile ? '94vw' : '900px'"
             :top="isMobile ? '6vh' : '20vh'">
    <template #header>{{ isEdit ? t('common.actions.edit') : t('common.actions.add') }}</template>
    <div class="content-box">
      <el-form :model="form" label-width="auto">
        <el-form-item label="角色名" required>
          <el-input v-model="form.name" clearable style="width:100%"/>
        </el-form-item>
        <el-form-item label="权限">
          <el-cascader :options="PermissionTree" :props="props" v-model="form.permission_id" collapse-tags clearable
                       style="width:100%"/>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="dialogShow=false">{{
        t('common.actions.cancel')
      }}</el-button><el-button
        type="primary" @click="submit">{{ t('common.actions.confirm') }}</el-button></span></template>
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
