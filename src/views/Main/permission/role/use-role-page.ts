import { computed, nextTick, onMounted, ref } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { SearchField } from '@/components/Search/types'
import {
  RoleApi,
  type RoleAddPayload,
  type RoleEditPayload,
  type RoleInitResponse,
  type RoleListItem,
  type RoleListParams,
} from '@/api/permission/role'
import { useCrudTable } from '@/hooks/useCrudTable'
import { PermissionTypeEnum, PlatformEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import { buildRolePermissionMatrix, diffPermissionIds, getRoleMatrixGroupPermissionIds } from './role-matrix'

export function useRolePage() {
  const { t } = useI18n()

  interface RoleForm {
    id: number | ''
    name: string
    permission_id: number[]
  }

  const permissionTree = ref<RoleInitResponse['dict']['permission_tree']>([])
  const platformOptions = ref<RoleInitResponse['dict']['permission_platform_arr']>([])
  const activePlatform = ref<string>(PlatformEnum.ADMIN)
  const originalPermissionIds = ref<number[]>([])

  const matrixGroups = computed(() => buildRolePermissionMatrix(permissionTree.value, activePlatform.value, {
    rootPagesLabel: t('role.permissionGroup.rootPages'),
    rootButtonsLabel: t('role.permissionGroup.rootButtons'),
  }))
  const currentPlatformPermissionIds = computed(() => matrixGroups.value.flatMap(getRoleMatrixGroupPermissionIds))
  const permissionLabelMap = computed(() => {
    const map = new Map<number, string>()
    const walk = (nodes: RoleInitResponse['dict']['permission_tree']) => {
      for (const node of nodes) {
        if (node.type === PermissionTypeEnum.PAGE || node.type === PermissionTypeEnum.BUTTON) {
          map.set(node.value, node.label)
        }
        if (node.children?.length) {
          walk(node.children)
        }
      }
    }

    walk(permissionTree.value)

    return map
  })

  const init = async () => {
    const data = await RoleApi.pageInit()
    permissionTree.value = data.dict.permission_tree
    platformOptions.value = data.dict.permission_platform_arr
    if (!platformOptions.value.some((item) => item.value === activePlatform.value)) {
      activePlatform.value = platformOptions.value[0]?.value ?? PlatformEnum.ADMIN
    }
  }

  const dialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')
  const form = ref<RoleForm>({ id: '', name: '', permission_id: [] })
  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }
  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('role.table.name') + t('common.required'), trigger: 'blur' }]
  }))

  const add = () => {
    dialogMode.value = 'add'
    form.value = { id: '', name: '', permission_id: [] }
    originalPermissionIds.value = []
    dialogVisible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  const searchForm = ref<Pick<RoleListParams, 'name'>>({ name: '' })

  const {
    loading: listLoading,
    data: listData,
    page,

    onSearch,
    onPageChange,
    refresh,
    getList,
    onSelectionChange,
    confirmDel,
    batchDel
  } = useCrudTable<RoleListItem, RoleListParams>({
    api: RoleApi,
    searchForm,
    initPage: { page_size: 50 },
  })

  const columns = [
    { key: 'name', label: t('role.table.name') },
    { key: 'is_default', label: t('role.table.is_default'), width: 120 },
    { key: 'created_at', label: t('role.table.created_at') },
    { key: 'updated_at', label: t('role.table.updated_at') },
    { key: 'actions', label: t('common.actions.action'), width: 300 },
  ]

  const edit = (current: RoleListItem) => {
    dialogMode.value = 'edit'
    const permissionIds = [...current.permission_id].sort((a, b) => a - b)
    form.value = { id: current.id, name: current.name, permission_id: permissionIds }
    originalPermissionIds.value = permissionIds
    dialogVisible.value = true
    nextTick(() => {
      formRef.value?.clearValidate()
    })
  }

  const diffDialogVisible = ref(false)
  const permissionDiff = ref<{ added: number[]; removed: number[] }>({ added: [], removed: [] })
  const addedPermissionLabels = computed(() => permissionDiff.value.added.map((id) => permissionLabelMap.value.get(id) ?? `#${id}`))
  const removedPermissionLabels = computed(() => permissionDiff.value.removed.map((id) => permissionLabelMap.value.get(id) ?? `#${id}`))
  const diffAddedTitle = computed(() => `${t('common.actions.add')}${t('role.form.permission')}`)
  const diffRemovedTitle = computed(() => `${t('common.actions.del')}${t('role.form.permission')}`)

  const submitRole = async () => {
    const addPayload: RoleAddPayload = { name: form.value.name, permission_id: form.value.permission_id }
    const editPayload: RoleEditPayload = { id: Number(form.value.id), name: form.value.name, permission_id: form.value.permission_id }

    if (dialogMode.value === 'add') {
      await RoleApi.create(addPayload)
    } else {
      await RoleApi.update(editPayload)
    }

    ElNotification.success({ message: t('common.success.operation') })
    diffDialogVisible.value = false
    dialogVisible.value = false
    void getList()
  }

  const confirmSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }

    permissionDiff.value = diffPermissionIds(originalPermissionIds.value, form.value.permission_id)
    if (permissionDiff.value.added.length === 0 && permissionDiff.value.removed.length === 0) {
      await submitRole()
      return
    }

    diffDialogVisible.value = true
  }

  const handleDefaultSwitch = async (current: Pick<RoleListItem, 'id'>) => {
    try {
      await ElMessageBox.confirm(
        t('role.confirmSetDefault'),
        t('common.confirmTitle'),
        { type: 'warning', confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel') },
      )
    } catch {
      return
    }

    await RoleApi.default({ id: current.id })
    ElNotification.success({ message: t('common.success.operation') })
    void getList()
  }

  const selectAllPermissions = () => {
    form.value.permission_id = Array.from(new Set([
      ...form.value.permission_id,
      ...currentPlatformPermissionIds.value,
    ])).sort((a, b) => a - b)
  }

  const clearCurrentPlatformPermissions = () => {
    const currentPlatformIdSet = new Set(currentPlatformPermissionIds.value)
    form.value.permission_id = form.value.permission_id.filter((id) => !currentPlatformIdSet.has(id))
  }

  const searchFields = computed<SearchField[]>(() => [
    { key: 'name', type: 'input', label: t('role.filter.name'), placeholder: t('role.filter.name'), width: 150 },
  ])
  const isMobile = useIsMobile()
  onMounted(() => {
    void init()
    void getList()
  })

  return {
    activePlatform, add, addedPermissionLabels, batchDel, clearCurrentPlatformPermissions,
    columns, confirmDel, confirmSubmit, dialogMode, dialogVisible,
    diffAddedTitle, diffDialogVisible, diffRemovedTitle, edit, form,
    handleDefaultSwitch, isMobile, listData, listLoading, matrixGroups,
    onPageChange, onSearch, onSelectionChange, page, platformOptions,
    refresh, removedPermissionLabels, rules, searchFields, searchForm,
    selectAllPermissions, submitRole, t, setFormRef,
  }
}
