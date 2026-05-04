<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import {
  AuthPlatformApi,
  type AuthPlatformAddPayload,
  type AuthPlatformEditPayload,
  type AuthPlatformInitResponse,
  type AuthPlatformItem,
  type AuthPlatformListParams,
} from '@/api/permission/authPlatform'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { AppTable } from '@/components/Table'
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import FormDialog from './components/FormDialog.vue'
import { createAuthPlatformDefaultForm, type AuthPlatformForm } from './helpers'

const { t } = useI18n()
const userStore = useUserStore()

const dict = ref<AuthPlatformInitResponse['dict']>({
  common_status_arr: [],
  auth_platform_login_type_arr: [],
  auth_platform_captcha_type_arr: [],
})

const searchForm = ref<Pick<AuthPlatformListParams, 'name' | 'status'>>({ name: '', status: '' })

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
  batchDel,
  toggleStatus
} = useCrudTable<AuthPlatformItem, AuthPlatformListParams>({ api: AuthPlatformApi, searchForm })

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

const defaultForm = (): AuthPlatformForm => createAuthPlatformDefaultForm()

const form = ref<AuthPlatformForm>(defaultForm())

// TTL 格式化显示
const formatTtl = (seconds: number): string => {
  if (seconds >= 86400 && seconds % 86400 === 0) return `${seconds / 86400} ${t('authPlatform.ttlFormat.day')}`
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600} ${t('authPlatform.ttlFormat.hour')}`
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} ${t('authPlatform.ttlFormat.minute')}`
  return `${seconds}s`
}

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('authPlatform.filter.name'), placeholder: t('authPlatform.filter.name'), width: 200 },
  { key: 'status', type: 'select-v2', label: t('authPlatform.filter.status'), placeholder: t('authPlatform.filter.status'), width: 160,
    options: dict.value.common_status_arr }
])

const columns = computed(() => [
  { key: 'code', label: t('authPlatform.table.code'), width: 120 },
  { key: 'name', label: t('authPlatform.table.name'), width: 140 },
  { key: 'login_types', label: t('authPlatform.table.login_types'), width: 300 },
  { key: 'captcha_type', label: t('authPlatform.table.captcha_type'), width: 120 },
  { key: 'access_ttl', label: t('authPlatform.table.access_ttl'), width: 130 },
  { key: 'refresh_ttl', label: t('authPlatform.table.refresh_ttl'), width: 130 },
  { key: 'bind_platform', label: t('authPlatform.table.bind_platform'), width: 100 },
  { key: 'bind_device', label: t('authPlatform.table.bind_device'), width: 100 },
  { key: 'bind_ip', label: t('authPlatform.table.bind_ip'), width: 90 },
  { key: 'single_session', label: t('authPlatform.table.single_session'), width: 100 },
  { key: 'max_sessions', label: t('authPlatform.table.max_sessions'), width: 110 },
  { key: 'allow_register', label: t('authPlatform.table.allow_register'), width: 100 },
  { key: 'status', label: t('authPlatform.table.status'), width: 100 },
  { key: 'updated_at', label: t('authPlatform.table.updated_at'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 240,fixed: 'right' }
])

const init = () => {
  AuthPlatformApi.init().then((data) => {
    dict.value = data.dict
  })
}

const add = () => {
  dialogMode.value = 'add'
  form.value = defaultForm()
  dialogVisible.value = true
}

const edit = (row: AuthPlatformItem) => {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    code: row.code,
    name: row.name,
    login_types: row.login_types,
    captcha_type: row.captcha_type,
    access_ttl: row.access_ttl,
    refresh_ttl: row.refresh_ttl,
    bind_platform: row.bind_platform,
    bind_device: row.bind_device,
    bind_ip: row.bind_ip,
    single_session: row.single_session,
    max_sessions: row.max_sessions,
    allow_register: row.allow_register,
  }
  dialogVisible.value = true
}

const confirmSubmit = async (submittedForm: AuthPlatformForm) => {
  if (dialogMode.value === 'add') {
    const addPayload: AuthPlatformAddPayload = {
      code: submittedForm.code,
      name: submittedForm.name,
      login_types: submittedForm.login_types,
      captcha_type: submittedForm.captcha_type,
      access_ttl: submittedForm.access_ttl,
      refresh_ttl: submittedForm.refresh_ttl,
      bind_platform: submittedForm.bind_platform,
      bind_device: submittedForm.bind_device,
      bind_ip: submittedForm.bind_ip,
      single_session: submittedForm.single_session,
      max_sessions: submittedForm.max_sessions,
      allow_register: submittedForm.allow_register,
    }
    await AuthPlatformApi.add(addPayload)
  } else {
    const editPayload: AuthPlatformEditPayload = {
      id: Number(submittedForm.id),
      name: submittedForm.name,
      login_types: submittedForm.login_types,
      captcha_type: submittedForm.captcha_type,
      access_ttl: submittedForm.access_ttl,
      refresh_ttl: submittedForm.refresh_ttl,
      bind_platform: submittedForm.bind_platform,
      bind_device: submittedForm.bind_device,
      bind_ip: submittedForm.bind_ip,
      single_session: submittedForm.single_session,
      max_sessions: submittedForm.max_sessions,
      allow_register: submittedForm.allow_register,
    }
    await AuthPlatformApi.edit(editPayload)
  }

  ElNotification.success({ message: t('common.success.operation') })
  dialogVisible.value = false
  getList()
}

// 登录方式 tag 映射（从 dict 动态取 label）
const loginTypeLabelMap = computed(() => {
  const map = new Map<string, string>()
  for (const item of dict.value.auth_platform_login_type_arr) {
    map.set(item.value, item.label)
  }
  return map
})

const getLoginTypeLabel = (val: string): string => {
  return loginTypeLabelMap.value.get(val) ?? ''
}

const captchaTypeLabelMap = computed(() => {
  const map = new Map<string, string>()
  for (const item of dict.value.auth_platform_captcha_type_arr) {
    map.set(item.value, item.label)
  }
  return map
})

const getCaptchaTypeLabel = (val: string): string => {
  return captchaTypeLabelMap.value.get(val) ?? ''
}

onMounted(() => { init(); getList() })
</script>

<template>
  <div class="box">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
    <div class="table">
      <AppTable
        :columns="columns"
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
          <el-button
            v-if="userStore.can('permission_authPlatform_add')"
            type="success"
            @click="add"
          >
            {{ t('common.actions.add') }}
          </el-button>
          <el-button
            v-if="userStore.can('permission_authPlatform_del')"
            type="danger"
            @click="batchDel"
          >
            {{ t('common.actions.batchDelete') }}
          </el-button>
        </template>

        <template #cell-login_types="{ row }">
          <el-tag
            v-for="lt in row.login_types"
            :key="lt"
            size="small"
            style="margin-right:4px"
          >
            {{ getLoginTypeLabel(lt) }}
          </el-tag>
        </template>
        <template #cell-captcha_type="{ row }">
          <el-tag size="small">
            {{ getCaptchaTypeLabel(row.captcha_type) }}
          </el-tag>
        </template>
        <template #cell-access_ttl="{ row }">
          {{ formatTtl(row.access_ttl) }}
        </template>
        <template #cell-refresh_ttl="{ row }">
          {{ formatTtl(row.refresh_ttl) }}
        </template>
        <template #cell-bind_platform="{ row }">
          <el-tag
            :type="row.bind_platform === CommonEnum.YES ? 'success' : 'info'"
            size="small"
          >
            {{ row.bind_platform === CommonEnum.YES ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>
        <template #cell-bind_device="{ row }">
          <el-tag
            :type="row.bind_device === CommonEnum.YES ? 'success' : 'info'"
            size="small"
          >
            {{ row.bind_device === CommonEnum.YES ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>
        <template #cell-bind_ip="{ row }">
          <el-tag
            :type="row.bind_ip === CommonEnum.YES ? 'success' : 'info'"
            size="small"
          >
            {{ row.bind_ip === CommonEnum.YES ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>
        <template #cell-single_session="{ row }">
          <el-tag
            :type="row.single_session === CommonEnum.YES ? 'warning' : 'info'"
            size="small"
          >
            {{ row.single_session === CommonEnum.YES ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>
        <template #cell-allow_register="{ row }">
          <el-tag
            :type="row.allow_register === CommonEnum.YES ? 'success' : 'info'"
            size="small"
          >
            {{ row.allow_register === CommonEnum.YES ? t('common.yes') : t('common.no') }}
          </el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag
            :type="row.status === CommonEnum.YES ? 'success' : 'danger'"
            size="small"
          >
            {{ row.status_name }}
          </el-tag>
        </template>

        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('permission_authPlatform_edit')"
            type="primary"
            text
            @click="edit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="userStore.can('permission_authPlatform_status') && row.status === CommonEnum.NO"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="userStore.can('permission_authPlatform_status') && row.status === CommonEnum.YES"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button
            v-if="userStore.can('permission_authPlatform_del')"
            type="danger"
            text
            @click="confirmDel(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <FormDialog
    v-model="dialogVisible"
    v-model:form="form"
    :mode="dialogMode"
    :dict="dict"
    @submit="confirmSubmit"
  />
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.table { flex: 1 1 auto; min-height: 0; overflow: auto }
</style>
