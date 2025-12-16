<script setup lang="ts">
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {SystemSettingApi} from '@/api/system/setting'
import {ElNotification, ElMessageBox} from 'element-plus'
import {Search} from '@/components/Search'
import {AppTable} from '@/components/Table'
import {useIsMobile} from '@/utils/responsive'

const {t} = useI18n()
const isMobile = useIsMobile()
const dict = ref({ system_setting_value_type_arr: [] } as any)
const listLoading = ref(false)
const listData = ref<any[]>([])
const page = ref({current_page: 1, page_size: 20, total: 0})
const searchForm = ref({key: '', status: ''} as any)
const selectedIds = ref<any[]>([])
const dialogShow = ref(false)
const isEdit = ref(false)
const form = ref({ key: '', value: '', type: 1, remark: '' } as any)

const init = () => {
  SystemSettingApi.init().then((data: any) => {
    dict.value = data.dict || {}
  })
}

const searchFields = computed(() => [
  { key: 'key', type: 'input', label: t('setting.filter.key'), placeholder: t('setting.filter.key'), width: 200 },
  { key: 'status', type: 'select-v2', label: t('setting.filter.status'), placeholder: t('setting.filter.status'), width: 160,
    options: [{label: '启用', value: 1}, {label: '禁用', value: 2}] }
])

const columns = computed(() => [
  { key: 'setting_key', label: t('setting.table.key'), width: 220, overflowTooltip: true },
  { key: 'setting_value', label: t('setting.table.value'), overflowTooltip: true },
  { key: 'value_type', label: t('setting.table.type'), width: 120 },
  { key: 'remark', label: t('setting.table.remark'), width: 200, overflowTooltip: true },
  { key: 'status', label: t('setting.table.status'), width: 120 },
  { key: 'created_at', label: t('setting.table.created_at'), width: 160 },
  { key: 'updated_at', label: t('setting.table.updated_at'), width: 160 },
  { key: 'actions', label: t('common.actions.action'), width: 240, align: 'center' }
])

const getList = () => {
  listLoading.value = true
  const param: any = {...searchForm.value, page_size: page.value.page_size, current_page: page.value.current_page}
  SystemSettingApi.list(param).then((data: any) => {
    listLoading.value = false
    listData.value = (data.list || []).map((it: any) => ({
      ...it,
      value_type_label: (dict.value.system_setting_value_type_arr || []).find((d: any) => d.value === it.value_type)?.label || it.value_type,
    }))
    page.value = data.page
  }).catch(() => {
    listLoading.value = false
  })
}

const refresh = () => getList()
const onPageChange = (p: any) => { page.value = p; getList() }
const onSelectionChange = (selection: any[]) => { selectedIds.value = selection.map((it: any) => it.id) }

const add = () => {
  isEdit.value = false
  form.value = { key: '', value: '', type: 1, remark: '' }
  dialogShow.value = true
}
const edit = (row: any) => {
  isEdit.value = true
  form.value = { id: row.id, key: row.setting_key, value: row.setting_value, type: row.value_type, remark: row.remark }
  dialogShow.value = true
}
const submit = () => {
  const v = form.value
  if (!v.key) { ElNotification.error({message: t('setting.form.key') + t('common.required')}); return }
  if (v.type === 2 && v.value && isNaN(Number(v.value))) { ElNotification.error({message: t('setting.form.value') + '需为数字'}); return }
  if (v.type === 3 && !['0','1','true','false'].includes(String(v.value).toLowerCase())) { ElNotification.error({message: t('setting.form.value') + '需为 true/false 或 0/1'}); return }
  const api = isEdit.value ? SystemSettingApi.edit : SystemSettingApi.add
  const payload = isEdit.value ? { id: form.value.id, value: v.value, type: v.type, remark: v.remark } : { key: v.key, value: v.value, type: v.type, remark: v.remark }
  api(payload).then(() => {
    ElNotification.success({message: t('common.success.operation')})
    dialogShow.value = false
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
    <Search v-model="searchForm" :fields="searchFields" @query="getList" @reset="getList"/>
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
          <el-tag type="primary">{{ (dict.system_setting_value_type_arr || []).find((d:any) => d.value === row.value_type)?.label || row.value_type }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
        </template>
        <template #cell-setting_value="{ row }">
          <div style="display:flex;align-items:center;gap:8px;">
            <el-text style="max-width:550px" truncated>{{ row.setting_value }}</el-text>
            <el-button size="small" @click="copy(row.setting_value)">{{ t('common.actions.copy') || '复制' }}</el-button>
            <el-avatar v-if="row.setting_key==='user.default_avatar'" :src="row.setting_value" :size="28"/>
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

  <el-dialog v-model="dialogShow" :width="isMobile ? '94vw' : '900px'" :top="isMobile ? '4vh' : '20vh'">
    <template #header>{{ isEdit ? '编辑配置' : '新增配置' }}</template>
    <el-form :model="form" label-width="auto">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('setting.form.key')" required>
            <el-input v-model="form.key" :disabled="isEdit" clearable/>
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('setting.form.type')" required>
            <el-select-v2 v-model="form.type" :options="dict.system_setting_value_type_arr" style="width:100%" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('setting.form.value')">
            <el-input v-if="form.type!==4" v-model="form.value" clearable/>
            <el-input v-else type="textarea" v-model="form.value" :rows="6" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('setting.form.remark')">
            <el-input v-model="form.remark" clearable/>
          </el-form-item>
        </el-col>
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
.box { display:flex; flex-direction:column; height:100% }
.table { flex:1 1 auto; min-height:0; overflow:auto }
</style>
