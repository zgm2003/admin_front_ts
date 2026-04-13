<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'
import {ElNotification} from 'element-plus'
import { AppDialog } from '@/components/AppDialog'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {
  UploadSettingApi,
  type UploadSettingForm,
  type UploadSettingInitResponse,
  type UploadSettingItem,
} from '@/api/system/uploadConfig'
import type {FormInstance, FormRules} from 'element-plus'
import {useUserStore} from "@/store/user.ts";
import { useCrudTable } from '@/hooks/useCrudTable'
import { CommonEnum } from '@/enums'
import { ArrowDown } from '@element-plus/icons-vue'

const {t} = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()

const searchForm = ref({remark: '', status: '', driver_id: '', rule_id: ''})
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
} = useCrudTable({
  api: UploadSettingApi,
  searchForm
})
const dict = ref<UploadSettingInitResponse['dict']>({
  upload_driver_list: [],
  upload_rule_list: [],
  common_status_arr: [],
})

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'driver_id',
    type: 'select-v2',
    label: t('upload.setting.table.driver'),
    placeholder: t('upload.setting.table.driver'),
    width: 200,
    options: dict.value.upload_driver_list
  },
  {
    key: 'rule_id',
    type: 'select-v2',
    label: t('upload.setting.table.rule'),
    placeholder: t('upload.setting.table.rule'),
    width: 200,
    options: dict.value.upload_rule_list
  },
  {
    key: 'remark',
    type: 'input',
    label: t('upload.setting.filter.remark'),
    placeholder: t('upload.setting.filter.remark'),
    width: 200
  },
  {
    key: 'status',
    type: 'select-v2',
    label: t('upload.setting.filter.status'),
    placeholder: t('upload.setting.filter.status'),
    width: 200,
    options: dict.value.common_status_arr
  },
])

const columns = computed(() => [
  {key: 'driver_name', label: t('upload.setting.table.driver')},
  {key: 'rule_name', label: t('upload.setting.table.rule')},
  {key: 'remark', label: t('upload.setting.table.remark'), width: 200, overflowTooltip: true},
  {key: 'status', label: t('upload.setting.table.status'), width: 100},
  {key: 'created_at', label: t('upload.setting.table.created_at')},
  {key: 'updated_at', label: t('upload.setting.table.updated_at')},
  {key: 'actions', label: t('common.actions.action'), width: 280}
])

const init = () => {
  UploadSettingApi.init().then((data) => {
    dict.value = data.dict
  })
}

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

type UploadSettingFormState = UploadSettingForm & {
  id: number | string
  driver_id: number | string
  rule_id: number | string
  remark: string
}

const form = ref<UploadSettingFormState>({
  id: '',
  driver_id: '',
  rule_id: '',
  status: 1,
  remark: ''
})

const requiredMsg = (label: string) => `${label} ${t('common.required')}`

const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => ({
  driver_id: [{required: true, message: requiredMsg(t('upload.setting.form.driver')), trigger: 'blur'}],
  rule_id: [{required: true, message: requiredMsg(t('upload.setting.form.rule')), trigger: 'blur'}],
  status: [{required: true, message: requiredMsg(t('upload.setting.form.status')), trigger: 'blur'}]
}))

const add = () => {
  dialogMode.value = 'add'
  form.value = {
    id: '',
    driver_id: '',
    rule_id: '',
    status: 2,
    remark: ''
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const edit = (row: UploadSettingItem) => {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    driver_id: row.driver_id,
    rule_id: row.rule_id,
    status: row.status,
    remark: row.remark ?? ''
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}
const confirmSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const api = dialogMode.value === 'add' ? UploadSettingApi.add : UploadSettingApi.edit
  api(form.value as UploadSettingForm).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    dialogVisible.value = false
    getList()
  })
}

onMounted(() => {
  init()
  getList()
})
</script>

<template>
  <div class="box">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch"/>
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
          <el-button type="success" @click="add" v-if="userStore.can('system_uploadConfig_settingAdd')">{{
              t('common.actions.add')
            }}
          </el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('system_uploadConfig_settingDel')">
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template #cell-status="{ row }">
          <el-tag :type="row.status === CommonEnum.YES ? 'success' : 'danger'">{{ row.status_name }}</el-tag>
        </template>

        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)" v-if="userStore.can('system_uploadConfig_settingEdit')">
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button type="warning" text v-if="row.status === CommonEnum.NO && userStore.can('system_uploadConfig_settingStatus')" @click="toggleStatus(row, CommonEnum.YES)">
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button type="warning" text v-if="row.status === CommonEnum.YES && userStore.can('system_uploadConfig_settingStatus')" @click="toggleStatus(row, CommonEnum.NO)">
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button type="danger" text @click="confirmDel(row)" v-if="userStore.can('system_uploadConfig_settingDel')">
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '600px'">
    <template #header>{{
        dialogMode === 'add' ? t('upload.setting.addTitle') : t('upload.setting.editTitle')
      }}
    </template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item :label="t('upload.setting.form.driver')" prop="driver_id" required>
            <el-select-v2 v-model="form.driver_id" :options="dict.upload_driver_list" style="width:100%" filterable
                          clearable/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.setting.form.rule')" prop="rule_id" required>
            <el-select-v2 v-model="form.rule_id" :options="dict.upload_rule_list" style="width:100%" filterable
                          clearable/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.setting.form.status')" prop="status" required>
            <el-radio-group v-model="form.status">
              <el-radio :value="CommonEnum.YES">{{ t('common.status.enabled') }}</el-radio>
              <el-radio :value="CommonEnum.NO">{{ t('common.status.disabled') }}</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.setting.form.remark')" prop="remark">
            <el-input v-model="form.remark" type="textarea" clearable/>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible=false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>
</template>

<style scoped>
.box {
  display: flex;
  flex-direction: column;
  height: 100%
}

.table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto
}
</style>
