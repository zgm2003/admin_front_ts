import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { SearchField } from '@/components/Search/types'
import { createUserManagementWorkflow } from '@/features/user-management/workflow'
import { useWorkflowTable } from '@/features/shared/use-workflow-table'
import { useExportSubmit } from '@/hooks/useExportSubmit'
import { useIsMobile } from '@/hooks/useResponsive'
import { useI18n } from 'vue-i18n'
import type { DictOption } from '@/types/common'
import type {
  AddressTreeNode,
  UserBatchEditParams,
  UserEditParams,
  UserListItem,
  UserListResponse,
  UsersListParams,
} from '@/types/user'

interface UserEditDialogForm extends UserEditParams {
  phone: string
  email: string
}

export function useUserList() {
  const { t } = useI18n()
  const router = useRouter()
  const isMobile = useIsMobile()
  const workflow = createUserManagementWorkflow({
    async confirmDelete() {
      try {
        await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirmTitle'), {
          type: 'warning',
          confirmButtonText: t('common.actions.del'),
          cancelButtonText: t('common.actions.cancel'),
        })
        return true
      } catch {
        return false
      }
    },
    async confirmStatus() {
      try {
        await ElMessageBox.confirm(t('common.confirmStatusChange'), t('common.confirmTitle'), {
          type: 'warning',
          confirmButtonText: t('common.actions.confirm'),
          cancelButtonText: t('common.actions.cancel'),
        })
        return true
      } catch {
        return false
      }
    },
  })
  const { submitSelectedExport } = useExportSubmit({
    async submit(ids) {
      const result = await workflow.exportUsers.mutate({ ids })
      if (result.kind === 'canceled') throw new Error('User export was canceled')
      return result.data
    },
  })

  const sexArr = ref<DictOption<number>[]>([])
  const addressTree = ref<AddressTreeNode[]>([])
  const roleArr = ref<DictOption<number>[]>([])

  const initList = async () => {
    try {
      const data = await workflow.loadPageInit()
      sexArr.value = data.dict.sexArr
      roleArr.value = data.dict.roleArr
      addressTree.value = data.dict.auth_address_tree
    } catch (error) {
      ElNotification.error({ message: error instanceof Error ? error.message : t('common.error.operation') })
    }
  }

  const searchForm = ref({
    username: '',
    email: '',
    role_id: '' as number | '',
    sex: '' as 0 | 1 | 2 | '',
    address_id: [] as number[],
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
    clearSelection,
  } = useWorkflowTable<UserListItem, UsersListParams, UserListResponse>({
    resource: workflow.list,
    page: workflow.page,
    searchForm,
  })

  const confirmDel = async (row: UserListItem) => {
    const result = await workflow.deleteOne.mutate({ id: row.id })
    if (result.kind === 'canceled') return
    ElNotification.success({ message: t('common.success.operation') })
  }

  const batchDel = async () => {
    if (selectedIds.value.length === 0) {
      ElNotification.warning({ message: t('common.selectAtLeastOne') })
      return
    }
    const result = await workflow.deleteBatch.mutate({ ids: [...selectedIds.value] })
    if (result.kind === 'canceled') return
    clearSelection()
    ElNotification.success({ message: t('common.success.operation') })
  }

  const toggleStatus = async (row: UserListItem, status: 1 | 2) => {
    const result = await workflow.changeStatus.mutate({ id: row.id, status })
    if (result.kind === 'canceled') return
    ElNotification.success({ message: t('common.success.operation') })
  }

  const searchFields = computed<SearchField[]>(() => [
    { key: 'username', type: 'input', label: t('user.filter.username'), placeholder: t('user.filter.username'), width: 150 },
    { key: 'email', type: 'input', label: t('user.filter.email'), placeholder: t('user.filter.email'), width: 150 },
    { key: 'role_id', type: 'select-v2', label: t('user.filter.role'), options: roleArr.value, placeholder: t('user.filter.role'), width: 150 },
    { key: 'sex', type: 'select-v2', label: t('user.filter.sex'), options: sexArr.value, placeholder: t('user.filter.sex'), width: 150 },
    {
      key: 'address_id',
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
    address_id: 0,
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
      address_id: current.address_id,
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
      address_id: editForm.value.address_id,
      detail_address: editForm.value.detail_address,
      bio: editForm.value.bio,
    }

    await workflow.update.mutate(payload)
    ElNotification.success({ message: t('common.success.operation') })
    editBoxShow.value = false
  }

  const batchEditBoxShow = ref(false)
  const batchFieldOptions = computed(() => [
    { value: 'sex', label: t('user.table.sex') },
    { value: 'address_id', label: t('user.table.address') },
    { value: 'detail_address', label: t('user.filter.detail_address') },
  ])

  const batchEditForm = ref<{
    ids: number[]
    field: '' | UserBatchEditParams['field']
    sex: 0 | 1 | 2 | null
    address_id: number | null
    detail_address: string
  }>({
    ids: [],
    field: '',
    sex: null,
    address_id: null,
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
      address_id: null,
      detail_address: '',
    }
    batchEditBoxShow.value = true
  }

  const confirmBatchEdit = async () => {
    const { ids, field, sex, address_id, detail_address } = batchEditForm.value
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
    } else if (field === 'address_id') {
      if (address_id === null) {
        ElNotification.warning({ message: t('user.warning.fillComplete') })
        return
      }
      payload = { ids, field, address_id }
    } else {
      payload = { ids, field, detail_address }
    }

    await workflow.batchEdit.mutate(payload)
    ElNotification.success({ message: t('common.success.operation') })
    batchEditBoxShow.value = false
  }

  const goToPersonal = (row: UserListItem) => {
    router.push({ path: '/personal', query: { user_id: row.id } })
  }

  const exportExcel = async () => {
    await submitSelectedExport(selectedIds.value)
  }

  onMounted(() => {
    void initList()
    void getList()
  })

  onUnmounted(() => workflow.dispose())

  return {
    t, isMobile, searchForm, searchFields, listLoading, listData, page,
    onSearch, onPageChange, refresh, onSelectionChange,
    confirmDel, batchDel, toggleStatus, edit, exportExcel, batchEdit,
    editBoxShow, editForm, roleArr, sexArr, addressTree, confirmEdit,
    batchEditBoxShow, batchFieldOptions, batchEditForm, confirmBatchEdit,
    goToPersonal,
  }
}
