<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import type { SearchField } from '@/components/Search/types'
import { useCrudTable } from '@/hooks/useCrudTable'
import { useIsMobile } from '@/hooks/useResponsive'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { AiAssetApi, type AiAssetInitResponse, type AiAssetItem, type AiAssetMutationParams, type AiAssetType, type AiCommonStatus } from '@/api/ai/assets'

interface AssetTableParams {
  current_page: number
  page_size: number
  keyword?: string
  type?: AiAssetType | ''
  status?: AiCommonStatus | ''
}

interface AssetSearchForm {
  keyword: string
  type: AiAssetType | ''
  status: AiCommonStatus | ''
}

interface AssetForm {
  id?: number
  slug: string
  type: AiAssetType
  category: string
  title: string
  cover_url: string
  description: string
  content: string
  url: string
  tags_json: string
  status: AiCommonStatus
}

const { t } = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()
const formRef = useTemplateRef<FormInstance>('formRef')

const dict = shallowRef<AiAssetInitResponse>({
  common_status_arr: [],
  ai_asset_type_arr: [],
})

const searchForm = ref<AssetSearchForm>({
  keyword: '',
  type: '',
  status: '',
})

const {
  loading: listLoading,
  data: listData,
  page,
  onSearch,
  onPageChange,
  onSelectionChange,
  refresh,
  getList,
  confirmDel,
  batchDel,
} = useCrudTable<AiAssetItem, AssetTableParams>({
  api: AiAssetApi,
  searchForm,
})

const dialogVisible = shallowRef(false)
const dialogMode = shallowRef<'add' | 'edit'>('add')
const form = ref<AssetForm>(defaultForm())

const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', type: 'input', label: t('aiAssets.filter.keyword'), placeholder: t('aiAssets.filter.keyword'), width: 180 },
  { key: 'type', type: 'select-v2', label: t('aiAssets.filter.type'), placeholder: t('aiAssets.filter.type'), width: 140, options: dict.value.ai_asset_type_arr },
  { key: 'status', type: 'select-v2', label: t('aiAssets.filter.status'), placeholder: t('aiAssets.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'cover_url', label: t('aiAssets.table.cover'), width: 90 },
  { key: 'title', label: t('aiAssets.table.title'), minWidth: 180, overflowTooltip: true },
  { key: 'slug', label: t('aiAssets.table.slug'), minWidth: 160, overflowTooltip: true },
  { key: 'type', label: t('aiAssets.table.type'), width: 110 },
  { key: 'category', label: t('aiAssets.table.category'), width: 140, overflowTooltip: true },
  { key: 'description', label: t('aiAssets.table.description'), minWidth: 220, overflowTooltip: true },
  { key: 'status', label: t('aiAssets.table.status'), width: 100 },
  { key: 'updated_at', label: t('aiAssets.table.updatedAt'), width: 170 },
  { key: 'actions', label: t('common.actions.action'), width: 180 },
])

const rules = computed<FormRules>(() => ({
  slug: [{ required: true, message: t('aiAssets.form.slug') + t('common.required'), trigger: 'blur' }],
  type: [{ required: true, message: t('aiAssets.form.type') + t('common.required'), trigger: 'change' }],
  title: [{ required: true, message: t('aiAssets.form.title') + t('common.required'), trigger: 'blur' }],
  status: [{ required: true, message: t('aiAssets.form.status') + t('common.required'), trigger: 'change' }],
}))

function defaultForm(): AssetForm {
  return {
    slug: '',
    type: 'text',
    category: '',
    title: '',
    cover_url: '',
    description: '',
    content: '',
    url: '',
    tags_json: '',
    status: CommonEnum.YES,
  }
}

async function init() {
  dict.value = await AiAssetApi.pageInit()
}

function statusText(status: AiCommonStatus): string {
  const option = dict.value.common_status_arr.find((item) => item.value === status)
  if (!option) throw new Error(`AI asset status ${status} missing from page-init`)
  return option.label
}

function typeText(type: AiAssetType): string {
  const option = dict.value.ai_asset_type_arr.find((item) => item.value === type)
  if (!option) throw new Error(`AI asset type ${type} missing from page-init`)
  return option.label
}

function statusTagType(status: AiCommonStatus): 'success' | 'danger' {
  return status === CommonEnum.YES ? 'success' : 'danger'
}

function add() {
  dialogMode.value = 'add'
  form.value = defaultForm()
  dialogVisible.value = true
  void nextTick(() => formRef.value?.clearValidate())
}

function edit(row: AiAssetItem) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    slug: row.slug,
    type: row.type,
    category: row.category,
    title: row.title,
    cover_url: row.cover_url,
    description: row.description,
    content: row.content,
    url: row.url,
    tags_json: row.tags_json,
    status: row.status,
  }
  dialogVisible.value = true
  void nextTick(() => formRef.value?.clearValidate())
}

async function confirmSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const payload: AiAssetMutationParams = {
    id: form.value.id,
    slug: form.value.slug,
    type: form.value.type,
    category: form.value.category,
    title: form.value.title,
    cover_url: form.value.cover_url,
    description: form.value.description,
    content: form.value.content,
    url: form.value.url,
    tags_json: form.value.tags_json,
    status: form.value.status,
  }
  const api = dialogMode.value === 'add' ? AiAssetApi.create : AiAssetApi.update
  await api(payload)
  ElNotification.success({ message: t('common.success.operation') })
  dialogVisible.value = false
  await getList()
}

onMounted(async () => {
  await init()
  await getList()
})
</script>

<template>
  <div class="ai-asset-page">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="ai-asset-page__table">
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
          <el-button v-if="userStore.can('ai_asset_add')" type="success" @click="add">{{ t('common.actions.add') }}</el-button>
          <el-dropdown v-if="userStore.can('ai_asset_del')">
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel">{{ t('common.actions.batchDelete') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-cover_url="{ row }">
          <el-image v-if="row.cover_url !== ''" class="ai-asset-page__cover" :src="row.cover_url" fit="cover" />
          <el-text v-else type="info">-</el-text>
        </template>
        <template #cell-type="{ row }">
          <el-tag type="info">{{ typeText(row.type) }}</el-tag>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button v-if="userStore.can('ai_asset_edit')" type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button v-if="userStore.can('ai_asset_del')" type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '820px'" :height="isMobile ? '76vh' : 'min(78vh, 760px)'">
    <template #header>{{ dialogMode === 'add' ? t('aiAssets.addTitle') : t('aiAssets.editTitle') }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAssets.form.slug')" prop="slug" required>
            <el-input v-model="form.slug" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAssets.form.type')" prop="type" required>
            <el-select-v2 v-model="form.type" :options="dict.ai_asset_type_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAssets.form.title')" prop="title" required>
            <el-input v-model="form.title" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAssets.form.status')" prop="status" required>
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAssets.form.category')" prop="category">
            <el-input v-model="form.category" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiAssets.form.coverUrl')" prop="cover_url">
            <el-input v-model="form.cover_url" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAssets.form.description')" prop="description">
            <el-input v-model="form.description" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAssets.form.content')" prop="content">
            <el-input v-model="form.content" type="textarea" :rows="6" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAssets.form.url')" prop="url">
            <el-input v-model="form.url" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiAssets.form.tagsJson')" prop="tags_json">
            <el-input v-model="form.tags_json" clearable />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
      <el-button type="primary" @click="confirmSubmit">{{ t('common.actions.confirm') }}</el-button>
    </template>
  </AppDialog>
</template>

<style scoped>
.ai-asset-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-asset-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.ai-asset-page__cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}
</style>
