import { computed, ref, shallowRef } from 'vue'
import { ElMessageBox, ElNotification } from 'element-plus'
import { useI18n } from 'vue-i18n'
import type { SearchField } from '@/components/Search/types'
import {
  PermissionApi,
  type PermissionInitResponse,
  type PermissionListItem,
  type PermissionListParams,
  type PermissionEditPayload,
  type PermissionMutationPayload,
  type PermissionTreeNode,
} from '@/api/permission/permission'
import { CommonEnum, PermissionTypeEnum, PlatformEnum } from '@/enums'
import { applyParentSelectableState, normalizePermissionParentId } from '../helpers'

export interface PermissionFormState {
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

export interface PermissionHealthWarning {
  key: 'page-missing-route' | 'button-missing-code' | 'admin-button-root'
  type: 'warning' | 'error'
  label: string
  count: number
}

export function createDefaultPermissionForm(platform: string): PermissionFormState {
  return {
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
  }
}

function filterTreeByPlatform(tree: PermissionTreeNode[], platform: string): PermissionTreeNode[] {
  return tree
    .filter((node) => node.platform === platform)
    .map((node) => ({
      ...node,
      children: node.children ? filterTreeByPlatform(node.children, platform) : [],
    }))
}

function flattenRows(rows: PermissionListItem[]): PermissionListItem[] {
  return rows.flatMap((row) => [row, ...flattenRows(row.children ?? [])])
}

function countPagesMissingRoute(rows: PermissionListItem[]): number {
  return flattenRows(rows).filter((row) => (
    row.type === PermissionTypeEnum.PAGE
    && (row.path.trim() === '' || row.component.trim() === '')
  )).length
}

function countButtonsMissingCode(rows: PermissionListItem[]): number {
  return flattenRows(rows).filter((row) => row.type === PermissionTypeEnum.BUTTON && row.code.trim() === '').length
}

function countAdminRootButtons(rows: PermissionListItem[], platform: string): number {
  if (platform !== PlatformEnum.ADMIN) {
    return 0
  }

  return flattenRows(rows).filter((row) => row.type === PermissionTypeEnum.BUTTON && row.parent_id === 0).length
}

export function usePermissionDefinitionPage() {
  const { t } = useI18n()

  const permissionTree = ref<PermissionInitResponse['dict']['permission_tree']>([])
  const permissionTypeArr = ref<PermissionInitResponse['dict']['permission_type_arr']>([])
  const platformOptions = ref<PermissionInitResponse['dict']['permission_platform_arr']>([])
  const activePlatform = shallowRef<string>(PlatformEnum.ADMIN)

  const dialogVisible = shallowRef(false)
  const dialogMode = shallowRef<'add' | 'edit'>('add')
  const form = ref<PermissionFormState>(createDefaultPermissionForm(activePlatform.value))

  const listLoading = shallowRef(false)
  const listData = ref<PermissionListItem[]>([])
  const searchForm = ref<Pick<PermissionListParams, 'name'>>({ name: '' })
  const isExpanded = shallowRef(false)
  const selectedIds = ref<Array<PermissionListItem['id']>>([])

  const parentTree = computed(() => applyParentSelectableState(
    filterTreeByPlatform(permissionTree.value, form.value.platform),
    { platform: form.value.platform, type: form.value.type },
  ))

  const filteredTypeArr = computed(() => permissionTypeArr.value)

  const searchFields = computed<SearchField[]>(() => [
    { key: 'name', type: 'input', label: t('permission.filter.name'), placeholder: t('permission.filter.name'), width: 150 },
  ])

  const healthWarnings = computed<PermissionHealthWarning[]>(() => {
    const warnings: PermissionHealthWarning[] = []
    const missingRouteCount = countPagesMissingRoute(listData.value)
    const missingCodeCount = countButtonsMissingCode(listData.value)
    const adminRootButtonCount = countAdminRootButtons(listData.value, activePlatform.value)

    if (missingRouteCount > 0) {
      warnings.push({
        key: 'page-missing-route',
        type: 'warning',
        label: t('permission.health.pageMissingRoute', { count: missingRouteCount }),
        count: missingRouteCount,
      })
    }

    if (missingCodeCount > 0) {
      warnings.push({
        key: 'button-missing-code',
        type: 'warning',
        label: t('permission.health.buttonMissingCode', { count: missingCodeCount }),
        count: missingCodeCount,
      })
    }

    if (adminRootButtonCount > 0) {
      warnings.push({
        key: 'admin-button-root',
        type: 'error',
        label: t('permission.health.adminButtonRoot', { count: adminRootButtonCount }),
        count: adminRootButtonCount,
      })
    }

    return warnings
  })

  async function init() {
    const data = await PermissionApi.init()
    permissionTree.value = data.dict.permission_tree
    permissionTypeArr.value = data.dict.permission_type_arr
    platformOptions.value = data.dict.permission_platform_arr
    if (!platformOptions.value.some((item) => item.value === activePlatform.value)) {
      activePlatform.value = platformOptions.value[0]?.value ?? PlatformEnum.ADMIN
    }
  }

  async function getList() {
    listLoading.value = true
    try {
      const param: PermissionListParams = { ...searchForm.value, platform: activePlatform.value }
      listData.value = await PermissionApi.list(param)
    } finally {
      listLoading.value = false
    }
  }

  function onSearch() {
    void getList()
  }

  function openAdd() {
    dialogMode.value = 'add'
    form.value = createDefaultPermissionForm(activePlatform.value)
    dialogVisible.value = true
  }

  function openAddChild(current: PermissionListItem) {
    dialogMode.value = 'add'
    const nextType = Math.min(PermissionTypeEnum.BUTTON, current.type + 1)
    form.value = {
      ...createDefaultPermissionForm(activePlatform.value),
      parent_id: current.id,
      type: nextType,
    }
    dialogVisible.value = true
  }

  function openEdit(current: PermissionListItem) {
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
      platform: activePlatform.value,
    }
    dialogVisible.value = true
  }

  function buildMutationPayload(): PermissionMutationPayload {
    const parentId = normalizePermissionParentId(form.value.parent_id, {
      platform: form.value.platform,
      type: form.value.type,
    })

    return {
      name: form.value.name,
      parent_id: parentId,
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
  }

  async function submitForm() {
    let payload: PermissionMutationPayload
    try {
      payload = buildMutationPayload()
    } catch {
      ElNotification.error({ message: t('permission.form.rule.parent_id') })
      return
    }

    if (dialogMode.value === 'add') {
      await PermissionApi.add(payload)
    } else {
      if (form.value.id === '') {
        ElNotification.error({ message: '权限ID缺失' })
        return
      }

      const editPayload: PermissionEditPayload = {
        ...payload,
        id: form.value.id,
      }
      await PermissionApi.edit(editPayload)
    }

    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    await Promise.all([getList(), init()])
  }

  function setSelectedRows(selection: PermissionListItem[]) {
    selectedIds.value = selection.map((item) => item.id)
  }

  async function batchDel() {
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

    await PermissionApi.delBatch({ ids: selectedIds.value })
    ElNotification.success({ message: t('common.success.operation') })
    selectedIds.value = []
    await getList()
  }

  function confirmIcon(iconName: string) {
    form.value.icon = iconName
  }

  function toggleStatusValue(status: number) {
    return status === CommonEnum.YES ? CommonEnum.NO : CommonEnum.YES
  }

  async function changeStatus(row: PermissionListItem) {
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

    try {
      await PermissionApi.status({ id: row.id, status: row.status })
      ElNotification.success({ message: t('common.success.operation') })
    } catch {
      row.status = toggleStatusValue(row.status)
    }
  }

  function switchPlatform(platform?: string) {
    if (platform) {
      activePlatform.value = platform
    }
    selectedIds.value = []
    isExpanded.value = false
    void getList()
  }

  function toggleExpand() {
    isExpanded.value = !isExpanded.value
  }

  return {
    platformOptions,
    activePlatform,
    parentTree,
    filteredTypeArr,
    dialogVisible,
    dialogMode,
    form,
    listLoading,
    listData,
    searchForm,
    searchFields,
    isExpanded,
    selectedIds,
    healthWarnings,
    init,
    getList,
    onSearch,
    openAdd,
    openAddChild,
    openEdit,
    submitForm,
    setSelectedRows,
    batchDel,
    changeStatus,
    confirmIcon,
    switchPlatform,
    toggleExpand,
  }
}
