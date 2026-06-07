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
import { AiPromptApi, type AiCommonStatus, type AiPromptInitResponse, type AiPromptItem, type AiPromptMutationParams } from '@/api/ai/prompts'

interface PromptTableParams {
  current_page: number
  page_size: number
  keyword?: string
  category?: string
  status?: AiCommonStatus | ''
}

interface PromptSearchForm {
  keyword: string
  category: string
  status: AiCommonStatus | ''
}

interface PromptForm {
  id?: number
  slug: string
  category: string
  title: string
  cover_url: string
  prompt: string
  preview: string
  tags_json: string
  source_url: string
  status: AiCommonStatus
}

const { t } = useI18n()
const isMobile = useIsMobile()
const userStore = useUserStore()
const formRef = useTemplateRef<FormInstance>('formRef')

const dict = shallowRef<AiPromptInitResponse>({
  common_status_arr: [],
})

const searchForm = ref<PromptSearchForm>({
  keyword: '',
  category: '',
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
  toggleStatus,
} = useCrudTable<AiPromptItem, PromptTableParams, AiCommonStatus>({
  api: AiPromptApi,
  searchForm,
})

const dialogVisible = shallowRef(false)
const dialogMode = shallowRef<'add' | 'edit'>('add')
const form = ref<PromptForm>(defaultForm())

const searchFields = computed<SearchField[]>(() => [
  { key: 'keyword', type: 'input', label: t('aiPrompts.filter.keyword'), placeholder: t('aiPrompts.filter.keyword'), width: 180 },
  { key: 'category', type: 'input', label: t('aiPrompts.filter.category'), placeholder: t('aiPrompts.filter.category'), width: 160 },
  { key: 'status', type: 'select-v2', label: t('aiPrompts.filter.status'), placeholder: t('aiPrompts.filter.status'), width: 120, options: dict.value.common_status_arr },
])

const columns = computed(() => [
  { key: 'cover_url', label: t('aiPrompts.table.cover'), width: 90 },
  { key: 'title', label: t('aiPrompts.table.title'), minWidth: 180, overflowTooltip: true },
  { key: 'slug', label: t('aiPrompts.table.slug'), minWidth: 160, overflowTooltip: true },
  { key: 'category', label: t('aiPrompts.table.category'), width: 140, overflowTooltip: true },
  { key: 'preview', label: t('aiPrompts.table.preview'), minWidth: 220, overflowTooltip: true },
  { key: 'status', label: t('aiPrompts.table.status'), width: 100 },
  { key: 'updated_at', label: t('aiPrompts.table.updatedAt'), width: 170 },
  { key: 'actions', label: t('common.actions.action'), width: 260 },
])

const rules = computed<FormRules>(() => ({
  slug: [{ required: true, message: t('aiPrompts.form.slug') + t('common.required'), trigger: 'blur' }],
  title: [{ required: true, message: t('aiPrompts.form.title') + t('common.required'), trigger: 'blur' }],
  prompt: [{ required: true, message: t('aiPrompts.form.prompt') + t('common.required'), trigger: 'blur' }],
  status: [{ required: true, message: t('aiPrompts.form.status') + t('common.required'), trigger: 'change' }],
}))

function defaultForm(): PromptForm {
  return {
    slug: '',
    category: '',
    title: '',
    cover_url: '',
    prompt: '',
    preview: '',
    tags_json: '',
    source_url: '',
    status: CommonEnum.YES,
  }
}

async function init() {
  dict.value = await AiPromptApi.pageInit()
}

function statusText(status: AiCommonStatus): string {
  const option = dict.value.common_status_arr.find((item) => item.value === status)
  if (!option) throw new Error(`AI prompt status ${status} missing from page-init`)
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

function edit(row: AiPromptItem) {
  dialogMode.value = 'edit'
  form.value = {
    id: row.id,
    slug: row.slug,
    category: row.category,
    title: row.title,
    cover_url: row.cover_url,
    prompt: row.prompt,
    preview: row.preview,
    tags_json: row.tags_json,
    source_url: row.source_url,
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
  const payload: AiPromptMutationParams = {
    id: form.value.id,
    slug: form.value.slug,
    category: form.value.category,
    title: form.value.title,
    cover_url: form.value.cover_url,
    prompt: form.value.prompt,
    preview: form.value.preview,
    tags_json: form.value.tags_json,
    source_url: form.value.source_url,
    status: form.value.status,
  }
  const api = dialogMode.value === 'add' ? AiPromptApi.create : AiPromptApi.update
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
  <div class="ai-prompt-page">
    <Search v-model="searchForm" :fields="searchFields" @query="onSearch" @reset="onSearch" />
    <div class="ai-prompt-page__table">
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
          <el-button v-if="userStore.can('ai_prompt_add')" type="success" @click="add">{{ t('common.actions.add') }}</el-button>
          <el-dropdown v-if="userStore.can('ai_prompt_del')">
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
          <el-image v-if="row.cover_url !== ''" class="ai-prompt-page__cover" :src="row.cover_url" fit="cover" />
          <el-text v-else type="info">-</el-text>
        </template>
        <template #cell-status="{ row }">
          <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
        <template #cell-actions="{ row }">
          <el-button v-if="userStore.can('ai_prompt_edit')" type="primary" text @click="edit(row)">{{ t('common.actions.edit') }}</el-button>
          <el-button v-if="userStore.can('ai_prompt_status') && row.status === CommonEnum.NO" type="warning" text @click="toggleStatus(row, CommonEnum.YES)">{{ t('common.actions.enable') }}</el-button>
          <el-button v-if="userStore.can('ai_prompt_status') && row.status === CommonEnum.YES" type="warning" text @click="toggleStatus(row, CommonEnum.NO)">{{ t('common.actions.disable') }}</el-button>
          <el-button v-if="userStore.can('ai_prompt_del')" type="danger" text @click="confirmDel(row)">{{ t('common.actions.del') }}</el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog v-model="dialogVisible" :width="isMobile ? '94vw' : '820px'" :height="isMobile ? '76vh' : 'min(78vh, 760px)'">
    <template #header>{{ dialogMode === 'add' ? t('aiPrompts.addTitle') : t('aiPrompts.editTitle') }}</template>
    <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" :validate-on-rule-change="false">
      <el-row :gutter="12">
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiPrompts.form.slug')" prop="slug" required>
            <el-input v-model="form.slug" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiPrompts.form.status')" prop="status" required>
            <el-select-v2 v-model="form.status" :options="dict.common_status_arr" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiPrompts.form.title')" prop="title" required>
            <el-input v-model="form.title" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiPrompts.form.category')" prop="category">
            <el-input v-model="form.category" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiPrompts.form.coverUrl')" prop="cover_url">
            <el-input v-model="form.cover_url" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiPrompts.form.prompt')" prop="prompt" required>
            <el-input v-model="form.prompt" type="textarea" :rows="7" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item :label="t('aiPrompts.form.preview')" prop="preview">
            <el-input v-model="form.preview" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiPrompts.form.tagsJson')" prop="tags_json">
            <el-input v-model="form.tags_json" clearable />
          </el-form-item>
        </el-col>
        <el-col :md="12" :span="24">
          <el-form-item :label="t('aiPrompts.form.sourceUrl')" prop="source_url">
            <el-input v-model="form.source_url" clearable />
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
.ai-prompt-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-prompt-page__table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.ai-prompt-page__cover {
  width: 48px;
  height: 48px;
  border-radius: 8px;
}
</style>
