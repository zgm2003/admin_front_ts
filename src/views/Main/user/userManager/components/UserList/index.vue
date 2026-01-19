<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useIsMobile} from '@/hooks/useResponsive'
import {useRouter} from 'vue-router'
import {UsersListApi} from '@/api/user/users'
import {ElNotification, ElMessageBox} from 'element-plus'
import UpImg from '@/components/UpImg'
import {useUserStore} from '@/store/user'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import {useI18n} from 'vue-i18n'
import {useTable} from '@/hooks/useTable'
import {ArrowRight} from "@element-plus/icons-vue"

const userStore = useUserStore()
const {t} = useI18n()
const router = useRouter()
const sexArr = ref([])
const addressTree = ref([])
const roleArr = ref([])

const initList = () => {
  UsersListApi.init().then((data: any) => {
    sexArr.value = data.dict.sexArr
    roleArr.value = data.dict.roleArr
    addressTree.value = data.dict.auth_address_tree
  }).catch(() => {})
}

const searchForm = ref({username: '', email: '', role_id: '', sex: '', address: '', detail_address: ''})

const {
  loading: listLoading,
  data: listData,
  page,
  selectedIds,
  onSearch,
  onPageChange,
  refresh,
  getList,
  onSelectionChange,
  confirmDel,
  batchDel
} = useTable({
  api: UsersListApi,
  searchForm
})

const searchFields = computed<SearchField[]>(() => [
  {key: 'username', type: 'input', label: t('user.filter.username'), placeholder: t('user.filter.username'), width: 150},
  {key: 'email', type: 'input', label: t('user.filter.email'), placeholder: t('user.filter.email'), width: 150},
  {key: 'role_id', type: 'select-v2', label: t('user.filter.role'), options: roleArr.value, placeholder: t('user.filter.role'), width: 150},
  {key: 'sex', type: 'select-v2', label: t('user.filter.sex'), options: sexArr.value, placeholder: t('user.filter.sex'), width: 150},
  {key: 'address', type: 'cascader', label: t('user.filter.address'), options: addressTree.value, placeholder: t('user.filter.address'), width: 150, cascaderProps: {emitPath: false, multiple: true}},
  {key: 'detail_address', type: 'input', label: t('user.filter.detail_address'), placeholder: t('user.filter.detail_address'), width: 150}
])

const editBoxShow = ref(false)
const editForm = ref({id: '', phone: '', avatar: '', role_id: '', username: '', email: '', sex: '', address: '', detail_address: '', bio: ''})

const edit = (current: any) => {
  editForm.value = {
    id: current.id, phone: current.phone, avatar: current.avatar, role_id: current.role_id,
    username: current.username, email: current.email, sex: current.sex,
    address: current.address, detail_address: current.detail_address, bio: current.bio || ''
  }
  editBoxShow.value = true
}

const confirmEdit = () => {
  UsersListApi.edit(editForm.value).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    editBoxShow.value = false
    getList()
  }).catch(() => {})
}

const batchEditBoxShow = ref(false)
const batchEditForm = ref({ids: [] as any[], field: '', sex: '', address: '', detail_address: ''})
const batchFieldOptions = computed(() => [
  {value: 'sex', label: t('user.table.sex')},
  {value: 'address', label: t('user.table.address')},
  {value: 'detail_address', label: t('user.filter.detail_address')}
])

const batchEdit = () => {
  if (selectedIds.value.length === 0) {
    ElNotification.error({message: t('common.selectAtLeastOne')})
    return
  }
  batchEditForm.value = {ids: selectedIds.value, field: '', sex: '', address: '', detail_address: ''}
  batchEditBoxShow.value = true
}

const confirmBatchEdit = () => {
  UsersListApi.batchEdit(batchEditForm.value).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    batchEditBoxShow.value = false
    getList()
  }).catch(() => {})
}

const goToPersonal = (current: any) => {
  router.push({path: '/personal', query: {user_id: current.row.id}})
}

const exportExcel = () => {
  if (selectedIds.value.length === 0) {
    ElNotification.error({message: t('common.selectAtLeastOne')})
    return
  }
  UsersListApi.export({ids: selectedIds.value}).then((data: any) => {
    ElNotification.success({message: data.message || t('common.export.submitted')})
  }).catch(() => {})
}

const isMobile = useIsMobile()

onMounted(() => {
  initList()
  getList()
})
</script>

<template>
  <div class="user-list">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" :collapseCount="2"/>
    <div class="table">
      <AppTable :columns="[
          { key: 'username', label: t('user.table.username'), width: 150 },
          { key: 'avatar', label: t('user.table.avatar') },
          { key: 'phone', label: t('user.table.phone') },
          { key: 'sex_show', label: t('user.table.sex') },
          { key: 'email', label: t('user.table.email') },
          { key: 'role_name', label: t('user.table.role'), width: 150 },
          { key: 'address_show', label: t('user.table.address'), width: 180, overflowTooltip: true },
          { key: 'bio', label: t('user.table.desc'), width: 180,overflowTooltip: true },
          { key: 'actions', label: t('common.actions.action'),width: 180 }
        ]" :data="listData" :loading="listLoading" row-key="id" :pagination="page" selectable :show-index="true"
                @refresh="refresh" @update:pagination="onPageChange" @selection-change="onSelectionChange">
        <template #toolbar-left>
          <el-dropdown>
            <el-button type="primary">{{ t('common.actions.batchAction') }}<el-icon class="el-icon--right"><arrow-right/></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('user_userManager_del')">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
                <el-dropdown-item @click="batchEdit" v-if="userStore.can('user_userManager_edit')">{{ t('common.actions.batchEdit') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="success" @click="exportExcel">{{ t('common.actions.export') }}</el-button>
        </template>
        <template #cell-username="{ row }">
          <el-link type="primary" @click="goToPersonal({ row })">{{ row.username }}</el-link>
        </template>
        <template #cell-avatar="{ row }"><el-avatar :src="row.avatar"/></template>
        <template #cell-role_name="{ row }"><el-tag :type="row.role_id === 1 ? 'success' : 'danger'">{{ row.role_name }}</el-tag></template>
        <template #cell-bio="{ row }"><el-text v-html="row.bio"></el-text></template>
        <template #cell-actions="{ row }">
          <el-button type="primary" @click="edit(row)" text v-if="userStore.can('user_userManager_edit')">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text v-if="userStore.can('user_userManager_del')" @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <!-- 编辑弹窗 -->
  <el-dialog v-model="editBoxShow" class="add-box" :width="isMobile ? '94vw' : '950px'" :title="t('common.actions.edit')">
    <div class="add-box">
      <el-form label-width="auto" :model="editForm" inline>
        <el-form-item :label="t('user.table.username')"><el-input v-model="editForm.username" :placeholder="t('user.table.username')" clearable style="width:200px"/></el-form-item>
        <el-form-item :label="t('user.table.email')"><el-input v-model="editForm.email" :placeholder="t('user.table.email')" clearable style="width:200px" disabled/></el-form-item>
        <el-form-item :label="t('user.table.phone')"><el-input v-model="editForm.phone" :placeholder="t('user.table.phone')" clearable style="width:200px" disabled/></el-form-item>
        <el-form-item :label="t('user.table.sex')"><el-select-v2 v-model="editForm.sex" :options="sexArr" style="width:200px" filterable clearable/></el-form-item>
        <el-form-item :label="t('user.table.role')"><el-select-v2 v-model="editForm.role_id" :options="roleArr" style="width:200px" filterable clearable/></el-form-item>
        <el-form-item :label="t('user.table.avatar')"><UpImg v-model="editForm.avatar" folderName="avatar" :isClearable="false"/></el-form-item>
        <el-form-item :label="t('user.table.address')">
          <el-cascader v-model="editForm.address" :options="addressTree" :props="{ emitPath: false }" :placeholder="t('user.filter.address')" style="width:200px;margin-right:5px" clearable filterable/>
          <el-input v-model="editForm.detail_address" :placeholder="t('user.filter.detail_address')" clearable style="width:300px"/>
        </el-form-item>
      </el-form>
      <el-row>
        <el-col :span="22">
          <el-form>
            <el-form-item :label="t('user.table.desc')" style="width:100%"><el-input type="textarea" :rows="5" v-model="editForm.bio"/></el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="editBoxShow=false">{{ t('common.actions.cancel') }}</el-button><el-button type="primary" @click="confirmEdit">{{ t('common.actions.confirm') }}</el-button></span></template>
  </el-dialog>

  <!-- 批量编辑弹窗 -->
  <el-dialog v-model="batchEditBoxShow" class="add-box" :width="isMobile ? '94vw' : '650px'" :title="t('common.actions.batchEdit')">
    <div class="add-box">
      <el-form label-width="80">
        <el-form-item :label="t('user.batchEdit.field')" required><el-select-v2 v-model="batchEditForm.field" :options="batchFieldOptions"/></el-form-item>
        <el-form-item :label="t('user.table.sex')" v-if="batchEditForm.field === 'sex'"><el-select-v2 :options="sexArr" v-model="batchEditForm.sex" style="width:300px" :placeholder="t('user.filter.sex')" clearable/></el-form-item>
        <el-form-item :label="t('user.table.address')" v-if="batchEditForm.field === 'address'"><el-cascader v-model="batchEditForm.address" :options="addressTree" :props="{ emitPath: false }" :placeholder="t('user.filter.address')" style="width:300px" clearable filterable/></el-form-item>
        <el-form-item :label="t('user.filter.detail_address')" v-if="batchEditForm.field === 'detail_address'"><el-input v-model="batchEditForm.detail_address" :placeholder="t('user.filter.detail_address')" clearable style="width:300px"/></el-form-item>
      </el-form>
    </div>
    <template #footer><span class="dialog-footer"><el-button @click="batchEditBoxShow=false">{{ t('common.actions.cancel') }}</el-button><el-button type="primary" @click="confirmBatchEdit">{{ t('common.actions.confirm') }}</el-button></span></template>
  </el-dialog>
</template>

<style scoped>
.user-list { display: flex; flex-direction: column; height: 100%; }
.table { flex: 1 1 auto; min-height: 0; overflow: auto; }
</style>
