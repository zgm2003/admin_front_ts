<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {useIsMobile} from '@/hooks/useResponsive'
import {ElNotification} from 'element-plus'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type {SearchField} from '@/components/Search/types'
import {UploadDriverApi} from '@/api/system/uploadConfig'
import type {FormInstance, FormRules} from 'element-plus'
import {useUserStore} from "@/store/user.ts";
import {useTable} from '@/hooks/useTable'
import {ArrowRight} from "@element-plus/icons-vue";

const {t} = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()

const searchForm = ref({driver: ''})

const {
  loading: listLoading,
  data: listData,
  page,
  selectedIds,
  onSearch,
  onPageChange,
  refresh,
  getList,
  onSelectionChange,
  confirmDel,
  batchDel
} = useTable({
  api: UploadDriverApi,
  searchForm
})

const dict = ref({upload_driver_arr: []} as any)

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'driver',
    type: 'select-v2',
    label: t('upload.driver.filter.driver'),
    placeholder: t('upload.driver.filter.driver'),
    width: 200,
    options: dict.value.upload_driver_arr || []
  },
])

const columns = computed(() => [
  {key: 'driver_show', label: t('upload.driver.table.driver')},
  {key: 'secret_id_hint', label: t('upload.driver.table.secret_id')},
  {key: 'secret_key_hint', label: t('upload.driver.table.secret_key')},
  {key: 'bucket', label: t('upload.driver.table.bucket')},
  {key: 'region', label: t('upload.driver.table.region')},
  {key: 'created_at', label: t('upload.driver.table.created_at')},
  {key: 'updated_at', label: t('upload.driver.table.updated_at')},
  {key: 'actions', label: t('common.actions.action'), width: 220}
])

const init = () => {
  UploadDriverApi.init()
      .then((data: any) => {
        dict.value = data.dict || {}
      })
      .catch(() => {
      })
}


const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

const form = ref({
  id: '',
  driver: '',
  secret_id: '',
  secret_key: '',
  bucket: '',
  region: '',
  role_arn: '',
  appid: '',
  endpoint: '',
  bucket_domain: ''
})

const requiredMsg = (label: string) => `${label} ${t('common.required')}`

const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => ({
  driver: [{required: true, message: requiredMsg(t('upload.driver.form.driver')), trigger: 'blur'}],
  secret_id: [
    {
      validator: (_rule, _value, callback) => {
        // 新增时必填，编辑时留空不改
        if (dialogMode.value === 'add' && !form.value.secret_id) callback(new Error(requiredMsg(t('upload.driver.form.secret_id'))))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  secret_key: [
    {
      validator: (_rule, _value, callback) => {
        if (dialogMode.value === 'add' && !form.value.secret_key) callback(new Error(requiredMsg(t('upload.driver.form.secret_key'))))
        else callback()
      },
      trigger: 'blur'
    }
  ],
  bucket: [{required: true, message: requiredMsg(t('upload.driver.form.bucket')), trigger: 'blur'}],
  region: [{required: true, message: requiredMsg(t('upload.driver.form.region')), trigger: 'blur'}],
  role_arn: [
    {
      validator: (_rule, _value, callback) => {
        if (form.value.driver === 'oss' && !form.value.role_arn) callback(new Error(requiredMsg(t('upload.driver.form.role_arn'))))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}))

// 单一 rules 即可，区分模式通过 dialogMode 控制提交行为

const add = () => {
  dialogMode.value = 'add'
  form.value = {
    id: '',
    driver: '',
    secret_id: '',
    secret_key: '',
    bucket: '',
    region: '',
    role_arn: '',
    appid: '',
    endpoint: '',
    bucket_domain: ''
  }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const edit = (row: any) => {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    driver: row.driver,
    secret_id: '',  // 编辑时留空，后端不返回明文
    secret_key: '', // 编辑时留空，后端不返回明文
    bucket: row.bucket,
    region: row.region,
    role_arn: row.role_arn,
    appid: row.appid,
    endpoint: row.endpoint,
    bucket_domain: row.bucket_domain
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

  const api = dialogMode.value === 'add' ? UploadDriverApi.add : UploadDriverApi.edit
  api(form.value).then(() => {
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
          <el-button type="success" @click="add" v-if="userStore.can('system_uploadConfig_driverAdd')">{{ t('common.actions.add') }}</el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <arrow-right/>
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('system_uploadConfig_driverDel')">
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)" v-if="userStore.can('system_uploadConfig_driverEdit')">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)" v-if="userStore.can('system_uploadConfig_driverDel')">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '900px'">
    <template #header>{{ dialogMode === 'add' ? t('upload.driver.addTitle') : t('upload.driver.editTitle') }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.driver')" prop="driver" required>
            <el-select-v2 v-model="form.driver" :options="dict.upload_driver_arr" style="width:100%" filterable
                          clearable/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.secret_id')" prop="secret_id" :required="dialogMode === 'add'">
            <el-input v-model="form.secret_id" type="password" show-password clearable
                      :placeholder="dialogMode === 'edit' ? t('common.placeholder.leaveEmpty') : ''"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.secret_key')" prop="secret_key" :required="dialogMode === 'add'">
            <el-input v-model="form.secret_key" type="password" show-password clearable
                      :placeholder="dialogMode === 'edit' ? t('common.placeholder.leaveEmpty') : ''"/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.bucket')" prop="bucket" required>
            <el-input v-model="form.bucket" clearable/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.region')" prop="region" required>
            <el-input v-model="form.region" clearable/>
          </el-form-item>
        </el-col>
        <template v-if="form.driver==='cos'">
          <el-col :span="24">
            <el-form-item :label="t('upload.driver.form.appid')">
              <el-input v-model="form.appid" clearable/>
            </el-form-item>
          </el-col>
        </template>
        <template v-else-if="form.driver==='oss'">
          <el-col :span="24">
            <el-form-item :label="t('upload.driver.form.role_arn')" prop="role_arn" required>
              <el-input v-model="form.role_arn" clearable/>
            </el-form-item>
          </el-col>
        </template>
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.endpoint')">
            <el-input v-model="form.endpoint" clearable/>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('upload.driver.form.bucket_domain')">
            <el-input v-model="form.bucket_domain" clearable/>
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
  </el-dialog>

  <!-- 已合并为单一弹窗 -->
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
