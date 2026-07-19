<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { AppDialog } from '@/components/AppDialog'
import { AppTable } from '@/components/Table'
import { Search } from '@/components/Search'
import { useUserStore } from '@/store/user'
import { useUploadRulePage } from './use-upload-rule-page'

const userStore = useUserStore()
const {
  add, batchDel, columns, confirmDel, confirmSubmit,
  dialogMode, dialogVisible, dict, edit, form,
  isMobile, listData, listLoading, onPageChange, onSearch,
  onSelectionChange, page, refresh, rules, searchFields,
  searchForm, t, tagWrapStyle, setFormRef,
} = useUploadRulePage()
</script>

<template>
  <div class="box">
    <Search
      v-model="searchForm"
      :fields="searchFields"
      @query="onSearch"
      @reset="onSearch"
    />
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
          <el-button
            v-if="userStore.can('system_uploadConfig_ruleAdd')"
            type="success"
            @click="add"
          >
            {{ t('common.actions.add') }}
          </el-button>
          <el-dropdown>
            <el-button type="primary">
              {{ t('common.actions.batchAction') }}
              <el-icon class="el-icon--right">
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-if="userStore.can('system_uploadConfig_ruleDel')"
                  @click="batchDel"
                >
                  {{ t('common.actions.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <template #cell-image_exts="{ row }">
          <div :style="tagWrapStyle">
            <el-tag
              v-for="it in row.image_exts"
              :key="it"
              type="success"
            >
              {{ it }}
            </el-tag>
          </div>
        </template>
        <template #cell-file_exts="{ row }">
          <div :style="tagWrapStyle">
            <el-tag
              v-for="it in row.file_exts"
              :key="it"
              type="warning"
            >
              {{ it }}
            </el-tag>
          </div>
        </template>
        <template #cell-actions="{ row }">
          <el-button
            v-if="userStore.can('system_uploadConfig_ruleEdit')"
            type="primary"
            text
            @click="edit(row)"
          >
            {{ t('common.actions.edit') }}
          </el-button>
          <el-button
            v-if="userStore.can('system_uploadConfig_ruleDel')"
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
    :width="isMobile ? '94vw' : '900px'"
  >
    <template #header>
      {{ dialogMode === 'add' ? t('upload.rule.addTitle') : t('upload.rule.editTitle') }}
    </template>
    <el-form
      :ref="setFormRef"
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
            :label="t('upload.rule.form.title')"
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
            :label="t('upload.rule.form.max_size_mb')"
            prop="max_size_mb"
            required
          >
            <el-input-number
              v-model="form.max_size_mb"
              :min="1"
              :max="10240"
              :controls="false"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            label="Image Exts"
            prop="image_exts"
          >
            <el-select-v2
              v-model="form.image_exts"
              multiple
              style="width:100%"
              :options="dict.upload_image_ext_arr"
            />
          </el-form-item>
        </el-col>
        <el-col
          :md="12"
          :span="24"
        >
          <el-form-item
            label="File Exts"
            prop="file_exts"
          >
            <el-select-v2
              v-model="form.file_exts"
              multiple
              style="width:100%"
              :options="dict.upload_file_ext_arr"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible=false">{{ t('common.actions.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="confirmSubmit"
        >{{ t('common.actions.confirm') }}</el-button>
      </span>
    </template>
  </AppDialog>
</template>

<style scoped src="./styles.css"></style>
