import {ref, computed, onMounted, nextTick, shallowRef} from 'vue'
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus'
import {useI18n} from 'vue-i18n'
import type {FormInstance} from 'element-plus'
import type {SearchField} from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'
import {useCopy} from '@/hooks/useCopy'
import {useIsMobile} from '@/hooks/useResponsive'
import {
  NotificationTaskApi,
  type NotificationTaskAddParams,
  type NotificationTaskInitResponse,
  type NotificationTaskItem,
  type NotificationTaskStatusItem,
  type NotificationTaskStatus,
} from '@/api/system/notificationTask'

export function useNotificationTaskPage() {
  const {t} = useI18n()
  const isMobile = useIsMobile()
  const {copy} = useCopy()
  const statusArr = ref<NotificationTaskStatusItem[]>([])
  const searchForm = ref({status: '' as NotificationTaskStatus | '', title: ''})

  // 字典数据
  const typeArr = ref<NotificationTaskInitResponse['dict']['notification_type_arr']>([])
  const levelArr = ref<NotificationTaskInitResponse['dict']['notification_level_arr']>([])
  const targetTypeArr = ref<NotificationTaskInitResponse['dict']['notification_target_type_arr']>([])
  const platformArr = ref<NotificationTaskInitResponse['dict']['platformArr']>([])

  const loadStatusCount = async () => {
    const data = await NotificationTaskApi.statusCount({title: searchForm.value.title})
    statusArr.value = data
    searchForm.value.status = data[0]?.value ?? ''
    await getList()
  }

  const refreshStatusCount = async () => {
    statusArr.value = await NotificationTaskApi.statusCount({title: searchForm.value.title})
  }

  const handleSearch = async () => {
    await getList()
    await refreshStatusCount()
  }

  const handleRefresh = async () => {
    await getList()
    await refreshStatusCount()
  }

  const {
    loading: listLoading,
    data: listData,
    page,
    onPageChange,
    getList,
    confirmDel
  } = useCrudTable({
    api: NotificationTaskApi,
    searchForm,
    afterDel: refreshStatusCount
  })

  const searchFields = computed<SearchField[]>(() => [
    {key: 'title', type: 'input', label: t('notificationTask.title'), placeholder: t('notificationTask.title'), width: 180}
  ])

  const columns = [
    {key: 'id', label: 'ID'},
    {key: 'title', label: t('notificationTask.title')},
    {key: 'type', label: t('notificationTask.type')},
    {key: 'level', label: t('notificationTask.level')},
    {key: 'platform', label: t('notificationTask.platform'), width: 120},
    {key: 'target_type', label: t('notificationTask.targetType')},
    {key: 'progress', label: t('notificationTask.progress')},
    {key: 'status', label: t('notificationTask.status')},
    {key: 'error_msg', label: t('notificationTask.errorMsg'), width: 150},
    {key: 'send_at', label: t('notificationTask.sendAt')},
    {key: 'created_at', label: t('common.createdAt')},
    {key: 'actions', label: t('common.actions.action'), width: 180}
  ]

  const handleChangeStatus = async () => {
    await getList()
    await refreshStatusCount()
  }

  const getStatusType = (status: number): 'warning' | 'success' | 'danger' | 'info' | 'primary' => {
    return ({1: 'warning', 2: 'primary', 3: 'success', 4: 'danger'} as const)[status as 1 | 2 | 3 | 4] || 'info'
  }

  const getTypeColor = (type: number): 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
    return ({1: 'info', 2: 'success', 3: 'warning', 4: 'danger'} as const)[type as 1 | 2 | 3 | 4] || 'info'
  }

  // 弹窗
  const dialogVisible = ref(false)
  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }
  const submitLoading = shallowRef(false)
  const form = ref<NotificationTaskAddParams>({
    title: '',
    content: '',
    type: 1,
    level: 1,
    link: '',
    platform: 'all',
    target_type: 1,
    target_ids: [] as number[],
    send_at: ''
  })

  const showAdd = () => {
    form.value = {title: '', content: '', type: 1, level: 1, link: '', platform: 'all', target_type: 1, target_ids: [], send_at: ''}
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }
    submitLoading.value = true
    try {
      await NotificationTaskApi.create(form.value)
      ElNotification.success({message: t('common.success.operation')})
      dialogVisible.value = false
      await loadStatusCount()
    } finally {
      submitLoading.value = false
    }
  }

  // 取消任务
  const handleCancel = async (row: Pick<NotificationTaskItem, 'id'>) => {
    try {
      await ElMessageBox.confirm(t('notificationTask.cancelConfirm'), t('common.confirmTitle'), {
        type: 'warning',
        confirmButtonText: t('common.actions.confirm'),
        cancelButtonText: t('common.actions.cancel')
      })
    } catch {
      return
    }

    await NotificationTaskApi.cancel({id: row.id})
    ElMessage.success(t('common.success.operation'))
    await loadStatusCount()
  }

  onMounted(async () => {
    const data = await NotificationTaskApi.pageInit()
    typeArr.value = data.dict.notification_type_arr
    levelArr.value = data.dict.notification_level_arr
    targetTypeArr.value = data.dict.notification_target_type_arr
    platformArr.value = data.dict.platformArr
    await loadStatusCount()
  })

  return {
    columns, confirmDel, copy, dialogVisible, form,
    getStatusType, getTypeColor, handleCancel, handleChangeStatus, handleRefresh,
    handleSearch, handleSubmit, isMobile, levelArr, listData,
    listLoading, onPageChange, page, platformArr, searchFields,
    searchForm, showAdd, statusArr, submitLoading, t,
    targetTypeArr, typeArr, setFormRef,
  }
}
