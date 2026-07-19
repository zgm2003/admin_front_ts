import { ref, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCrudTable } from '@/hooks/useCrudTable'
import {
  CronTaskApi,
  type CronPresetItem,
  type CronTaskForm,
  type CronTaskItem,
} from '@/api/system/cronTask'
import { CommonEnum } from '@/enums'
import { useIsMobile } from '@/hooks/useResponsive'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useCronTaskLogs } from './composables/useCronTaskLogs'

export function useCronTaskPage() {
  const { t } = useI18n()
  const isMobile = useIsMobile()

  // 初始化数据
  const cronPresets = ref<CronPresetItem[]>([])
  const init = () => {
    CronTaskApi.pageInit().then((res) => {
      cronPresets.value = res.dict.cron_preset_arr
    })
  }

  // 主列表
  const searchForm = ref<{ title: string }>({ title: '' })
  const { loading, data, page, onPageChange, refresh, toggleStatus, confirmDel, getList, onSearch } = useCrudTable({
    api: CronTaskApi,
    searchForm,
    immediate: true
  })

  const searchFields = [
    { key: 'title', type: 'input' as const, label: t('cronTask.taskName'), placeholder: t('cronTask.taskName'), width: 150 }
  ]

  const columns = computed(() => [
    { key: 'title', label: t('cronTask.taskName'), minWidth: 150 },
    { key: 'description', label: t('cronTask.description'), minWidth: 200, overflowTooltip: true },
    { key: 'cron', label: t('cronTask.cronExpr'), width: 140 },
    { key: 'next_run_time', label: t('cronTask.nextRunTime'), width: 180 },
    { key: 'status', label: t('cronTask.status'), width: 100 },
    { key: 'handler', label: t('cronTask.handler'), minWidth: 220 },
    { key: 'actions', label: t('common.actions.action'), width: 340 }
  ])

  // 新增/编辑弹窗
  const dialogVisible = ref(false)
  const dialogMode = ref<'add' | 'edit'>('add')
  const formRef = ref<FormInstance | null>(null)

  function setFormRef(element: unknown) {
    formRef.value = element as FormInstance | null
  }
  const defaultForm = () => ({ name: '', title: '', description: '', cron: '', cron_readable: '', handler: '', status: CommonEnum.YES })
  const form = ref<CronTaskForm>(defaultForm())

  const rules = computed<FormRules>(() => ({
    name: [{ required: true, message: t('cronTask.form.name') + t('common.required'), trigger: 'blur' }],
    title: [{ required: true, message: t('cronTask.form.title') + t('common.required'), trigger: 'blur' }],
    cron: [{ required: true, message: t('cronTask.form.cron') + t('common.required'), trigger: 'blur' }]
  }))

  const onPresetChange = (val: string) => {
    if (!val) return
    const preset = cronPresets.value.find((p) => p.value === val)
    if (preset) {
      form.value.cron = preset.value
      form.value.cron_readable = preset.label
    }
  }

  const openAdd = () => {
    dialogMode.value = 'add'
    form.value = defaultForm()
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const openEdit = (row: CronTaskItem) => {
    dialogMode.value = 'edit'
    form.value = { id: row.id, name: row.name, title: row.title, description: row.description, cron: row.cron, cron_readable: row.cron_readable, handler: row.handler, status: row.status }
    dialogVisible.value = true
    nextTick(() => formRef.value?.clearValidate())
  }

  const confirmSubmit = async () => {
    if (!formRef.value) return
    try { await formRef.value.validate() } catch { return }

    if (dialogMode.value === 'add') {
      await CronTaskApi.create(form.value)
    } else if (form.value.id != null) {
      await CronTaskApi.update({ ...form.value, id: form.value.id })
    }

    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    getList()
  }

  // 日志弹窗
  const logVisible = ref(false)
  const logSearchForm = ref<{ task_id: number; date: string[] }>({ task_id: 0, date: [] })
  const logTaskTitle = ref('')

  const logSearchFields = [
    { key: 'date', type: 'date-range' as const, label: t('cronTask.log.startTime'), width: 240 }
  ]

  const {
    loading: logLoading,
    data: logData,
    page: logPage,
    onPageChange: onLogPageChange,
    refresh: refreshLogs,
    onSearch: onLogSearch,
  } = useCronTaskLogs(logSearchForm)

  const showLogs = (row: { id: number; title: string }) => {
    logTaskTitle.value = row.title
    logSearchForm.value = { task_id: row.id, date: [] }
    logVisible.value = true
    refreshLogs()
  }

  const logColumns = computed(() => [
    { key: 'start_time', label: t('cronTask.log.startTime'), width: 180 },
    { key: 'end_time', label: t('cronTask.log.endTime'), width: 180 },
    { key: 'duration_ms', label: t('cronTask.log.duration'), width: 100 },
    { key: 'status', label: t('cronTask.status'), width: 100 },
    { key: 'result', label: t('cronTask.log.result'), minWidth: 150, overflowTooltip: true },
    { key: 'error_msg', label: t('cronTask.log.errorMsg'), minWidth: 150, overflowTooltip: true }
  ])

  const LOG_STATUS_TYPE: Record<number, 'success' | 'danger' | 'warning' | 'info'> = { 1: 'success', 2: 'danger', 3: 'warning' }

  const logStatusType = (status: number) => LOG_STATUS_TYPE[status] ?? 'info'
  const displayTaskType = (row: CronTaskItem) => row.handler || '-'

  onMounted(() => init())

  return {
    columns, confirmDel, confirmSubmit, cronPresets, data,
    dialogMode, dialogVisible, displayTaskType, form, isMobile,
    loading, logColumns, logData, logLoading, logPage,
    logSearchFields, logSearchForm, logStatusType, logTaskTitle, logVisible,
    onLogPageChange, onLogSearch, onPageChange, onPresetChange, onSearch,
    openAdd, openEdit, page, refresh, refreshLogs,
    rules, searchFields, searchForm, showLogs, t,
    toggleStatus, setFormRef,
  }
}
