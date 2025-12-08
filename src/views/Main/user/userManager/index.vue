<script setup lang="ts">
import {ref, computed} from 'vue'
import { useIsMobile } from '@/utils/responsive'
import {useRouter} from 'vue-router'
import {listListApi, initListApi, editListApi, delListApi, batchEditListApi, exportListApi} from '@/api/user/users'
import {ElNotification, ElMessageBox} from 'element-plus'
import UpImg from '@/components/UpImg'
import {useUserStore} from '@/store/user'
import {AppTable} from '@/components/Table'
import { Search } from '@/components/Search'
import {useI18n} from 'vue-i18n'

const userStore = useUserStore()
const {t} = useI18n()
const router = useRouter()
const sexArr = ref([])
const addressTree = ref([])
const roleArr = ref([])
const initList = () => {
  initListApi().then((data: any) => {
    sexArr.value = data.dict.sexArr;
    roleArr.value = data.dict.roleArr;
    addressTree.value = data.dict.auth_address_tree
  }).catch(() => {
  })
}
initList()
const listLoading = ref(false)
const listData = ref([])
const searchForm = ref({username: '', email: '', role_id: '', sex: '', address: '', detail_address: ''})
const page = ref({current_page: 1, page_size: 10, total: 0})
const getList = () => {
  listLoading.value = true;
  const param: any = {...searchForm.value, page_size: page.value.page_size, current_page: page.value.current_page};
  listListApi(param).then((data: any) => {
    listLoading.value = false;
    listData.value = data.list;
    page.value = data.page
  }).catch(() => {
    listLoading.value = false
  })
}
getList()
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
const searchFields = computed(() => [
  { key: 'username', type: 'input', label: t('user.filter.username'), placeholder: t('user.filter.username'), width: 150 },
  { key: 'email', type: 'input', label: t('user.filter.email'), placeholder: t('user.filter.email'), width: 150 },
  { key: 'role_id', type: 'select-v2', label: t('user.filter.role'), options: roleArr.value, placeholder: t('user.filter.role'), width: 150 },
  { key: 'sex', type: 'select-v2', label: t('user.filter.sex'), options: sexArr.value, placeholder: t('user.filter.sex'), width: 150 },
  { key: 'address', type: 'cascader', label: t('user.filter.address'), options: addressTree.value, placeholder: t('user.filter.address'), width: 150 },
  { key: 'detail_address', type: 'input', label: t('user.filter.detail_address'), placeholder: t('user.filter.detail_address'), width: 150 }
])
const editBoxShow = ref(false)
const editForm = ref({
  id: '',
  phone: '',
  avatar: '',
  role_id: '',
  username: '',
  email: '',
  sex: '',
  address: '',
  detail_address: '',
  desc: ''
})
const edit = (current: any) => {
  editForm.value = {
    id: current.id,
    phone: current.phone,
    avatar: current.avatar,
    role_id: current.role_id,
    username: current.username,
    email: current.email,
    sex: current.sex,
    address: current.address,
    detail_address: current.detail_address,
    desc: current.desc
  };
  editBoxShow.value = true
}
const handleUploadSuccess = (url: string) => {
  editForm.value.avatar = url
}
const confirmEdit = () => {
  const data = editForm.value;
  editListApi(data).then(() => {
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
  delListApi(param).then(() => {
    ElNotification.success({message: '删除成功'});
    getList()
  }).catch(() => {
  })
}
const selectedIds = ref([] as any[])
const batchDel = async () => {
  if (!selectedIds.value || selectedIds.value.length === 0) {
    ElNotification.error({message: '请至少选择一个用户'});
    return
  }
  try {
    await ElMessageBox.confirm('确定批量删除选中用户吗？此操作不可撤销', '二次确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  const param = {id: selectedIds.value}
  delListApi(param).then(() => {
    ElNotification.success({message: '删除成功'});
    getList()
  }).catch(() => {
  })
}
const batchEditBoxShow = ref(false)
const batchEditForm = ref({ids: [], field: '', sex: '', address: '', detail_address: ''})
const batchEdit = () => {
  if (selectedIds.value.length === 0) {
    ElNotification.error({message: '请至少选择一个用户'});
    return
  }
  batchEditForm.value = {ids: selectedIds.value, field: '', sex: '', address: '', detail_address: ''};
  batchEditBoxShow.value = true
}
const confirmBatchEdit = () => {
  const param = batchEditForm.value;
  batchEditListApi(param).then(() => {
    ElNotification.success({message: '操作成功'});
    batchEditBoxShow.value = false;
    getList()
  }).catch(() => {
  })
}
const goToPersonal = (current: any) => {
  router.push({path: '/personal', query: {user_id: current.row.id}})
}
const exportExcel = () => {
  if (selectedIds.value.length === 0) {
    ElNotification.error({message: '请至少选择一个用户'});
    return
  }
  listLoading.value = true;
  const data = {ids: selectedIds.value};
  exportListApi(data).then((data: any) => {
    listLoading.value = false;
    const url = data.url;
    window.open(url);
    ElNotification.success({message: '导出成功'})
  }).catch(() => {
    listLoading.value = false
  })
}
const isMobile = useIsMobile()
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="getList" @reset="getList" />
    <div class="table">
      <AppTable :columns="[
          { key: 'username', label: t('user.table.username') },
          { key: 'avatar', label: t('user.table.avatar') },
          { key: 'phone', label: t('user.table.phone') },
          { key: 'sex_show', label: t('user.table.sex') },
          { key: 'email', label: t('user.table.email') },
          { key: 'role_name', label: t('user.table.role') },
          { key: 'address_show', label: t('user.table.address') ,width: 180, overflowTooltip: true},
          { key: 'desc', label: t('user.table.desc'), width: 180, overflowTooltip: true },
          { key: 'expires_in', label: t('user.table.expires_in') },
          { key: 'is_expired', label: t('user.table.is_expired') },
          { key: 'actions', label: t('common.actions.action'), width: 180 }
        ]" :data="listData" :loading="listLoading" row-key="id" :pagination="page" selectable :show-index="true" @refresh="refresh"
                @update:pagination="onPageChange" @selection-change="onSelectionChange">
        <template #toolbar-left>
          <el-dropdown>
            <el-button type="primary">{{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <arrow-right/>
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('user.del')">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
                <el-dropdown-item @click="batchEdit" v-if="userStore.can('user.edit')">{{ t('common.actions.batchEdit') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="success" @click="exportExcel">{{ t('common.actions.export') }}</el-button>
        </template>
        <template #cell-username="{ row }">
          <el-link type="primary" @click="goToPersonal({ row })">{{ row.username }}</el-link>
        </template>
        <template #cell-avatar="{ row }">
          <el-avatar :src="row.avatar" :size="70"/>
        </template>
        <template #cell-role_name="{ row }">
          <el-tag :type="row.role_id === 1 ? 'success' : 'danger'">{{ row.role_name }}</el-tag>
        </template>
        <template #cell-desc="{ row }">
          <el-text v-html="row.desc"></el-text>
        </template>
        <template #cell-is_expired="{ row }">
          <el-tag :type="row.is_expired === '未过期' ? 'success' : 'danger'">{{ row.is_expired }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" @click="edit(row)" text v-if="userStore.can('user.edit')">
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button type="danger" text v-if="userStore.can('user.del')" @click="confirmDel(row)">
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>
  <el-dialog v-model="editBoxShow" class="add-box" :width="isMobile ? '94vw' : '950px'" title="编辑" :top="isMobile ? '6vh' : '20vh'">
    <div class="add-box">
      <el-form label-width="auto" :model="editForm" inline>
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" placeholder="用户名" clearable style="width:200px"/>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="邮箱" clearable style="width:200px" disabled/>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="手机号" clearable style="width:200px" disabled/>
        </el-form-item>
        <el-form-item label="性别">
          <el-select-v2 v-model="editForm.sex" :options="sexArr" style="width:200px" filterable clearable/>
        </el-form-item>
        <el-form-item label="权限">
          <el-select-v2 v-model="editForm.role_id" :options="roleArr" style="width:200px" filterable clearable/>
        </el-form-item>
        <el-form-item label="头像">
          <up-img v-model="editForm.avatar" folderName="avatar" :isClearable="false"/>
        </el-form-item>
        <el-form-item label="地址">
          <el-cascader v-model="editForm.address" :options="addressTree" placeholder="请选择地址"
                       style="width:200px;margin-right:5px" clearable filterable/>
          <el-input v-model="editForm.detail_address" placeholder="详细地址" clearable style="width:300px"/>
        </el-form-item>
      </el-form>
      <el-row>
        <el-col :span="22">
          <el-form>
            <el-form-item label="个人简介" style="width:100%">
              <el-input type="textarea" :rows="5" v-model="editForm.desc"/>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="editBoxShow=false">取消</el-button><el-button
        type="primary" @click="confirmEdit">确认</el-button></span></template>
  </el-dialog>
  <el-dialog v-model="batchEditBoxShow" class="add-box" :width="isMobile ? '94vw' : '650px'" title="编辑" :top="isMobile ? '6vh' : '5vh'">
    <div class="add-box">
      <el-form label-width="80">
        <el-form-item label="字段" required>
          <el-select v-model="batchEditForm.field">
            <el-option label="性别" value="sex"/>
            <el-option label="地址" value="address"/>
            <el-option label="详细地址" value="detail_address"/>
          </el-select>
        </el-form-item>
        <el-form-item label="性别" v-if="batchEditForm.field === 'sex'">
          <el-select-v2 :options="sexArr" v-model="batchEditForm.sex" style="width:300px" placeholder="请选择性别"
                        clearable/>
        </el-form-item>
        <el-form-item label="地址" v-if="batchEditForm.field === 'address'">
          <el-cascader v-model="batchEditForm.address" :options="addressTree" placeholder="请选择地址"
                       style="width:300px" clearable filterable/>
        </el-form-item>
        <el-form-item label="详细地址" v-if="batchEditForm.field === 'detail_address'">
          <el-input v-model="batchEditForm.detail_address" placeholder="详细地址" clearable style="width:300px"/>
        </el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="batchEditBoxShow=false">取消</el-button><el-button
        type="primary" @click="confirmBatchEdit">确认</el-button></span></template>
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

@media (max-width: 768px) {
  .filters {
    flex-wrap: wrap
  }

  .filters :deep(.el-form-item) {
    width: auto;
    margin-right: 8px
  }

  .filters :deep(.el-input),
  .filters :deep(.el-select-v2),
  .filters :deep(.el-cascader) {
    width: 160px !important
  }
}
</style>
