<script setup lang="ts">
import {ref, computed, onMounted, nextTick} from 'vue'
import {useI18n} from 'vue-i18n'
import {SystemSettingApi} from '@/api/system/setting'
import {ElNotification, ElMessageBox} from 'element-plus'
import type {FormInstance, FormRules} from 'element-plus'
import {Search} from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import {AppTable} from '@/components/Table'
import {useIsMobile} from '@/hooks/useResponsive'
import {useTable} from '@/hooks/useTable'

const {t} = useI18n()
const isMobile = useIsMobile()
const dict = ref({ system_setting_value_type_arr: [] } as any)

const searchForm = ref({key: '', status: ''} as any)
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
  api: SystemSettingApi.list,
  searchForm
})

const onSelectionChange = (selection: any[]) => { selectedIds.value = selection.map((it: any) => it.id) }

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const form = ref({ key: '', value: '', type: 1, remark: '' } as any)
const formRef = ref<FormInstance | null>(null)

const rules = computed<FormRules>(() => ({
  key: [{ required: true, message: t('setting.form.key') + t('common.required'), trigger: 'blur' }],
  value: [
    {
      validator: (_rule, value, callback) => {
        if (form.value.type === 2) {
           if (value && isNaN(Number(value))) return callback(new Error(t('setting.form.value') + '需为数字'))
        }
        if (form.value.type === 3) {
           if (value && !['0','1','true','false'].includes(String(value).toLowerCase())) return callback(new Error(t('setting.form.value') + '需为 true/false 或 0/1'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ]
}))

const init = () => {
  SystemSettingApi.init().then((data: any) => {
    dict.value = data.dict || {}
  })
}

const searchFields = computed<SearchField[]>(() => [
  { key: 'key', type: 'input', label: t('setting.filter.key'), placeholder: t('setting.filter.key'), width: 200 },
  { key: 'status', type: 'select-v2', label: t('setting.filter.status'), placeholder: t('setting.filter.status'), width: 160,
    options: [{label: '启用', value: 1}, {label: '禁用', value: 2}] }
])

const columns = computed(() => [
  { key: 'setting_key', label: t('setting.table.key'), width: 220, overflowTooltip: true },
  { key: 'setting_value', label: t('setting.table.value'), overflowTooltip: true},
  { key: 'value_type', label: t('setting.table.type'), width: 120 },
  { key: 'remark', label: t('setting.table.remark'), width: 200, overflowTooltip: true },
  { key: 'status', label: t('setting.table.status'), width: 120 },
  { key: 'created_at', label: t('setting.table.created_at'), width: 160 },
  { key: 'updated_at', label: t('setting.table.updated_at'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 240 }
])

const add = () => {
  dialogMode.value = 'add'
  form.value = { key: '', value: '', type: 1, remark: '' }
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}
const edit = (row: any) => {
  dialogMode.value = 'edit'
  form.value = { id: row.id, key: row.setting_key, value: row.setting_value, type: row.value_type, remark: row.remark }
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
  
  const api = dialogMode.value === 'add' ? SystemSettingApi.add : SystemSettingApi.edit
  const v = form.value
  const payload = dialogMode.value === 'edit' ? { id: form.value.id, value: v.value, type: v.type, remark: v.remark } : { key: v.key, value: v.value, type: v.type, remark: v.remark }
  
  api(payload).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    dialogVisible.value = false
    getList()
  })
}

const enable = (row: any) => {
  SystemSettingApi.status({ id: row.id, status: 1 }).then(() => { ElNotification.success({message: t('common.success.operation')}); getList() })
}
const disable = (row: any) => {
  SystemSettingApi.status({ id: row.id, status: 2 }).then(() => { ElNotification.success({message: t('common.success.operation')}); getList() })
}
const del = async (row: any) => {
  try {
    await ElMessageBox.confirm(t('common.confirmDelete'), t('common.confirmTitle'), {type: 'warning', confirmButtonText: t('common.actions.del'), cancelButtonText: t('common.actions.cancel')})
  } catch { return }
  SystemSettingApi.del({ id: row.id }).then(() => { ElNotification.success({message: t('common.success.operation')}); getList() })
}

const copy = async (text: string) => {
  try { await navigator.clipboard.writeText(text); ElNotification.success({message: '复制成功'}) } catch {}
}

onMounted(() => { init(); getList() })
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
          <el-button type="success" @click="add">{{ t('common.actions.add') }}</el-button>
        </template>
        <template #cell-value_type="{ row }">
          <el-tag type="primary">{{ row.value_type_name }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status_name }}</el-tag>
        </template>
        <template #cell-setting_value="{ row }">
          <div style="display:flex;align-items:center;gap:8px;">
            <el-text v-if="!isMobile" style="max-width:550px" truncated>{{ row.setting_value }}</el-text>
            <el-button size="small" @click="copy(row.setting_value)">{{ t('common.actions.copy')}}</el-button>
          </div>
        </template>
        <template #cell-actions="{ row }">
          <el-button type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button type="warning" text v-if="row.status===2" @click="enable(row)">启用</el-button>
          <el-button type="warning" text v-if="row.status===1" @click="disable(row)">禁用</el-button>
          <el-button type="danger" text @click="del(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '900px'">
    <template #header>{{ dialogMode === 'add' ? '新增配置' : '编辑配置' }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('setting.form.key')" prop="key" required>
            <el-input v-model="form.key" :disabled="dialogMode === 'edit'" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('setting.form.type')" prop="type" required>
            <el-select-v2 v-model="form.type" :options="dict.system_setting_value_type_arr" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('setting.form.value')" prop="value">
            <el-input v-if="form.type!==4" v-model="form.value" clearable/>
            <el-input v-else type="textarea" v-model="form.value" :rows="6" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('setting.form.remark')" prop="remark">
            <el-input v-model="form.remark" clearable/>
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
.box { display:flex; flex-direction:column; height:100% }
.table { flex:1 1 auto; min-height:0; overflow:auto }
</style>
