<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElNotification } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { UpMedia } from '@/components/UpMedia'
import { UsersListApi } from '@/api/user/users'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useIsMobile } from '@/hooks/useResponsive'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import type { DictOption } from '@/types/common'
import type { UserBatchEditParams, UserEditParams, UserListItem } from '@/types/user'

interface UserEditDialogForm extends UserEditParams {
  phone: string
  email: string
}

const userStore = useUserStore()
const { t } = useI18n()
const router = useRouter()
const isMobile = useIsMobile()

const sexArr = ref<DictOption<number>[]>([])
const addressTree = ref<any[]>([])
const roleArr = ref<DictOption<number>[]>([])

const initList = async () => {
  try {
    const data = await UsersListApi.init()
    sexArr.value = data.dict.sexArr
    roleArr.value = data.dict.roleArr
    addressTree.value = data.dict.auth_address_tree
  } catch {
    // request interceptor handles notification
  }
}

const searchForm = ref({
  username: '',
  email: '',
  role_id: '' as number | '',
  sex: '' as number | '',
  address: [] as number[],
  detail_address: '',
})

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
  batchDel,
} = useCrudTable<UserListItem>({
  api: UsersListApi,
  searchForm,
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'username', type: 'input', label: t('user.filter.username'), placeholder: t('user.filter.username'), width: 150 },
  { key: 'email', type: 'input', label: t('user.filter.email'), placeholder: t('user.filter.email'), width: 150 },
  { key: 'role_id', type: 'select-v2', label: t('user.filter.role'), options: roleArr.value, placeholder: t('user.filter.role'), width: 150 },
  { key: 'sex', type: 'select-v2', label: t('user.filter.sex'), options: sexArr.value, placeholder: t('user.filter.sex'), width: 150 },
  {
    key: 'address',
    type: 'cascader',
    label: t('user.filter.address'),
    options: addressTree.value,
    placeholder: t('user.filter.address'),
    width: 150,
    cascaderProps: { emitPath: false, multiple: true },
  },
  {
    key: 'detail_address',
    type: 'input',
    label: t('user.filter.detail_address'),
    placeholder: t('user.filter.detail_address'),
    width: 150,
  },
])

const editBoxShow = ref(false)
const editForm = ref<UserEditDialogForm>({
  id: 0,
  phone: '',
  avatar: '',
  role_id: 0,
  username: '',
  email: '',
  sex: 0,
  address: 0,
  detail_address: '',
  bio: '',
})

const edit = (current: UserListItem) => {
  editForm.value = {
    id: current.id,
    phone: current.phone,
    avatar: current.avatar || '',
    role_id: current.role_id,
    username: current.username,
    email: current.email,
    sex: current.sex,
    address: current.address,
    detail_address: current.detail_address,
    bio: current.bio || '',
  }
  editBoxShow.value = true
}

const confirmEdit = async () => {
  const payload: UserEditParams = {
    id: editForm.value.id,
    avatar: editForm.value.avatar,
    role_id: editForm.value.role_id,
    username: editForm.value.username,
    sex: editForm.value.sex,
    address: editForm.value.address,
    detail_address: editForm.value.detail_address,
    bio: editForm.value.bio,
  }

  await UsersListApi.edit(payload)
  ElNotification.success({ message: t('common.success.operation') })
  editBoxShow.value = false
  await getList()
}

const batchEditBoxShow = ref(false)
const batchFieldOptions = computed(() => [
  { value: 'sex', label: t('user.table.sex') },
  { value: 'address', label: t('user.table.address') },
  { value: 'detail_address', label: t('user.filter.detail_address') },
])

const batchEditForm = ref<{
  ids: number[]
  field: '' | UserBatchEditParams['field']
  sex: number | null
  address: number | null
  detail_address: string
}>({
  ids: [],
  field: '',
  sex: null,
  address: null,
  detail_address: '',
})

const batchEdit = () => {
  if (selectedIds.value.length === 0) {
    ElNotification.error({ message: t('common.selectAtLeastOne') })
    return
  }

  batchEditForm.value = {
    ids: [...selectedIds.value],
    field: '',
    sex: null,
    address: null,
    detail_address: '',
  }
  batchEditBoxShow.value = true
}

const confirmBatchEdit = async () => {
  const { ids, field, sex, address, detail_address } = batchEditForm.value
  if (!field) {
    return
  }

  let payload: UserBatchEditParams
  if (field === 'sex') {
    if (sex === null) {
      ElNotification.warning({ message: t('user.warning.fillComplete') })
      return
    }
    payload = { ids, field, sex }
  } else if (field === 'address') {
    if (address === null) {
      ElNotification.warning({ message: t('user.warning.fillComplete') })
      return
    }
    payload = { ids, field, address }
  } else {
    payload = { ids, field, detail_address }
  }

  await UsersListApi.batchEdit(payload)
  ElNotification.success({ message: t('common.success.operation') })
  batchEditBoxShow.value = false
  await getList()
}

const goToPersonal = (row: UserListItem) => {
  router.push({ path: '/personal', query: { user_id: row.id } })
}

const exportExcel = async () => {
  if (selectedIds.value.length === 0) {
    ElNotification.error({ message: t('common.selectAtLeastOne') })
    return
  }

  const data = await UsersListApi.export({ ids: [...selectedIds.value] })
  ElNotification.success({ message: data.message || t('common.export.submitted') })
}

onMounted(() => {
  void initList()
  void getList()
})
</script>

<template>
  <div class="user-list">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" :collapse-count="2" />
    <div class="table">
      <AppTable
        :columns="[
          { key: 'username', label: t('user.table.username'), width: 150 },
          { key: 'avatar', label: t('user.table.avatar') },
          { key: 'phone', label: t('user.table.phone') },
          { key: 'sex_show', label: t('user.table.sex') },
          { key: 'email', label: t('user.table.email') },
          { key: 'role_name', label: t('user.table.role'), width: 150 },
          { key: 'address_show', label: t('user.table.address'), width: 180, overflowTooltip: true },
          { key: 'bio', label: t('user.table.desc'), width: 180, overflowTooltip: true },
          { key: 'actions', label: t('common.actions.action'), width: 180 },
        ]"
        :data="listData"
        :loading="listLoading"
        row-key="id"
        :pagination="page"
        selectable
        :show-index="true"
        @refresh="refresh"
        @update:pagination="onPageChange"
        @selection-change="onSelectionChange"
      >
        <template #toolbar-left>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-if="userStore.can('user_userManager_del')" @click="batchDel">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
                <el-dropdown-item v-if="userStore.can('user_userManager_batchEdit')" @click="batchEdit">{{ t('common.actions.batchEdit') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-if="userStore.can('user_userManager_export')" type="success" @click="exportExcel">{{ t('common.actions.export') }}</el-button>
        </template>
        <template #cell-username="{ row }">
          <el-link type="primary" @click="goToPersonal(row)">{{ row.username }}</el-link>
        </template>
        <template #cell-avatar="{ row }"><el-avatar :src="row.avatar || undefined" /></template>
        <template #cell-role_name="{ row }"><el-tag :type="row.role_id === 1 ? 'success' : 'danger'">{{ row.role_name }}</el-tag></template>
        <template #cell-bio="{ row }"><el-text>{{ row.bio }}</el-text></template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text v-if="userStore.can('user_userManager_edit')" @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text v-if="userStore.can('user_userManager_del')" @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="editBoxShow" class="add-box" :width="isMobile ? '94vw' : '950px'" :title="t('common.actions.edit')">
    <div class="add-box">
      <el-form label-width="auto" :model="editForm" inline>
        <el-form-item :label="t('user.table.username')"><el-input v-model="editForm.username" :placeholder="t('user.table.username')" clearable style="width: 200px" /></el-form-item>
        <el-form-item :label="t('user.table.email')"><el-input v-model="editForm.email" :placeholder="t('user.table.email')" clearable style="width: 200px" disabled /></el-form-item>
        <el-form-item :label="t('user.table.phone')"><el-input v-model="editForm.phone" :placeholder="t('user.table.phone')" clearable style="width: 200px" disabled /></el-form-item>
        <el-form-item :label="t('user.table.sex')"><el-select-v2 v-model="editForm.sex" :options="sexArr" style="width: 200px" filterable clearable /></el-form-item>
        <el-form-item :label="t('user.table.role')"><el-select-v2 v-model="editForm.role_id" :options="roleArr" style="width: 200px" filterable clearable /></el-form-item>
        <el-form-item :label="t('user.table.avatar')"><UpMedia v-model="editForm.avatar" folder-name="avatars" :isClearable="false" /></el-form-item>
        <el-form-item :label="t('user.table.address')">
          <el-cascader
            v-model="editForm.address"
            :options="addressTree"
            :props="{ emitPath: false }"
            :placeholder="t('user.filter.address')"
            style="width: 200px; margin-right: 5px"
            clearable
            filterable
          />
          <el-input v-model="editForm.detail_address" :placeholder="t('user.filter.detail_address')" clearable style="width: 300px" />
        </el-form-item>
      </el-form>
      <el-row>
        <el-col :span="22">
          <el-form>
            <el-form-item :label="t('user.table.desc')" style="width: 100%"><el-input type="textarea" :rows="5" v-model="editForm.bio" /></el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editBoxShow = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmEdit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>

  <AppDialog v-model="batchEditBoxShow" class="add-box" :width="isMobile ? '94vw' : '650px'" :title="t('common.actions.batchEdit')">
    <div class="add-box">
      <el-form label-width="80">
        <el-form-item :label="t('user.batchEdit.field')" required><el-select-v2 v-model="batchEditForm.field" :options="batchFieldOptions" /></el-form-item>
        <el-form-item :label="t('user.table.sex')" v-if="batchEditForm.field === 'sex'"><el-select-v2 :options="sexArr" v-model="batchEditForm.sex" style="width: 300px" :placeholder="t('user.filter.sex')" clearable /></el-form-item>
        <el-form-item :label="t('user.table.address')" v-if="batchEditForm.field === 'address'"><el-cascader v-model="batchEditForm.address" :options="addressTree" :props="{ emitPath: false }" :placeholder="t('user.filter.address')" style="width: 300px" clearable filterable /></el-form-item>
        <el-form-item :label="t('user.filter.detail_address')" v-if="batchEditForm.field === 'detail_address'"><el-input v-model="batchEditForm.detail_address" :placeholder="t('user.filter.detail_address')" clearable style="width: 300px" /></el-form-item>
      </el-form>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="batchEditBoxShow = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmBatchEdit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>
</template>

<style scoped>
.user-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>
