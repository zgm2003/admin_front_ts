<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { UploadRuleApi } from '@/api/system/uploadConfig'
import { useIsMobile } from '@/utils/responsive'
import { ElMessageBox, ElNotification } from 'element-plus'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'

const { t } = useI18n()
const isMobile = useIsMobile()
const dict = ref({ upload_image_ext_arr: [], upload_file_ext_arr: [] } as any)
const listLoading = ref(false)
const listData = ref<any[]>([])
const page = ref({ current_page: 1, page_size: 20, total: 0 })
const searchForm = ref({ title: '' })
const selectedIds = ref<any[]>([])
const dialogShow = ref(false)
const isEdit = ref(false)

const form = ref({
  id: '',
  title: '',
  max_size_mb: 5,
  image_exts: [],
  file_exts: []
})

const init = () => {
  UploadRuleApi.init()
    .then((data: any) => { dict.value = data.dict || {} })
    .catch(() => {})
}

const searchFields = computed(() => [
  { key: 'title', type: 'input', label: t('upload.rule.filter.title'), placeholder: t('upload.rule.filter.title'), width: 200 },
  // 已移除 status，后续由独立配置生效
])

const columns = computed(() => [
  { key: 'title', label: t('upload.rule.table.title') },
  { key: 'max_size_mb', label: t('upload.rule.table.max_size_mb') },
  { key: 'image_exts', label: 'Image Exts' },
  { key: 'file_exts', label: 'File Exts' },
  { key: 'created_at', label: t('upload.rule.table.created_at') },
  { key: 'updated_at', label: t('upload.rule.table.updated_at') },
  { key: 'actions', label: t('common.actions.action'), width: 220, align: 'center' }
])

const tagWrapStyle = 'display:flex;flex-wrap:wrap;gap:6px;'

const getList = () => {
  listLoading.value = true
  const param: any = { ...searchForm.value, page_size: page.value.page_size, current_page: page.value.current_page }
  UploadRuleApi.list(param).then((data: any) => {
    listLoading.value = false
    listData.value = data.list
    page.value = data.page
  }).catch(() => { listLoading.value = false })
}

const refresh = () => getList()
const onPageChange = (p: any) => { page.value = p; getList() }
const onSelectionChange = (selection: any[]) => { selectedIds.value = selection.map((it: any) => it.id) }

const add = () => {
  isEdit.value = false
  form.value = { id: '', title: '', max_size_mb: 5, image_exts: [], file_exts: [] }
  dialogShow.value = true
}

const edit = (row: any) => {
  isEdit.value = true
  form.value = {
    id: row.id,
    title: row.title,
    max_size_mb: row.max_size_mb,
    image_exts: row.image_exts || [],
    file_exts: row.file_exts || []
  }
  dialogShow.value = true
}
const submit = () => {
  const v = form.value
  if (!v.title) { ElNotification.error({ message: t('upload.rule.form.title') + t('common.required') }); return }
  if (!isEdit.value) {
    const payload = { title: v.title, max_size_mb: v.max_size_mb, image_exts: v.image_exts || [], file_exts: v.file_exts || [] }
    UploadRuleApi.add(payload).then(() => { ElNotification.success({ message: t('common.success.operation') }); dialogShow.value = false; getList() })
  } else {
    const payload = { id: v.id, title: v.title, max_size_mb: v.max_size_mb, image_exts: v.image_exts || [], file_exts: v.file_exts || [] }
    UploadRuleApi.edit(payload).then(() => { ElNotification.success({ message: t('common.success.operation') }); dialogShow.value = false; getList() })
  }
}

const confirmDel = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      t('common.confirmDelete'),
      t('common.confirmTitle'),
      { type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel') }
    )
  } catch { return }
  UploadRuleApi.del({ id: row.id }).then(() => {
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
  UploadRuleApi.del({ id: selectedIds.value }).then(() => {
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
        <template #cell-image_exts="{ row }">
          <div :style="tagWrapStyle">
            <el-tag v-for="it in (row.image_exts || [])" :key="it" type="success">{{ it }}</el-tag>
          </div>
        </template>
        <template #cell-file_exts="{ row }">
          <div :style="tagWrapStyle">
            <el-tag v-for="it in (row.file_exts || [])" :key="it" type="warning">{{ it }}</el-tag>
          </div>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="dialogShow" :width="isMobile ? '94vw' : '900px'" :top="isMobile ? '4vh' : '20vh'">
    <template #header>{{ isEdit ? t('upload.rule.editTitle') : t('upload.rule.addTitle') }}</template>
    <el-form :model="form" label-width="auto">
      <el-row :gutter="12">
        <el-col :md="12" :span="24"><el-form-item :label="t('upload.rule.form.title')" required><el-input v-model="form.title" clearable /></el-form-item></el-col>
        <el-col :md="12" :span="24"><el-form-item :label="t('upload.rule.form.max_size_mb')" required><el-input-number v-model="form.max_size_mb" :min="1" :max="10240" /></el-form-item></el-col>
        <el-col :md="12" :span="24"><el-form-item label="Image Exts"><el-select-v2 v-model="form.image_exts" multiple style="width:100%" :options="dict.upload_image_ext_arr" /></el-form-item></el-col>
        <el-col :md="12" :span="24"><el-form-item label="File Exts"><el-select-v2 v-model="form.file_exts" multiple style="width:100%" :options="dict.upload_file_ext_arr" /></el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogShow=false">{{ t('common.actions.cancel') }}</el-button>
        <el-button type="primary" @click="submit">{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100% }
.table { flex: 1 1 auto; min-height: 0; overflow: auto }
</style>
