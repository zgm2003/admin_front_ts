<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {UploadRuleApi} from '@/api/system/uploadConfig'
import {useIsMobile} from '@/hooks/useResponsive'
import {ElMessageBox, ElNotification} from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {AppTable} from '@/components/Table'
import {Search} from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import {useUserStore} from "@/store/user.ts";
import {useTable} from '@/hooks/useTable'

const {t} = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()
const dict = ref({upload_image_ext_arr: [], upload_file_ext_arr: []} as any)

const searchForm = ref({title: ''})
const selectedIds = ref<any[]>([])

const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  refresh,
  getList
} = useTable({
  api: UploadRuleApi.list,
  searchForm
})

const onSelectionChange = (selection: any[]) => { selectedIds.value = selection.map((it: any) => it.id) }

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

const form = ref({
  id: '',
  title: '',
  max_size_mb: 5,
  image_exts: [],
  file_exts: []
})

const formRef = ref<FormInstance | null>(null)
const rules = computed<FormRules>(() => ({
  title: [{ required: true, message: t('upload.rule.form.title') + t('common.required'), trigger: 'blur' }],
  max_size_mb: [
    { required: true, message: t('upload.rule.form.max_size_mb') + t('common.required'), trigger: 'change' },
    {
      validator: (_rule, value, callback) => {
        const v = Number(value)
        if (!Number.isFinite(v) || v < 1 || v > 10240) callback(new Error(t('upload.rule.form.max_size_mb') + t('common.required')))
        else callback()
      },
      trigger: 'change'
    }
  ]
}))

const init = () => {
  UploadRuleApi.init()
      .then((data: any) => {
        dict.value = data.dict || {}
      })
      .catch(() => {
      })
}

const searchFields = computed<SearchField[]>(() => [
  {
    key: 'title',
    type: 'input',
    label: t('upload.rule.filter.title'),
    placeholder: t('upload.rule.filter.title'),
    width: 200
  },
  // 已移除 status，后续由独立配置生效
])

const columns = computed(() => [
  {key: 'title', label: t('upload.rule.table.title')},
  {key: 'max_size_mb', label: t('upload.rule.table.max_size_mb')},
  {key: 'image_exts', label: 'Image Exts'},
  {key: 'file_exts', label: 'File Exts'},
  {key: 'created_at', label: t('upload.rule.table.created_at')},
  {key: 'updated_at', label: t('upload.rule.table.updated_at')},
  {key: 'actions', label: t('common.actions.action'), width: 220, align: 'center'}
])

const tagWrapStyle = 'display:flex;flex-wrap:wrap;gap:6px;'

const add = () => {
  dialogMode.value = 'add'
  form.value = {id: '', title: '', max_size_mb: 5, image_exts: [], file_exts: []}
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const edit = (row: any) => {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    title: row.title,
    max_size_mb: row.max_size_mb,
    image_exts: row.image_exts || [],
    file_exts: row.file_exts || []
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
  
  const api = dialogMode.value === 'add' ? UploadRuleApi.add : UploadRuleApi.edit
  api(form.value).then(() => {
    ElNotification.success({message: t('common.success.operation')});
    dialogVisible.value = false;
    getList()
  })
}

const confirmDel = async (row: any) => {
  try {
    await ElMessageBox.confirm(
        t('common.confirmDelete'),
        t('common.confirmTitle'),
        {type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel')}
    )
  } catch {
    return
  }
  UploadRuleApi.del({id: row.id}).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    getList()
  })
}
const batchDel = async () => {
  if (!selectedIds.value.length) {
    ElNotification.error({message: t('common.selectAtLeastOne')})
    return
  }
  try {
    await ElMessageBox.confirm(
        t('common.confirmBatchDelete'),
        t('common.confirmTitle'),
        {type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel')}
    )
  } catch {
    return
  }
  UploadRuleApi.del({id: selectedIds.value}).then(() => {
    ElNotification.success({message: t('common.success.operation')})
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
          <el-button type="success" @click="add" v-if="userStore.can('uploadRule.add')">{{ t('common.actions.add') }}</el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <arrow-right/>
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel" v-if="userStore.can('uploadRule.del')">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
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
          <el-button type="primary" text @click="edit(row)" v-if="userStore.can('uploadRule.edit')">{{ t('common.actions.edit') }}</el-button>
          <el-button type="danger" text @click="confirmDel(row)" v-if="userStore.can('uploadRule.del')">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '900px'">
    <template #header>{{ dialogMode === 'add' ? t('upload.rule.addTitle') : t('upload.rule.editTitle') }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('upload.rule.form.title')" prop="title" required>
            <el-input v-model="form.title" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('upload.rule.form.max_size_mb')" prop="max_size_mb" required>
            <el-input-number v-model="form.max_size_mb" :min="1" :max="10240"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="Image Exts">
            <el-select-v2 v-model="form.image_exts" multiple style="width:100%" :options="dict.upload_image_ext_arr"/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item label="File Exts">
            <el-select-v2 v-model="form.file_exts" multiple style="width:100%" :options="dict.upload_file_ext_arr"/>
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
