<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
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
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { useIsMobile } from '@/hooks/useResponsive'
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { createAuthPlatformDefaultForm } from './helpers'

const { t } = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()

interface AuthPlatformForm extends AuthPlatformAddPayload {
  id?: number
}

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
const formRef = ref<FormInstance | null>(null)

const defaultForm = (): AuthPlatformForm => createAuthPlatformDefaultForm()

const form = ref<AuthPlatformForm>(defaultForm())

const rules = computed<FormRules>(() => ({
  code: [{ required: true, message: t('authPlatform.form.code') + t('common.required'), trigger: 'blur' }],
  name: [{ required: true, message: t('authPlatform.form.name') + t('common.required'), trigger: 'blur' }],
  login_types: [{ required: true, type: 'array', min: 1, message: t('authPlatform.form.login_types') + t('common.required'), trigger: 'change' }],
  captcha_type: [{ required: true, message: t('authPlatform.form.captcha_type') + t('common.required'), trigger: 'change' }],
  access_ttl: [{ required: true, message: t('authPlatform.form.access_ttl') + t('common.required'), trigger: 'blur' }],
  refresh_ttl: [{ required: true, message: t('authPlatform.form.refresh_ttl') + t('common.required'), trigger: 'blur' }],
}))

const yesNoOptions = computed(() => [
  { label: t('common.yes'), value: CommonEnum.YES },
  { label: t('common.no'), value: CommonEnum.NO },
])

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
  { key: 'login_types', label: t('authPlatform.table.login_types'), width: 200 },
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
  nextTick(() => formRef.value?.clearValidate())
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
  nextTick(() => formRef.value?.clearValidate())
}

const confirmSubmit = async () => {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }

  if (dialogMode.value === 'add') {
    const addPayload: AuthPlatformAddPayload = {
      code: form.value.code,
      name: form.value.name,
      login_types: form.value.login_types,
      captcha_type: form.value.captcha_type,
      access_ttl: form.value.access_ttl,
      refresh_ttl: form.value.refresh_ttl,
      bind_platform: form.value.bind_platform,
      bind_device: form.value.bind_device,
      bind_ip: form.value.bind_ip,
      single_session: form.value.single_session,
      max_sessions: form.value.max_sessions,
      allow_register: form.value.allow_register,
    }
    await AuthPlatformApi.add(addPayload)
  } else {
    const editPayload: AuthPlatformEditPayload = {
      id: Number(form.value.id),
      name: form.value.name,
      login_types: form.value.login_types,
      captcha_type: form.value.captcha_type,
      access_ttl: form.value.access_ttl,
      refresh_ttl: form.value.refresh_ttl,
      bind_platform: form.value.bind_platform,
      bind_device: form.value.bind_device,
      bind_ip: form.value.bind_ip,
      single_session: form.value.single_session,
      max_sessions: form.value.max_sessions,
      allow_register: form.value.allow_register,
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
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
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
          <el-button v-if="userStore.can('permission_authPlatform_add')" type="success" @click="add">{{ t('common.actions.add') }}</el-button>
          <el-button v-if="userStore.can('permission_authPlatform_del')" type="danger" @click="batchDel">{{ t('common.actions.batchDelete') }}</el-button>
        </template>

        <template #cell-login_types="{ row }">
          <el-tag v-for="lt in row.login_types" :key="lt" size="small" style="margin-right:4px">
            {{ getLoginTypeLabel(lt) }}
          </el-tag>
        </template>
        <template #cell-captcha_type="{ row }">
          <el-tag size="small">{{ getCaptchaTypeLabel(row.captcha_type) }}</el-tag>
        </template>
        <template #cell-access_ttl="{ row }">{{ formatTtl(row.access_ttl) }}</template>
        <template #cell-refresh_ttl="{ row }">{{ formatTtl(row.refresh_ttl) }}</template>
        <template #cell-bind_platform="{ row }">
          <el-tag :type="row.bind_platform === CommonEnum.YES ? 'success' : 'info'" size="small">{{ row.bind_platform === CommonEnum.YES ? t('common.yes') : t('common.no') }}</el-tag>
        </template>
        <template #cell-bind_device="{ row }">
          <el-tag :type="row.bind_device === CommonEnum.YES ? 'success' : 'info'" size="small">{{ row.bind_device === CommonEnum.YES ? t('common.yes') : t('common.no') }}</el-tag>
        </template>
        <template #cell-bind_ip="{ row }">
          <el-tag :type="row.bind_ip === CommonEnum.YES ? 'success' : 'info'" size="small">{{ row.bind_ip === CommonEnum.YES ? t('common.yes') : t('common.no') }}</el-tag>
        </template>
        <template #cell-single_session="{ row }">
          <el-tag :type="row.single_session === CommonEnum.YES ? 'warning' : 'info'" size="small">{{ row.single_session === CommonEnum.YES ? t('common.yes') : t('common.no') }}</el-tag>
        </template>
        <template #cell-allow_register="{ row }">
          <el-tag :type="row.allow_register === CommonEnum.YES ? 'success' : 'info'" size="small">{{ row.allow_register === CommonEnum.YES ? t('common.yes') : t('common.no') }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'" size="small">{{ row.status_name }}</el-tag>
        </template>

        <template #cell-actions="{ row }">
          <el-button v-if="userStore.can('permission_authPlatform_edit')" type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button v-if="userStore.can('permission_authPlatform_status') && row.status === CommonEnum.NO" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
          <el-button v-if="userStore.can('permission_authPlatform_status') && row.status === CommonEnum.YES" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
          <el-button v-if="userStore.can('permission_authPlatform_del')" type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '720px'" destroy-on-close>
    <template #header>{{ dialogMode === 'add' ? t('authPlatform.addTitle') : t('authPlatform.editTitle') }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <!-- 基本信息 -->
      <el-divider content-position="left">{{ t('authPlatform.form.section_basic') }}</el-divider>
      <el-row :gutter="16">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.code')" prop="code" required>
            <el-input v-model="form.code" :placeholder="t('authPlatform.form.codePlaceholder')" :disabled="dialogMode === 'edit'" clearable />
            <div v-if="dialogMode === 'add'" class="form-help">{{ t('authPlatform.form.codeHelp') }}</div>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.name')" prop="name" required>
            <el-input v-model="form.name" :placeholder="t('authPlatform.form.namePlaceholder')" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('authPlatform.form.login_types')" prop="login_types" required>
            <el-checkbox-group v-model="form.login_types">
              <el-checkbox v-for="opt in dict.auth_platform_login_type_arr" :key="opt.value" :value="opt.value" :label="opt.label" />
            </el-checkbox-group>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.captcha_type')" prop="captcha_type" required>
            <el-select-v2 v-model="form.captcha_type" :options="dict.auth_platform_captcha_type_arr" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- Token 策略 -->
      <el-divider content-position="left">{{ t('authPlatform.form.section_token') }}</el-divider>
      <el-row :gutter="16">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.access_ttl')" prop="access_ttl" required>
            <el-input-number v-model="form.access_ttl" :min="60" :max="2592000" :step="3600" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.refresh_ttl')" prop="refresh_ttl" required>
            <el-input-number v-model="form.refresh_ttl" :min="60" :max="31536000" :step="86400" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <!-- 安全策略 -->
      <el-divider content-position="left">{{ t('authPlatform.form.section_security') }}</el-divider>
      <el-alert :title="t('authPlatform.form.policy_notice')" type="warning" :closable="false" show-icon style="margin-bottom: 16px;" />
      <el-row :gutter="16">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.bind_platform')">
            <el-select-v2 v-model="form.bind_platform" :options="yesNoOptions" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.bind_device')">
            <el-select-v2 v-model="form.bind_device" :options="yesNoOptions" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.bind_ip')">
            <el-select-v2 v-model="form.bind_ip" :options="yesNoOptions" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.single_session')">
            <el-select-v2 v-model="form.single_session" :options="yesNoOptions" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.max_sessions')">
            <el-input-number v-model="form.max_sessions" :min="0" :max="100" :controls="false" style="width:100%" />
            <div class="form-help">{{ t('authPlatform.form.max_sessions_help') }}</div>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('authPlatform.form.allow_register')">
            <el-select-v2 v-model="form.allow_register" :options="yesNoOptions" style="width:100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.table { flex: 1 1 auto; min-height: 0; overflow: auto }
.form-help { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.4; margin-top: 4px }
</style>
