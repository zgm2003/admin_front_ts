<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIsMobile } from '@/utils/responsive'
import { ElMessageBox, ElNotification } from 'element-plus'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { UploadDriverApi } from '@/api/system/uploadConfig'

const { t } = useI18n()
const isMobile = useIsMobile()

const listLoading = ref(false)
const listData = ref<any[]>([])
const page = ref({ current_page: 1, page_size: 20, total: 0 })
const searchForm = ref({ driver: '' })
const dict = ref({ upload_driver_arr: [] } as any)

const searchFields = computed(() => [
  { key: 'driver', type: 'select-v2', label: t('upload.driver.filter.driver'), placeholder: t('upload.driver.filter.driver'), width: 200, options: dict.value.upload_driver_arr || [] },
])

const columns = computed(() => [
  { key: 'driver_show', label: t('upload.driver.table.driver') },
  { key: 'bucket', label: t('upload.driver.table.bucket') },
  { key: 'region', label: t('upload.driver.table.region') },
  { key: 'endpoint', label: t('upload.driver.table.endpoint') },
  { key: 'bucket_domain', label: t('upload.driver.table.bucket_domain') },
  { key: 'created_at', label: t('upload.driver.table.created_at') },
  { key: 'updated_at', label: t('upload.driver.table.updated_at') },
  { key: 'actions', label: t('common.actions.action'), width: 220, align: 'center' }
])

const init = () => {
  UploadDriverApi.init()
    .then((data: any) => { dict.value = data.dict || {} })
    .catch(() => {})
}

const getList = () => {
  listLoading.value = true
  const param: any = { ...searchForm.value, page_size: page.value.page_size, current_page: page.value.current_page }
  UploadDriverApi.list(param).then((data: any) => {
    listLoading.value = false
    listData.value = data.list
    page.value = data.page
  }).catch(() => { listLoading.value = false })
}

const refresh = () => getList()
const onPageChange = (p: any) => { page.value = p; getList() }
const selectedIds = ref<any[]>([])
const onSelectionChange = (selection: any[]) => { selectedIds.value = selection.map((it: any) => it.id) }

const addBoxShow = ref(false)
const editBoxShow = ref(false)

const addForm = ref({
  driver: '', secret_id: '', secret_key: '', bucket: '', region: '',
  appid: '', endpoint: '', bucket_domain: ''
})
const editForm = ref({
  id: '', driver: '', secret_id: '', secret_key: '', bucket: '', region: '',
  appid: '', endpoint: '', bucket_domain: ''
})

const add = () => {
  addForm.value = { driver: '', secret_id: '', secret_key: '', bucket: '', region: '', appid: '', endpoint: '', bucket_domain: '' }
  addBoxShow.value = true
}
const confirmAdd = () => {
  const v = addForm.value
  if (!v.driver || !v.secret_id || !v.secret_key || !v.bucket || !v.region) {
    ElNotification.error({ message: t('common.required') })
    return
  }
  UploadDriverApi.add(v).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    addBoxShow.value = false
    getList()
  })
}

const edit = (row: any) => {
  editForm.value = { id: row.id, driver: row.driver, secret_id: row.secret_id, secret_key: row.secret_key, bucket: row.bucket, region: row.region, appid: row.appid, endpoint: row.endpoint, bucket_domain: row.bucket_domain }
  editBoxShow.value = true
}
const confirmEdit = () => {
  const v = editForm.value
  if (!v.driver || !v.secret_id || !v.secret_key || !v.bucket || !v.region) {
    ElNotification.error({ message: t('common.required') })
    return
  }
  UploadDriverApi.edit(v).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    editBoxShow.value = false
    getList()
  })
}

const confirmDel = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete'),
      t('common.confirmTitle'),
      { type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel') }
    )
  } catch { return }
  UploadDriverApi.del({ id: row.id }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    getList()
  })
}
const batchDel = async () => {
  if (!selectedIds.value.length) {
    ElNotification.error({ message: t('common.selectAtLeastOne') || '请至少选择一个记录' })
    return
  }
  try {
    await ElMessageBox.confirm(
      t('common.confirmBatchDelete'),
      t('common.confirmTitle'),
      { type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel') }
    )
  } catch { return }
  UploadDriverApi.del({ id: selectedIds.value }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
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
    <Search v-model="searchForm" :fields="searchFields" @query="getList" @reset="getList" />
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
          <el-button type="success" @click="add">{{ t('common.actions.add') }}</el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right"><arrow-right /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="addBoxShow" :width="isMobile ? '94vw' : '900px'" :top="isMobile ? '4vh' : '20vh'">
    <template #header>{{ t('upload.driver.addTitle') }}</template>
    <el-form :model="addForm" label-width="auto">
      <el-row :gutter="12">
        <el-col :span="24"><el-form-item :label="t('upload.driver.form.driver')" required><el-select-v2 v-model="addForm.driver" :options="dict.upload_driver_arr" style="width:100%" filterable clearable /></el-form-item></el-col>
        <template v-if="addForm.driver==='cos'">
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.secret_id')" required><el-input v-model="addForm.secret_id" clearable /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.secret_key')" required><el-input v-model="addForm.secret_key" clearable /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.bucket')" required><el-input v-model="addForm.bucket" clearable /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.region')" required><el-input v-model="addForm.region" clearable /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.appid')"><el-input v-model="addForm.appid" clearable /></el-form-item></el-col>
        </template>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="addBoxShow=false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmAdd">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>

  <el-dialog v-model="editBoxShow" :width="isMobile ? '94vw' : '900px'" :top="isMobile ? '4vh' : '20vh'">
    <template #header>{{ t('upload.driver.editTitle') }}</template>
    <el-form :model="editForm" label-width="auto">
      <el-row :gutter="12">
        <el-col :span="24"><el-form-item :label="t('upload.driver.form.driver')" required><el-select-v2 v-model="editForm.driver" :options="dict.upload_driver_arr" style="width:100%" filterable clearable /></el-form-item></el-col>
        <template v-if="editForm.driver==='cos'">
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.secret_id')" required><el-input v-model="editForm.secret_id" clearable /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.secret_key')" required><el-input v-model="editForm.secret_key" clearable /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.bucket')" required><el-input v-model="editForm.bucket" clearable /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.region')" required><el-input v-model="editForm.region" clearable /></el-form-item></el-col>
          <el-col :span="24"><el-form-item :label="t('upload.driver.form.appid')"><el-input v-model="editForm.appid" clearable /></el-form-item></el-col>
        </template>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="editBoxShow=false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="confirmEdit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.table { flex: 1 1 auto; min-height: 0; overflow: auto }
</style>
