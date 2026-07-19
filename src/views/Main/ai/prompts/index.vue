<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { FormInstance } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { CommonEnum } from '@/enums'
import { useUserStore } from '@/store/user'
import { usePromptAdminPage } from './use-prompt-admin-page'

const userStore = useUserStore()
const formRef = useTemplateRef<FormInstance>('formRef')
const {
  t, isMobile, dict, searchForm, searchFields, columns,
  listLoading, listData, page, onSearch, onPageChange, onSelectionChange,
  refresh, confirmDel, batchDel, toggleStatus,
  dialogVisible, dialogMode, form, rules,
  statusText, isKnownStatus, statusTagType, add, edit, confirmSubmit,
} = usePromptAdminPage(formRef)
</script>

<template>
  <div class="ai-prompt-page">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
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
          <el-button
            v-if="userStore.can('ai_prompt_add')"
            type="success"
            @click="add"
          >
            {{ t('common.actions.add') }}
          </el-button>
          <el-dropdown v-if="userStore.can('ai_prompt_del')">
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="batchDel">
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-cover_url="{ row }">
          <el-image
            v-if="row.cover_url !== ''"
            class="ai-prompt-page__cover"
            :src="row.cover_url"
            fit="cover"
          />
          <el-text
            v-else
            type="info"
          >
            -
          </el-text>
        </template>
        <template #cell-status="{ row }">
          <el-tag
            v-if="isKnownStatus(row.status)"
            :type="statusTagType(row.status)"
          >
            {{ statusText(row.status) }}
          </el-tag>
          <el-text
            v-else
            type="danger"
          >
            {{ t('common.invalidData') }}
          </el-text>
        </template>
        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('ai_prompt_edit')"
            type="primary"
            text
            @click="edit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="userStore.can('ai_prompt_status') && row.status === CommonEnum.NO"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.YES)"
          >
            {{ t('common.actions.enable') }}
          </el-button>
          <el-button
            v-if="userStore.can('ai_prompt_status') && row.status === CommonEnum.YES"
            type="warning"
            text
            @click="toggleStatus(row, CommonEnum.NO)"
          >
            {{ t('common.actions.disable') }}
          </el-button>
          <el-button
            v-if="userStore.can('ai_prompt_del')"
            type="danger"
            text
            @click="confirmDel(row)"
          >
            {{ t('common.actions.del') }}
          </el-button>
        </template>
      </AppTable>
    </div>
  </div>

  <AppDialog
    v-model="dialogVisible"
    :width="isMobile ? '94vw' : '820px'"
    :height="isMobile ? '76vh' : 'min(78vh, 760px)'"
  >
    <template #header>
      {{ dialogMode === 'add' ? t('aiPrompts.addTitle') : t('aiPrompts.editTitle') }}
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="auto"
      :validate-on-rule-change="false"
    >
      <el-row :gutter="12">
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiPrompts.form.slug')"
            prop="slug"
            required
          >
            <el-input
              v-model="form.slug"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiPrompts.form.status')"
            prop="status"
            required
          >
            <el-select-v2
              v-model="form.status"
              :options="dict.common_status_arr"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiPrompts.form.title')"
            prop="title"
            required
          >
            <el-input
              v-model="form.title"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiPrompts.form.category')"
            prop="category"
          >
            <el-input
              v-model="form.category"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiPrompts.form.coverUrl')"
            prop="cover_url"
          >
            <el-input
              v-model="form.cover_url"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiPrompts.form.prompt')"
            prop="prompt"
            required
          >
            <el-input
              v-model="form.prompt"
              type="textarea"
              :rows="7"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item
            :label="t('aiPrompts.form.preview')"
            prop="preview"
          >
            <el-input
              v-model="form.preview"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiPrompts.form.tagsJson')"
            prop="tags_json"
          >
            <el-input
              v-model="form.tags_json"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            :label="t('aiPrompts.form.sourceUrl')"
            prop="source_url"
          >
            <el-input
              v-model="form.source_url"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
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
</template>

<style scoped src="./styles.css"></style>
