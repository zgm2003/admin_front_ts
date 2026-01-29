<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useIsMobile } from '@/hooks/useResponsive'
import { PermissionApi } from '@/api/permission/permission'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useUserStore } from '@/store/user'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { CommonEnum, PlatformEnum, PermissionTypeEnum } from '@/enums'
import { ArrowRight } from '@element-plus/icons-vue'
import { useTable } from '@/hooks/useTable'

const userStore = useUserStore()
const { t } = useI18n()
const isMobile = useIsMobile()

// 平台切换
const platformOptions = ref<{ value: string; label: string }[]>([])
const activePlatform = ref<string>(PlatformEnum.APP)

const searchForm = ref({ name: '', code: '', platform: activePlatform.value })

// 初始化
const init = () => {
  PermissionApi.init().then((data: any) => {
    platformOptions.value = (data.dict.permission_platform_arr || []).filter(
      (item: any) => item.value !== PlatformEnum.ADMIN
    )
  }).catch(() => {})
}

// 适配 useTable 的 API
const AppButtonApi = {
  list: (params: any) => PermissionApi.appButtonList(params).then((data: any) => ({ list: data, page: { current_page: 1, page_size: 999, total: data.length } })),
  del: PermissionApi.appButtonDel,
  status: PermissionApi.appButtonStatus
}

const {
  loading: listLoading,
  data: listData,
  onSearch,
  getList,
  onSelectionChange,
  confirmDel,
  batchDel,
  toggleStatus
} = useTable({
  api: AppButtonApi,
  searchForm
})

const onPlatformChange = () => {
  searchForm.value.platform = activePlatform.value
  getList()
}

// 表格列
const columns = computed(() => [
  { key: 'name', label: t('permission.table.name') },
  { key: 'code', label: t('permission.table.code') },
  { key: 'status', label: t('permission.table.status'), width: 100 },
  { key: 'sort', label: t('permission.table.sort'), width: 80 },
  { key: 'actions', label: t('common.actions.action'), width: 200 }
])

// 弹窗
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref({ id: '', name: '', code: '', sort: 1, platform: '' })
const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入权限标识', trigger: 'blur' }]
}))

const add = () => {
  dialogMode.value = 'add'
  form.value = { id: '', name: '', code: '', sort: 1, platform: activePlatform.value }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const edit = (row: any) => {
  dialogMode.value = 'edit'
  form.value = { id: row.id, name: row.name, code: row.code, sort: row.sort, platform: row.platform }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const confirmSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch { return }

  const payload = { ...form.value, type: PermissionTypeEnum.BUTTON }
  const api = dialogMode.value === 'add' ? PermissionApi.appButtonAdd : PermissionApi.appButtonEdit
  api(payload).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    getList()
  })
}

const searchFields = computed<SearchField[]>(() => [
  { key: 'name', type: 'input', label: t('permission.filter.name'), placeholder: t('permission.filter.name'), width: 150 },
  { key: 'code', type: 'input', label: t('permission.table.code'), placeholder: t('permission.table.code'), width: 180 }
])

onMounted(() => {
  init()
  getList()
})
</script>

<template>
  <div class="box">
    <el-tabs v-model="activePlatform" @tab-change="onPlatformChange" style="margin-bottom: 10px;">
      <el-tab-pane v-for="item in platformOptions" :key="item.value" :label="item.label" :name="item.value" />
    </el-tabs>
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="table">
      <AppTable :columns="columns" :data="listData" :loading="listLoading" row-key="id" selectable :show-index="true"
                @refresh="getList" @selection-change="onSelectionChange">
        <template #toolbar-left>
          <el-button v-if="userStore.can('permission_appButton_add')" type="success" @click="add">
            {{ t('common.actions.add') }}
          </el-button>
          <el-dropdown>
            <el-button type="primary">{{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right"><arrow-right /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('permission_appButton_del')">
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-status="{ row }">
          <el-tag type="success" v-if="row.status === CommonEnum.YES">启用</el-tag>
          <el-tag type="info" v-else>禁用</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text v-if="userStore.can('permission_appButton_edit')" @click="edit(row)">
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button type="warning" text v-if="row.status === CommonEnum.NO && userStore.can('permission_appButton_status')" @click="toggleStatus(row, CommonEnum.YES)">
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button type="warning" text v-if="row.status === CommonEnum.YES && userStore.can('permission_appButton_status')" @click="toggleStatus(row, CommonEnum.NO)">
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button type="danger" text v-if="userStore.can('permission_appButton_del')" @click="confirmDel(row)">
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" class="dialog-box" :width="isMobile ? '94vw' : '500px'"
             :title="dialogMode === 'add' ? t('common.actions.add') : t('common.actions.edit')" draggable destroy-on-close>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
      <el-form-item :label="t('permission.form.name')" prop="name" required>
        <el-input v-model="form.name" clearable :placeholder="t('permission.form.placeholder.name')" />
      </el-form-item>
      <el-form-item :label="t('permission.form.code')" prop="code" required>
        <el-input v-model="form.code" clearable :placeholder="t('permission.form.placeholder.code')" />
        <div style="color: #909399; font-size: 12px; margin-top: 4px;">
          命名规范：模块_操作，如 profile_edit、scan_submit
        </div>
      </el-form-item>
      <el-form-item :label="t('permission.form.sort')" prop="sort">
        <el-input-number v-model="form.sort" :min="1" :max="1000" :step="1" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100%; }
.table { flex: 1 1 auto; min-height: 0; overflow: auto; }
</style>
