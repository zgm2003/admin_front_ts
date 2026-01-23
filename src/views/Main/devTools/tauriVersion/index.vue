<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import { useTable } from '@/hooks/useTable'
import { TauriVersionApi } from '@/api/devTools/tauriVersion'
import { useUserStore } from '@/store/user'
import { useIsMobile } from '@/hooks/useResponsive'
import { ElNotification, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { openUrl } from '@/utils/download'
import { UpFile } from '@/components/UpFile'
import { CommonEnum } from '@/enums'

const { t } = useI18n()
const userStore = useUserStore()
const isMobile = useIsMobile()

// 平台选项（从 init 获取）
const platformOptions = ref<{ label: string; value: string }[]>([])
const init = () => {
  TauriVersionApi.init().then((res: any) => {
    const arr = res?.dict?.tauri_platform_arr || []
    platformOptions.value = arr.map((item: any) => ({ value: item.value, label: item.label }))
  })
}

// 主列表
const searchForm = ref({ platform: '' })
const { loading, data, page, onPageChange, refresh, getList, confirmDel } = useTable({
  api: TauriVersionApi,
  searchForm,
  immediate: true
})

const columns = computed(() => [
  { key: 'version', label: t('tauriVersion.version'), width: 100 },
  { key: 'platform', label: t('tauriVersion.platform'), width: 140 },
  { key: 'notes', label: t('tauriVersion.notes'), minWidth: 200, overflowTooltip: true },
  { key: 'file_size_text', label: t('tauriVersion.fileSize'), width: 100 },
  { key: 'is_latest', label: t('tauriVersion.isLatest'), width: 100 },
  { key: 'force_update', label: t('tauriVersion.forceUpdate'), width: 100 },
  { key: 'created_at', label: t('common.createdAt'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 350 }
])

// 新增弹窗
const dialogVisible = ref(false)
const formRef = ref<FormInstance | null>(null)
const defaultForm = () => ({ version: '', notes: '', file_url: '', signature: '', platform: 'windows-x86_64', file_size: 0, force_update: 0 })
const form = ref<any>(defaultForm())

const rules = computed<FormRules>(() => ({
  version: [{ required: true, message: t('tauriVersion.form.version') + t('common.required'), trigger: 'blur' }],
  file_url: [{ required: true, message: t('tauriVersion.form.fileUrl') + t('common.required'), trigger: 'blur' }],
  signature: [{ required: true, message: t('tauriVersion.form.signature') + t('common.required'), trigger: 'blur' }],
  platform: [{ required: true, message: t('tauriVersion.form.platform') + t('common.required'), trigger: 'change' }]
}))

const openAdd = () => {
  form.value = defaultForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const confirmSubmit = async () => {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  TauriVersionApi.add(form.value).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    getList()
  })
}

// 设为最新
const handleSetLatest = (row: any) => {
  ElMessageBox.confirm(t('tauriVersion.setLatestConfirm', { version: row.version }), t('common.confirmTitle'), {
    confirmButtonText: t('common.actions.confirm'),
    cancelButtonText: t('common.actions.cancel'),
    type: 'warning'
  }).then(() => {
    TauriVersionApi.setLatest({ id: row.id }).then(() => {
      ElNotification.success({ message: t('common.success.operation') })
      getList()
    })
  }).catch(() => {})
}

// 切换强制更新状态
const toggleForceUpdate = async (row: any) => {
  const isForce = row.force_update === CommonEnum.YES
  const confirmMsg = isForce 
    ? t('tauriVersion.cancelForceConfirm', { version: row.version })
    : t('tauriVersion.setForceConfirm', { version: row.version })
  
  try {
    await ElMessageBox.confirm(
      confirmMsg,
      t('common.confirmTitle'),
      { type: 'warning', confirmButtonText: t('common.actions.confirm'), cancelButtonText: t('common.actions.cancel') }
    )
  } catch {
    return
  }
  
  const newStatus = isForce ? CommonEnum.NO : CommonEnum.YES
  TauriVersionApi.forceUpdate({ id: row.id, force_update: newStatus }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    getList()
  })
}

// 查看 update.json
const jsonDialogVisible = ref(false)
const updateJsonContent = ref('')
const showUpdateJson = () => {
  TauriVersionApi.updateJson({ platform: 'windows-x86_64' }).then((res: any) => {
    updateJsonContent.value = JSON.stringify(res, null, 2)
    jsonDialogVisible.value = true
  })
}

const copyJson = () => {
  navigator.clipboard.writeText(updateJsonContent.value).then(() => {
    ElNotification.success({ message: t('common.success.copy') })
  })
}

// 文件上传成功回调
const onUploadSuccess = (data: { url: string; size: number; name: string }) => {
  form.value.file_url = data.url
  form.value.file_size = data.size
}

onMounted(() => init())
</script>

<template>
  <div class="box">
    <AppTable :columns="columns" :data="data" :loading="loading" :pagination="page" @refresh="refresh" @update:pagination="onPageChange">
      <template #toolbar-left>
        <el-button v-if="userStore.can('devTools_tauriVersion_add')" type="success" @click="openAdd">{{ t('common.actions.add') }}</el-button>
        <el-button type="primary" @click="showUpdateJson">{{ t('tauriVersion.viewUpdateJson') }}</el-button>
      </template>
      <template #cell-platform="{ row }">
        <el-tag size="small">{{ platformOptions.find(p => p.value === row.platform)?.label || row.platform }}</el-tag>
      </template>
      <template #cell-is_latest="{ row }">
        <el-tag v-if="row.is_latest === CommonEnum.YES" type="success" size="small">{{ t('tauriVersion.latest') }}</el-tag>
        <span v-else class="text-secondary">-</span>
      </template>
      <template #cell-force_update="{ row }">
        <el-tag v-if="row.force_update === CommonEnum.YES" type="danger" size="small">{{ t('tauriVersion.forceUpdate') }}</el-tag>
        <span v-else class="text-secondary">-</span>
      </template>
      <template #cell-actions="{ row }">
        <el-button v-if="row.is_latest !== CommonEnum.YES && userStore.can('devTools_tauriVersion_setLatest')" type="warning" text @click="handleSetLatest(row)">{{ t('tauriVersion.setLatest') }}</el-button>
        <el-button type="primary" text @click="openUrl(row.file_url)">{{ t('tauriVersion.download') }}</el-button>
        <el-button v-if="row.is_latest !== CommonEnum.YES && userStore.can('devTools_tauriVersion_del')" type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        <el-button v-if="userStore.can('devTools_tauriVersion_forceUpdate')" type="warning" text @click="toggleForceUpdate(row)">
          {{ row.force_update === CommonEnum.YES ? t('tauriVersion.cancelForce') : t('tauriVersion.setForce') }}
        </el-button>
      </template>
    </AppTable>
  </div>

  <!-- 新增弹窗 -->
  <el-dialog v-model="dialogVisible" :width="isMobile ? '94vw' : '600px'" draggable>
    <template #header>{{ t('tauriVersion.addVersion') }}</template>
    <el-form :model="form" :rules="rules" ref="formRef" label-width="auto">
      <el-form-item :label="t('tauriVersion.form.version')" prop="version" required>
        <el-input v-model="form.version" placeholder="1.0.0" />
      </el-form-item>
      <el-form-item :label="t('tauriVersion.form.platform')" prop="platform" required>
        <el-select v-model="form.platform" style="width: 100%">
          <el-option v-for="p in platformOptions" :key="p.value" :label="p.label" :value="p.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="t('tauriVersion.form.fileUrl')" prop="file_url" required>
        <UpFile v-model="form.file_url" folder-name="releases" accept=".zip,.msi,.exe,.dmg,.AppImage" tip="支持 .zip/.msi/.exe/.dmg/.AppImage" @success="onUploadSuccess" />
      </el-form-item>
      <el-form-item :label="t('tauriVersion.form.signature')" prop="signature" required>
        <el-input v-model="form.signature" type="textarea" :rows="4" placeholder=".sig 文件内容" />
      </el-form-item>
      <el-form-item :label="t('tauriVersion.form.notes')">
        <el-input v-model="form.notes" type="textarea" :rows="2" :placeholder="t('tauriVersion.form.notesPlaceholder')" />
      </el-form-item>
      <el-form-item :label="t('tauriVersion.form.forceUpdate')" prop="force_update">
        <el-switch v-model="form.force_update" :active-value="CommonEnum.YES" :inactive-value="CommonEnum.NO" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </el-dialog>

  <!-- update.json 弹窗 -->
  <el-dialog v-model="jsonDialogVisible" :width="isMobile ? '94vw' : '700px'" title="update.json">
    <el-input v-model="updateJsonContent" type="textarea" :rows="16" readonly />
    <template #footer>
      <el-button @click="copyJson">{{ t('common.actions.copy') }}</el-button>
      <el-button type="primary" @click="jsonDialogVisible = false">{{ t('common.actions.close') }}</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100%; }
.text-secondary { color: var(--el-text-color-secondary); }
</style>