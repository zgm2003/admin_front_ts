<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { useTable } from '@/hooks/useTable'
import { CronTaskApi } from '@/api/devTools/cronTask'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { useIsMobile } from '@/hooks/useResponsive'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const { t } = useI18n()
const userStore = useUserStore()
const isMobile = useIsMobile()

// 初始化数据
const cronPresets = ref<any[]>([])
const init = () => {
  CronTaskApi.init().then((res: any) => {
    cronPresets.value = res.data?.dict?.cron_preset_arr || []
  })
}

// 主列表
const searchForm = ref({ title: '' })
const { loading, data, page, onPageChange, refresh, toggleStatus, confirmDel, getList, onSearch } = useTable({
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
  { key: 'handler', label: t('cronTask.handler'), minWidth: 200 },
  { key: 'actions', label: t('common.actions.action'), width: 340 }
])

// 新增/编辑弹窗
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance | null>(null)
const defaultForm = () => ({ name: '', title: '', description: '', cron: '', cron_readable: '', handler: '', status: CommonEnum.YES })
const form = ref<any>(defaultForm())

const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: t('cronTask.form.name') + t('common.required'), trigger: 'blur' }],
  title: [{ required: true, message: t('cronTask.form.title') + t('common.required'), trigger: 'blur' }],
  cron: [{ required: true, message: t('cronTask.form.cron') + t('common.required'), trigger: 'blur' }],
  handler: [{ required: true, message: t('cronTask.form.handler') + t('common.required'), trigger: 'blur' }]
}))

const onPresetChange = (val: string) => {
  if (!val) return
  const preset = cronPresets.value.find((p: any) => p.value === val)
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

const openEdit = (row: any) => {
  dialogMode.value = 'edit'
  form.value = { id: row.id, name: row.name, title: row.title, description: row.description || '', cron: row.cron, cron_readable: row.cron_readable || '', handler: row.handler, status: row.status }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const confirmSubmit = async () => {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  const api = dialogMode.value === 'add' ? CronTaskApi.add : CronTaskApi.edit
  api(form.value).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    getList()
  })
}

// 日志弹窗
const logVisible = ref(false)
const logSearchForm = ref<any>({ task_id: 0, date: [] })
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
  onSearch: onLogSearch
} = useTable({
  api: { list: CronTaskApi.logs },
  searchForm: logSearchForm,
  immediate: false
})

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

const LOG_STATUS_TYPE = { 1: 'success', 2: 'danger', 3: 'warning' } as const

onMounted(() => init())
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <AppTable :columns="columns" :data="data" :loading="loading" :pagination="page" @refresh="refresh" @update:pagination="onPageChange">
      <template #toolbar-left>
        <el-button v-if="userStore.can('devTools_cronTask_add')" type="success" @click="openAdd">{{ t('common.actions.add') }}</el-button>
      </template>
      <template #cell-title="{ row }">
        <div class="task-title">
          <span class="title">{{ row.title }}</span>
          <span class="name text-secondary">{{ row.name }}</span>
        </div>
      </template>
      <template #cell-cron="{ row }">
        <el-tooltip :content="row.cron" placement="top">
          <el-tag size="small" type="info">{{ row.cron_readable || row.cron }}</el-tag>
        </el-tooltip>
      </template>
      <template #cell-status="{ row }">
        <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'" size="small">
          {{ row.status === CommonEnum.YES ? t('cronTask.statusEnabled') : t('cronTask.statusDisabled') }}
        </el-tag>
      </template>
      <template #cell-handler="{ row }">
        <code class="handler-code">{{ row.handler }}</code>
      </template>
      <template #cell-actions="{ row }">
        <el-button v-if="userStore.can('devTools_cronTask_edit')" type="primary" text @click="openEdit(row)">{{ t('common.actions.edit') }}</el-button>
        <el-button v-if="row.status === CommonEnum.NO && userStore.can('devTools_cronTask_status')" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
        <el-button v-if="row.status === CommonEnum.YES && userStore.can('devTools_cronTask_status')" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
        <el-button v-if="userStore.can('devTools_cronTask_logs')" type="primary" text @click="showLogs(row)">{{ t('cronTask.viewLogs') }}</el-button>
        <el-button v-if="userStore.can('devTools_cronTask_del')" type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
      </template>
    </AppTable>
  </div>

  <!-- 新增/编辑弹窗 -->
  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '600px'" draggable>
    <template #header>{{ dialogMode === 'edit' ? t('common.actions.edit') : t('common.actions.add') }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
      <el-form-item :label="t('cronTask.form.name')" prop="name" required>
        <el-input v-model="form.name" :disabled="dialogMode === 'edit'" :placeholder="t('cronTask.form.namePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.title')" prop="title" required>
        <el-input v-model="form.title" :placeholder="t('cronTask.form.titlePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.description')">
        <el-input v-model="form.description" type="textarea" :rows="2" :placeholder="t('cronTask.form.descriptionPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.cronPreset')">
        <el-select-v2 v-model="form.cron" :options="cronPresets" :placeholder="t('cronTask.form.cronPresetPlaceholder')" clearable @change="onPresetChange" style="width: 100%" />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.cron')" prop="cron" required>
        <el-input v-model="form.cron" :placeholder="t('cronTask.form.cronPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.cronReadable')">
        <el-input v-model="form.cron_readable" :placeholder="t('cronTask.form.cronReadablePlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('cronTask.form.handler')" prop="handler" required>
        <el-input v-model="form.handler" :placeholder="t('cronTask.form.handlerPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('cronTask.status')">
        <el-radio-group v-model="form.status">
          <el-radio :value="CommonEnum.YES">{{ t('cronTask.statusEnabled') }}</el-radio>
          <el-radio :value="CommonEnum.NO">{{ t('cronTask.statusDisabled') }}</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <el-alert :title="t('cronTask.form.restartTip')" type="warning" show-icon :closable="false" style="margin-top: 8px" />
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- 日志弹窗 -->
  <el-dialog v-model="logVisible" :title="t('cronTask.logsTitle', { name: logTaskTitle })" :width="isMobile ? '94vw' : '1000px'" top="10vh">
    <Search v-model="logSearchForm" :fields="logSearchFields" @query="onLogSearch" @reset="onLogSearch" />
    <AppTable :columns="logColumns" :data="logData" :loading="logLoading" :pagination="logPage" @refresh="refreshLogs" @update:pagination="onLogPageChange" :tableProps="{ height: 400 }" :fixedFooter="false">
      <template #cell-duration_ms="{ row }">{{ row.duration_ms != null ? `${row.duration_ms}ms` : '-' }}</template>
      <template #cell-status="{ row }">
        <el-tag :type="(LOG_STATUS_TYPE as any)[row.status] || 'info'" size="small">{{ row.status_name }}</el-tag>
      </template>
    </AppTable>
    <template #footer>
      <el-button @click="logVisible = false">{{ t('common.actions.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100%; }
.task-title { display: flex; flex-direction: column; gap: 2px; }
.task-title .title { font-weight: 500; }
.task-title .name { font-size: 12px; }
.text-secondary { color: var(--el-text-color-secondary); }
.handler-code { font-size: 12px; background: var(--el-fill-color-light); padding: 2px 6px; border-radius: 4px; }
</style>
