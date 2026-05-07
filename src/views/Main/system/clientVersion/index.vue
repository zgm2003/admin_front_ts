<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AppTable } from '@/components/Table'
import { useCrudTable } from '@/hooks/useCrudTable'
import { Search } from '@/components/Search'
import { AppDialog } from '@/components/AppDialog'
import type { SearchField } from '@/components/Search/types'
import {
  ClientVersionApi,
  type ClientPlatform,
  type ClientVersionForm,
  type ClientVersionItem,
  type ClientVersionPageInitResponse,
} from '@/api/system/clientVersion'
import { useUserStore } from '@/store/user'
import { useIsMobile } from '@/hooks/useResponsive'
import { useCopy } from '@/hooks/useCopy'
import { ElNotification, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { downloadFile } from '@/components/DownloadManager'
import { UpFile } from '@/components/UpFile'
import SignatureInput from './components/SignatureInput.vue'
import { CommonEnum } from '@/enums'

const { t } = useI18n()
const userStore = useUserStore()
const isMobile = useIsMobile()
const { copy } = useCopy()

// 平台选项（从 init 获取）
const platformOptions = ref<Array<{ label: string; value: ClientPlatform }>>([])
// 平台映射表，O(1) 查找替代 find 遍历
const platformMap = computed(() => new Map(platformOptions.value.map(p => [p.value, p.label])))
const init = () => {
  ClientVersionApi.init().then((res: ClientVersionPageInitResponse) => {
    const arr = res.dict.client_version_platform_arr
    platformOptions.value = arr.map((item) => ({ value: item.value, label: item.label }))
  })
}

// 主列表
const searchForm = ref<{ platform: ClientPlatform | '' }>({ platform: '' })
const { loading, data, page, onPageChange, onSearch, refresh, getList, confirmDel } = useCrudTable({
  api: ClientVersionApi,
  searchForm,
  immediate: true
})

const searchFields = computed<SearchField[]>(() => [
  { key: 'platform', type: 'select-v2', label: t('clientVersion.platform'), placeholder: t('clientVersion.platform'), options: platformOptions.value, width: 150 }
])

const columns = computed(() => [
  { key: 'version', label: t('clientVersion.version'), width: 100 },
  { key: 'platform', label: t('clientVersion.platform'), width: 140 },
  { key: 'notes', label: t('clientVersion.notes'), minWidth: 200, overflowTooltip: true },
  { key: 'file_size_text', label: t('clientVersion.fileSize'), width: 100 },
  { key: 'is_latest', label: t('clientVersion.isLatest'), width: 100 },
  { key: 'force_update', label: t('clientVersion.forceUpdate'), width: 100 },
  { key: 'created_at', label: t('common.createdAt'), width: 180 },
  { key: 'actions', label: t('common.actions.action'), width: 420, fixed: 'right' }
])

// 新增/编辑弹窗
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref<FormInstance | null>(null)
const defaultForm = (): ClientVersionForm & { id?: number } => ({ id: 0, version: '', notes: '', file_url: '', signature: '', platform: 'windows-x86_64', file_size: 0, force_update: CommonEnum.NO })
const form = ref<ClientVersionForm & { id?: number }>(defaultForm())

const rules = computed<FormRules>(() => ({
  version: [{ required: true, message: t('clientVersion.form.version') + t('common.required'), trigger: 'blur' }],
  file_url: [{ required: true, message: t('clientVersion.form.fileUrl') + t('common.required'), trigger: 'blur' }],
  signature: [{ required: true, message: t('clientVersion.form.signature') + t('common.required'), trigger: 'blur' }],
  platform: [{ required: true, message: t('clientVersion.form.platform') + t('common.required'), trigger: 'change' }]
}))

const add = () => {
  dialogMode.value = 'add'
  form.value = defaultForm()
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const edit = (row: ClientVersionItem) => {
  dialogMode.value = 'edit'
  form.value = { ...row }
  dialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const confirmSubmit = async () => {
  if (!formRef.value) return
  try { await formRef.value.validate() } catch { return }
  const payload = { ...form.value, id: Number(form.value.id) }
  const request = dialogMode.value === 'add'
    ? ClientVersionApi.add(payload)
    : ClientVersionApi.edit({ ...payload, id: payload.id })
  request.then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    dialogVisible.value = false
    getList()
  })
}

// 设为最新
const handleSetLatest = (row: ClientVersionItem) => {
  ElMessageBox.confirm(t('clientVersion.setLatestConfirm', { version: row.version }), t('common.confirmTitle'), {
    confirmButtonText: t('common.actions.confirm'),
    cancelButtonText: t('common.actions.cancel'),
    type: 'warning'
  }).then(() => {
    ClientVersionApi.setLatest({ id: row.id }).then(() => {
      ElNotification.success({ message: t('common.success.operation') })
      getList()
    })
  }).catch(() => {})
}

// 切换强制更新状态
const toggleForceUpdate = async (row: ClientVersionItem) => {
  const isForce = row.force_update === CommonEnum.YES
  const confirmMsg = isForce 
    ? t('clientVersion.cancelForceConfirm', { version: row.version })
    : t('clientVersion.setForceConfirm', { version: row.version })
  
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
  ClientVersionApi.forceUpdate({ id: row.id, force_update: newStatus }).then(() => {
    ElNotification.success({ message: t('common.success.operation') })
    getList()
  })
}


function downloadFileName(row: ClientVersionItem): string {
  const fallbackExt = row.platform.startsWith('darwin') ? '.dmg' : '.exe'
  try {
    const url = new URL(row.file_url)
    const lastSegment = url.pathname.split('/').filter(Boolean).pop() ?? ''
    const dot = lastSegment.lastIndexOf('.')
    if (dot >= 0 && dot < lastSegment.length - 1) {
      return `${row.version}${lastSegment.slice(dot)}`
    }
  } catch {
    const dot = row.file_url.lastIndexOf('.')
    if (dot >= 0 && dot < row.file_url.length - 1) {
      return `${row.version}${row.file_url.slice(dot)}`
    }
  }

  return `${row.version}${fallbackExt}`
}

// 查看 update.json
const jsonDialogVisible = ref(false)
const updateJsonContent = ref('')
const showUpdateJson = () => {
  ClientVersionApi.updateJson({ platform: searchForm.value.platform || 'windows-x86_64' }).then((res) => {
    updateJsonContent.value = JSON.stringify(res, null, 2)
    jsonDialogVisible.value = true
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
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
    <AppTable
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="page"
      @refresh="refresh"
      @update:pagination="onPageChange"
    >
      <template #toolbar-left>
        <el-button
          v-if="userStore.can('system_clientVersion_add')"
          type="success"
          @click="add"
        >
          {{ t('common.actions.add') }}
        </el-button>
        <el-button
          type="primary"
          @click="showUpdateJson"
        >
          {{ t('clientVersion.viewUpdateJson') }}
        </el-button>
      </template>
      <template #cell-platform="{ row }">
        <el-tag size="small">
          {{ platformMap.get(row.platform) || row.platform }}
        </el-tag>
      </template>
      <template #cell-is_latest="{ row }">
        <el-tag
          v-if="row.is_latest === CommonEnum.YES"
          type="success"
          size="small"
        >
          {{ t('clientVersion.latest') }}
        </el-tag>
        <span
          v-else
          class="text-secondary"
        >-</span>
      </template>
      <template #cell-force_update="{ row }">
        <el-tag
          v-if="row.force_update === CommonEnum.YES"
          type="danger"
          size="small"
        >
          {{ t('clientVersion.forceUpdate') }}
        </el-tag>
        <span
          v-else
          class="text-secondary"
        >-</span>
      </template>
      <template #cell-actions="{ row }">
        <el-button
          v-if="userStore.can('system_clientVersion_edit')"
          type="primary"
          text
          @click="edit(row)"
        >
          {{ t('common.actions.edit') }}
        </el-button>
        <el-button
          v-if="row.is_latest !== CommonEnum.YES && userStore.can('system_clientVersion_setLatest')"
          type="warning"
          text
          @click="handleSetLatest(row)"
        >
          {{ t('clientVersion.setLatest') }}
        </el-button>
        <el-button
          type="primary"
          text
          @click="downloadFile(row.file_url, downloadFileName(row))"
        >
          {{ t('clientVersion.download') }}
        </el-button>
        <el-button
          v-if="row.is_latest !== CommonEnum.YES && userStore.can('system_clientVersion_del')"
          type="danger"
          text
          @click="confirmDel(row)"
        >
          {{ t('common.actions.del') }}
        </el-button>
        <el-button
          v-if="userStore.can('system_clientVersion_forceUpdate')"
          type="warning"
          text
          @click="toggleForceUpdate(row)"
        >
          {{ row.force_update === CommonEnum.YES ? t('clientVersion.cancelForce') : t('clientVersion.setForce') }}
        </el-button>
      </template>
    </AppTable>
  </div>

  <!-- 新增/编辑弹窗 -->
  <AppDialog
    v-model="dialogVisible"
    :width="isMobile ? '94vw' : '700px'"
    :draggable="!isMobile"
    destroy-on-close
  >
    <template #header>
      {{ dialogMode === 'edit' ? t('common.actions.edit') : t('clientVersion.addVersion') }}
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      :label-position="isMobile ? 'top' : 'right'"
    >
      <el-form-item
        :label="t('clientVersion.form.version')"
        prop="version"
        required
      >
        <el-input
          v-model="form.version"
          :placeholder="t('clientVersion.form.versionPlaceholder')"
        />
      </el-form-item>
      <el-form-item
        :label="t('clientVersion.form.platform')"
        prop="platform"
        required
      >
        <el-select
          v-model="form.platform"
          style="width: 100%"
          :disabled="dialogMode === 'edit'"
        >
          <el-option
            v-for="p in platformOptions"
            :key="p.value"
            :label="p.label"
            :value="p.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="t('clientVersion.form.fileUrl')"
        prop="file_url"
        required
      >
        <UpFile
          v-model="form.file_url"
          folder-name="releases"
          accept=".zip,.msi,.exe,.dmg,.AppImage"
          :tip="t('clientVersion.form.fileTip')"
          @success="onUploadSuccess"
        />
      </el-form-item>
      <el-form-item
        :label="t('clientVersion.form.signature')"
        prop="signature"
        required
      >
        <SignatureInput v-model="form.signature" />
      </el-form-item>
      <el-form-item :label="t('clientVersion.form.notes')">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="2"
          :placeholder="t('clientVersion.form.notesPlaceholder')"
        />
      </el-form-item>
      <el-form-item
        :label="t('clientVersion.form.forceUpdate')"
        prop="force_update"
      >
        <el-switch
          v-model="form.force_update"
          :active-value="CommonEnum.YES"
          :inactive-value="CommonEnum.NO"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">
        {{ t('common.actions.cancel') }}
      </el-button>
      <el-button
        type="primary"
        @click="confirmSubmit"
      >
        {{ t('common.actions.confirm') }}
      </el-button>
    </template>
  </AppDialog>

  <!-- update.json 弹窗 -->
  <AppDialog
    v-model="jsonDialogVisible"
    :width="isMobile ? '94vw' : '700px'"
    :title="t('clientVersion.viewUpdateJson')"
  >
    <el-input
      v-model="updateJsonContent"
      type="textarea"
      :rows="16"
      readonly
    />
    <template #footer>
      <el-button
        type="primary"
        @click="copy(updateJsonContent)"
      >
        {{ t('common.actions.copy') }}
      </el-button>
      <el-button @click="jsonDialogVisible = false">
        {{ t('common.actions.close') }}
      </el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.box { display: flex; flex-direction: column; height: 100%; }
.text-secondary { color: var(--el-text-color-secondary); }
</style>

