<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {ElMessage, ElMessageBox, ElNotification} from 'element-plus'
import {DocumentCopy} from '@element-plus/icons-vue'
import {useI18n} from 'vue-i18n'
import { AppDialog } from '@/components/AppDialog'
import type {FormInstance} from 'element-plus'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {RemoteSelect} from '@/components/RemoteSelect'
import { useCrudTable } from '@/hooks/useCrudTable'
import {useCopy} from '@/hooks/useCopy'
import {useIsMobile} from '@/hooks/useResponsive'
import {
  NotificationTaskApi,
  type NotificationTaskAddParams,
  type NotificationTaskInitResponse,
  type NotificationTaskItem,
  type NotificationTaskStatusItem,
} from '@/api/system/notificationTask'
import {UsersListApi} from '@/api/user/users'
import {RoleApi} from '@/api/permission/role'
import type { UserListItem } from '@/types/user'

const {t} = useI18n()
const isMobile = useIsMobile()
const {copy} = useCopy()
const statusArr = ref<NotificationTaskStatusItem[]>([])
const searchForm = ref({status: '' as number | '', title: ''})

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

const {
  loading: listLoading,
  data: listData,
  page,
  onPageChange,
  refresh,
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
const submitLoading = ref(false)
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
  NotificationTaskApi.add(form.value).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    dialogVisible.value = false
    loadStatusCount()
  }).finally(() => {
    submitLoading.value = false
  })
}

// 取消任务
const handleCancel = (row: Pick<NotificationTaskItem, 'id'>) => {
  ElMessageBox.confirm(t('notificationTask.cancelConfirm'), t('common.confirmTitle'), {
    type: 'warning',
    confirmButtonText: t('common.actions.confirm'),
    cancelButtonText: t('common.actions.cancel')
  })
    .then(() => {
      NotificationTaskApi.cancel({id: row.id}).then(() => {
        ElMessage.success(t('common.success.operation'))
        void loadStatusCount()
      })
    })
    .catch(() => {})
}

onMounted(() => {
  NotificationTaskApi.init().then((data) => {
    typeArr.value = data.dict.notification_type_arr
    levelArr.value = data.dict.notification_level_arr
    targetTypeArr.value = data.dict.notification_target_type_arr
    platformArr.value = data.dict.platformArr
  })
  void loadStatusCount()
})
</script>

<template>
  <div class="box">
    <el-tabs v-model="searchForm.status" @tab-change="handleChangeStatus">
      <el-tab-pane v-for="item in statusArr" :key="item.value" :name="item.value">
        <template #label>{{ item.label }} ({{ item.num }})</template>
      </el-tab-pane>
    </el-tabs>

    <Search v-model="searchForm" :fields="searchFields" @query="handleSearch" @reset="handleSearch" />
    
    <AppTable :columns="columns" :data="listData" :loading="listLoading" :pagination="page"
              @update:pagination="onPageChange" @refresh="refresh">
      <template #toolbar-left>
        <el-button type="primary" @click="showAdd">{{ t('notificationTask.publish') }}</el-button>
      </template>
      
     <template #cell-title="{row}">
        <span>{{ row.title }}</span>
      </template>
      
      <template #cell-type="{row}">
        <el-tag :type="getTypeColor(row.type)" size="small">{{ row.type_text }}</el-tag>
      </template>
      
      <template #cell-level="{row}">
        <el-tag :type="row.level === 2 ? 'danger' : 'info'" size="small">{{ row.level_text }}</el-tag>
      </template>
      
      <template #cell-platform="{row}">
        <el-tag size="small">{{ row.platform_text }}</el-tag>
      </template>
      
      <template #cell-target_type="{row}">
        <span>{{ row.target_type_text }}</span>
      </template>
      
      <template #cell-progress="{row}">
        <span>{{ row.sent_count }} / {{ row.total_count }}</span>
      </template>
      
     <template #cell-status="{row}">
        <el-tag :type="getStatusType(row.status)" size="small">{{ row.status_text }}</el-tag>
      </template>
      
      <template #cell-error_msg="{row}">
        <div v-if="row.error_msg" class="cell-error">
          <span class="error-text">{{ row.error_msg }}</span>
          <el-button :icon="DocumentCopy" link size="small" @click="copy(row.error_msg)" />
        </div>
        <span v-else class="text-secondary">-</span>
      </template>
      
      <template #cell-send_at="{row}">
        <span v-if="row.send_at">{{ row.send_at }}</span>
        <span v-else class="text-secondary">{{ t('notificationTask.immediate') }}</span>
      </template>
      
      <template #cell-actions="{row}">
        <el-button v-if="row.status === 1" type="warning" text @click="handleCancel(row)">{{ t('notificationTask.cancel') }}</el-button>
        <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
      </template>
    </AppTable>
    
    <!-- 发布弹窗 -->
    <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '600px'">
      <template #header>{{ t('notificationTask.publish') }}</template>
      <el-form :model="form" ref="formRef" label-width="100px">
        <el-form-item :label="t('notificationTask.title')" prop="title" :rules="[{required: true, message: t('notificationTask.title') + t('common.required')}]">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item :label="t('notificationTask.content')">
          <el-input v-model="form.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item :label="t('notificationTask.type')">
          <el-radio-group v-model="form.type">
            <el-radio v-for="item in typeArr" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('notificationTask.level')">
          <el-radio-group v-model="form.level">
            <el-radio v-for="item in levelArr" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-alert :title="t('notificationTask.levelHelp')" type="primary" :closable="false" show-icon />
        </el-form-item>
        <el-form-item :label="t('notificationTask.link')">
          <el-input v-model="form.link" placeholder="/path/to/page" />
        </el-form-item>
        <el-form-item :label="t('notificationTask.platform')">
          <el-radio-group v-model="form.platform">
            <el-radio v-for="item in platformArr" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="t('notificationTask.targetType')" prop="target_type" :rules="[{required: true, message: t('notificationTask.targetType') + t('common.required')}]">
          <el-radio-group v-model="form.target_type" @change="form.target_ids = []">
            <el-radio v-for="item in targetTypeArr" :key="item.value" :value="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.target_type === 2" :label="t('notificationTask.selectUsers')">
          <RemoteSelect v-model="form.target_ids" multiple :fetch-method="UsersListApi.list"
                        :label-field="(item: UserListItem) => item.username" value-field="id"
                        :placeholder="t('notificationTask.searchUsers')" width="100%" />
        </el-form-item>
        <el-form-item v-if="form.target_type === 3" :label="t('notificationTask.selectRoles')">
          <RemoteSelect v-model="form.target_ids" multiple :fetch-method="RoleApi.list"
                        label-field="name" value-field="id" keyword-field="name"
                        :placeholder="t('notificationTask.searchRoles')" width="100%" />
        </el-form-item>
        <el-form-item :label="t('notificationTask.sendAt')">
          <el-date-picker v-model="form.send_at" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
                          :placeholder="t('notificationTask.sendAtPlaceholder')" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ t('common.actions.confirm') }}</el-button>
      </template>
    </AppDialog>
  </div>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.text-secondary { color: var(--el-text-color-secondary) }
.cell-error { display: flex; align-items: center; gap: 4px }
.error-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--el-color-danger) }
</style>
